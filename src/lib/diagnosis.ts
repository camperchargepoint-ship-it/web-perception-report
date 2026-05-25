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
  [0.8, "highly refined"],
  [0.65, "solid"],
  [0.5, "emerging"],
  [0.35, "uneven"],
  [0, "under-optimized"],
];

function normalizeScore(value: number): number {
  const clamped = Math.max(0, Math.min(0.99, value));
  return Number(clamped.toFixed(2));
}

function interpretScore(name: string, value: number): string {
  const normalized = normalizeScore(value);
  const label = scoreLabels.find(([threshold]) => normalized >= threshold)?.[1] ?? "developing";
  return `${name} sits at ${Math.round(normalized * 100)}%, which feels ${label} for a premium experience.`;
}

function emotionalTone(summary: string): string {
  return `A carefully considered audit voice observes that ${summary}`;
}

function deriveWeakAreas(scores: Record<string, number>): string[] {
  return Object.entries(scores)
    .filter(([, value]) => normalizeScore(value) < 0.65)
    .map(([key]) => `${key} requires closer attention to elevate the experience.`);
}

function deriveOpportunities(scores: Record<string, number>): string[] {
  const opportunities: string[] = [];

  if ((normalizeScore(scores.accessibility ?? 0)) < 0.75) {
    opportunities.push(
      "Refine accessibility touchpoints with clearer hierarchy and interaction cues to make the interface more inclusive and intuitive."
    );
  }

  if ((normalizeScore(scores.performance ?? 0)) < 0.80) {
    opportunities.push(
      "Optimize fast-path interactions and perceptual performance so the experience feels seamless under real customer conditions."
    );
  }

  if ((normalizeScore(scores.usability ?? 0)) < 0.75) {
    opportunities.push(
      "Align navigation and content structure with user intent to reduce friction and strengthen confidence in each touchpoint."
    );
  }

  if ((normalizeScore(scores.engagement ?? 0)) < 0.85) {
    opportunities.push(
      "Elevate emotional resonance through curated microcopy, purposeful motion, and more elegant interaction rhythms."
    );

  }

  if (opportunities.length === 0) {
    opportunities.push(
      "Continue refining the experience with small, strategic improvements that reinforce your premium position and preserve momentum."
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
    options.brandName ? `${options.brandName} receives a premium audit that is balanced and strategic.` : "The audit delivers a measured, premium assessment.",
    options.focus ? `It is especially attuned to ${options.focus}.` : "It is designed to feel like a high-end UX review.",
    "No component is crowned flawless; the focus is on momentum, nuance, and clear direction.",
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
      accessibility: 0.88,
      performance: 0.93,
      usability: 0.89,
      engagement: 0.86,
    },
    {
      brandName: "Elevate Studio",
      focus: "premium conversion journeys",
    }
  ),
  medium: diagnoseKPIs(
    {
      accessibility: 0.72,
      performance: 0.65,
      usability: 0.70,
      engagement: 0.78,
    },
    {
      brandName: "Canvas Collective",
      focus: "user confidence and retention",
    }
  ),
  weak: diagnoseKPIs(
    {
      accessibility: 0.48,
      performance: 0.52,
      usability: 0.50,
      engagement: 0.43,
    },
    {
      brandName: "Foundry Labs",
      focus: "baseline product experience",
    }
  ),
};
