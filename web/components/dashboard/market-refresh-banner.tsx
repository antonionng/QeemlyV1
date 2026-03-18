"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { MarketPublishEvent } from "@/lib/benchmarks/market-publish";

const DISMISS_PREFIX = "qeemly:market-publish-dismissed:";

type LatestMarketPublishResponse = {
  event: MarketPublishEvent | null;
};

export function MarketRefreshBanner() {
  const [event, setEvent] = useState<MarketPublishEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLatestEvent = async () => {
      try {
        const response = await fetch("/api/market-publish/latest", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload = (await response.json()) as LatestMarketPublishResponse;
        if (cancelled) return;
        setEvent(payload.event);
      } catch {
        // Tenant pages should stay usable even if the announcement cannot load.
      }
    };

    void loadLatestEvent();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!event) return;
    setDismissed(localStorage.getItem(`${DISMISS_PREFIX}${event.id}`) === "true");
  }, [event]);

  const publishedLabel = useMemo(() => {
    if (!event?.publishedAt) return null;
    const date = new Date(event.publishedAt);
    return Number.isNaN(date.getTime())
      ? null
      : date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
  }, [event]);

  if (!event || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-violet-50 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-brand-900">{event.title}</p>
              {publishedLabel ? (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                  Published {publishedLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-accent-700">{event.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-accent-700 ring-1 ring-brand-100">
                {event.rowCount} shared market rows live
              </span>
              <Link
                href="/dashboard/benchmarks"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View Benchmarking
              </Link>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss market update announcement"
          onClick={() => {
            localStorage.setItem(`${DISMISS_PREFIX}${event.id}`, "true");
            setDismissed(true);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-accent-500 transition-colors hover:bg-white/70 hover:text-accent-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
