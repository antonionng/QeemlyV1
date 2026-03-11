"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Shield,
  MessageSquare,
  TrendingUp,
  Info,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { generateAdvisory } from "@/lib/advisory/generator";
import type { AdvisoryRisk } from "@/lib/advisory/types";
import type { Employee } from "@/lib/employees";
import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import clsx from "clsx";

interface AdvisoryPanelProps {
  employee: Employee;
  proposedIncrease?: number;
}

const RISK_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  high: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500" },
  low: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" },
};

const AUDIENCE_ICONS: Record<string, typeof MessageSquare> = {
  manager: MessageSquare,
  employee: Info,
  finance: TrendingUp,
};

const OPEN_AI_DRAWER_EVENT = "qeemly:open-ai-drawer";

export function AdvisoryPanel({ employee, proposedIncrease }: AdvisoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTalkTrack, setActiveTalkTrack] = useState<string>("manager");
  const [question, setQuestion] = useState("");

  const advisory = useMemo(
    () =>
      generateAdvisory({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        baseSalary: employee.baseSalary,
        bandPosition: employee.bandPosition,
        bandPercentile: employee.bandPercentile,
        marketComparison: employee.marketComparison,
        performanceRating: employee.performanceRating,
        employmentType: employee.employmentType,
        department: employee.department,
        roleName: employee.role.title,
        levelName: employee.level.name,
        hireDate: employee.hireDate,
        lastReviewDate: employee.lastReviewDate,
        proposedIncrease,
      }),
    [employee, proposedIncrease]
  );
  const benchmarkTrust = buildBenchmarkTrustLabels(employee.benchmarkContext);

  const confidenceColor =
    advisory.confidence_score >= 80
      ? "text-emerald-600"
      : advisory.confidence_score >= 60
        ? "text-amber-600"
        : "text-red-600";

  const confidenceBg =
    advisory.confidence_score >= 80
      ? "bg-emerald-100"
      : advisory.confidence_score >= 60
        ? "bg-amber-100"
        : "bg-red-100";

  const askQuestion = () => {
    const prompt = question.trim();
    if (!prompt) return;
    window.dispatchEvent(
      new CustomEvent(OPEN_AI_DRAWER_EVENT, {
        detail: {
          mode: "employee",
          employeeId: employee.id,
          employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`.trim(),
            role: employee.role.title,
            department: employee.department,
          },
          message: prompt,
        },
      })
    );
    setQuestion("");
  };

  return (
    <Card className="overflow-hidden border-brand-200/50">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-900">
                {employee.firstName} {employee.lastName}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-brand-400 bg-brand-50 px-2 py-0.5 rounded-full">
                Advisory
              </span>
            </div>
            <p className="text-xs text-brand-500 mt-0.5 line-clamp-1 max-w-md">
              {advisory.recommendation_summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {advisory.risks.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              {advisory.risks.length} flag{advisory.risks.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className={clsx("flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5", confidenceBg, confidenceColor)}>
            {advisory.confidence_score}%
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-brand-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-brand-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border/50 px-5 py-5 space-y-5">
          {/* Recommendation Summary */}
          <div className="rounded-xl bg-brand-50 p-4">
            <h4 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
              Recommendation
            </h4>
            <p className="text-sm text-brand-900 leading-relaxed">
              {advisory.recommendation_summary}
            </p>
            {benchmarkTrust && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700">
                  {benchmarkTrust.sourceLabel}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700">
                  {benchmarkTrust.matchLabel}
                </span>
                {benchmarkTrust.freshnessLabel && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700">
                    {benchmarkTrust.freshnessLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rationale Bullets */}
          <div>
            <h4 className="text-xs font-semibold text-accent-500 uppercase tracking-wider mb-3">
              Rationale
            </h4>
            <div className="space-y-2">
              {advisory.rationale.map((r, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-accent-50 px-4 py-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-200 text-brand-700 text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-accent-900">{r.point}</div>
                    <div className="text-xs text-accent-500 mt-0.5">{r.supporting_data}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Flags */}
          {advisory.risks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-accent-500 uppercase tracking-wider mb-3">
                Risk Flags
              </h4>
              <div className="space-y-2">
                {advisory.risks.map((risk: AdvisoryRisk, i: number) => {
                  const colors = RISK_COLORS[risk.severity];
                  return (
                    <div key={i} className={clsx("flex items-start gap-3 rounded-lg px-4 py-3", colors.bg)}>
                      <Shield className={clsx("h-4 w-4 mt-0.5 shrink-0", colors.icon)} />
                      <div>
                        <div className={clsx("text-sm font-medium", colors.text)}>{risk.label}</div>
                        <div className="text-xs text-accent-600 mt-0.5">{risk.detail}</div>
                      </div>
                      <span className={clsx("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", colors.bg, colors.text)}>
                        {risk.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-accent-500 uppercase tracking-wider">
                Qeemly Confidence Score
              </h4>
              <span className={clsx("text-lg font-bold", confidenceColor)}>
                {advisory.confidence_score}/100
              </span>
            </div>
            <div className="h-2 rounded-full bg-accent-100 overflow-hidden mb-2">
              <div
                className={clsx(
                  "h-full rounded-full transition-all",
                  advisory.confidence_score >= 80
                    ? "bg-emerald-500"
                    : advisory.confidence_score >= 60
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
                style={{ width: `${advisory.confidence_score}%` }}
              />
            </div>
            <p className="text-xs text-accent-500">{advisory.confidence_explanation}</p>
          </div>

          {/* Talk Tracks */}
          <div>
            <h4 className="text-xs font-semibold text-accent-500 uppercase tracking-wider mb-3">
              Talk Tracks
            </h4>
            <div className="flex gap-1 mb-3 rounded-lg bg-accent-100 p-1">
              {advisory.talk_tracks.map((track) => {
                const Icon = AUDIENCE_ICONS[track.audience];
                return (
                  <button
                    key={track.audience}
                    type="button"
                    onClick={() => setActiveTalkTrack(track.audience)}
                    className={clsx(
                      "flex items-center gap-1.5 flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all",
                      activeTalkTrack === track.audience
                        ? "bg-white text-brand-900 shadow-sm"
                        : "text-accent-600 hover:text-accent-800"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {track.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>
            {advisory.talk_tracks
              .filter((t) => t.audience === activeTalkTrack)
              .map((track) => (
                <div key={track.audience} className="space-y-2">
                  {track.points.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-accent-700">
                      <span className="text-brand-400 mt-1 shrink-0">&bull;</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              ))}
          </div>

          {/* Ask About This Employee */}
          <div className="rounded-xl border border-border p-4">
            <h4 className="text-xs font-semibold text-accent-500 uppercase tracking-wider mb-3">
              Ask About This Employee
            </h4>
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  askQuestion();
                }}
                placeholder="Ask a compensation question for this employee..."
                className="flex-1 h-10 rounded-lg border border-border bg-white px-3 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={askQuestion}
                disabled={!question.trim()}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                Ask
              </button>
            </div>
            <p className="mt-2 text-[11px] text-accent-500">
              Opens Qeemly AI side chat with this employee context.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="text-[10px] text-accent-400 border-t border-border/50 pt-3">
            Qeemly Advisory provides structured guidance based on deterministic compensation data.
            All calculations remain rule-based. This is not a substitute for human judgment.
          </div>
        </div>
      )}
    </Card>
  );
}
