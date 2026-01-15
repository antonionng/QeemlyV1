"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Download,
  FileText,
  LayoutGrid,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReportSection } from "@/components/dashboard/reports/report-section";
import { ReportCard } from "@/components/dashboard/reports/report-card";
import { ReportTypeTabs } from "@/components/dashboard/reports/report-type-tabs";
import {
  REPORT_KPIS,
  REPORT_TEMPLATES,
  REPORT_TYPES,
  RECENT_REPORTS,
  formatTimeAgo,
  type ReportTypeId,
} from "@/lib/reports/data";

const REPORT_TYPE_ICONS: Record<ReportTypeId, JSX.Element> = {
  overview: <LayoutGrid className="h-5 w-5" />,
  benchmark: <BarChart3 className="h-5 w-5" />,
  compliance: <ShieldCheck className="h-5 w-5" />,
  custom: <FileText className="h-5 w-5" />,
};

const STATUS_STYLES: Record<string, string> = {
  Ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Building: "bg-amber-50 text-amber-700 border-amber-200",
  Scheduled: "bg-brand-50 text-brand-600 border-brand-200",
};

export default function ReportsPage() {
  const [activeType, setActiveType] = useState<ReportTypeId>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const activeTypeMeta = REPORT_TYPES.find((type) => type.id === activeType);

  const filteredTemplates = useMemo(() => {
    return REPORT_TEMPLATES.filter((template) => {
      if (template.typeId !== activeType) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [activeType, searchQuery]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">Reports</h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-700/80">
            Build board-ready summaries, benchmark packs, and compliance updates with full data history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10 px-4">
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button className="h-10 px-4">
            <Plus className="h-4 w-4" />
            New report
          </Button>
          <Button variant="ghost" className="h-10 px-4">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {REPORT_KPIS.map((kpi) => (
          <Card key={kpi.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-600">{kpi.label}</p>
              <span className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-600">
                {kpi.delta}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-brand-900">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border border-brand-100 bg-gradient-to-r from-white to-brand-50/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="ghost" className="border-brand-200 text-brand-700">
                All data · Full history
              </Badge>
              <Badge variant="ghost" className="border-brand-200 text-brand-700">
                18 markets covered
              </Badge>
              <Badge variant="ghost" className="border-brand-200 text-brand-700">
                312 active companies
              </Badge>
            </div>
            <p className="mt-2 text-sm text-brand-700/70">
              Reports default to complete history, with optional time filters applied at export.
            </p>
          </div>
          <Button variant="outline" className="h-10 px-4">
            <Sparkles className="h-4 w-4" />
            Customize scope
          </Button>
        </div>
      </Card>

      <ReportSection
        title="Report types"
        description="Switch between report families to view tailored templates."
      >
        <div className="space-y-4">
          <ReportTypeTabs types={REPORT_TYPES} activeId={activeType} onChange={setActiveType} />
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  {REPORT_TYPE_ICONS[activeType]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-900">{activeTypeMeta?.label}</p>
                  <p className="text-sm text-brand-700/70">{activeTypeMeta?.description}</p>
                </div>
              </div>
              <Button variant="outline" className="h-9 px-4">
                View {activeTypeMeta?.label} reports
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </ReportSection>

      <ReportSection
        title="Templates"
        description="Start fast with curated templates and adjust the scope on export."
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search templates..."
                className="h-10 w-56 rounded-full pl-9"
              />
            </div>
            <Button variant="outline" className="h-10 px-4">
              Filter
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTemplates.map((template) => (
            <ReportCard
              key={template.id}
              title={template.title}
              description={template.description}
              badge={template.cadence}
              icon={REPORT_TYPE_ICONS[template.typeId]}
              metadata={[
                template.coverage,
                `${template.confidence} confidence`,
                `Updated ${formatTimeAgo(template.lastUpdated)}`,
              ]}
              tags={template.tags}
              action={
                <Button variant="ghost" className="h-9 px-3">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
        {filteredTemplates.length === 0 ? (
          <Card className="mt-4 p-6 text-center">
            <p className="text-sm text-brand-700">No templates match your search.</p>
          </Card>
        ) : null}
      </ReportSection>

      <div className="grid gap-6 lg:grid-cols-3">
        <ReportSection
          title="Recent reports"
          description="Track saved outputs and delivery status."
          action={
            <Button variant="outline" className="h-9 px-3">
              View all
            </Button>
          }
        >
          <div className="space-y-3">
            {RECENT_REPORTS.map((report) => (
              <Card key={report.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">{report.title}</p>
                    <p className="text-xs text-brand-700/70">
                      {report.owner} · {formatTimeAgo(report.lastRun)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      STATUS_STYLES[report.status]
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-brand-600">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1">
                    {REPORT_TYPES.find((type) => type.id === report.typeId)?.label}
                  </span>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1">{report.format}</span>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1">
                    {report.recipients} recipients
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </ReportSection>

        <Card className="flex h-full flex-col justify-between border border-brand-100 bg-gradient-to-br from-white to-brand-50/60 p-6 lg:col-span-2">
          <div>
            <div className="flex items-center gap-2 text-brand-600">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Custom builder</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-brand-900">
              Assemble a bespoke report in minutes.
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-brand-700/70">
              Mix benchmarks, compliance checks, and executive summaries into a single narrative. Save
              layouts for recurring board packs.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="ghost" className="border-brand-200 text-brand-700">
                Drag-and-drop blocks
              </Badge>
              <Badge variant="ghost" className="border-brand-200 text-brand-700">
                Collaboration notes
              </Badge>
              <Badge variant="ghost" className="border-brand-200 text-brand-700">
                Audit trail
              </Badge>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button className="h-10 px-4">
              <Plus className="h-4 w-4" />
              Start custom report
            </Button>
            <Button variant="outline" className="h-10 px-4">
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

