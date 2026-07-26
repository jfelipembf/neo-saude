import { WHATSAPP_AUTOMATION_DEFAULTS } from "./whatsappAutomationDefaults.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("automation defaults cover every supported trigger", () => {
  assert(WHATSAPP_AUTOMATION_DEFAULTS.length === 5, "expected five defaults");
  assert(
    new Set(WHATSAPP_AUTOMATION_DEFAULTS.map((item) => item.trigger)).size === 5,
    "triggers must be unique",
  );
});

Deno.test("automation defaults are inactive and multitenant", () => {
  for (const item of WHATSAPP_AUTOMATION_DEFAULTS) {
    assert(item.status === "inactive", `${item.trigger} must start inactive`);
    assert(
      item.message.includes("{clinica}") &&
        item.message.includes("{paciente}"),
      `${item.trigger} must identify clinic and patient`,
    );
    assert(
      (item.trigger === "after_booking") === (item.send_time === null),
      `${item.trigger} has an invalid default time`,
    );
  }
});
