"use client";

import { useEffect, useState } from "react";

export type PublicBenchmarkSnapshot = {
  role: string;
  location: string;
  level: string;
  currency: string;
  p25: number;
  p50: number;
  p75: number;
  submissionsThisWeek: number;
  momDeltaP25: string;
  momDeltaP50: string;
  momDeltaP75: string;
  trendDelta: string;
};

const EMPTY_SNAPSHOT: PublicBenchmarkSnapshot = {
  role: "No role data",
  location: "No location data",
  level: "N/A",
  currency: "AED",
  p25: 0,
  p50: 0,
  p75: 0,
  submissionsThisWeek: 0,
  momDeltaP25: "0%",
  momDeltaP50: "0%",
  momDeltaP75: "0%",
  trendDelta: "0%",
};

export function usePublicBenchmarkSnapshot() {
  const [snapshot, setSnapshot] = useState<PublicBenchmarkSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    let isMounted = true;
    void fetch("/api/public/benchmark-snapshot")
      .then(async (res) => {
        if (!res.ok) return;
        const payload = await res.json();
        const row = payload.snapshot;
        if (!row || !isMounted) return;
        setSnapshot({
          role: row.role_label,
          location: row.location_label,
          level: row.level_label,
          currency: row.currency,
          p25: Number(row.p25),
          p50: Number(row.p50),
          p75: Number(row.p75),
          submissionsThisWeek: Number(row.submissions_this_week || 0),
          momDeltaP25: row.mom_delta_p25 || "0%",
          momDeltaP50: row.mom_delta_p50 || "0%",
          momDeltaP75: row.mom_delta_p75 || "0%",
          trendDelta: row.trend_delta || "0%",
        });
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return snapshot;
}

export function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}
