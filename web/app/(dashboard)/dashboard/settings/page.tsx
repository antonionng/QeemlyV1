"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Save, 
  Building2, 
  Target, 
  CheckCircle, 
  Globe, 
  Palette,
  Calendar,
  Percent,
  Gift,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Info,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LogoUploader } from "@/components/dashboard/settings/logo-uploader";
import { ComplianceSettingsPanel } from "@/components/dashboard/settings/compliance-settings-panel";
import { 
  useCompanySettings, 
  FUNDING_STAGES, 
  REVIEW_CYCLES, 
  TARGET_PERCENTILES,
  CURRENCIES,
  COUNTRIES,
  VESTING_SCHEDULES,
  BENEFITS_TIERS,
  FISCAL_MONTHS,
  type FundingStage,
  type ReviewCycle,
  type TargetPercentile,
  type VestingSchedule,
  type BenefitsTier,
} from "@/lib/company";
import { INDUSTRIES, COMPANY_SIZES } from "@/lib/dashboard/dummy-data";
import { getEmployees, type Employee } from "@/lib/employees";
import { getBenchmark } from "@/lib/benchmarks/data-service";
import clsx from "clsx";

type SettingsTab = "profile" | "compensation" | "indices" | "compliance";
type IndexView = "family" | "family-level";

export default function SettingsPage() {
  const zustandSettings = useCompanySettings();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  // Company Profile state
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#5C45FD");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [fundingStage, setFundingStage] = useState<FundingStage>("Seed");
  const [headquartersCountry, setHeadquartersCountry] = useState("AE");
  const [headquartersCity, setHeadquartersCity] = useState("");
  
  // Compensation Defaults state
  const [targetPercentile, setTargetPercentile] = useState<TargetPercentile>(50);
  const [reviewCycle, setReviewCycle] = useState<ReviewCycle>("annual");
  const [defaultCurrency, setDefaultCurrency] = useState("AED");
  const [fiscalYearStart, setFiscalYearStart] = useState(1);
  const [defaultBonusPercentage, setDefaultBonusPercentage] = useState<number | null>(15);
  const [equityVestingSchedule, setEquityVestingSchedule] = useState<VestingSchedule>("4-year-1-cliff");
  const [benefitsTier, setBenefitsTier] = useState<BenefitsTier>("standard");
  const [compSplitBasicPct, setCompSplitBasicPct] = useState(60);
  const [compSplitHousingPct, setCompSplitHousingPct] = useState(25);
  const [compSplitTransportPct, setCompSplitTransportPct] = useState(10);
  const [compSplitOtherPct, setCompSplitOtherPct] = useState(5);

  // Load settings from API on mount
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/settings");
      if (!res.ok) {
        throw new Error("Failed to load settings");
      }
      const data = await res.json();
      const s = data.settings;
      
      setCompanyName(s.company_name || data.workspace_name || "");
      setCompanyLogo(s.company_logo ?? null);
      setCompanyWebsite(s.company_website || "");
      setCompanyDescription(s.company_description || "");
      setPrimaryColor(s.primary_color || "#5C45FD");
      setIndustry(s.industry || "");
      setCompanySize(s.company_size || "");
      setFundingStage((s.funding_stage as FundingStage) || "Seed");
      setHeadquartersCountry(s.headquarters_country || "AE");
      setHeadquartersCity(s.headquarters_city || "");
      setTargetPercentile((s.target_percentile as TargetPercentile) || 50);
      setReviewCycle((s.review_cycle as ReviewCycle) || "annual");
      setDefaultCurrency(s.default_currency || "AED");
      setFiscalYearStart(s.fiscal_year_start || 1);
      setDefaultBonusPercentage(Number(s.default_bonus_percentage) || 15);
      setEquityVestingSchedule((s.equity_vesting_schedule as VestingSchedule) || "4-year-1-cliff");
      setBenefitsTier((s.benefits_tier as BenefitsTier) || "standard");
      setCompSplitBasicPct(s.comp_split_basic_pct ?? 60);
      setCompSplitHousingPct(s.comp_split_housing_pct ?? 25);
      setCompSplitTransportPct(s.comp_split_transport_pct ?? 10);
      setCompSplitOtherPct(s.comp_split_other_pct ?? 5);
      
      // Also sync to Zustand store for sidebar
      zustandSettings.updateSettings({
        companyName: s.company_name || data.workspace_name || "",
        companyLogo: s.company_logo || "",
        companyWebsite: s.company_website || "",
        companyDescription: s.company_description || "",
        primaryColor: s.primary_color || "#5C45FD",
        industry: s.industry || "",
        companySize: s.company_size || "",
        fundingStage: (s.funding_stage as FundingStage) || "Seed",
        headquartersCountry: s.headquarters_country || "AE",
        headquartersCity: s.headquarters_city || "",
        targetPercentile: (s.target_percentile as TargetPercentile) || 50,
        reviewCycle: (s.review_cycle as ReviewCycle) || "annual",
        defaultCurrency: s.default_currency || "AED",
        fiscalYearStart: s.fiscal_year_start || 1,
        defaultBonusPercentage: Number(s.default_bonus_percentage) || 15,
        equityVestingSchedule: (s.equity_vesting_schedule as VestingSchedule) || "4-year-1-cliff",
        benefitsTier: (s.benefits_tier as BenefitsTier) || "standard",
        compSplitBasicPct: s.comp_split_basic_pct ?? 60,
        compSplitHousingPct: s.comp_split_housing_pct ?? 25,
        compSplitTransportPct: s.comp_split_transport_pct ?? 10,
        compSplitOtherPct: s.comp_split_other_pct ?? 5,
      });
      if (s.is_configured) {
        zustandSettings.markAsConfigured();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [zustandSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        company_name: companyName,
        company_logo: companyLogo,
        company_website: companyWebsite,
        company_description: companyDescription,
        primary_color: primaryColor,
        industry,
        company_size: companySize,
        funding_stage: fundingStage,
        headquarters_country: headquartersCountry,
        headquarters_city: headquartersCity,
        target_percentile: targetPercentile,
        review_cycle: reviewCycle,
        default_currency: defaultCurrency,
        fiscal_year_start: fiscalYearStart,
        default_bonus_percentage: defaultBonusPercentage,
        equity_vesting_schedule: equityVestingSchedule,
        benefits_tier: benefitsTier,
        comp_split_basic_pct: compSplitBasicPct,
        comp_split_housing_pct: compSplitHousingPct,
        comp_split_transport_pct: compSplitTransportPct,
        comp_split_other_pct: compSplitOtherPct,
        is_configured: true,
      };
      
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }
      
      // Sync to Zustand store for sidebar
      zustandSettings.updateSettings({
        companyName,
        companyLogo,
        companyWebsite,
        companyDescription,
        primaryColor,
        industry,
        companySize,
        fundingStage,
        headquartersCountry,
        headquartersCity,
        targetPercentile,
        reviewCycle,
        defaultCurrency,
        fiscalYearStart,
        defaultBonusPercentage,
        equityVestingSchedule,
        benefitsTier,
        compSplitBasicPct,
        compSplitHousingPct,
        compSplitTransportPct,
        compSplitOtherPct,
      });
      zustandSettings.markAsConfigured();
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Company Profile", icon: Building2 },
    { id: "compensation" as const, label: "Compensation Defaults", icon: Target },
    { id: "indices" as const, label: "Compensation Index", icon: BarChart3 },
    { id: "compliance" as const, label: "Compliance Setup", icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" />
          <p className="mt-3 text-brand-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="page-title">
          Company Settings
        </h1>
        <p className="page-subtitle">
          Configure your company profile and compensation defaults. These settings are used across all benchmarks and reports.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-brand-500 text-brand-900"
                  : "border-transparent text-brand-600 hover:text-brand-800 hover:border-brand-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
        <Link
          href="/dashboard/settings/employees"
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px border-transparent text-brand-600 hover:text-brand-800 hover:border-brand-200"
        >
          <Users className="h-4 w-4" />
          Employee Accounts
        </Link>
      </div>

      {/* Company Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Logo & Branding Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-900">Logo & Branding</h2>
                <p className="text-sm text-brand-600">Your company identity across the platform</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <LogoUploader
                value={companyLogo}
                onChange={setCompanyLogo}
                companyName={companyName}
              />

              {/* Company Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Ltd"
                    fullWidth
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
                    <Input
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://yourcompany.com"
                      fullWidth
                      className="rounded-xl pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Company Description
                </label>
                <Textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Tell us about your company, mission, and what makes your workplace unique..."
                  rows={5}
                  className="rounded-xl resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-brand-500">
                    Optional. Appears in exported reports and comparisons.
                  </p>
                  <p className="text-xs text-brand-400">
                    {companyDescription.length}/500
                  </p>
                </div>
              </div>

              {/* Brand Color */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-12 rounded-xl border border-border cursor-pointer overflow-hidden"
                    />
                  </div>
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#6366f1"
                    className="rounded-xl w-32 font-mono text-sm"
                  />
                  <div 
                    className="flex-1 h-12 rounded-xl flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Preview
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Details Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-900">Company Details</h2>
                <p className="text-sm text-brand-600">Information used for benchmark filtering</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Industry & Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                  >
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} employees
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Funding Stage */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Funding Stage
                </label>
                <select
                  value={fundingStage}
                  onChange={(e) => setFundingStage(e.target.value as FundingStage)}
                  className="w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  {FUNDING_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              {/* Headquarters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Headquarters Country
                  </label>
                  <select
                    value={headquartersCountry}
                    onChange={(e) => setHeadquartersCountry(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.value}>
                        {country.flag} {country.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    City
                  </label>
                  <Input
                    type="text"
                    value={headquartersCity}
                    onChange={(e) => setHeadquartersCity(e.target.value)}
                    placeholder="London"
                    fullWidth
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Compensation Defaults Tab */}
      {activeTab === "compensation" && (
        <div className="space-y-6">
          {/* Target & Positioning Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-900">Market Positioning</h2>
                <p className="text-sm text-brand-600">Your default compensation strategy</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Target Percentile */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Target Percentile
                </label>
                <p className="text-xs text-brand-500 mb-3">
                  This is the default percentile used for all salary benchmarks. You can override it per search.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TARGET_PERCENTILES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTargetPercentile(option.value)}
                      className={clsx(
                        "p-4 rounded-xl text-center transition-all",
                        targetPercentile === option.value
                          ? "bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-2"
                          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      )}
                    >
                      <div className="text-xl font-bold">{option.value}th</div>
                      <div className={clsx(
                        "text-xs mt-1",
                        targetPercentile === option.value ? "text-brand-100" : "text-brand-500"
                      )}>
                        {option.value === 25 ? "Below Market" : option.value === 50 ? "Median" : option.value === 75 ? "Above Market" : "Premium"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency & Review Cycle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Review Cycle
                  </label>
                  <select
                    value={reviewCycle}
                    onChange={(e) => setReviewCycle(e.target.value as ReviewCycle)}
                    className="w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                  >
                    {REVIEW_CYCLES.map((cycle) => (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fiscal Year Start */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fiscal Year Start
                  </div>
                </label>
                <select
                  value={fiscalYearStart}
                  onChange={(e) => setFiscalYearStart(Number(e.target.value))}
                  className="w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none"
                >
                  {FISCAL_MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-brand-500 mt-1">
                  Used for budget planning and annual review scheduling.
                </p>
              </div>
            </div>
          </Card>

          {/* Compensation Structure Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-900">Compensation Structure</h2>
                <p className="text-sm text-brand-600">Default bonus and equity settings</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Bonus Percentage */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Target Bonus (% of Base Salary)
                  </div>
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="bonus-enabled"
                      checked={defaultBonusPercentage !== null}
                      onChange={(e) => setDefaultBonusPercentage(e.target.checked ? 15 : null)}
                      className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="bonus-enabled" className="text-sm text-brand-700">
                      Enable bonus
                    </label>
                  </div>
                  {defaultBonusPercentage !== null && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={defaultBonusPercentage}
                        onChange={(e) => setDefaultBonusPercentage(Number(e.target.value))}
                        className="rounded-xl w-20 text-center"
                      />
                      <span className="text-sm text-brand-600">%</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-brand-500 mt-2">
                  {defaultBonusPercentage !== null
                    ? `Employees will see ${defaultBonusPercentage}% target bonus in offer comparisons`
                    : "No bonus structure configured. Enable to include bonus in compensation comparisons."}
                </p>
              </div>

              {/* Equity Vesting Schedule */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Equity Vesting Schedule
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {VESTING_SCHEDULES.map((schedule) => (
                    <button
                      key={schedule.value}
                      type="button"
                      onClick={() => setEquityVestingSchedule(schedule.value)}
                      className={clsx(
                        "p-3 rounded-xl text-left transition-all",
                        equityVestingSchedule === schedule.value
                          ? "bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-2"
                          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      )}
                    >
                      <div className="text-sm font-semibold">{schedule.label}</div>
                      <div className={clsx(
                        "text-xs mt-0.5",
                        equityVestingSchedule === schedule.value ? "text-brand-100" : "text-brand-500"
                      )}>
                        {schedule.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Benefits Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-900">Benefits Package</h2>
                <p className="text-sm text-brand-600">Your standard benefits tier</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-3">
                Benefits Tier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BENEFITS_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => setBenefitsTier(tier.value)}
                    className={clsx(
                      "p-4 rounded-xl text-center transition-all",
                      benefitsTier === tier.value
                        ? "bg-brand-500 text-white ring-2 ring-brand-500 ring-offset-2"
                        : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    )}
                  >
                    <div className="text-sm font-semibold">{tier.label}</div>
                    <div className={clsx(
                      "text-xs mt-1",
                      benefitsTier === tier.value ? "text-brand-100" : "text-brand-500"
                    )}>
                      {tier.description}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-brand-500 mt-3">
                This affects how total compensation is calculated in benchmarks and comparisons.
              </p>
            </div>
          </Card>

          {/* Compensation Split Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-900">Compensation Split</h2>
                <p className="text-sm text-brand-600">Define your base vs allowance breakdown</p>
              </div>
            </div>

            <p className="text-xs text-brand-500 mb-4">
              Set how total compensation is split between basic salary and allowances.
              This is used for salary breakdowns across benchmarks and salary reviews.
              Percentages must total 100%.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Basic Salary %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={compSplitBasicPct}
                  onChange={(e) => setCompSplitBasicPct(Number(e.target.value))}
                  className="rounded-xl text-center"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Housing %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={compSplitHousingPct}
                  onChange={(e) => setCompSplitHousingPct(Number(e.target.value))}
                  className="rounded-xl text-center"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Transport %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={compSplitTransportPct}
                  onChange={(e) => setCompSplitTransportPct(Number(e.target.value))}
                  className="rounded-xl text-center"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">Other %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={compSplitOtherPct}
                  onChange={(e) => setCompSplitOtherPct(Number(e.target.value))}
                  className="rounded-xl text-center"
                  fullWidth
                />
              </div>
            </div>

            {compSplitBasicPct + compSplitHousingPct + compSplitTransportPct + compSplitOtherPct !== 100 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Total is {compSplitBasicPct + compSplitHousingPct + compSplitTransportPct + compSplitOtherPct}% — must equal 100%
                </span>
              </div>
            )}

            <div className="mt-4 flex h-4 rounded-full overflow-hidden">
              <div className="bg-brand-500" style={{ width: `${compSplitBasicPct}%` }} title={`Basic ${compSplitBasicPct}%`} />
              <div className="bg-brand-300" style={{ width: `${compSplitHousingPct}%` }} title={`Housing ${compSplitHousingPct}%`} />
              <div className="bg-brand-200" style={{ width: `${compSplitTransportPct}%` }} title={`Transport ${compSplitTransportPct}%`} />
              <div className="bg-brand-100" style={{ width: `${compSplitOtherPct}%` }} title={`Other ${compSplitOtherPct}%`} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-brand-500">
              <span>Basic {compSplitBasicPct}%</span>
              <span>Housing {compSplitHousingPct}%</span>
              <span>Transport {compSplitTransportPct}%</span>
              <span>Other {compSplitOtherPct}%</span>
            </div>
          </Card>
        </div>
      )}

      {/* Compensation Index Tab */}
      {activeTab === "indices" && <CompensationIndexPanel targetPercentile={targetPercentile} />}
      {activeTab === "compliance" && <ComplianceSettingsPanel />}

      {/* Save Button */}
      {activeTab !== "compliance" && (
      <div className="flex items-center justify-between pt-4 border-t border-border sticky bottom-0 bg-white py-4 -mx-6 px-6">
        <div>
          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <span>Settings saved successfully</span>
            </div>
          )}
          {zustandSettings.isConfigured && !saved && (
            <div className="flex items-center gap-2 text-xs text-brand-500">
              <span>Last updated: {new Date(zustandSettings.lastUpdated).toLocaleDateString("en-GB")}</span>
            </div>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
      )}
    </div>
  );
}

// === Compensation Index Panel ===

type IndexRating = "way-below" | "below" | "aligned" | "above" | "way-above";

const INDEX_LABELS: Record<IndexRating, string> = {
  "way-below": "Way below target",
  below: "A bit below target",
  aligned: "On target",
  above: "A bit above target",
  "way-above": "Way above target",
};

const INDEX_COLORS: Record<IndexRating, { bg: string; text: string; dot: string }> = {
  "way-below": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  below: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-300" },
  aligned: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  above: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-400" },
  "way-above": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

function getIndexRating(ratio: number): IndexRating {
  // ratio = avg employee salary / target benchmark salary
  if (ratio < 0.85) return "way-below";
  if (ratio < 0.95) return "below";
  if (ratio <= 1.05) return "aligned";
  if (ratio <= 1.15) return "above";
  return "way-above";
}

const SENIORITY_LEVELS = [
  { id: "junior", label: "Junior", levelIds: ["ic1", "ic2"] },
  { id: "intermediate", label: "Intermediate", levelIds: ["ic3"] },
  { id: "senior", label: "Senior", levelIds: ["ic4", "ic5"] },
  { id: "expert", label: "Expert", levelIds: ["ic6", "director", "vp"] },
];

function CompensationIndexPanel({ targetPercentile }: { targetPercentile: number }) {
  type PercentileKey = "p10" | "p25" | "p50" | "p75" | "p90";
  const resolvePercentileKey = (percentile: number): PercentileKey => {
    if (percentile >= 90) return "p90";
    if (percentile >= 75) return "p75";
    if (percentile >= 50) return "p50";
    if (percentile >= 25) return "p25";
    return "p10";
  };
  const [indexView, setIndexView] = useState<IndexView>("family-level");
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    let isMounted = true;
    void getEmployees().then((employees) => {
      if (!isMounted) return;
      setActiveEmployees(employees.filter((e) => e.status === "active"));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [indexData, setIndexData] = useState<
    {
      family: string;
      bySeniority: Record<string, { rating: IndexRating; count: number } | null>;
      overall: { rating: IndexRating; count: number };
    }[]
  >([]);

  useEffect(() => {
    const run = async () => {
      const familyGroups: Record<string, typeof activeEmployees> = {};
      for (const emp of activeEmployees) {
        const family = emp.role.family;
        if (!familyGroups[family]) familyGroups[family] = [];
        familyGroups[family].push(emp);
      }

      const families = Object.keys(familyGroups).sort();
      const next: {
        family: string;
        bySeniority: Record<string, { rating: IndexRating; count: number } | null>;
        overall: { rating: IndexRating; count: number };
      }[] = [];

      for (const family of families) {
        const employees = familyGroups[family];
        const bySeniority: Record<string, { rating: IndexRating; count: number } | null> = {};

        for (const senLevel of SENIORITY_LEVELS) {
          const matchingEmps = employees.filter((e) => senLevel.levelIds.includes(e.level.id));
          if (matchingEmps.length === 0) {
            bySeniority[senLevel.id] = null;
            continue;
          }
          const avgSalary = matchingEmps.reduce((s, e) => s + e.baseSalary, 0) / matchingEmps.length;
          const sampleRole = matchingEmps[0].role;
          const sampleLevel = senLevel.levelIds[0];
          const sampleLocation = matchingEmps[0].location.id;
          const benchmark = await getBenchmark(sampleRole.id, sampleLocation, sampleLevel);
          const targetKey = resolvePercentileKey(targetPercentile);
          const targetValue = benchmark ? benchmark.percentiles[targetKey] || benchmark.percentiles.p50 : avgSalary;
          const ratio = targetValue > 0 ? avgSalary / targetValue : 1;
          bySeniority[senLevel.id] = { rating: getIndexRating(ratio), count: matchingEmps.length };
        }

        const avgSalary = employees.reduce((s, e) => s + e.baseSalary, 0) / employees.length;
        const sampleRole = employees[0].role;
        const sampleLocation = employees[0].location.id;
        const benchmark = await getBenchmark(sampleRole.id, sampleLocation, "ic3");
        const targetKey = resolvePercentileKey(targetPercentile);
        const targetValue = benchmark ? benchmark.percentiles[targetKey] || benchmark.percentiles.p50 : avgSalary;
        const ratio = targetValue > 0 ? avgSalary / targetValue : 1;

        next.push({
          family,
          bySeniority,
          overall: { rating: getIndexRating(ratio), count: employees.length },
        });
      }

      setIndexData(next);
    };
    void run();
  }, [activeEmployees, targetPercentile]);

  const RatingBadge = ({ rating, count }: { rating: IndexRating; count: number }) => {
    const colors = INDEX_COLORS[rating];
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          colors.bg,
          colors.text
        )}
        title={`${count} employee${count !== 1 ? "s" : ""}`}
      >
        <span className={clsx("h-2 w-2 rounded-full", colors.dot)} />
        {INDEX_LABELS[rating]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Explanation Card */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-brand-900">Compensation indices explained</h2>
            <p className="mt-1 text-sm text-brand-600 leading-relaxed">
              Compensation indices are the easiest way to know where you stand against your targets.
              To calculate an index, we rank each one of your employees against the market and compound
              each rank into a weighted average.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-brand-600">
              <li>A 100% index means you are paying at the highest of the market</li>
              <li>A 50% index means you are paying exactly at the market standards</li>
              <li>A 0% index means you are paying at the lowest of the market</li>
            </ul>
          </div>
          {/* Legend */}
          <div className="hidden lg:block shrink-0 space-y-1.5">
            {(Object.keys(INDEX_LABELS) as IndexRating[]).map((rating) => {
              const colors = INDEX_COLORS[rating];
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className={clsx("h-3 w-8 rounded-sm", colors.dot.replace("bg-", "bg-"))} style={{
                    backgroundColor: rating === "way-below" ? "#ef4444" : rating === "below" ? "#fca5a5" : rating === "aligned" ? "#93c5fd" : rating === "above" ? "#5eead4" : "#34d399"
                  }} />
                  <span className="text-xs text-brand-600">{INDEX_LABELS[rating]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* View Toggle */}
      <div className="flex gap-1 rounded-lg bg-brand-100/50 p-1 w-fit">
        <button
          type="button"
          onClick={() => setIndexView("family")}
          className={clsx(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            indexView === "family"
              ? "bg-white text-brand-900 shadow-sm"
              : "text-brand-600 hover:text-brand-800"
          )}
        >
          By Job Family
        </button>
        <button
          type="button"
          onClick={() => setIndexView("family-level")}
          className={clsx(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            indexView === "family-level"
              ? "bg-white text-brand-900 shadow-sm"
              : "text-brand-600 hover:text-brand-800"
          )}
        >
          By Job Family &amp; Seniority Level
        </button>
      </div>

      {/* Index Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold text-brand-900">Compensation Index</h3>
          <p className="text-sm text-brand-500">
            See how your compensation policy is performing compared to the market.
            Current view is based on your P{targetPercentile} target.
          </p>
        </div>

        {indexView === "family" ? (
          // Simple view: just job family with overall rating
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_auto] px-6 py-3 bg-brand-50/50">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Job Family</span>
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Index</span>
            </div>
            {indexData.map((row) => (
              <div key={row.family} className="grid grid-cols-[1fr_auto] items-center px-6 py-3">
                <span className="text-sm font-medium text-brand-900">{row.family}</span>
                <RatingBadge rating={row.overall.rating} count={row.overall.count} />
              </div>
            ))}
          </div>
        ) : (
          // Detailed view: job family x seniority level
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                    Job Family
                  </th>
                  {SENIORITY_LEVELS.map((level) => (
                    <th
                      key={level.id}
                      className="text-center px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wider"
                    >
                      {level.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {indexData.map((row) => (
                  <tr key={row.family} className="hover:bg-brand-50/30">
                    <td className="px-6 py-3 text-sm font-medium text-brand-900">
                      {row.family}
                    </td>
                    {SENIORITY_LEVELS.map((level) => {
                      const cell = row.bySeniority[level.id];
                      return (
                        <td key={level.id} className="px-4 py-3 text-center">
                          {cell ? (
                            <RatingBadge rating={cell.rating} count={cell.count} />
                          ) : (
                            <span className="text-xs text-brand-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
