"use client";

import { useState, useEffect, useMemo } from "react";
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
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LogoUploader } from "@/components/dashboard/settings/logo-uploader";
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
import { INDUSTRIES, COMPANY_SIZES, generateBenchmark } from "@/lib/dashboard/dummy-data";
import { MOCK_EMPLOYEES } from "@/lib/employees";
import clsx from "clsx";

type SettingsTab = "profile" | "compensation" | "indices";
type IndexView = "family" | "family-level";

export default function SettingsPage() {
  const settings = useCompanySettings();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  // Company Profile state
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyLogo, setCompanyLogo] = useState(settings.companyLogo);
  const [companyWebsite, setCompanyWebsite] = useState(settings.companyWebsite);
  const [companyDescription, setCompanyDescription] = useState(settings.companyDescription);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [industry, setIndustry] = useState(settings.industry);
  const [companySize, setCompanySize] = useState(settings.companySize);
  const [fundingStage, setFundingStage] = useState(settings.fundingStage);
  const [headquartersCountry, setHeadquartersCountry] = useState(settings.headquartersCountry);
  const [headquartersCity, setHeadquartersCity] = useState(settings.headquartersCity);
  
  // Compensation Defaults state
  const [targetPercentile, setTargetPercentile] = useState(settings.targetPercentile);
  const [reviewCycle, setReviewCycle] = useState(settings.reviewCycle);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.defaultCurrency);
  const [fiscalYearStart, setFiscalYearStart] = useState(settings.fiscalYearStart);
  const [defaultBonusPercentage, setDefaultBonusPercentage] = useState(settings.defaultBonusPercentage);
  const [equityVestingSchedule, setEquityVestingSchedule] = useState(settings.equityVestingSchedule);
  const [benefitsTier, setBenefitsTier] = useState(settings.benefitsTier);

  // Sync form state with store on mount
  useEffect(() => {
    setCompanyName(settings.companyName);
    setCompanyLogo(settings.companyLogo);
    setCompanyWebsite(settings.companyWebsite);
    setCompanyDescription(settings.companyDescription);
    setPrimaryColor(settings.primaryColor);
    setIndustry(settings.industry);
    setCompanySize(settings.companySize);
    setFundingStage(settings.fundingStage);
    setHeadquartersCountry(settings.headquartersCountry);
    setHeadquartersCity(settings.headquartersCity);
    setTargetPercentile(settings.targetPercentile);
    setReviewCycle(settings.reviewCycle);
    setDefaultCurrency(settings.defaultCurrency);
    setFiscalYearStart(settings.fiscalYearStart);
    setDefaultBonusPercentage(settings.defaultBonusPercentage);
    setEquityVestingSchedule(settings.equityVestingSchedule);
    setBenefitsTier(settings.benefitsTier);
  }, [settings]);

  const handleSave = () => {
    settings.updateSettings({
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
    });
    settings.markAsConfigured();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "profile" as const, label: "Company Profile", icon: Building2 },
    { id: "compensation" as const, label: "Compensation Defaults", icon: Target },
    { id: "indices" as const, label: "Compensation Index", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-900">
          Company Settings
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-brand-700/80">
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
                  Company Tagline
                </label>
                <Textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="A brief description of your company..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
                <p className="text-xs text-brand-500 mt-1">
                  Optional. Appears in exported reports and comparisons.
                </p>
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
        </div>
      )}

      {/* Compensation Index Tab */}
      {activeTab === "indices" && <CompensationIndexPanel targetPercentile={targetPercentile} />}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-border sticky bottom-0 bg-white py-4 -mx-6 px-6">
        <div>
          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              <span>Settings saved successfully</span>
            </div>
          )}
          {settings.isConfigured && !saved && (
            <div className="flex items-center gap-2 text-xs text-brand-500">
              <span>Last updated: {new Date(settings.lastUpdated).toLocaleDateString("en-GB")}</span>
            </div>
          )}
        </div>
        <Button onClick={handleSave} className="px-8">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
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
  const [indexView, setIndexView] = useState<IndexView>("family-level");

  // Compute indices from employee data vs benchmarks
  const indexData = useMemo(() => {
    const activeEmployees = MOCK_EMPLOYEES.filter((e) => e.status === "active");

    // Group employees by job family
    const familyGroups: Record<string, typeof activeEmployees> = {};
    for (const emp of activeEmployees) {
      const family = emp.role.family;
      if (!familyGroups[family]) familyGroups[family] = [];
      familyGroups[family].push(emp);
    }

    const families = Object.keys(familyGroups).sort();

    // For each family (and optionally seniority), compute index
    const result: {
      family: string;
      bySeniority: Record<string, { rating: IndexRating; count: number } | null>;
      overall: { rating: IndexRating; count: number };
    }[] = [];

    for (const family of families) {
      const employees = familyGroups[family];
      const bySeniority: Record<string, { rating: IndexRating; count: number } | null> = {};

      for (const senLevel of SENIORITY_LEVELS) {
        const matchingEmps = employees.filter((e) =>
          senLevel.levelIds.includes(e.level.id)
        );

        if (matchingEmps.length === 0) {
          bySeniority[senLevel.id] = null;
          continue;
        }

        // Get average salary for these employees
        const avgSalary = matchingEmps.reduce((s, e) => s + e.baseSalary, 0) / matchingEmps.length;

        // Get benchmark target for this role/level combo
        const sampleRole = matchingEmps[0].role;
        const sampleLevel = senLevel.levelIds[0];
        const sampleLocation = matchingEmps[0].location.id;
        const benchmark = generateBenchmark(sampleRole.id, sampleLocation, sampleLevel);

        const targetKey = `p${targetPercentile}` as keyof typeof benchmark.percentiles;
        const targetValue = benchmark.percentiles[targetKey] || benchmark.percentiles.p50;

        const ratio = targetValue > 0 ? avgSalary / targetValue : 1;
        bySeniority[senLevel.id] = { rating: getIndexRating(ratio), count: matchingEmps.length };
      }

      // Overall for family
      const avgSalary = employees.reduce((s, e) => s + e.baseSalary, 0) / employees.length;
      const sampleRole = employees[0].role;
      const sampleLocation = employees[0].location.id;
      const benchmark = generateBenchmark(sampleRole.id, sampleLocation, "ic3");
      const targetKey = `p${targetPercentile}` as keyof typeof benchmark.percentiles;
      const targetValue = benchmark.percentiles[targetKey] || benchmark.percentiles.p50;
      const ratio = targetValue > 0 ? avgSalary / targetValue : 1;

      result.push({
        family,
        bySeniority,
        overall: { rating: getIndexRating(ratio), count: employees.length },
      });
    }

    return result;
  }, [targetPercentile]);

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
