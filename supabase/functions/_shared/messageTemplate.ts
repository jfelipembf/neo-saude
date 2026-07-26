export function renderClinicTemplate(
  template: string,
  clinicName: string,
): string {
  const name = clinicName.trim();
  return template.replace(/\{clinica\}/gi, () => name);
}
