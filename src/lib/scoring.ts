export type UserAnswers = {
  accessibilityAwareness: number;
  performancePerception: number;
  usabilityFlow: number;
  engagementRetention: number;
  navigationClarity: number;
  visualConfidence: number;
  emotionalConnection: number;
  interactionReliability: number;
  brandPositioning?: string;
  strategicFocus?: string;
};

export type KpiScores = {
  accessibility: number;
  performance: number;
  usability: number;
  engagement: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const normalizeAnswer = (value: number) => clamp(value / 10);

const weightedAverage = (values: Array<{ value: number; weight: number }>) => {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  return clamp(values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight);
};

export function calculateKpiScores(answers: UserAnswers): KpiScores {
  return {
    accessibility: weightedAverage([
      { value: normalizeAnswer(answers.accessibilityAwareness), weight: 0.5 },
      { value: normalizeAnswer(answers.navigationClarity), weight: 0.3 },
      { value: normalizeAnswer(answers.visualConfidence), weight: 0.2 },
    ]),
    performance: weightedAverage([
      { value: normalizeAnswer(answers.performancePerception), weight: 0.6 },
      { value: normalizeAnswer(answers.interactionReliability), weight: 0.4 },
    ]),
    usability: weightedAverage([
      { value: normalizeAnswer(answers.usabilityFlow), weight: 0.5 },
      { value: normalizeAnswer(answers.navigationClarity), weight: 0.3 },
      { value: normalizeAnswer(answers.visualConfidence), weight: 0.2 },
    ]),
    engagement: weightedAverage([
      { value: normalizeAnswer(answers.engagementRetention), weight: 0.5 },
      { value: normalizeAnswer(answers.emotionalConnection), weight: 0.3 },
      { value: normalizeAnswer(answers.brandPositioning ? 10 : 5), weight: 0.2 },
    ]),
  };
}

export function buildScoringContext(answers: UserAnswers) {
  return {
    brandName: answers.brandPositioning,
    focus: answers.strategicFocus,
  };
}
