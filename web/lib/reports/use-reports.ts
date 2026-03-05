"use client";

import { useEffect, useMemo, useState } from "react";
import { useReportsStore } from "./store";
import type { ReportTypeId } from "./constants";

export function useReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ReportTypeId | "all">("all");
  const { templates, reports, loadReports, loadTemplates } = useReportsStore();

  useEffect(() => {
    void loadReports();
    void loadTemplates();
  }, [loadReports, loadTemplates]);

  const filteredTemplates = useMemo(() => {
    return templates.map((template) => ({
      id: template.id,
      typeId: template.type_id,
      title: template.title,
      description: template.description,
      cadence: template.cadence || "On demand",
      tags: template.tags || [],
      lastUpdated: template.updated_at,
      owner: template.owner || "People Analytics",
    })).filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === "all" || template.typeId === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType, templates]);

  const filteredRecentReports = useMemo(() => {
    return reports.map((report) => ({
      id: report.id,
      title: report.title,
      typeId: report.type_id,
      owner: report.owner,
      lastRun: report.last_run_at || report.updated_at,
      status: report.status,
      format: report.format,
      recipients: report.recipients?.length || 0,
    })).filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || report.typeId === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType, reports]);

  const stats = useMemo(() => {
    const generated = reports.length;
    const ready = reports.filter((r) => r.status === "Ready").length;
    return [
      { id: "generated", label: "Reports Generated", value: String(generated), delta: "Live", deltaLabel: "workspace total", trend: "up" as const },
      { id: "ready", label: "Ready to Share", value: String(ready), delta: "Live", deltaLabel: "currently ready", trend: "up" as const },
    ];
  }, [reports]);

  return {
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    filteredTemplates,
    filteredRecentReports,
    stats,
  };
}

export type ReportsState = ReturnType<typeof useReports>;
