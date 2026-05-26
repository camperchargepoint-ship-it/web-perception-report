export type DiagnosisOptions = {
  brandName?: string;
  focus?: string;
};

export type DiagnosisReport = {
  assessment: string;
  emotionalSummary: string;
  weakAreas: string[];
  improvementOpportunities: string[];
  interpretedScores: Record<string, number>;
};

const scoreDiagnostics: Record<string, { high: string; medium: string; low: string }> = {
  claridad: {
    high: "El mensaje principal se entiende rápidamente y transmite una propuesta clara.",
    medium: "La propuesta se percibe, aunque algunos bloques generan fricción visual o conceptual.",
    low: "El usuario necesita demasiado esfuerzo para comprender qué ofrece realmente la marca.",
  },
  confianza: {
    high: "La presencia visual transmite profesionalidad y coherencia.",
    medium: "La base es correcta, aunque algunos elementos reducen la percepción de solidez.",
    low: "La experiencia actual puede generar dudas en la primera impresión.",
  },
  percepcionDeMarca: {
    high: "La identidad visual tiene personalidad y una dirección clara.",
    medium: "La marca funciona, aunque todavía resulta algo genérica.",
    low: "La percepción visual no refleja todavía el valor real del proyecto.",
  },
  conversion: {
    high: "La estructura acompaña correctamente al usuario hacia la acción.",
    medium: "Existen oportunidades para mejorar foco y llamadas a la acción.",
    low: "El flujo actual no guía claramente hacia la conversión.",
  },
  experienciaMovil: {
    high: "La experiencia móvil se percibe fluida y bien resuelta.",
    medium: "La navegación funciona, aunque algunos elementos podrían optimizarse.",
    low: "La experiencia móvil presenta fricción visual o funcional.",
  },
};

function normalizeScore(value: number): number {
  const clamped = Math.max(0, Math.min(0.99, value));
  return Number(clamped.toFixed(2));
}

function getLabelName(name: string) {
  const labelNames: Record<string, string> = {
    claridad: "Claridad",
    confianza: "Confianza",
    percepcionDeMarca: "Percepción de marca",
    conversion: "Conversión",
    experienciaMovil: "Experiencia móvil",
  };

  return labelNames[name] ?? name;
}

function interpretScore(name: string, value: number): string {
  const normalized = normalizeScore(value);
  const level = normalized >= 0.8 ? "high" : normalized >= 0.55 ? "medium" : "low";
  const diagnostic = scoreDiagnostics[name]?.[level] ?? `${getLabelName(name)} requiere una lectura más precisa.`;
  return `${getLabelName(name)}: ${diagnostic}`;
}

function emotionalTone(summary: string): string {
  return `La lectura estratégica sugiere una experiencia con potencial claro: ${summary}`;
}

function deriveWeakAreas(scores: Record<string, number>): string[] {
  return Object.entries(scores)
    .filter(([, value]) => normalizeScore(value) < 0.65)
    .map(([key, value]) => interpretScore(key, value));
}

function deriveOpportunities(scores: Record<string, number>): string[] {
  const opportunities: string[] = [];

  if ((normalizeScore(scores.claridad ?? 0)) < 0.75) {
    opportunities.push(
      "Clarifica el mensaje principal y simplifica la jerarquía para que el usuario entienda inmediatamente lo que ofreces."
    );
  }

  if ((normalizeScore(scores.confianza ?? 0)) < 0.80) {
    opportunities.push(
      "Refuerza la coherencia visual y el tono para generar una sensación de confianza desde el primer contacto."
    );
  }

  if ((normalizeScore(scores.percepcionDeMarca ?? 0)) < 0.75) {
    opportunities.push(
      "Alinea la identidad de marca con el valor que ofreces para destacar con más claridad frente a la competencia."
    );
  }

  if ((normalizeScore(scores.conversion ?? 0)) < 0.75) {
    opportunities.push(
      "Optimiza los llamados a la acción y los puntos de decisión para transformar más visitas en resultados tangibles."
    );
  }

  if ((normalizeScore(scores.experienciaMovil ?? 0)) < 0.85) {
    opportunities.push(
      "Mejora la experiencia móvil con interacciones más fluidas y una presentación adaptada al contexto del usuario."
    );
  }

  if (opportunities.length === 0) {
    opportunities.push(
      "Sigue refinando con ajustes estratégicos que refuercen una posición clara y consistente." 
    );
  }

  return opportunities;
}

export function diagnoseKPIs(
  kpiScores: Record<string, number>,
  options: DiagnosisOptions = {}
): DiagnosisReport {
  const normalizedScores = Object.fromEntries(
    Object.entries(kpiScores).map(([key, value]) => [key, normalizeScore(value)])
  );

  const interpretations = Object.entries(normalizedScores).map(([name, value]) => interpretScore(name, value));

  const assessment = [
    options.brandName ? `${options.brandName} muestra una base digital con señales que conviene leer con calma.` : "El análisis ofrece una lectura estratégica de la presencia digital.",
    options.focus ? `La revisión se orienta especialmente a ${options.focus}.` : "El foco está en claridad, confianza, percepción de marca y capacidad de conversión.",
    "Más que señalar errores aislados, el informe identifica dónde la experiencia puede ganar intención, elegancia y dirección.",
  ].join(" ");

  const emotionalSummary = emotionalTone(
    interpretations.join(" ")
  );

  const weakAreas = deriveWeakAreas(normalizedScores);
  const improvementOpportunities = deriveOpportunities(normalizedScores);

  return {
    assessment,
    emotionalSummary,
    weakAreas,
    improvementOpportunities,
    interpretedScores: normalizedScores,
  };
}

export const mockDiagnosisExamples = {
  good: diagnoseKPIs(
    {
      claridad: 0.88,
      confianza: 0.93,
      percepcionDeMarca: 0.89,
      conversion: 0.86,
      experienciaMovil: 0.87,
    },
    {
      brandName: "Elevate Studio",
      focus: "claridad estratégica",
    }
  ),
  medium: diagnoseKPIs(
    {
      claridad: 0.72,
      confianza: 0.65,
      percepcionDeMarca: 0.70,
      conversion: 0.78,
      experienciaMovil: 0.74,
    },
    {
      brandName: "Canvas Collective",
      focus: "alineación de marca",
    }
  ),
  weak: diagnoseKPIs(
    {
      claridad: 0.48,
      confianza: 0.52,
      percepcionDeMarca: 0.50,
      conversion: 0.43,
      experienciaMovil: 0.46,
    },
    {
      brandName: "Foundry Labs",
      focus: "experiencia móvil y conversión",
    }
  ),
};
