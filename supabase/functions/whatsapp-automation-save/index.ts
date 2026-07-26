import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const TRIGGERS = new Set([
  "after_booking",
  "appointment_day",
  "no_show",
  "birthday",
  "billing",
]);
const COMMON_PLACEHOLDERS = new Set(["paciente", "clinica"]);
const TRIGGER_PLACEHOLDERS: Record<string, Set<string>> = {
  after_booking: new Set(["data", "hora", "profissional"]),
  appointment_day: new Set(["hora", "profissional"]),
  no_show: new Set(["data", "profissional"]),
  birthday: new Set(),
  billing: new Set(["valor", "data"]),
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

function validTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  return Number(match[1]) <= 23 && Number(match[2]) <= 59;
}

function placeholdersValid(message: string, trigger: string): boolean {
  const allowed = new Set([
    ...COMMON_PLACEHOLDERS,
    ...(TRIGGER_PLACEHOLDERS[trigger] ?? []),
  ]);
  return [...message.matchAll(/\{([A-Za-z_]+)\}/g)]
    .every((match) => allowed.has(match[1].toLowerCase()));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  let body: {
    clinicId?: string;
    trigger?: string;
    status?: string;
    message?: string;
    sendTime?: string | null;
  } = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  const clinicId = String(body.clinicId ?? "");
  const trigger = String(body.trigger ?? "");
  const status = String(body.status ?? "");
  const message = String(body.message ?? "").trim();
  const sendTime = body.sendTime == null ? null : String(body.sendTime);
  const scheduled = trigger !== "after_booking";

  if (
    !clinicId ||
    !TRIGGERS.has(trigger) ||
    (status !== "active" && status !== "inactive") ||
    !message ||
    message.length > 4096 ||
    !placeholdersValid(message, trigger) ||
    (scheduled ? !sendTime || !validTime(sendTime) : sendTime !== null)
  ) {
    return json({ ok: false, error: "invalid_automation" }, 400);
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

  const { error } = await admin.from("whatsapp_automation").upsert(
    {
      clinic_id: clinicId,
      trigger,
      status,
      message,
      send_time: sendTime,
    },
    { onConflict: "clinic_id,trigger" },
  );
  if (error) {
    console.error("[whatsapp-automation-save]", error);
    return json({ ok: false, error: "automation_save_failed" });
  }
  return json({ ok: true });
});
