import { buildScoringContext, calculateKpiScores, KpiScores, UserAnswers } from "./scoring";
import { diagnoseKPIs, DiagnosisReport } from "./diagnosis";

export type FullReport = {
  answers: UserAnswers;
  kpiScores: KpiScores;
  diagnosis: DiagnosisReport;
  overview: {
    brandName?: string;
    focus?: string;
    headline: string;
  };
};

export function generateReport(userAnswers: UserAnswers): FullReport {
  const kpiScores = calculateKpiScores(userAnswers);
  const context = buildScoringContext(userAnswers);
  const diagnosis = diagnoseKPIs(kpiScores, context);

  const overviewHeadline = context.focus
    ? `Strategic insights focused on ${context.focus}.`
    : "A premium review of performance, usability, accessibility, and engagement.";

  return {
    answers: userAnswers,
    kpiScores,
    diagnosis,
    overview: {
      brandName: context.brandName,
      focus: context.focus,
      headline: overviewHeadline,
    },
  };
}
