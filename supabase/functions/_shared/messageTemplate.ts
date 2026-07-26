export function renderMessageTemplate(
  template: string,
  values: Record<string, string>,
): string {
  const normalized = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return template.replace(
    /\{([A-Za-z_]+)\}/g,
    (match, key: string) => normalized[key.toLowerCase()] ?? match,
  );
}

export function renderClinicTemplate(
  template: string,
  clinicName: string,
): string {
  return renderMessageTemplate(template, { clinica: clinicName.trim() });
}
