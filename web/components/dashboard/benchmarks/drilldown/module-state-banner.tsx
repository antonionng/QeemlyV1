"use client";

import clsx from "clsx";

type ModuleStateBannerVariant = "loading" | "error" | "info";

interface ModuleStateBannerProps {
  variant: ModuleStateBannerVariant;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ModuleStateBanner({
  variant,
  message,
  actionLabel,
  onAction,
  className,
}: ModuleStateBannerProps) {
  const styles =
    variant === "loading"
      ? "border-brand-100 bg-brand-50 text-brand-700"
      : variant === "error"
        ? "border-red-200 bg-red-50 text-red-600"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className={clsx("rounded-xl border px-4 py-3 text-sm", styles, className)}>
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-full border border-current/30 bg-white px-3 py-1 text-xs font-semibold"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
