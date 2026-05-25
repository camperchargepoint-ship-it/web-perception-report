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

const scoreLabels: Array<[number, string]> = [
  [0.8, "muy refinado"],
  [0.65, "sólido"],
  [0.5, "emergente"],
  [0.35, "desigual"],
  [0, "suboptimizado"],
];

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
  const label = scoreLabels.find(([threshold]) => normalized >= threshold)?.[1] ?? "en desarrollo";
  return `${getLabelName(name)} está en ${Math.round(normalized * 100)}%, lo que se percibe como ${label} para una experiencia premium.`;
}

function emotionalTone(summary: string): string {
  return `Una voz de auditoría cuidadosamente considerada observa que ${summary}`;
}

function deriveWeakAreas(scores: Record<string, number>): string[] {
  return Object.entries(scores)
    .filter(([, value]) => normalizeScore(value) < 0.65)
    .map(([key]) => `${getLabelName(key)} requiere atención para elevar la experiencia.`);
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
      "Sigue refinando con ajustes estratégicos que refuercen tu posición premium sin perder elegancia." 
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
    options.brandName ? `${options.brandName} recibe una auditoría premium equilibrada y estratégica.` : "El análisis ofrece una evaluación medida y de alto nivel.",
    options.focus ? `Está especialmente orientado a ${options.focus}.` : "Se diseña para sentirse como una revisión UX editorial y de lujo.",
    "Ningún componente se presenta como perfecto; el énfasis está en el impulso, la sutileza y la claridad estratégica.",
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
      focus: "audiencia premium",
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
