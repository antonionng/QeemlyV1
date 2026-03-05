"use client";

import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";

interface TotalCompCardProps {
  baseSalary: number;
  bonus: number | null;
  equity: number | null;
  currency: string;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TotalCompCard({ baseSalary, bonus, equity, currency }: TotalCompCardProps) {
  const total = baseSalary + (bonus ?? 0) + (equity ?? 0);

  return (
    <Card className="relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-emerald-500/5" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Wallet className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="text-sm font-semibold text-brand-700">Total Compensation</h3>
        </div>
        <p className="text-4xl font-bold tracking-tight text-brand-900">
          {formatCurrency(total, currency)}
        </p>
        <p className="mt-1 text-sm text-brand-600/70">per year</p>
      </div>
    </Card>
  );
}
