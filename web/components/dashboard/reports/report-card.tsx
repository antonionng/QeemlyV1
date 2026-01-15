import type { ReactNode } from "react";
import clsx from "clsx";
import { Card } from "@/components/ui/card";

type ReportCardProps = {
  title: string;
  description: string;
  badge?: string;
  icon?: ReactNode;
  metadata?: string[];
  tags?: string[];
  action?: ReactNode;
  className?: string;
};

export function ReportCard({
  title,
  description,
  badge,
  icon,
  metadata,
  tags,
  action,
  className,
}: ReportCardProps) {
  return (
    <Card className={clsx("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              {icon}
            </span>
          ) : null}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-brand-900">{title}</h3>
              {badge ? (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
                  {badge}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-brand-700/70">{description}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {metadata && metadata.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-brand-600">
          {metadata.map((item) => (
            <span key={item} className="rounded-full bg-brand-50 px-2.5 py-1">
              {item}
            </span>
          ))}
        </div>
      ) : null}
      {tags && tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-700"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
