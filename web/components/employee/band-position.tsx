"use client";

import { Card } from "@/components/ui/card";
import type { BandInfo } from "@/lib/employee";

interface BandPositionProps {
  band: BandInfo;
  baseSalary: number;
  currency: string;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function BandPosition({ band, baseSalary, currency }: BandPositionProps) {
  const positionColor =
    band.position >= 60
      ? "text-emerald-600"
      : band.position >= 40
        ? "text-brand-600"
        : "text-amber-600";

  const dotColor =
    band.position >= 60
      ? "bg-emerald-500"
      : band.position >= 40
        ? "bg-brand-500"
        : "bg-amber-500";

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-brand-700 mb-1">Your Band Position</h3>
      <p className={`text-lg font-bold ${positionColor} mb-4`}>{band.label}</p>

      {/* Track */}
      <div className="relative mb-3">
        <div className="h-3 rounded-full bg-gradient-to-r from-brand-100 via-brand-200 to-brand-300" />
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${band.position}%` }}
        >
          <div className={`h-5 w-5 rounded-full ${dotColor} border-2 border-white shadow-md`} />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[11px] text-brand-500 mb-5">
        <span>{formatCurrency(band.p10, currency)}</span>
        <span>Mid: {formatCurrency(band.p50, currency)}</span>
        <span>{formatCurrency(band.p90, currency)}</span>
      </div>

      <div className="rounded-xl bg-brand-50/80 border border-brand-100 px-4 py-3">
        <p className="text-sm text-brand-700">
          Your base salary of{" "}
          <span className="font-semibold text-brand-900">
            {formatCurrency(baseSalary, currency)}
          </span>{" "}
          places you at the{" "}
          <span className={`font-semibold ${positionColor}`}>
            {band.position}th percentile
          </span>{" "}
          of the salary band for your role.
        </p>
      </div>
    </Card>
  );
}
