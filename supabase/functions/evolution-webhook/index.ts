import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  extractEvolutionPhone,
  fetchEvolutionPhone,
  mapEvolutionState,
  pickEvolutionQr,
} from "../_shared/evolution.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const WEBHOOK_SECRET = Deno.env.get("EVOLUTION_WEBHOOK_SECRET") ?? "";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (request) => {
  const secret = new URL(request.url).searchParams.get("secret") ?? "";
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  // deno-lint-ignore no-explicit-any
  let payload: any = {};
  try {
    payload = await request.json();
  } catch {
    return json({ ok: true, ignored: "invalid_body" });
  }

  const event = String(payload?.event ?? "").toUpperCase().replace(/\./g, "_");
  const instanceName = String(
    payload?.instance ?? payload?.instanceName ?? payload?.data?.instance ?? "",
  );
  if (!instanceName) return json({ ok: true, ignored: "unknown_instance" });

  const admin = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: connection } = await admin
    .from("whatsapp_connection")
    .select("clinic_id")
    .eq("session_ref", instanceName)
    .maybeSingle();
  if (!connection) return json({ ok: true, ignored: "unknown_instance" });

  try {
    if (event === "QRCODE_UPDATED") {
      const qr = pickEvolutionQr(payload?.data);
      if (!qr.qrCode) return json({ ok: true });
      await admin.from("whatsapp_connection").update({
        status: "connecting",
        qr_code: qr.qrCode,
        qr_expires_at: new Date(Date.now() + 2 * 60_000).toISOString(),
        last_error: null,
      }).eq("session_ref", instanceName);
      return json({ ok: true });
    }

    if (event !== "CONNECTION_UPDATE") {
      return json({ ok: true, ignored: event });
    }

    const state = String(
      payload?.data?.state ?? payload?.data?.connection ?? "",
    );
    const status = mapEvolutionState(state);

    if (status === "connected") {
      const phone = extractEvolutionPhone(payload?.data) ??
        await fetchEvolutionPhone(instanceName);
      if (!phone) {
        await admin.from("whatsapp_connection").update({
          status: "connecting",
          last_error: "connected_phone_unavailable",
        }).eq("session_ref", instanceName);
        return json({ ok: false, error: "connected_phone_unavailable" }, 503);
      }
      await admin.from("whatsapp_connection").update({
        status: "connected",
        phone_number: phone,
        connected_at: new Date().toISOString(),
        qr_code: null,
        qr_expires_at: null,
        last_error: null,
      }).eq("session_ref", instanceName);
      return json({ ok: true });
    }

    const reason = payload?.data?.statusReason ??
      payload?.data?.statusCode ??
      payload?.data?.reason ??
      null;
    const patch: Record<string, unknown> = {
      status,
      last_error: reason == null ? null : String(reason),
    };
    if (status === "disconnected") {
      patch.qr_code = null;
      patch.qr_expires_at = null;
    }
    await admin.from("whatsapp_connection").update(patch).eq(
      "session_ref",
      instanceName,
    );
    return json({ ok: true });
  } catch (error) {
    console.error("[evolution-webhook]", error);
    return json({ ok: false, error: "webhook_error" }, 500);
  }
});
