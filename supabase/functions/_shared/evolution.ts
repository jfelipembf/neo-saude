const EVOLUTION_URL = (Deno.env.get("EVOLUTION_API_URL") ?? "").replace(
  /\/+$/,
  "",
);
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";

interface EvolutionResponse {
  ok: boolean;
  status: number;
  data: unknown;
}

export function evolutionConfigured(): boolean {
  return Boolean(EVOLUTION_URL && EVOLUTION_KEY);
}

export async function evolutionRequest(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<EvolutionResponse> {
  const response = await fetch(`${EVOLUTION_URL}${path}`, {
    method,
    headers: {
      apikey: EVOLUTION_KEY,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Alguns endpoints de logout respondem sem corpo.
  }
  return { ok: response.ok, status: response.status, data };
}

// deno-lint-ignore no-explicit-any
export function pickEvolutionQr(data: any): {
  qrCode: string | null;
  pairingCode: string | null;
} {
  const qr = data?.qrcode ?? data?.data ?? data;
  return {
    qrCode: qr?.base64 ?? null,
    // `code` é o conteúdo bruto do QR, não o código numérico de pareamento.
    pairingCode: qr?.pairingCode ?? null,
  };
}

export type EvolutionConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected";

export function mapEvolutionState(state?: string): EvolutionConnectionStatus {
  if (state === "open") return "connected";
  if (state === "connecting") return "connecting";
  return "disconnected";
}

function phoneDigits(value: unknown): string | null {
  const raw = String(value ?? "").split("@")[0].split(":")[0].replace(
    /\D/g,
    "",
  );
  return raw.length >= 10 ? raw : null;
}

// deno-lint-ignore no-explicit-any
export function extractEvolutionPhone(data: any): string | null {
  const candidates = [
    data?.ownerJid,
    data?.owner,
    data?.number,
    data?.wuid,
    data?.me?.id,
    data?.instance?.ownerJid,
    data?.instance?.owner,
    data?.data?.ownerJid,
    data?.data?.wuid,
  ];
  for (const candidate of candidates) {
    const phone = phoneDigits(candidate);
    if (phone) return phone;
  }
  return null;
}

export async function fetchEvolutionPhone(
  instanceName: string,
): Promise<string | null> {
  const response = await evolutionRequest(
    `/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
  );
  if (!response.ok) return null;

  // deno-lint-ignore no-explicit-any
  const payload = response.data as any;
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
    ? payload.data
    : [payload];
  const instance =
    items.find((item: Record<string, unknown>) =>
      item?.name === instanceName || item?.instanceName === instanceName
    ) ?? items[0];
  return extractEvolutionPhone(instance);
}

export async function fetchEvolutionState(
  instanceName: string,
): Promise<EvolutionConnectionStatus> {
  const response = await evolutionRequest(
    `/instance/connectionState/${instanceName}`,
  );
  // deno-lint-ignore no-explicit-any
  const payload = response.data as any;
  const state = payload?.instance?.state ?? payload?.state;
  return mapEvolutionState(response.ok ? state : undefined);
}

interface EvolutionWebhook {
  url: string;
  events: string[];
}

interface EvolutionConnectResult {
  ok: boolean;
  qrCode?: string | null;
  pairingCode?: string | null;
  status?: EvolutionConnectionStatus;
  phone?: string | null;
  error?: string;
}

async function ensureEvolutionWebhook(
  instanceName: string,
  webhook: EvolutionWebhook,
) {
  await evolutionRequest(`/webhook/set/${instanceName}`, "POST", {
    webhook: {
      enabled: true,
      url: webhook.url,
      byEvents: false,
      webhookByEvents: false,
      base64: false,
      events: webhook.events,
    },
  }).catch(() => undefined);
}

async function connectedInstance(
  instanceName: string,
): Promise<EvolutionConnectResult | null> {
  const status = await fetchEvolutionState(instanceName);
  if (status !== "connected") return null;
  return {
    ok: true,
    status,
    phone: await fetchEvolutionPhone(instanceName),
    qrCode: null,
    pairingCode: null,
  };
}

export async function createEvolutionInstance(
  instanceName: string,
  webhook: EvolutionWebhook,
): Promise<EvolutionConnectResult> {
  let response = await evolutionRequest("/instance/create", "POST", {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
    webhook: {
      enabled: true,
      url: webhook.url,
      byEvents: false,
      webhookByEvents: false,
      base64: false,
      events: webhook.events,
    },
  });

  if (!response.ok) {
    const connected = await connectedInstance(instanceName);
    if (connected) {
      await ensureEvolutionWebhook(instanceName, webhook);
      return connected;
    }
    response = await evolutionRequest(`/instance/connect/${instanceName}`);
    if (!response.ok) return { ok: false, error: "create_failed" };
  }

  await ensureEvolutionWebhook(instanceName, webhook);
  return {
    ok: true,
    status: "connecting",
    ...pickEvolutionQr(response.data),
  };
}

export async function connectEvolutionInstance(
  instanceName: string,
): Promise<EvolutionConnectResult> {
  const connected = await connectedInstance(instanceName);
  if (connected) return connected;

  const response = await evolutionRequest(`/instance/connect/${instanceName}`);
  if (!response.ok) return { ok: false, error: "connect_failed" };
  return {
    ok: true,
    status: "connecting",
    ...pickEvolutionQr(response.data),
  };
}

export function normalizeWhatsappNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return null;
}

export async function sendEvolutionText(
  instanceName: string,
  phone: string,
  text: string,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const number = normalizeWhatsappNumber(phone);
  if (!number) return { ok: false, error: "invalid_phone" };

  const response = await evolutionRequest(
    `/message/sendText/${encodeURIComponent(instanceName)}`,
    "POST",
    {
      number,
      textMessage: { text },
      // Evita rajadas instantâneas em lotes pequenos de fornecedores.
      delay: 1200,
      linkPreview: false,
    },
  );
  if (!response.ok) return { ok: false, error: "send_failed" };

  // deno-lint-ignore no-explicit-any
  const payload = response.data as any;
  const messageId = payload?.key?.id ??
    payload?.messageId ??
    payload?.data?.key?.id;
  return {
    ok: true,
    messageId: typeof messageId === "string" ? messageId : undefined,
  };
}

export async function logoutEvolutionInstance(
  instanceName: string,
): Promise<void> {
  await evolutionRequest(`/instance/logout/${instanceName}`, "DELETE").catch(
    () => undefined,
  );
}
