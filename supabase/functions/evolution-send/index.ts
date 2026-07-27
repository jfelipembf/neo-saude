import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  evolutionConfigured,
  sendEvolutionText,
} from "../_shared/evolution.ts";
import { renderClinicTemplate } from "../_shared/messageTemplate.ts";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const MAX_RECIPIENTS = 5;
const CLINIC_MESSAGES_PER_MINUTE = 10;
const RECIPIENT_MESSAGES_PER_15_MINUTES = 3;
const DEDUPE_WINDOW_MS = 5 * 60_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * "test" é o ÚNICO tipo que carrega um número cru, e existe só para a tela de
 * Configurações provar que a Evolution está entregando.
 *
 * O resto do arquivo recusa número vindo do cliente de propósito: paciente e
 * fornecedor entram por ID e o telefone é resolvido AQUI, contra o banco da
 * própria clínica. É isso que impede a Cibelly (ou um cliente comprometido) de
 * mandar mensagem para um número qualquer.
 *
 * O furo é fechado por três lados, e não pela boa vontade de quem chama:
 *  1. o TEXTO do teste é fixo, escrito aqui embaixo — quem pede não escolhe o
 *     que vai ser dito, então isto não vira um canal de "qualquer texto para
 *     qualquer número";
 *  2. um destinatário por vez, e nunca misturado com paciente/fornecedor;
 *  3. passa pelos MESMOS limites de taxa, dedupe e auditoria do envio normal.
 * A Cibelly não alcança este caminho: as ferramentas dela mandam
 * {type:'patient'|'supplier'}, e o texto do teste ignora o campo `message`.
 */
type RecipientKind = "patient" | "supplier" | "test";

const TEST_MESSAGE =
  "Esta é uma mensagem de teste do Neo Saúde. Se você recebeu, a integração de "
  + "WhatsApp da clínica está funcionando. Não é preciso responder.";

/** Telefone brasileiro com DDI opcional: 10 a 13 dígitos, igual ao phoneToDb do app. */
const PHONE_PATTERN = /^\d{10,13}$/;

interface RecipientInput {
  type: RecipientKind;
  id: string;
}

interface StoredRecipient extends RecipientInput {
  name: string;
  whatsapp: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

function uniqueRecipients(value: unknown): RecipientInput[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, RecipientInput>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const type = (item as { type?: unknown }).type;
    const id = String((item as { id?: unknown }).id ?? "");
    // O "test" traz DÍGITOS no lugar do UUID (ver o comentário de RecipientKind).
    if (type === "test") {
      if (PHONE_PATTERN.test(id)) unique.set(`test:${id}`, { type, id });
      continue;
    }
    if (
      (type !== "patient" && type !== "supplier") ||
      !UUID_PATTERN.test(id)
    ) continue;
    unique.set(`${type}:${id}`, { type, id });
  }
  return [...unique.values()];
}

async function digestBytes(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function deterministicUuid(value: string): Promise<string> {
  const bytes = (await digestBytes(value)).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }
  if (!evolutionConfigured()) {
    return json({ ok: false, error: "evolution_not_configured" });
  }

  let body: {
    clinicId?: string;
    recipients?: unknown;
    message?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  const clinicId = String(body.clinicId ?? "");
  const recipients = uniqueRecipients(body.recipients);

  // TESTE: nunca misturado com envio de verdade, nunca em lote, e o texto é o
  // do servidor — o `message` que veio do cliente é IGNORADO aqui.
  const isTest = recipients.some((recipient) => recipient.type === "test");
  if (isTest && recipients.length > 1) {
    return json({ ok: false, error: "test_send_is_single_recipient" }, 400);
  }
  const message = isTest ? TEST_MESSAGE : String(body.message ?? "").trim();

  if (!UUID_PATTERN.test(clinicId) || recipients.length === 0 || !message) {
    return json({ ok: false, error: "missing_params" }, 400);
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return json({ ok: false, error: "too_many_recipients" }, 400);
  }
  if (message.length > 4096) {
    return json({ ok: false, error: "message_too_long" }, 400);
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
      .select("name, plan_key")
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

  const renderedMessage = renderClinicTemplate(message, clinic.name);
  if (renderedMessage.length > 4096) {
    return json({ ok: false, error: "message_too_long" }, 400);
  }

  const instanceName = `neosaude-${clinicId.replaceAll("-", "")}`;
  const { data: connection } = await admin
    .from("whatsapp_connection")
    .select("status, session_ref")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (
    connection?.status !== "connected" ||
    connection.session_ref !== instanceName
  ) {
    return json({ ok: false, error: "whatsapp_not_connected" });
  }

  const patientIds = recipients
    .filter((recipient) => recipient.type === "patient")
    .map((recipient) => recipient.id);
  const supplierIds = recipients
    .filter((recipient) => recipient.type === "supplier")
    .map((recipient) => recipient.id);

  const resolved = new Map<string, StoredRecipient>();
  // O teste é o único que não consulta o banco: o número É o destinatário.
  for (const recipient of recipients) {
    if (recipient.type !== "test") continue;
    resolved.set(`test:${recipient.id}`, {
      type: "test",
      id: recipient.id,
      name: "Teste",
      whatsapp: recipient.id,
    });
  }
  if (patientIds.length > 0) {
    const { data, error } = await admin
      .from("patient")
      .select("id, name, whatsapp")
      .eq("clinic_id", clinicId)
      .in("id", patientIds);
    if (error) return json({ ok: false, error: "recipient_lookup_failed" });
    for (const row of data ?? []) {
      if (row.whatsapp) {
        resolved.set(`patient:${row.id}`, {
          type: "patient",
          id: row.id,
          name: row.name,
          whatsapp: row.whatsapp,
        });
      }
    }
  }
  if (supplierIds.length > 0) {
    const { data, error } = await admin
      .from("supplier")
      .select("id, name, whatsapp")
      .eq("clinic_id", clinicId)
      .in("id", supplierIds);
    if (error) return json({ ok: false, error: "recipient_lookup_failed" });
    for (const row of data ?? []) {
      if (row.whatsapp) {
        resolved.set(`supplier:${row.id}`, {
          type: "supplier",
          id: row.id,
          name: row.name,
          whatsapp: row.whatsapp,
        });
      }
    }
  }

  const now = Date.now();
  const messageHash = bytesToHex(
    await digestBytes(renderedMessage.replace(/\s+/g, " ").trim()),
  );
  const { count: recentClinicMessages, error: countError } = await admin
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("table_name", "whatsapp_message")
    .eq("action", "insert")
    .gte("created_at", new Date(now - 60_000).toISOString());
  if (countError) {
    return json({ ok: false, error: "rate_limit_check_failed" });
  }
  if (
    (recentClinicMessages ?? 0) + recipients.length >
      CLINIC_MESSAGES_PER_MINUTE
  ) {
    return json({ ok: false, error: "clinic_rate_limited" }, 429);
  }

  const results: Array<Record<string, unknown>> = [];
  for (const [index, input] of recipients.entries()) {
    const recipient = resolved.get(`${input.type}:${input.id}`);
    if (!recipient) {
      results.push({
        type: input.type,
        id: input.id,
        sent: false,
        error: "recipient_without_whatsapp",
      });
      continue;
    }

    const { count: recentRecipientMessages } = await admin
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("table_name", "whatsapp_message")
      .eq("action", "insert")
      .eq("new_data->>recipient_kind", recipient.type)
      .eq("new_data->>recipient_id", recipient.id)
      .gte(
        "created_at",
        new Date(now - 15 * 60_000).toISOString(),
      );
    if (
      (recentRecipientMessages ?? 0) >= RECIPIENT_MESSAGES_PER_15_MINUTES
    ) {
      results.push({
        type: recipient.type,
        id: recipient.id,
        name: recipient.name,
        sent: false,
        error: "recipient_rate_limited",
      });
      continue;
    }

    const bucket = Math.floor(now / DEDUPE_WINDOW_MS);
    const claimId = await deterministicUuid(
      `${clinicId}|${recipient.type}|${recipient.id}|${messageHash}|${bucket}`,
    );
    const claimData = {
      source: "cibelly",
      status: "pending",
      recipient_kind: recipient.type,
      recipient_id: recipient.id,
      recipient_name: recipient.name,
      message_hash: messageHash,
    };
    const { error: claimError } = await admin.from("audit_log").insert({
      id: claimId,
      clinic_id: clinicId,
      table_name: "whatsapp_message",
      record_id: claimId,
      action: "insert",
      actor_id: user.id,
      new_data: claimData,
    });
    if (claimError?.code === "23505") {
      const { data: lastAttempt } = await admin
        .from("audit_log")
        .select("new_data")
        .eq("clinic_id", clinicId)
        .eq("record_id", claimId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      results.push({
        type: recipient.type,
        id: recipient.id,
        name: recipient.name,
        sent: lastAttempt?.new_data?.status === "sent",
        pending: lastAttempt?.new_data?.status === "pending",
        reused: true,
        error: lastAttempt?.new_data?.status === "failed"
          ? lastAttempt.new_data.error
          : undefined,
      });
      continue;
    }
    if (claimError) {
      results.push({
        type: recipient.type,
        id: recipient.id,
        name: recipient.name,
        sent: false,
        error: "send_claim_failed",
      });
      continue;
    }

    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    const send = await sendEvolutionText(
      instanceName,
      recipient.whatsapp,
      renderedMessage,
    );
    if (!send.ok) {
      // Um por destinatário: num lote, saber QUAL falhou (e por quê) é o que
      // separa "a instância caiu" de "aquele número não tem WhatsApp".
      console.error(
        `[evolution-send] falha · tipo=${recipient.type} · nome=${recipient.name} · erro=${send.error}`,
      );
    }
    const resultData = {
      ...claimData,
      status: send.ok ? "sent" : "failed",
      provider_message_id: send.messageId ?? null,
      error: send.error ?? null,
    };
    await admin.from("audit_log").insert({
      clinic_id: clinicId,
      table_name: "whatsapp_message",
      record_id: claimId,
      action: "update",
      actor_id: user.id,
      old_data: claimData,
      new_data: resultData,
      changed_fields: ["status"],
    });
    results.push({
      type: recipient.type,
      id: recipient.id,
      name: recipient.name,
      sent: send.ok,
      messageId: send.messageId,
      error: send.error,
    });
  }

  const successful = results.filter((result) =>
    result.sent === true || result.pending === true
  );
  const failureCodes = [...new Set(
    results.flatMap((result) =>
      typeof result.error === "string" ? [result.error] : []
    ),
  )];
  return json({
    ok: successful.length > 0,
    sent: results.filter((result) => result.sent === true).length,
    pending: results.filter((result) => result.pending === true).length,
    failed: results.length - successful.length,
    results,
    error: successful.length === 0
      ? failureCodes.length === 1
        ? failureCodes[0]
        : "no_message_sent"
      : undefined,
  });
});
