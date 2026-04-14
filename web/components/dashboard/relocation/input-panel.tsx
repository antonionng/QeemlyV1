"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import clsx from "clsx";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEVELS, ROLES } from "@/lib/dashboard/dummy-data";
import {
  getRelocationCities,
  City,
  searchCities,
  REGION_LABELS,
  Region,
} from "@/lib/relocation/col-data";
import { CompApproach } from "@/lib/relocation/calculator";

export interface RelocationFormData {
  homeCityId: string;
  targetCityId: string;
  baseSalary: number;
  compApproach: CompApproach;
  hybridCap: number;
  rentOverride?: number;
  roleId: string;
  levelId: string;
}

interface InputPanelProps {
  data: RelocationFormData;
  onChange: (data: RelocationFormData) => void;
  onRunAnalysis: () => void;
  isAnalysisPending: boolean;
  isAnalyzing: boolean;
  className?: string;
}

const FIELD_LABEL_CLASSES = "mb-3 text-sm font-medium text-accent-700";
const FIELD_TRIGGER_CLASSES =
  "flex w-full items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10";

function CitySelect({
  label,
  value,
  onChange,
  excludeId,
  country,
}: {
  label: string;
  value: string;
  onChange: (cityId: string) => void;
  excludeId?: string;
  country?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selectedCity = getRelocationCities().find((c) => c.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filteredCities = useMemo(() => {
    let cities = searchCities(search);
    if (country) cities = cities.filter((c) => c.country === country);
    if (excludeId) cities = cities.filter((c) => c.id !== excludeId);
    return cities;
  }, [search, excludeId, country]);

  const groupedCities = useMemo(() => {
    const groups: Record<Region, City[]> = {
      gcc: [],
      mena: [],
      europe: [],
      asia: [],
      americas: [],
    };
    filteredCities.forEach((city) => {
      if (city.region && groups[city.region]) groups[city.region].push(city);
    });
    return groups;
  }, [filteredCities]);

  return (
    <div ref={ref} className="relative">
      <p className={FIELD_LABEL_CLASSES}>{label}</p>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          FIELD_TRIGGER_CLASSES,
          isOpen && "border-brand-300 ring-2 ring-brand-500/10",
        )}
      >
        {selectedCity ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50">
              <span className="text-[28px] leading-none">{selectedCity.flag}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-accent-900">
                {selectedCity.name}
              </p>
              <p className="truncate text-xs text-accent-500">
                {selectedCity.country}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-accent-400">Select a city...</span>
        )}
        <ChevronDown className="ml-3 h-5 w-5 shrink-0 text-accent-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cities..."
                className="w-full rounded-lg border border-border bg-accent-50 py-2 pl-9 pr-3 text-sm focus:border-brand-300 focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {(Object.keys(groupedCities) as Region[]).map((region) => {
              const cities = groupedCities[region];
              if (cities.length === 0) return null;
              return (
                <div key={region} className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-accent-400">
                    {REGION_LABELS[region]}
                  </p>
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        onChange(city.id);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        city.id === value
                          ? "bg-brand-50 text-brand-900"
                          : "hover:bg-accent-50",
                      )}
                    >
                      <span className="text-lg">{city.flag}</span>
                      <div>
                        <p className="font-medium text-brand-900">
                          {city.name}
                        </p>
                        <p className="text-xs text-accent-500">
                          {city.country}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const COMP_APPROACHES: { id: CompApproach; label: string }[] = [
  { id: "local", label: "Local Market Pay" },
  { id: "purchasing-power", label: "Purchasing Power" },
  { id: "hybrid", label: "Hybrid" },
];

export function InputPanel({
  data,
  onChange,
  onRunAnalysis,
  isAnalysisPending,
  isAnalyzing,
  className,
}: InputPanelProps) {
  const [isApproachOpen, setIsApproachOpen] = useState(false);
  const approachRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        approachRef.current &&
        !approachRef.current.contains(e.target as Node)
      ) {
        setIsApproachOpen(false);
      }
    }
    if (isApproachOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isApproachOpen]);

  const updateField = <K extends keyof RelocationFormData>(
    field: K,
    value: RelocationFormData[K],
  ) => {
    onChange({ ...data, [field]: value });
  };

  const currentApproach = COMP_APPROACHES.find(
    (a) => a.id === data.compApproach,
  );
  const allCities = useMemo(() => getRelocationCities(), []);
  const selectedHomeCity = useMemo(
    () => allCities.find((city) => city.id === data.homeCityId),
    [allCities, data.homeCityId],
  );
  const selectedTargetCity = useMemo(
    () => allCities.find((city) => city.id === data.targetCityId),
    [allCities, data.targetCityId],
  );
  const countryOptions = useMemo(
    () =>
      [...new Set(allCities.map((city) => city.country))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [allCities],
  );

  const selectCityForCountry = (
    field: "homeCityId" | "targetCityId",
    country: string,
  ) => {
    const oppositeCityId =
      field === "homeCityId" ? data.targetCityId : data.homeCityId;
    const currentCityId = field === "homeCityId" ? data.homeCityId : data.targetCityId;
    const currentCity = allCities.find((city) => city.id === currentCityId);

    if (currentCity?.country === country && currentCity.id !== oppositeCityId) {
      updateField(field, currentCity.id);
      return;
    }

    const nextCity = allCities.find(
      (city) => city.country === country && city.id !== oppositeCityId,
    );

    if (nextCity) {
      updateField(field, nextCity.id);
    }
  };

  const sliderMin = 50;
  const sliderMax = 150;
  const sliderPercent =
    ((data.hybridCap - sliderMin) / (sliderMax - sliderMin)) * 100;

  return (
    <Card className={clsx("panel p-6 sm:p-7", className)}>
      <div className="space-y-6">
        <div>
          <h2 className="overview-section-title">Relocation inputs</h2>
          <p className="overview-supporting-text mt-1">
            Pick the origin city, destination city, and pay policy to compare
            relocation scenarios.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <p className={FIELD_LABEL_CLASSES}>Home Country</p>
              <select
                name="home-country"
                value={selectedHomeCity?.country ?? ""}
                onChange={(e) => selectCityForCountry("homeCityId", e.target.value)}
                className="w-full appearance-none rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-accent-900 shadow-sm transition-all hover:border-brand-200 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-[46px] h-5 w-5 text-accent-400" />
            </div>
            <CitySelect
              label="Home City"
              value={data.homeCityId}
              onChange={(id) => updateField("homeCityId", id)}
              excludeId={data.targetCityId}
              country={selectedHomeCity?.country}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <p className={FIELD_LABEL_CLASSES}>Host Country</p>
              <select
                name="target-country"
                value={selectedTargetCity?.country ?? ""}
                onChange={(e) => selectCityForCountry("targetCityId", e.target.value)}
                className="w-full appearance-none rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-accent-900 shadow-sm transition-all hover:border-brand-200 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-[46px] h-5 w-5 text-accent-400" />
            </div>
            <CitySelect
              label="Host City"
              value={data.targetCityId}
              onChange={(id) => updateField("targetCityId", id)}
              excludeId={data.homeCityId}
              country={selectedTargetCity?.country}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <p className={FIELD_LABEL_CLASSES}>Role</p>
            <select
              value={data.roleId}
              onChange={(e) => updateField("roleId", e.target.value)}
              className="w-full appearance-none rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-accent-900 shadow-sm transition-all hover:border-brand-200 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-[46px] h-5 w-5 text-accent-400" />
          </div>

          <div className="relative">
            <p className={FIELD_LABEL_CLASSES}>Level</p>
            <select
              value={data.levelId}
              onChange={(e) => updateField("levelId", e.target.value)}
              className="w-full appearance-none rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-accent-900 shadow-sm transition-all hover:border-brand-200 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
            >
              {LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-[46px] h-5 w-5 text-accent-400" />
          </div>
        </div>

        {/* Salary Input */}
        <div>
          <p className={FIELD_LABEL_CLASSES}>
            Current Annual Salary{" "}
            <span className="font-normal text-accent-500">
              ({selectedHomeCity?.currency ?? "Local"})
            </span>
          </p>
          <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm transition-all focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/10">
            <input
              type="text"
              inputMode="numeric"
              value={data.baseSalary ? data.baseSalary.toLocaleString() : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                const num = Number(raw);
                if (!isNaN(num)) updateField("baseSalary", num);
              }}
              className="w-full text-sm font-semibold text-accent-900 focus:outline-none"
              placeholder="Enter salary..."
            />
          </div>
        </div>

        {/* Compensation Approach */}
        <div ref={approachRef} className="relative">
          <p className={FIELD_LABEL_CLASSES}>
            Compensation approach
          </p>
          <button
            type="button"
            onClick={() => setIsApproachOpen(!isApproachOpen)}
            className={clsx(
              FIELD_TRIGGER_CLASSES,
              isApproachOpen && "border-brand-300 ring-2 ring-brand-500/10",
            )}
          >
            <span className="text-sm font-semibold text-accent-900">
              {currentApproach?.label || "Select..."}
            </span>
            <ChevronDown className="ml-3 h-5 w-5 shrink-0 text-accent-400" />
          </button>

          {isApproachOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
              {COMP_APPROACHES.map((approach) => (
                <button
                  key={approach.id}
                  type="button"
                  onClick={() => {
                    updateField("compApproach", approach.id);
                    setIsApproachOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center px-6 py-3 text-left text-base transition-colors",
                    data.compApproach === approach.id
                      ? "bg-brand-50 font-semibold text-brand-700"
                      : "text-accent-700 hover:bg-accent-50",
                  )}
                >
                  {approach.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Maximum Adjustment Cap */}
        {data.compApproach === "hybrid" && (
          <div className="space-y-5 rounded-2xl border border-border bg-accent-50/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-accent-700">
                Maximum Adjustment Cap
              </p>
              <div className="flex items-center justify-center rounded-xl bg-brand-500 px-3 py-2">
                <span className="w-12 text-center text-sm font-semibold text-white">
                  {data.hybridCap}%
                </span>
              </div>
            </div>
            <div>
              <div className="relative h-3 w-full">
                <div className="absolute inset-0 rounded-full bg-accent-200" />
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${sliderPercent}%` }}
                />
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={5}
                  value={data.hybridCap}
                  onChange={(e) =>
                    updateField("hybridCap", Number(e.target.value))
                  }
                  className="absolute inset-0 w-full cursor-pointer opacity-0"
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-500 shadow-md"
                  style={{ left: `${sliderPercent}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-accent-500">
                <span>{sliderMin}%</span>
                <span>{sliderMax}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isAnalysisPending ? (
            <p className="text-sm font-medium text-amber-700">
              Inputs changed. Run analysis to refresh the figures and AI recommendation.
            </p>
          ) : (
            <p className="text-sm text-accent-500">
              Analysis is up to date with the current inputs. Local currency is
              shown first, with AED references in the results.
            </p>
          )}
          <Button
            type="button"
            className="h-11 w-full rounded-2xl text-sm font-semibold"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Running analysis..." : isAnalysisPending ? "Refresh analysis" : "Run analysis"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
