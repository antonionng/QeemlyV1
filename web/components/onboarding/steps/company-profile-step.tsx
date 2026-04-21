"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  FUNDING_STAGES,
  COUNTRIES,
  type FundingStage,
} from "@/lib/company";
import { INDUSTRIES, COMPANY_SIZES } from "@/lib/dashboard/dummy-data";
import { useOnboardingStore } from "@/lib/onboarding";

const selectClasses =
  "w-full h-12 rounded-xl border border-border bg-white px-4 text-sm text-brand-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors";

export function CompanyProfileStep({ onNext }: { onNext: () => void }) {
  const completeStep = useOnboardingStore((s) => s.completeStep);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [fundingStage, setFundingStage] = useState<FundingStage>("Seed");
  const [headquartersCountry, setHeadquartersCountry] = useState("UAE");
  const [headquartersCity, setHeadquartersCity] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      const s = data.settings;
      setCompanyName(s.company_name || data.workspace_name || "");
      setIndustry(s.industry || INDUSTRIES[0]);
      setCompanySize(s.company_size || COMPANY_SIZES[2]);
      setFundingStage((s.funding_stage as FundingStage) || "Seed");
      setHeadquartersCountry(s.headquarters_country || "UAE");
      setHeadquartersCity(s.headquarters_city || "");
    } catch {
      setError("Could not load existing settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleContinue = async () => {
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          industry,
          company_size: companySize,
          funding_stage: fundingStage,
          headquarters_country: headquartersCountry,
          headquarters_city: headquartersCity,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to save");
      }

      await completeStep("company_profile");
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-900">
            Company profile
          </h2>
          <p className="text-sm text-brand-500">
            This helps Qeemly tailor benchmarks to your market.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="space-y-5 p-6">
        {/* Company name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-700">
            Company name
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Inc."
            fullWidth
            className="rounded-xl"
          />
        </div>

        {/* Industry & Size */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={selectClasses}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">
              Company size
            </label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className={selectClasses}
            >
              <option value="">Select size</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} employees
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Funding stage */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-700">
            Funding stage
          </label>
          <select
            value={fundingStage}
            onChange={(e) => setFundingStage(e.target.value as FundingStage)}
            className={selectClasses}
          >
            {FUNDING_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        {/* HQ Country & City */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">
              Headquarters country
            </label>
            <select
              value={headquartersCountry}
              onChange={(e) => setHeadquartersCountry(e.target.value)}
              className={selectClasses}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.value}>
                  {c.flag} {c.value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">
              City
            </label>
            <Input
              value={headquartersCity}
              onChange={(e) => setHeadquartersCity(e.target.value)}
              placeholder="Dubai"
              fullWidth
              className="rounded-xl"
            />
          </div>
        </div>
      </Card>

      {/* Continue */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleContinue} isLoading={saving} className="px-8">
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
