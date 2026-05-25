import { analyzeWebsite, type WebsiteAnalysis } from "../../../lib/webAnalysis";

const LEAD_RECIPIENT = "info@veronicavalero.com";
const LEAD_SENDER = "Web Perception Report <noreply@veronicavalero.com>";
const RESEND_EMAIL_API_URL = "https://api.resend.com/emails";
const isDevelopment = process.env.NODE_ENV === "development";

type KpiScores = Record<string, number>;

type LeadPayload = {
  nombre: string;
  email: string;
  web: string;
  kpiScores: KpiScores;
  diagnosisSummary: string;
  opportunities: string[];
};

type EnrichedLeadPayload = LeadPayload & {
  websiteAnalysis: WebsiteAnalysis;
};

type ResendEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  reply_to?: string;
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

const errorResponse = (publicMessage: string, status: number, exactMessage?: string) =>
  Response.json(
    { error: isDevelopment && exactMessage ? exactMessage : publicMessage },
    { status }
  );

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

const formatList = (items: string[], fallback: string) =>
  items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : fallback;

const buildWebsiteAnalysisText = (analysis: WebsiteAnalysis) => [
  `URL normalizada: ${analysis.normalizedUrl || "No disponible"}`,
  `Título de página: ${analysis.pageTitle || "No detectado"}`,
  `H1 detectado: ${analysis.hasH1 ? analysis.h1Text || "Sí, sin texto disponible" : "No detectado"}`,
  "",
  "CTA detectados:",
  formatList(analysis.ctaCandidates, "No se han detectado CTA claros."),
  "",
  "Notas automáticas:",
  formatList(analysis.notes, "No hay notas automáticas disponibles."),
].join("\n");

const buildWebsiteAnalysisHtml = (
  analysis: WebsiteAnalysis,
  variant: "light" | "dark"
) => {
  const isDark = variant === "dark";
  const borderColor = isDark ? "rgba(255,255,255,0.10)" : "#e5e7eb";
  const mutedColor = isDark ? "#94a3b8" : "#4b5563";
  const textColor = isDark ? "#e2e8f0" : "#111827";
  const panelBackground = isDark ? "rgba(15, 23, 42, 0.78)" : "#f9fafb";
  const accentColor = isDark ? "#fbbf24" : "#92400e";

  const ctaItems = analysis.ctaCandidates.length > 0
    ? analysis.ctaCandidates.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No se han detectado CTA claros.</li>";
  const noteItems = analysis.notes.length > 0
    ? analysis.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No hay notas automáticas disponibles.</li>";

  return `
    <div style="margin-top: 28px; padding: 28px; border-radius: 24px; background: ${panelBackground}; border: 1px solid ${borderColor};">
      <p style="margin: 0 0 16px; color: ${accentColor}; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Análisis automático del sitio</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; color: ${textColor}; font-family: Arial, sans-serif;">
        <tr>
          <td style="padding: 10px 0; color: ${mutedColor}; font-size: 13px;">Título de página</td>
          <td align="right" style="padding: 10px 0; font-size: 14px; font-weight: 700;">${escapeHtml(analysis.pageTitle || "No detectado")}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: ${mutedColor}; font-size: 13px;">H1 detectado</td>
          <td align="right" style="padding: 10px 0; font-size: 14px; font-weight: 700;">${escapeHtml(analysis.hasH1 ? analysis.h1Text || "Sí, sin texto disponible" : "No detectado")}</td>
        </tr>
      </table>
      <div style="margin-top: 18px;">
        <p style="margin: 0 0 8px; color: ${mutedColor}; font-family: Arial, sans-serif; font-size: 13px;">CTA detectados</p>
        <ul style="margin: 0; padding-left: 18px; color: ${textColor}; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7;">${ctaItems}</ul>
      </div>
      <div style="margin-top: 18px;">
        <p style="margin: 0 0 8px; color: ${mutedColor}; font-family: Arial, sans-serif; font-size: 13px;">Notas automáticas</p>
        <ul style="margin: 0; padding-left: 18px; color: ${textColor}; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7;">${noteItems}</ul>
      </div>
    </div>
  `;
};

const buildLeadEmail = (lead: EnrichedLeadPayload) => {
  const kpiText = formatKpiScores(lead.kpiScores);
  const opportunitiesText = lead.opportunities.map((item) => `- ${item}`).join("\n");
  const websiteAnalysisText = buildWebsiteAnalysisText(lead.websiteAnalysis);

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
      "Análisis automático del sitio:",
      websiteAnalysisText,
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
        ${buildWebsiteAnalysisHtml(lead.websiteAnalysis, "light")}
        <h2 style="font-size: 18px; margin-top: 24px;">Oportunidades</h2>
        <ul>${htmlOpportunities}</ul>
      </div>
    `,
  };
};

const buildUserEmail = (lead: EnrichedLeadPayload) => {
  const htmlKpis = Object.entries(lead.kpiScores)
    .map(([key, value]) => {
      const label = kpiLabels[key] ?? key;
      const percentage = Math.round(value * 100);

      return `
        <tr>
          <td style="padding: 18px 0; border-bottom: 1px solid rgba(226, 232, 240, 0.14);">
            <p style="margin: 0; color: #cbd5e1; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">${escapeHtml(label)}</p>
          </td>
          <td align="right" style="padding: 18px 0; border-bottom: 1px solid rgba(226, 232, 240, 0.14);">
            <strong style="color: #f8fafc; font-size: 22px; letter-spacing: -0.01em;">${percentage}%</strong>
          </td>
        </tr>
      `;
    })
    .join("");

  return {
    subject: "Tu auditoría web estratégica",
    text: [
      `Hola ${lead.nombre},`,
      "",
      `Tu auditoría estratégica para ${lead.web} ya está lista.`,
      "",
      "KPI scores:",
      formatKpiScores(lead.kpiScores),
      "",
      "Resumen del diagnóstico:",
      lead.diagnosisSummary,
      "",
      "Análisis automático del sitio:",
      buildWebsiteAnalysisText(lead.websiteAnalysis),
      "",
      "Gracias por completar la auditoría.",
    ].join("\n"),
    html: `
      <div style="margin: 0; padding: 0; background: #020617;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #020617;">
          <tr>
            <td align="center" style="padding: 48px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 42px; border: 1px solid rgba(255,255,255,0.12); border-radius: 28px; background: linear-gradient(145deg, #0f172a 0%, #020617 58%, #111827 100%); box-shadow: 0 28px 90px rgba(0,0,0,0.35);">
                    <p style="margin: 0 0 18px; color: #fbbf24; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.26em; text-transform: uppercase;">Auditoría estratégica</p>
                    <h1 style="margin: 0; color: #ffffff; font-family: Georgia, 'Times New Roman', serif; font-size: 40px; line-height: 1.08; font-weight: 500; letter-spacing: -0.02em;">Tu lectura web ya está preparada.</h1>
                    <p style="margin: 24px 0 0; color: #cbd5e1; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.75;">
                      Hola ${escapeHtml(lead.nombre)}, hemos preparado una lectura editorial de la percepción digital de
                      <strong style="color: #f8fafc;">${escapeHtml(lead.web)}</strong>.
                    </p>

                    <div style="height: 1px; background: linear-gradient(90deg, rgba(251,191,36,0), rgba(251,191,36,0.65), rgba(251,191,36,0)); margin: 34px 0;"></div>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      ${htmlKpis}
                    </table>

                    <div style="margin-top: 34px; padding: 28px; border-radius: 24px; background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(255,255,255,0.10);">
                      <p style="margin: 0 0 12px; color: #fbbf24; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Resumen del diagnóstico</p>
                      <p style="margin: 0; color: #e2e8f0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.8;">
                        ${escapeHtml(lead.diagnosisSummary)}
                      </p>
                    </div>

                    ${buildWebsiteAnalysisHtml(lead.websiteAnalysis, "dark")}

                    <p style="margin: 34px 0 0; color: #94a3b8; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.7;">
                      Esta auditoría funciona como una primera brújula estratégica: claridad, percepción, conversión y experiencia móvil alineadas en una lectura compacta para tomar mejores decisiones.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  };
};

const sendResendEmail = async (apiKey: string, email: ResendEmail, label: string) => {
  let response: Response;

  try {
    response = await fetch(RESEND_EMAIL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(email),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido al conectar con Resend.";
    console.error(`[lead-api] Resend request failed (${label})`, error);
    return {
      ok: false,
      status: 502,
      statusText: "Fetch failed",
      body: message,
    };
  }

  const body = await response.text();

  console.error(`[lead-api] Resend response (${label})`, {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body,
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body,
  };
};

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    const message = "Falta configurar RESEND_API_KEY.";
    console.error("[lead-api] RESEND_API_KEY missing");
    return errorResponse(message, 500, message);
  }

  let payload: unknown;

  try {
    payload = await request.json();
    console.error("[lead-api] Payload received", payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer el JSON recibido.";
    console.error("[lead-api] Invalid request body", error);
    return errorResponse("El cuerpo de la solicitud no es válido.", 400, message);
  }

  if (!isValidLeadPayload(payload)) {
    const message = "Los datos del lead están incompletos o tienen un formato inválido.";
    console.error("[lead-api] Invalid lead payload", payload);
    return errorResponse("Los datos del lead están incompletos.", 400, message);
  }

  const websiteAnalysis = await analyzeWebsite(payload.web);
  // Screenshots will be implemented later with an external screenshot API for Vercel serverless compatibility.

  const lead = {
    ...payload,
    nombre: payload.nombre.trim(),
    email: payload.email.trim(),
    web: payload.web.trim(),
    diagnosisSummary: payload.diagnosisSummary.trim(),
    websiteAnalysis,
  };

  console.error("[lead-api] Website analysis completed", lead.websiteAnalysis);

  const internalEmail = buildLeadEmail(lead);
  const internalResponse = await sendResendEmail(
    resendApiKey,
    {
      from: LEAD_SENDER,
      to: LEAD_RECIPIENT,
      subject: internalEmail.subject,
      text: internalEmail.text,
      html: internalEmail.html,
      reply_to: lead.email,
    },
    "internal lead"
  );

  if (!internalResponse.ok) {
    const message = internalResponse.body || `${internalResponse.status} ${internalResponse.statusText}`;
    console.error("[lead-api] Resend returned an error (internal lead)", internalResponse);
    return errorResponse("No se pudo enviar la notificación del lead.", 502, message);
  }

  const userEmail = buildUserEmail(lead);
  const userResponse = await sendResendEmail(
    resendApiKey,
    {
      from: LEAD_SENDER,
      to: lead.email,
      subject: userEmail.subject,
      text: userEmail.text,
      html: userEmail.html,
    },
    "user report"
  );

  if (!userResponse.ok) {
    const message = userResponse.body || `${userResponse.status} ${userResponse.statusText}`;
    console.error("[lead-api] Resend returned an error (user report)", userResponse);
    return errorResponse("No se pudo enviar el email de la auditoría al usuario.", 502, message);
  }

  return Response.json({ ok: true, websiteAnalysis: lead.websiteAnalysis });
}
