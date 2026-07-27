import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  evolutionConfigured,
  sendEvolutionText,
} from "../_shared/evolution.ts";
import { renderMessageTemplate } from "../_shared/messageTemplate.ts";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const CLINIC_MESSAGES_PER_MINUTE = 10;
const RECIPIENT_MESSAGES_PER_15_MINUTES = 3;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

function skipped(reason: string): Response {
  return json({ ok: true, status: "skipped", reason });
}

function failed(reason: string): Response {
  return json({ ok: false, status: "failed", reason });
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
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
    return failed("evolution_not_configured");
  }

  let body: {
    clinicId?: string;
    appointmentId?: string;
    force?: boolean;
  } = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  const clinicId = String(body.clinicId ?? "");
  const appointmentId = String(body.appointmentId ?? "");
  const force = body.force === true;
  if (!UUID_PATTERN.test(clinicId) || !UUID_PATTERN.test(appointmentId)) {
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

  const [{ data: schedulePermission }, { data: whatsappEntitlement }] =
    await Promise.all([
      admin
        .from("access_profile_permission")
        .select("can_edit")
        .eq("access_profile_id", member.access_profile_id)
        .eq("feature_key", "schedule")
        .eq("can_edit", true)
        .maybeSingle(),
      admin
        .from("plan_feature")
        .select("feature_key")
        .eq("plan_key", clinic.plan_key)
        .eq("feature_key", "whatsapp")
        .maybeSingle(),
    ]);
  if (!schedulePermission || !whatsappEntitlement) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const [appointmentResult, automationResult, connectionResult] = await Promise
    .all([
      admin
        .from("appointment")
        .select(
          "id, patient_id, professional_id, date, start_time, status, send_confirmation",
        )
        .eq("id", appointmentId)
        .eq("clinic_id", clinicId)
        .maybeSingle(),
      admin
        .from("whatsapp_automation")
        .select("status, message")
        .eq("clinic_id", clinicId)
        .eq("trigger", "after_booking")
        .maybeSingle(),
      admin
        .from("whatsapp_connection")
        .select("status, session_ref")
        .eq("clinic_id", clinicId)
        .maybeSingle(),
    ]);
  if (
    appointmentResult.error ||
    automationResult.error ||
    connectionResult.error
  ) {
    return failed("appointment_configuration_lookup_failed");
  }
  const appointment = appointmentResult.data;
  const automation = automationResult.data;
  const connection = connectionResult.data;

  if (!appointment) {
    return json({ ok: false, error: "appointment_not_found" }, 404);
  }
  if (
    appointment.status !== "scheduled" && appointment.status !== "confirmed"
  ) {
    return skipped("appointment_not_eligible");
  }
  if (!force && !appointment.send_confirmation) {
    return skipped("confirmation_disabled");
  }

  const eventId = await deterministicUuid(
    `${clinicId}|after_booking|${appointmentId}`,
  );
  const { data: history, error: historyError } = await admin
    .from("audit_log")
    .select("new_data")
    .eq("clinic_id", clinicId)
    .eq("table_name", "whatsapp_message")
    .eq("record_id", eventId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (historyError) return failed("send_history_failed");

  const latestStatus = String(history?.[0]?.new_data?.status ?? "");
  if (latestStatus === "sent" || latestStatus === "pending") {
    return json({
      ok: true,
      status: latestStatus,
      reused: true,
      reason: latestStatus === "sent" ? "already_sent" : "send_pending",
    });
  }

  if (!automation || (!force && automation.status !== "active")) {
    return skipped("automation_inactive");
  }

  const instanceName = `neosaude-${clinicId.replaceAll("-", "")}`;
  if (
    connection?.status !== "connected" ||
    connection.session_ref !== instanceName
  ) {
    return skipped("whatsapp_not_connected");
  }

  const [patientResult, professionalResult] = await Promise.all([
    admin
      .from("patient")
      .select("name, common_name, whatsapp, phone")
      .eq("id", appointment.patient_id)
      .eq("clinic_id", clinicId)
      .maybeSingle(),
    admin
      .from("professional")
      .select("name")
      .eq("id", appointment.professional_id)
      .eq("clinic_id", clinicId)
      .maybeSingle(),
  ]);
  if (patientResult.error || professionalResult.error) {
    return failed("appointment_contacts_lookup_failed");
  }
  const patient = patientResult.data;
  const professional = professionalResult.data;
  if (!patient || !professional) {
    return failed("appointment_contacts_not_found");
  }

  const phone = patient.whatsapp || patient.phone;
  if (!phone) {
    return skipped("recipient_without_whatsapp");
  }

  const message = renderMessageTemplate(automation.message, {
    paciente: patient.common_name || patient.name,
    clinica: clinic.name,
    data: formatDate(appointment.date),
    hora: String(appointment.start_time).slice(0, 5),
    profissional: professional.name,
  });
  if (!message || message.length > 4096 || /\{[A-Za-z_]+\}/.test(message)) {
    return failed("invalid_rendered_message");
  }

  const now = Date.now();
  const { count: recentClinicMessages, error: clinicRateError } = await admin
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("table_name", "whatsapp_message")
    .eq("action", "insert")
    .gte("created_at", new Date(now - 60_000).toISOString());
  if (clinicRateError) return failed("rate_limit_check_failed");
  if ((recentClinicMessages ?? 0) >= CLINIC_MESSAGES_PER_MINUTE) {
    return failed("clinic_rate_limited");
  }

  const { count: recentRecipientMessages, error: recipientRateError } =
    await admin
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("table_name", "whatsapp_message")
      .eq("action", "insert")
      .eq("new_data->>recipient_kind", "patient")
      .eq("new_data->>recipient_id", appointment.patient_id)
      .gte("created_at", new Date(now - 15 * 60_000).toISOString());
  if (recipientRateError) return failed("rate_limit_check_failed");
  if (
    (recentRecipientMessages ?? 0) >= RECIPIENT_MESSAGES_PER_15_MINUTES
  ) {
    return failed("recipient_rate_limited");
  }

  const failedAttempts = (history ?? []).filter((item) =>
    item.new_data?.status === "failed"
  ).length;
  const claimId = await deterministicUuid(`${eventId}|${failedAttempts}`);
  const messageHash = bytesToHex(
    await digestBytes(message.replace(/\s+/g, " ").trim()),
  );
  const claimData = {
    source: "appointment_automation",
    trigger: "after_booking",
    status: "pending",
    appointment_id: appointmentId,
    recipient_kind: "patient",
    recipient_id: appointment.patient_id,
    recipient_name: patient.name,
    message_hash: messageHash,
  };
  const { error: claimError } = await admin.from("audit_log").insert({
    id: claimId,
    clinic_id: clinicId,
    table_name: "whatsapp_message",
    record_id: eventId,
    action: "insert",
    actor_id: user.id,
    new_data: claimData,
  });
  if (claimError?.code === "23505") {
    return json({
      ok: true,
      status: "pending",
      reused: true,
      reason: "send_pending",
    });
  }
  if (claimError) return failed("send_claim_failed");

  const send = await sendEvolutionText(instanceName, phone, message).catch(
    () => ({ ok: false, messageId: undefined, error: "send_failed" }),
  );
  const resultData = {
    ...claimData,
    status: send.ok ? "sent" : "failed",
    provider_message_id: send.messageId ?? null,
    error: send.error ?? null,
  };
  await admin.from("audit_log").insert({
    clinic_id: clinicId,
    table_name: "whatsapp_message",
    record_id: eventId,
    action: "update",
    actor_id: user.id,
    old_data: claimData,
    new_data: resultData,
    changed_fields: ["status"],
  });

  if (!send.ok) return failed(send.error ?? "send_failed");
  return json({
    ok: true,
    status: "sent",
    messageId: send.messageId,
  });
});
