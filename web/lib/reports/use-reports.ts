"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  REPORT_TEMPLATES, 
  RECENT_REPORTS, 
  REPORT_KPIS, 
  ReportTypeId 
} from "./data";

export function useReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ReportTypeId | "all">("all");

  const filteredTemplates = useMemo(() => {
    return REPORT_TEMPLATES.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === "all" || template.typeId === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const filteredRecentReports = useMemo(() => {
    return RECENT_REPORTS.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || report.typeId === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const stats = useMemo(() => REPORT_KPIS, []);

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
