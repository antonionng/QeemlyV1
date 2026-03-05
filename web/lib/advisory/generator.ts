import type { QeemlyAdvisory, AdvisoryRationale, AdvisoryRisk, AdvisoryTalkTrack } from "./types";

interface EmployeeInput {
  id: string;
  firstName: string;
  lastName: string;
  baseSalary: number;
  bandPosition: "below" | "in-band" | "above";
  bandPercentile: number;
  marketComparison: number;
  performanceRating?: "low" | "meets" | "exceeds" | "exceptional";
  employmentType: "national" | "expat";
  department: string;
  roleName: string;
  levelName: string;
  hireDate: Date;
  lastReviewDate?: Date;
  proposedIncrease?: number;
}

function computeTenureYears(hireDate: Date): number {
  const now = new Date();
  return (now.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function buildRationale(emp: EmployeeInput): AdvisoryRationale[] {
  const rationale: AdvisoryRationale[] = [];
  const tenure = computeTenureYears(emp.hireDate);

  if (emp.bandPosition === "below") {
    rationale.push({
      point: "Currently positioned below the market band",
      supporting_data: `Band percentile is ${emp.bandPercentile}% — ${Math.abs(emp.marketComparison).toFixed(1)}% below market median`,
    });
  } else if (emp.bandPosition === "above") {
    rationale.push({
      point: "Currently positioned above the market band",
      supporting_data: `Band percentile is ${emp.bandPercentile}% — ${emp.marketComparison.toFixed(1)}% above market median`,
    });
  } else {
    rationale.push({
      point: "Well-positioned within market band",
      supporting_data: `Band percentile is ${emp.bandPercentile}% — aligned with market expectations`,
    });
  }

  if (emp.performanceRating === "exceptional") {
    rationale.push({
      point: "Exceptional performance warrants above-average consideration",
      supporting_data: "Rated Exceptional in most recent review cycle",
    });
  } else if (emp.performanceRating === "exceeds") {
    rationale.push({
      point: "Strong performer exceeding expectations",
      supporting_data: "Rated Exceeds in most recent review cycle",
    });
  } else if (emp.performanceRating === "low") {
    rationale.push({
      point: "Performance below expectations — increase should be conservative",
      supporting_data: "Rated Low in most recent review cycle",
    });
  }

  if (tenure >= 3) {
    rationale.push({
      point: `${Math.round(tenure)}-year tenure adds retention value`,
      supporting_data: `Hired ${emp.hireDate.toLocaleDateString("en-GB")} — institutional knowledge and team continuity`,
    });
  }

  return rationale.slice(0, 3);
}

function buildRisks(emp: EmployeeInput): AdvisoryRisk[] {
  const risks: AdvisoryRisk[] = [];
  const tenure = computeTenureYears(emp.hireDate);

  if (emp.bandPosition === "below" && (emp.performanceRating === "exceeds" || emp.performanceRating === "exceptional")) {
    risks.push({
      type: "retention",
      label: "Retention Risk",
      severity: "high",
      detail: "Strong performer below band — high flight risk without corrective action",
    });
  }

  if (emp.bandPosition === "below" && emp.marketComparison < -15) {
    risks.push({
      type: "equity-gap",
      label: "Significant Pay Gap",
      severity: "high",
      detail: `${Math.abs(emp.marketComparison).toFixed(1)}% below market median — may require multi-cycle correction`,
    });
  }

  if (emp.proposedIncrease && emp.proposedIncrease > emp.baseSalary * 0.15) {
    risks.push({
      type: "high-uplift",
      label: "High Uplift",
      severity: "medium",
      detail: `Proposed increase of ${((emp.proposedIncrease / emp.baseSalary) * 100).toFixed(1)}% exceeds typical threshold of 15%`,
    });
  }

  if (emp.bandPosition === "above" && emp.performanceRating === "low") {
    risks.push({
      type: "compression",
      label: "Overpayment Concern",
      severity: "medium",
      detail: "Above-band compensation paired with low performance rating",
    });
  }

  if (emp.bandPercentile > 85 && emp.performanceRating !== "exceptional") {
    risks.push({
      type: "compression",
      label: "Band Compression Risk",
      severity: "low",
      detail: `At ${emp.bandPercentile}th percentile — limited headroom for future increases without promotion`,
    });
  }

  if (emp.marketComparison < -5 && tenure < 1) {
    risks.push({
      type: "low-confidence",
      label: "New Hire Below Market",
      severity: "medium",
      detail: "Recently hired below market — may indicate offer was under-calibrated",
    });
  }

  return risks.slice(0, 4);
}

function computeConfidence(emp: EmployeeInput): { score: number; explanation: string } {
  let score = 70;
  const factors: string[] = [];

  if (emp.performanceRating) {
    score += 10;
    factors.push("performance data available");
  } else {
    factors.push("no performance data on file");
  }

  if (emp.lastReviewDate) {
    const monthsSinceReview = (Date.now() - emp.lastReviewDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    if (monthsSinceReview < 12) {
      score += 10;
      factors.push("recent review data");
    } else {
      score -= 5;
      factors.push("review data is stale (>12 months)");
    }
  }

  const tenure = computeTenureYears(emp.hireDate);
  if (tenure >= 2) {
    score += 5;
    factors.push("sufficient tenure for trend analysis");
  }

  if (emp.bandPercentile > 0) {
    score += 5;
    factors.push("benchmark data available");
  }

  score = Math.max(30, Math.min(100, score));

  return {
    score,
    explanation: `Confidence based on: ${factors.join(", ")}. Score: ${score}/100.`,
  };
}

function buildTalkTracks(emp: EmployeeInput): AdvisoryTalkTrack[] {
  const tracks: AdvisoryTalkTrack[] = [];
  const isBelow = emp.bandPosition === "below";
  const isAbove = emp.bandPosition === "above";
  const isHighPerformer = emp.performanceRating === "exceeds" || emp.performanceRating === "exceptional";
  const isLowPerformer = emp.performanceRating === "low";

  const managerPoints: string[] = [];
  if (isBelow && isHighPerformer) {
    managerPoints.push(
      `${emp.firstName} is performing at an Exceptional/Exceeds level but is compensated below the market band.`,
      "A meaningful adjustment now will reduce retention risk and signal investment in their growth.",
      "Consider pairing the salary increase with a development conversation about career trajectory."
    );
  } else if (isAbove && isLowPerformer) {
    managerPoints.push(
      `${emp.firstName}'s compensation is above market but performance ratings are below expectations.`,
      "Focus the conversation on a performance improvement plan before considering any increase.",
      "Document the performance gap and set clear, measurable objectives for the next review."
    );
  } else {
    managerPoints.push(
      `${emp.firstName} is positioned ${emp.bandPosition === "in-band" ? "within" : emp.bandPosition} the market band.`,
      `Performance is rated as ${emp.performanceRating || "not yet rated"}.`,
      "Standard increase guidelines apply — adjust based on team budget and peer equity."
    );
  }
  tracks.push({ audience: "manager", label: "Manager Talking Points", points: managerPoints });

  const employeePoints: string[] = [];
  if (isBelow) {
    employeePoints.push(
      "Your compensation is being reviewed as part of our commitment to market-competitive pay.",
      "We've identified an opportunity to bring your compensation closer to the market band.",
      "This adjustment reflects both your contributions and our market positioning goals."
    );
  } else if (isAbove) {
    employeePoints.push(
      "Your current compensation is strong relative to the market for your role and level.",
      "Any adjustments this cycle will focus on maintaining your competitive position.",
      "We encourage a conversation about growth opportunities and skill development."
    );
  } else {
    employeePoints.push(
      "Your compensation is well-positioned within the market band for your role.",
      "Proposed adjustments reflect a balance of performance, market movement, and budget.",
      "We're committed to keeping your total package competitive."
    );
  }
  tracks.push({ audience: "employee", label: "Employee Communication", points: employeePoints });

  const financePoints: string[] = [];
  if (emp.proposedIncrease) {
    const pctIncrease = (emp.proposedIncrease / emp.baseSalary) * 100;
    financePoints.push(
      `Proposed increase: ${emp.proposedIncrease.toLocaleString()} AED (${pctIncrease.toFixed(1)}% of base)`,
    );
  }
  if (isBelow && isHighPerformer) {
    financePoints.push(
      "Correction increase recommended to mitigate replacement cost (typically 1.5-2x annual salary).",
      "Budget impact is front-loaded but reduces long-term attrition expense."
    );
  } else if (isAbove) {
    financePoints.push(
      "Current compensation is above market — a conservative approach is advisable.",
      "Consider redirecting excess spend toward below-band high performers."
    );
  } else {
    financePoints.push(
      "Standard increase within budget guidelines.",
      "No significant budget risk identified for this adjustment."
    );
  }
  tracks.push({ audience: "finance", label: "Finance Justification", points: financePoints });

  return tracks;
}

function buildSummary(emp: EmployeeInput, risks: AdvisoryRisk[]): string {
  const isHighPerformer = emp.performanceRating === "exceeds" || emp.performanceRating === "exceptional";
  const isLowPerformer = emp.performanceRating === "low";
  const isBelow = emp.bandPosition === "below";
  const isAbove = emp.bandPosition === "above";

  if (isBelow && isHighPerformer) {
    return `Immediate action recommended: ${emp.firstName} ${emp.lastName} is a high performer positioned below band. A market correction increase is strongly advised to mitigate retention risk.`;
  }
  if (isAbove && isLowPerformer) {
    return `Caution advised: ${emp.firstName} ${emp.lastName} is compensated above market band with a low performance rating. A performance improvement plan should precede any increase consideration.`;
  }
  if (isBelow) {
    return `Market adjustment suggested: ${emp.firstName} ${emp.lastName} is below the market band. A modest increase toward band midpoint is recommended, calibrated to performance.`;
  }
  if (isAbove && isHighPerformer) {
    return `Well-compensated high performer: ${emp.firstName} ${emp.lastName} is above band and performing strongly. Consider non-monetary recognition or promotion pathways rather than further base increases.`;
  }
  if (risks.length === 0) {
    return `No immediate concerns: ${emp.firstName} ${emp.lastName} is well-positioned in-band with no significant risk flags. Standard review guidelines apply.`;
  }
  return `Review recommended: ${emp.firstName} ${emp.lastName} has ${risks.length} flag(s) that warrant attention during this review cycle.`;
}

export function generateAdvisory(emp: EmployeeInput): QeemlyAdvisory {
  const rationale = buildRationale(emp);
  const risks = buildRisks(emp);
  const confidence = computeConfidence(emp);
  const talkTracks = buildTalkTracks(emp);
  const summary = buildSummary(emp, risks);

  return {
    employee_id: emp.id,
    recommendation_summary: summary,
    rationale,
    risks,
    confidence_score: confidence.score,
    confidence_explanation: confidence.explanation,
    talk_tracks: talkTracks,
    generated_at: new Date().toISOString(),
  };
}
