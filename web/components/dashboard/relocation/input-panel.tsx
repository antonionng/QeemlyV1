"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronUp,
  Globe2,
  MapPin,
  Search,
  Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
}

interface InputPanelProps {
  data: RelocationFormData;
  onChange: (data: RelocationFormData) => void;
  className?: string;
}

function CitySelect({
  label,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  value: string;
  onChange: (cityId: string) => void;
  excludeId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCity = getRelocationCities().find((c) => c.id === value);

  const filteredCities = useMemo(() => {
    let cities = searchCities(search);
    if (excludeId) {
      cities = cities.filter((c) => c.id !== excludeId);
    }
    return cities;
  }, [search, excludeId]);

  const groupedCities = useMemo(() => {
    const groups: Record<Region, City[]> = {
      gcc: [],
      mena: [],
      europe: [],
      asia: [],
      americas: [],
    };
    filteredCities.forEach((city) => {
      if (city.region && groups[city.region]) {
        groups[city.region].push(city);
      }
    });
    return groups;
  }, [filteredCities]);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-accent-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3 text-left transition-all",
          "hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          isOpen && "border-brand-400 ring-2 ring-brand-500/20"
        )}
      >
        {selectedCity ? (
          <div className="flex items-center gap-3">
            <span className="text-xl">{selectedCity.flag}</span>
            <div>
              <p className="font-semibold text-brand-900">{selectedCity.name}</p>
              <p className="text-xs text-accent-500">{selectedCity.country}</p>
            </div>
          </div>
        ) : (
          <span className="text-accent-400">Select a city...</span>
        )}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-accent-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-accent-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
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
                          : "hover:bg-accent-50"
                      )}
                    >
                      <span className="text-lg">{city.flag}</span>
                      <div>
                        <p className="font-medium text-brand-900">{city.name}</p>
                        <p className="text-xs text-accent-500">{city.country}</p>
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

const COMP_APPROACHES: { id: CompApproach; label: string; description: string }[] = [
  {
    id: "local",
    label: "Local Market Pay",
    description: "Pay the target market rate",
  },
  {
    id: "purchasing-power",
    label: "Purchasing Power",
    description: "Maintain same purchasing power",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    description: "Cap adjustment at a percentage",
  },
];

export function InputPanel({ data, onChange, className }: InputPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateField = <K extends keyof RelocationFormData>(
    field: K,
    value: RelocationFormData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card
      className={clsx(
        "dash-card border border-brand-100 bg-gradient-to-b from-white to-accent-50/40 p-5 transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">
              Scenario setup
            </p>
            <h2 className="mt-1 font-bold text-brand-900">Relocation Inputs</h2>
            <p className="text-xs text-accent-500">Configure the route, pay anchor, and policy</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 text-accent-500 hover:bg-brand-50 lg:hidden"
        >
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>
      </div>

      <div
        className={clsx(
          "mt-5 space-y-4 overflow-hidden transition-all",
          isCollapsed ? "max-h-0 opacity-0 lg:max-h-none lg:opacity-100" : "max-h-[2000px] opacity-100"
        )}
      >
        {/* Location Selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <CitySelect
            label="Home Location"
            value={data.homeCityId}
            onChange={(id) => updateField("homeCityId", id)}
            excludeId={data.targetCityId}
          />
          <CitySelect
            label="Target Location"
            value={data.targetCityId}
            onChange={(id) => updateField("targetCityId", id)}
            excludeId={data.homeCityId}
          />
        </div>

        {/* Base Salary */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-accent-500">
            Base Salary (Annual, AED)
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
            <Input
              type="number"
              fullWidth
              value={data.baseSalary || ""}
              onChange={(e) =>
                updateField("baseSalary", Number(e.target.value) || 0)
              }
              placeholder="e.g., 450000"
              className="h-11 rounded-xl pl-10"
            />
          </div>
        </div>

        {/* Compensation Approach */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-accent-500">
            Compensation Approach
          </label>
          <div className="space-y-2">
            {COMP_APPROACHES.map((approach) => (
              <button
                key={approach.id}
                type="button"
                onClick={() => updateField("compApproach", approach.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                  data.compApproach === approach.id
                    ? "border-brand-300 bg-white ring-2 ring-brand-200"
                    : "border-border bg-white/90 hover:border-brand-200 hover:bg-white"
                )}
              >
                <div
                  className={clsx(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    data.compApproach === approach.id
                      ? "border-brand-500 bg-brand-500"
                      : "border-brand-300"
                  )}
                >
                  {data.compApproach === approach.id && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-brand-900">{approach.label}</p>
                  <p className="text-xs text-accent-500">{approach.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Hybrid Cap Slider */}
        {data.compApproach === "hybrid" && (
          <div className="rounded-2xl border border-brand-100 bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-brand-900">
                Maximum Adjustment Cap
              </label>
              <span className="rounded-full bg-brand-500 px-3 py-1 text-sm font-bold text-white">
                {data.hybridCap}%
              </span>
            </div>
            <input
              type="range"
              min={80}
              max={150}
              step={5}
              value={data.hybridCap}
              onChange={(e) => updateField("hybridCap", Number(e.target.value))}
              className="mt-3 w-full accent-brand-500"
            />
            <div className="mt-1 flex justify-between text-xs text-accent-500">
              <span>80%</span>
              <span>100%</span>
              <span>150%</span>
            </div>
          </div>
        )}

        {/* Rent Override */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-accent-500">
            Rent Override (Optional, Monthly AED)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-400" />
            <Input
              type="number"
              fullWidth
              value={data.rentOverride || ""}
              onChange={(e) =>
                updateField(
                  "rentOverride",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="Monthly rent in AED"
              className="h-11 rounded-xl pl-10"
            />
          </div>
          <p className="mt-1 text-xs text-accent-400">
            Override the default rent estimate when you have a known housing assumption.
          </p>
        </div>
      </div>
    </Card>
  );
}
