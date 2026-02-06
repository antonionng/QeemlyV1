"use client";

import { Card } from "@/components/ui/card";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-brand-100 rounded ${className}`} />
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28 mt-1" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function HealthScoreSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64 mt-2" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-24" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ChartSkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48 mt-1" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-16 flex-1 rounded-xl" />
        <Skeleton className="h-16 flex-1 rounded-xl" />
        <Skeleton className="h-16 flex-1 rounded-xl" />
      </div>
      <Skeleton className={`w-full rounded-xl ${height}`} />
    </Card>
  );
}

export function InsightsSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-brand-100 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4 mt-2" />
                <Skeleton className="h-6 w-24 mt-2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DepartmentSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-48 mt-1" />
        </div>
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-border">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function QuickActionsSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-brand-50">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 mt-1" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <StatCardsSkeleton />

      {/* Health score */}
      <HealthScoreSkeleton />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height="h-[180px]" />
        <ChartSkeleton height="h-[200px]" />
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <InsightsSkeleton />
        <DepartmentSkeleton />
        <QuickActionsSkeleton />
      </div>
    </div>
  );
}
