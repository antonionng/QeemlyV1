"use client";

import clsx from "clsx";

type Props = {
  id: string;
  label?: string;
  size?: number;
  className?: string;
};

function getInitials(label: string) {
  return label
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProviderLogo({ id, label, size = 40, className }: Props) {
  const displayLabel = label ?? id.replace(/_/g, " ");
  const initials = getInitials(displayLabel);

  return (
    <div
      className={clsx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={`${displayLabel} badge`}
    >
      <span>{initials}</span>
    </div>
  );
}
