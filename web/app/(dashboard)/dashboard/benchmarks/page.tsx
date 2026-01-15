"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  X,
  MapPin,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  BookmarkPlus,
  Scale,
  Calendar,
  Target,
  Briefcase,
  Users,
  Sparkles,
} from "lucide-react";
import {
  ROLES,
  LOCATIONS,
  LEVELS,
  generateBenchmark,
  formatCurrency,
  formatCurrencyK,
  formatPercentage,
  getRole,
  getLocation,
  getLevel,
} from "@/lib/dashboard/dummy-data";

type ViewMode = "search" | "results" | "compare";

type Confidence = "High" | "Medium" | "Low";

export default function BenchmarksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState(LOCATIONS[0].id);
  const [selectedLevelId, setSelectedLevelId] = useState("ic3");
  const [showFilters, setShowFilters] = useState(false);
  const [confidenceFilters, setConfidenceFilters] = useState<Confidence[]>([]);
  const [minSampleSize, setMinSampleSize] = useState<number | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [offerTarget, setOfferTarget] = useState(75);

  const location = getLocation(selectedLocationId);
  const level = getLevel(selectedLevelId);

  const rolePreviews = useMemo(() => {
    return ROLES.map((role) => {
      const benchmark = generateBenchmark(role.id, selectedLocationId, selectedLevelId);
      return { role, benchmark };
    });
  }, [selectedLocationId, selectedLevelId]);

  const filteredRoles = useMemo(() => {
    let list = rolePreviews;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        ({ role }) =>
          role.title.toLowerCase().includes(q) || role.family.toLowerCase().includes(q)
      );
    }
    if (confidenceFilters.length) {
      list = list.filter(({ benchmark }) => confidenceFilters.includes(benchmark.confidence));
    }
    if (minSampleSize != null) {
      list = list.filter(({ benchmark }) => benchmark.sampleSize >= minSampleSize);
    }
    return list;
  }, [rolePreviews, searchQuery, confidenceFilters, minSampleSize]);

  const roleCards = searchQuery.trim()
    ? filteredRoles
    : rolePreviews.slice(0, 9);

  const selectedBenchmark = useMemo(() => {
    if (!selectedRoleId) return null;
    return generateBenchmark(selectedRoleId, selectedLocationId, selectedLevelId);
  }, [selectedRoleId, selectedLocationId, selectedLevelId]);

  const selectedRole = selectedRoleId ? getRole(selectedRoleId) : null;

  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    setViewMode("results");
  };

  const toggleConfidence = (value: Confidence) => {
    setConfidenceFilters((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const toggleCompare = (roleId: string) => {
    setCompareList((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId].slice(0, 3)
    );
  };

  const offerValue = selectedBenchmark
    ? offerTarget >= 90
      ? selectedBenchmark.percentiles.p90
      : offerTarget >= 75
      ? selectedBenchmark.percentiles.p75
      : offerTarget >= 50
      ? selectedBenchmark.percentiles.p50
      : offerTarget >= 25
      ? selectedBenchmark.percentiles.p25
      : selectedBenchmark.percentiles.p10
    : 0;

  const offerLow = Math.round(offerValue * 0.96);
  const offerHigh = Math.round(offerValue * 1.04);

  const FiltersPanel = (
    <Card className="mt-4 bg-white p-5 text-[#0f0f1a] ring-1 ring-brand-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-brand-900">Filters</p>
          <p className="text-xs text-accent-500">Refine benchmarks for the client review.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(false)}
          className="rounded-full p-2 text-accent-500 hover:bg-brand-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Confidence</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["High", "Medium", "Low"] as Confidence[]).map((c) => (
              <button
                key={c}
                onClick={() => toggleConfidence(c)}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all",
                  confidenceFilters.includes(c)
                    ? "bg-brand-500 text-white ring-brand-400"
                    : "bg-white text-brand-700 ring-brand-200 hover:bg-brand-50"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Min sample size</p>
          <Input
            type="number"
            fullWidth
            min={0}
            value={minSampleSize ?? ""}
            onChange={(e) => setMinSampleSize(e.target.value ? Number(e.target.value) : null)}
            className="mt-2 h-10 rounded-xl"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            setConfidenceFilters([]);
            setMinSampleSize(null);
          }}
        >
          Clear all
        </Button>
        <Button onClick={() => setShowFilters(false)}>Apply filters</Button>
      </div>
    </Card>
  );

  if (viewMode === "search") {
    return (
      <div className="min-h-screen pb-16 text-[#0f0f1a]">
        <div className="mx-auto max-w-5xl px-6 pt-12">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-brand-900">Benchmarks</h1>
            <p className="mt-2 text-lg text-accent-600">
              Search any role to open a full compensation report.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-accent-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles..."
              className="flex-1 bg-transparent text-base text-brand-900 focus:outline-none"
            />
            <Button size="sm">Search</Button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <div className="text-sm text-accent-500">
              {filteredRoles.length} roles
            </div>
          </div>

          {showFilters ? FiltersPanel : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roleCards.map(({ role, benchmark }) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="rounded-2xl border border-brand-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-brand-100 px-3 py-2 text-xs font-bold text-brand-700">
                    {role.icon}
                  </span>
                  <span className="rounded-full bg-accent-100 px-2 py-1 text-xs text-accent-600">
                    {role.family}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-brand-900">{role.title}</h3>
                <p className="mt-1 text-sm text-accent-600">
                  {benchmark.sampleSize} data points · {benchmark.confidence} confidence
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-brand-50 pt-3">
                  <div>
                    <p className="text-xs text-accent-500">Median</p>
                    <p className="text-lg font-bold text-brand-900">
                      {formatCurrencyK(benchmark.currency, benchmark.percentiles.p50)}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "flex items-center gap-1 text-sm font-semibold",
                      benchmark.yoyChange >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {benchmark.yoyChange >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {formatPercentage(Math.abs(benchmark.yoyChange))}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {!searchQuery.trim() ? (
            <p className="mt-4 text-sm text-accent-500">
              Showing featured roles. Use search or filters to explore more.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (viewMode === "results") {
    if (!selectedBenchmark || !selectedRole) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Card className="p-6 text-center">
            <p className="text-lg font-semibold text-brand-900">Select a role to view a report</p>
            <Button className="mt-4" onClick={() => setViewMode("search")}>Back</Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-7xl px-6 pb-12 text-[#0f0f1a]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("search")}
              className="rounded-full bg-brand-100 p-2 text-brand-700"
            >
              <Search className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-brand-900">{selectedRole.title}</h2>
              <p className="text-sm text-accent-600">
                {selectedRole.family} · {location?.city}, {location?.country} · {level?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toggleCompare(selectedRole.id)}>
              <Scale className="h-4 w-4" />
              Compare
            </Button>
            <Button variant="outline">
              <BookmarkPlus className="h-4 w-4" />
              Save
            </Button>
            <Button>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="h-11 w-full appearance-none rounded-full border border-brand-200 bg-white pl-10 pr-10 text-sm font-semibold text-brand-900"
            >
              {LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.city}, {l.country}
                </option>
              ))}
            </select>
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-500" />
          </div>
          <div className="relative">
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="h-11 w-full appearance-none rounded-full border border-brand-200 bg-white pl-10 pr-10 text-sm font-semibold text-brand-900"
            >
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-500" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="bg-white p-6 text-[#0f0f1a] ring-1 ring-brand-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">
                Monthly Cash Compensation
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <span className="text-4xl font-extrabold text-brand-900">
                  {formatCurrency(selectedBenchmark.currency, selectedBenchmark.percentiles.p50)}
                </span>
                <span className="text-base font-semibold text-accent-600">Median (P50)</span>
                <span className="text-sm text-accent-600">
                  Range {formatCurrencyK(selectedBenchmark.currency, selectedBenchmark.percentiles.p25)} –{" "}
                  {formatCurrencyK(selectedBenchmark.currency, selectedBenchmark.percentiles.p75)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                  selectedBenchmark.momChange >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                  {selectedBenchmark.momChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {formatPercentage(Math.abs(selectedBenchmark.momChange))} MoM
                </span>
                <span className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                  selectedBenchmark.yoyChange >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                  {selectedBenchmark.yoyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {formatPercentage(Math.abs(selectedBenchmark.yoyChange))} YoY
                </span>
                <span className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                  selectedBenchmark.confidence === "High" ? "bg-emerald-50 text-emerald-700" : selectedBenchmark.confidence === "Medium" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                )}>
                  {selectedBenchmark.confidence} confidence
                </span>
              </div>

              <div className="mt-6 rounded-2xl bg-brand-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-brand-900">Offer Builder</p>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
                    P{offerTarget}
                  </span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={90}
                  step={25}
                  value={offerTarget}
                  onChange={(e) => setOfferTarget(Number(e.target.value))}
                  className="mt-4 w-full accent-brand-500"
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-accent-600">Recommended range</p>
                  <p className="text-sm font-bold text-brand-900">
                    {formatCurrencyK(selectedBenchmark.currency, offerLow)} – {formatCurrencyK(selectedBenchmark.currency, offerHigh)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6 text-[#0f0f1a] ring-1 ring-brand-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-brand-900">Salary Trend</h3>
                  <p className="text-sm text-accent-500">12-month movement</p>
                </div>
                <span className="flex items-center gap-2 text-xs text-accent-500">
                  <Calendar className="h-4 w-4" />
                  Updated {new Date(selectedBenchmark.lastUpdated).toLocaleDateString()}
                </span>
              </div>
              <div className="grid h-40 grid-cols-6 items-end gap-2">
                {selectedBenchmark.trend.slice(-6).map((t) => (
                  <div key={t.month} className="flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-lg bg-brand-500"
                      style={{ height: `${Math.max(20, (t.p50 / selectedBenchmark.percentiles.p90) * 100)}%` }}
                    />
                    <span className="text-xs text-accent-500">{t.month}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white p-6 text-[#0f0f1a] ring-1 ring-brand-200">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-brand-900">Across GCC Markets</h3>
                <p className="text-sm text-accent-500">Same role, same level</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {LOCATIONS.slice(0, 6).map((loc) => {
                  const b = generateBenchmark(selectedRole.id, loc.id, selectedLevelId);
                  const isSelected = loc.id === selectedLocationId;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={clsx(
                        "rounded-xl p-4 text-left ring-1 transition",
                        isSelected ? "bg-brand-100 ring-brand-300" : "bg-white ring-brand-100 hover:ring-brand-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-brand-900">{loc.city}</p>
                          <p className="text-xs text-accent-500">{loc.country}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-900">
                            {formatCurrencyK(b.currency, b.percentiles.p50)}
                          </p>
                          <p className={clsx("text-xs", b.yoyChange >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatPercentage(b.yoyChange)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Card className="bg-white p-5 text-[#0f0f1a] ring-1 ring-brand-200">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent-500">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" fullWidth className="justify-start">
                  <Briefcase className="h-4 w-4" />
                  Create offer draft
                </Button>
                <Button variant="outline" fullWidth className="justify-start">
                  <Target className="h-4 w-4" />
                  Set target percentile
                </Button>
                <Button variant="outline" fullWidth className="justify-start">
                  <TrendingUp className="h-4 w-4" />
                  Negotiation guidance
                </Button>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-[#0f0f1a] ring-1 ring-amber-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Offer Guidance</p>
              </div>
              <p className="mt-2 text-sm text-amber-900">
                Candidates typically expect offers around{" "}
                <strong>{formatCurrencyK(selectedBenchmark.currency, selectedBenchmark.percentiles.p50)}</strong> (P50). To close top talent, anchor in the <strong>P75+</strong> range.
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "compare") {
    return (
      <div className="mx-auto max-w-6xl px-6 pb-12 text-[#0f0f1a]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode("results")}>
              Back
            </Button>
            <h2 className="text-2xl font-bold text-brand-900">Compare Roles</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCompareList([])}>
            Clear
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {compareList.map((id) => {
            const role = getRole(id);
            if (!role) return null;
            const b = generateBenchmark(role.id, selectedLocationId, selectedLevelId);
            return (
              <Card key={id} className="bg-white p-5 text-[#0f0f1a] ring-1 ring-brand-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-accent-500">{role.family}</p>
                    <h3 className="text-lg font-bold text-brand-900">{role.title}</h3>
                  </div>
                  <button onClick={() => toggleCompare(id)} className="text-accent-400 hover:text-brand-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 rounded-xl bg-brand-50 p-4">
                  <p className="text-xs text-accent-500">Median (P50)</p>
                  <p className="text-2xl font-extrabold text-brand-900">
                    {formatCurrency(b.currency, b.percentiles.p50)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
