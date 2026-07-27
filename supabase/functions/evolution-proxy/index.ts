import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  connectEvolutionInstance,
  createEvolutionInstance,
  evolutionConfigured,
  logoutEvolutionInstance,
  type EvolutionWebhook,
} from "../_shared/evolution.ts";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") ?? "";
const QR_REUSE_MARGIN_MS = 30_000;
const REQUEST_COOLDOWN_MS = 15_000;

interface StoredConnection {
  id: string;
  status: "connected" | "connecting" | "disconnected";
  phone_number: string | null;
  qr_code: string | null;
  qr_expires_at: string | null;
  updated_at: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }
  if (!evolutionConfigured() || !WEBHOOK_SECRET) {
    return json({ ok: false, error: "evolution_not_configured" });
  }

  let body: { action?: string; clinicId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  const action = String(body.action ?? "");
  const clinicId = String(body.clinicId ?? "");
  if (!action || !clinicId) {
    return json({ ok: false, error: "missing_params" }, 400);
  }

  const caller = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: request.headers.get("Authorization") ?? "" },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data: { user }, error: userError } = await caller.auth.getUser();
  if (userError || !user) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const admin = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Mesmos portões de private.can_edit_feature: vínculo e clínica ativos,
  // permissão de edição no cargo e feature liberada no plano.
  const [{ data: member }, { data: clinic }] = await Promise.all([
    admin
      .from("clinic_user")
      .select("access_profile_id")
      .eq("clinic_id", clinicId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    admin
      .from("clinic")
      .select("plan_key")
      .eq("id", clinicId)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  if (!member || !clinic) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const [{ data: permission }, { data: entitlement }] = await Promise.all([
    admin
      .from("access_profile_permission")
      .select("can_edit")
      .eq("access_profile_id", member.access_profile_id)
      .eq("feature_key", "whatsapp")
      .eq("can_edit", true)
      .maybeSingle(),
    admin
      .from("plan_feature")
      .select("feature_key")
      .eq("plan_key", clinic.plan_key)
      .eq("feature_key", "whatsapp")
      .maybeSingle(),
  ]);
  if (!permission || !entitlement) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const instanceName = `neosaude-${clinicId.replaceAll("-", "")}`;

  async function upsertConnection(patch: Record<string, unknown>) {
    const { error } = await admin.from("whatsapp_connection").upsert(
      {
        clinic_id: clinicId,
        provider: "evolution",
        session_ref: instanceName,
        ...patch,
      },
      { onConflict: "clinic_id" },
    );
    if (error) throw error;
  }

  async function readConnection(): Promise<StoredConnection | null> {
    const { data, error } = await admin
      .from("whatsapp_connection")
      .select(
        "id, status, phone_number, qr_code, qr_expires_at, updated_at",
      )
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (error) throw error;
    return data as StoredConnection | null;
  }

  function reusableResult(connection: StoredConnection | null) {
    if (connection?.status === "connected") {
      return {
        ok: true,
        status: "connected",
        qrCode: null,
        pairingCode: null,
        reused: true,
      };
    }

    const expiresAt = connection?.qr_expires_at
      ? new Date(connection.qr_expires_at).getTime()
      : 0;
    if (
      connection?.status === "connecting" &&
      connection.qr_code &&
      expiresAt > Date.now() + QR_REUSE_MARGIN_MS
    ) {
      return {
        ok: true,
        status: "connecting",
        qrCode: connection.qr_code,
        pairingCode: null,
        reused: true,
      };
    }
    return null;
  }

  function requestInProgress(connection: StoredConnection | null): boolean {
    if (connection?.status !== "connecting") return false;
    return Date.now() - new Date(connection.updated_at).getTime() <
      REQUEST_COOLDOWN_MS;
  }

  // A atualização condicional funciona como trava entre abas e requisições
  // concorrentes. Só quem adquirir a linha pode chamar a Evolution.
  async function claimConnectionRequest(
    connection: StoredConnection | null,
  ): Promise<boolean> {
    if (!connection) {
      const { error } = await admin.from("whatsapp_connection").insert({
        clinic_id: clinicId,
        provider: "evolution",
        session_ref: instanceName,
        status: "connecting",
      });
      if (!error) return true;
      if (error.code === "23505") return false;
      throw error;
    }

    const { data, error } = await admin
      .from("whatsapp_connection")
      .update({
        provider: "evolution",
        session_ref: instanceName,
        status: "connecting",
        qr_code: null,
        qr_expires_at: null,
        last_error: null,
      })
      .eq("id", connection.id)
      .eq("updated_at", connection.updated_at)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  // Só o "create" (primeiro pareamento) usa isto — de propósito NÃO é
  // reafirmado em "connect"/reconexão, pra não somar uma chamada nova à
  // Evolution API num caminho que já foi clicado repetidamente antes (ver o
  // comentário em connectEvolutionInstance, _shared/evolution.ts).
  const webhook: EvolutionWebhook = {
    url: `${SUPABASE_URL}/functions/v1/evolution-webhook?secret=${
      encodeURIComponent(WEBHOOK_SECRET)
    }`,
    events: ["CONNECTION_UPDATE", "QRCODE_UPDATED", "MESSAGES_UPSERT"],
  };

  try {
    if (action === "create" || action === "connect") {
      const stored = await readConnection();
      const reusable = reusableResult(stored);
      if (reusable) return json(reusable);
      if (requestInProgress(stored)) {
        return json({
          ok: true,
          status: "connecting",
          qrCode: null,
          pairingCode: null,
          pending: true,
        });
      }

      const claimed = await claimConnectionRequest(stored);
      if (!claimed) {
        const concurrent = await readConnection();
        return json(
          reusableResult(concurrent) ?? {
            ok: true,
            status: concurrent?.status ?? "connecting",
            qrCode: null,
            pairingCode: null,
            pending: true,
          },
        );
      }
    }

    if (action === "create") {
      const result = await createEvolutionInstance(instanceName, webhook);
      if (!result.ok) {
        await upsertConnection({
          status: "disconnected",
          qr_code: null,
          qr_expires_at: null,
          last_error: result.error,
        });
        return json({ ok: false, error: result.error });
      }

      if (result.status === "connected" && result.phone) {
        await upsertConnection({
          status: "connected",
          phone_number: result.phone,
          connected_at: new Date().toISOString(),
          qr_code: null,
          qr_expires_at: null,
          last_error: null,
        });
      } else {
        await upsertConnection({
          status: "connecting",
          qr_code: result.qrCode ?? null,
          qr_expires_at: result.qrCode
            ? new Date(Date.now() + 2 * 60_000).toISOString()
            : null,
          last_error: null,
        });
      }
      return json({
        ok: true,
        status: result.status,
        qrCode: result.qrCode ?? null,
        pairingCode: result.pairingCode ?? null,
      });
    }

    if (action === "connect") {
      const result = await connectEvolutionInstance(instanceName);
      if (!result.ok) return json({ ok: false, error: result.error });

      if (result.status === "connected" && result.phone) {
        await upsertConnection({
          status: "connected",
          phone_number: result.phone,
          connected_at: new Date().toISOString(),
          qr_code: null,
          qr_expires_at: null,
          last_error: null,
        });
      } else {
        await upsertConnection({
          status: "connecting",
          qr_code: result.qrCode ?? null,
          qr_expires_at: result.qrCode
            ? new Date(Date.now() + 2 * 60_000).toISOString()
            : null,
          last_error: null,
        });
      }
      return json({
        ok: true,
        status: result.status,
        qrCode: result.qrCode ?? null,
        pairingCode: result.pairingCode ?? null,
      });
    }

    if (action === "logout") {
      const stored = await readConnection();
      if (!stored || stored.status === "disconnected") {
        return json({ ok: true, status: "disconnected", reused: true });
      }
      await logoutEvolutionInstance(instanceName);
      await upsertConnection({
        status: "disconnected",
        qr_code: null,
        qr_expires_at: null,
        last_error: null,
      });
      return json({ ok: true, status: "disconnected" });
    }

    return json({ ok: false, error: "unknown_action" }, 400);
  } catch (error) {
    console.error("[evolution-proxy]", error);
    return json({ ok: false, error: "proxy_error" }, 500);
  }
});
