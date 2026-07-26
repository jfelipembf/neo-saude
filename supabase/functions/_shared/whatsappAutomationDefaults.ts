export interface WhatsAppAutomationDefault {
  trigger: string;
  status: "inactive";
  message: string;
  send_time: string | null;
}

export const WHATSAPP_AUTOMATION_DEFAULTS: WhatsAppAutomationDefault[] = [
  {
    trigger: "after_booking",
    status: "inactive",
    message:
      "Olá, {paciente}! Seu atendimento na {clinica} foi agendado para {data}, às {hora}, com {profissional}. Se precisar alterar o horário, avise-nos com antecedência.",
    send_time: null,
  },
  {
    trigger: "appointment_day",
    status: "inactive",
    message:
      "Olá, {paciente}! Passando para lembrar que seu atendimento na {clinica} é hoje, às {hora}, com {profissional}. Até breve!",
    send_time: "08:00",
  },
  {
    trigger: "no_show",
    status: "inactive",
    message:
      "Olá, {paciente}. Sentimos sua ausência no atendimento de {data}, na {clinica}. Podemos ajudar a encontrar um novo horário?",
    send_time: "18:00",
  },
  {
    trigger: "birthday",
    status: "inactive",
    message:
      "Olá, {paciente}! A equipe da {clinica} deseja um feliz aniversário, com muita saúde e bons momentos!",
    send_time: "09:00",
  },
  {
    trigger: "billing",
    status: "inactive",
    message:
      "Olá, {paciente}. Identificamos na {clinica} um saldo em aberto de {valor}, com vencimento em {data}. Se o pagamento já foi realizado, desconsidere esta mensagem. Em caso de dúvida, estamos à disposição.",
    send_time: "09:00",
  },
];
