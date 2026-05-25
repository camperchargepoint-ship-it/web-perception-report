import * as cheerio from "cheerio";

export type WebsiteAnalysis = {
  normalizedUrl: string;
  pageTitle: string;
  h1Text: string;
  hasH1: boolean;
  ctaCandidates: string[];
  hasCTA: boolean;
  notes: string[];
};

const CTA_KEYWORDS = [
  "contacto",
  "contactar",
  "reservar",
  "comprar",
  "pedir cita",
  "solicitar",
  "presupuesto",
  "empezar",
  "ver productos",
];

const emptyAnalysis = (normalizedUrl: string, notes: string[]): WebsiteAnalysis => ({
  normalizedUrl,
  pageTitle: "",
  h1Text: "",
  hasH1: false,
  ctaCandidates: [],
  hasCTA: false,
  notes,
});

const normalizeUrl = (url: string) => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) return "";

  const urlWithProtocol = trimmedUrl.includes("://")
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  return new URL(urlWithProtocol).toString();
};

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

const uniqueItems = (items: string[]) => Array.from(new Set(items));

const looksLikeCTA = (text: string) => {
  const normalizedText = text.toLowerCase();
  return CTA_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
};

const extractCTACandidates = ($: cheerio.CheerioAPI) => {
  const candidates: string[] = [];

  $("a, button, [role='button']").each((_, element) => {
    const text = cleanText($(element).text());
    const ariaLabel = cleanText($(element).attr("aria-label") || "");
    const title = cleanText($(element).attr("title") || "");
    const candidate = text || ariaLabel || title;

    if (candidate && looksLikeCTA(candidate)) {
      candidates.push(candidate);
    }
  });

  return uniqueItems(candidates).slice(0, 12);
};

const buildNotes = (analysis: Omit<WebsiteAnalysis, "notes">) => {
  const notes: string[] = [];

  if (analysis.pageTitle) {
    notes.push("La página incluye un título visible para navegadores y buscadores.");
  } else {
    notes.push("No se ha detectado un título de página claro.");
  }

  if (analysis.hasH1) {
    notes.push("Se ha detectado un H1 principal, útil para reforzar la jerarquía del mensaje.");
  } else {
    notes.push("No se ha detectado un H1; conviene revisar la claridad del mensaje principal.");
  }

  if (analysis.hasCTA) {
    notes.push("Se han encontrado llamadas a la acción que pueden orientar al usuario hacia el siguiente paso.");
  } else {
    notes.push("No se han detectado llamadas a la acción claras en enlaces o botones.");
  }

  return notes;
};

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  let normalizedUrl = "";

  try {
    normalizedUrl = normalizeUrl(url);
  } catch {
    return emptyAnalysis("", [
      "La URL introducida no tiene un formato válido para realizar el análisis.",
    ]);
  }

  if (!normalizedUrl) {
    return emptyAnalysis("", [
      "No se ha recibido una URL para analizar.",
    ]);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Web Perception Report/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return emptyAnalysis(normalizedUrl, [
        `No se ha podido cargar la página. El servidor respondió con estado ${response.status}.`,
      ]);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pageTitle = cleanText($("title").first().text());
    const h1Text = cleanText($("h1").first().text());
    const ctaCandidates = extractCTACandidates($);

    const analysisWithoutNotes = {
      normalizedUrl,
      pageTitle,
      h1Text,
      hasH1: h1Text.length > 0,
      ctaCandidates,
      hasCTA: ctaCandidates.length > 0,
    };

    return {
      ...analysisWithoutNotes,
      notes: buildNotes(analysisWithoutNotes),
    };
  } catch (error) {
    const fallbackReason = error instanceof Error && error.name === "AbortError"
      ? "La página ha tardado demasiado en responder."
      : "No se ha podido completar el análisis automático de la página.";

    return emptyAnalysis(normalizedUrl, [fallbackReason]);
  }
}
