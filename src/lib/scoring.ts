export type Answers = {
  claridad: number;
  percepcionMarca: number;
  conversion: number;
  experienciaMovil: number;
  brandPositioning?: string;
  strategicFocus?: string;
};

export type KpiScores = {
  claridad: number;
  confianza: number;
  percepcionDeMarca: number;
  conversion: number;
  experienciaMovil: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const normalizeAnswer = (value: number) => clamp(value / 10);

const weightedAverage = (values: Array<{ value: number; weight: number }>) => {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  return clamp(values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight);
};

export function calculateScores(answers: Answers): KpiScores {
  const claridad = normalizeAnswer(answers.claridad);
  const percepcionDeMarca = normalizeAnswer(answers.percepcionMarca);
  const conversion = normalizeAnswer(answers.conversion);
  const experienciaMovil = normalizeAnswer(answers.experienciaMovil);

  return {
    claridad,
    confianza: weightedAverage([
      { value: claridad, weight: 0.55 },
      { value: percepcionDeMarca, weight: 0.45 },
    ]),
    percepcionDeMarca,
    conversion,
    experienciaMovil,
  };
}

export function buildScoringContext(answers: Answers) {
  return {
    brandName: answers.brandPositioning,
    focus: answers.strategicFocus,
  };
}
