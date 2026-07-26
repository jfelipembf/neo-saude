import { renderClinicTemplate } from "./messageTemplate.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

Deno.test("renderClinicTemplate resolves every clinic placeholder", () => {
  assertEquals(
    renderClinicTemplate(
      "Consulta na {clinica}. Em caso de dúvida, fale com a {CLINICA}.",
      "Neo Saúde Maceió",
    ),
    "Consulta na Neo Saúde Maceió. Em caso de dúvida, fale com a Neo Saúde Maceió.",
  );
});

Deno.test("renderClinicTemplate preserves special replacement characters", () => {
  assertEquals(
    renderClinicTemplate("Mensagem da {clinica}", "Clínica Saúde $ & Filhos"),
    "Mensagem da Clínica Saúde $ & Filhos",
  );
});
