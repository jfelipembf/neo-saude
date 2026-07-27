import { normalizeWhatsappNumber } from "./evolution.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

Deno.test("normalizeWhatsappNumber adds Brazil country code to local numbers", () => {
  assertEquals(normalizeWhatsappNumber("(82) 99999-0000"), "5582999990000");
  assertEquals(normalizeWhatsappNumber("82 3333-0000"), "558233330000");
});

Deno.test("normalizeWhatsappNumber keeps international numbers", () => {
  assertEquals(normalizeWhatsappNumber("+55 82 99999-0000"), "5582999990000");
  assertEquals(normalizeWhatsappNumber("351912345678"), "351912345678");
});

Deno.test("normalizeWhatsappNumber rejects incomplete numbers", () => {
  assertEquals(normalizeWhatsappNumber("9999-0000"), null);
  assertEquals(normalizeWhatsappNumber(""), null);
});
