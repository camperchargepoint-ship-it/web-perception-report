const LEAD_RECIPIENT = "info@veronicavalero.com";
const LEAD_SENDER = "Web Perception Report <noreply@veronicavalero.com>";
const RESEND_EMAIL_API_URL = "https://api.resend.com/emails";

type KpiScores = Record<string, number>;

type LeadPayload = {
  nombre: string;
  email: string;
  web: string;
  kpiScores: KpiScores;
  diagnosisSummary: string;
  opportunities: string[];
};

const kpiLabels: Record<string, string> = {
  claridad: "Claridad",
  confianza: "Confianza",
  percepcionDeMarca: "Percepción de marca",
  conversion: "Conversión",
  experienciaMovil: "Experiencia móvil",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidLeadPayload = (value: unknown): value is LeadPayload => {
  if (!isRecord(value)) return false;

  return (
    typeof value.nombre === "string" &&
    value.nombre.trim().length > 0 &&
    typeof value.email === "string" &&
    value.email.trim().length > 0 &&
    typeof value.web === "string" &&
    value.web.trim().length > 0 &&
    isRecord(value.kpiScores) &&
    Object.values(value.kpiScores).every((score) => typeof score === "number") &&
    typeof value.diagnosisSummary === "string" &&
    value.diagnosisSummary.trim().length > 0 &&
    Array.isArray(value.opportunities) &&
    value.opportunities.every((item) => typeof item === "string")
  );
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatKpiScores = (scores: KpiScores) =>
  Object.entries(scores)
    .map(([key, value]) => {
      const label = kpiLabels[key] ?? key;
      return `${label}: ${Math.round(value * 100)}%`;
    })
    .join("\n");

const buildLeadEmail = (lead: LeadPayload) => {
  const kpiText = formatKpiScores(lead.kpiScores);
  const opportunitiesText = lead.opportunities.map((item) => `- ${item}`).join("\n");

  const htmlKpis = Object.entries(lead.kpiScores)
    .map(([key, value]) => {
      const label = kpiLabels[key] ?? key;
      return `<li><strong>${escapeHtml(label)}:</strong> ${Math.round(value * 100)}%</li>`;
    })
    .join("");

  const htmlOpportunities = lead.opportunities
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return {
    subject: `Nuevo lead de auditoría web: ${lead.nombre}`,
    text: [
      "Nuevo lead desde la auditoría web premium.",
      "",
      `Nombre: ${lead.nombre}`,
      `Email: ${lead.email}`,
      `Web: ${lead.web}`,
      "",
      "KPI scores:",
      kpiText,
      "",
      "Resumen del diagnóstico:",
      lead.diagnosisSummary,
      "",
      "Oportunidades:",
      opportunitiesText,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h1 style="font-size: 22px; margin-bottom: 16px;">Nuevo lead desde la auditoría web premium</h1>
        <p><strong>Nombre:</strong> ${escapeHtml(lead.nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
        <p><strong>Web:</strong> ${escapeHtml(lead.web)}</p>
        <h2 style="font-size: 18px; margin-top: 24px;">KPI scores</h2>
        <ul>${htmlKpis}</ul>
        <h2 style="font-size: 18px; margin-top: 24px;">Resumen del diagnóstico</h2>
        <p>${escapeHtml(lead.diagnosisSummary)}</p>
        <h2 style="font-size: 18px; margin-top: 24px;">Oportunidades</h2>
        <ul>${htmlOpportunities}</ul>
      </div>
    `,
  };
};

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return Response.json(
      { error: "Falta configurar RESEND_API_KEY." },
      { status: 500 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "El cuerpo de la solicitud no es válido." },
      { status: 400 }
    );
  }

  if (!isValidLeadPayload(payload)) {
    return Response.json(
      { error: "Los datos del lead están incompletos." },
      { status: 400 }
    );
  }

  const email = buildLeadEmail({
    ...payload,
    nombre: payload.nombre.trim(),
    email: payload.email.trim(),
    web: payload.web.trim(),
    diagnosisSummary: payload.diagnosisSummary.trim(),
  });

  const response = await fetch(RESEND_EMAIL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: LEAD_SENDER,
      to: LEAD_RECIPIENT,
      subject: email.subject,
      text: email.text,
      html: email.html,
      reply_to: payload.email,
    }),
  });

  if (!response.ok) {
    return Response.json(
      { error: "No se pudo enviar la notificación del lead." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
