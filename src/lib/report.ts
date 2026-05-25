import { calculateScores, Answers } from "./scoring";
import { diagnoseKPIs, DiagnosisReport } from "./diagnosis";

export type FullReport = {
  answers: Answers;
  kpiScores: ReturnType<typeof calculateScores>;
  diagnosis: DiagnosisReport;
  summary: string;
  weakAreas: string[];
  improvementOpportunities: string[];
};

export function generateReport(answers: Answers): FullReport {
  const kpiScores = calculateScores(answers);
  const diagnosis = diagnoseKPIs(kpiScores, {
    brandName: answers.brandPositioning,
    focus: answers.strategicFocus,
  });

  return {
    answers,
    kpiScores,
    diagnosis,
    summary: diagnosis.assessment,
    weakAreas: diagnosis.weakAreas,
    improvementOpportunities: diagnosis.improvementOpportunities,
  };
}
