"use client";

type NoDataWidgetProps = {
  title: string;
  description: string;
};

export function NoDataWidget({ title, description }: NoDataWidgetProps) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-accent-50/40 p-4 text-center">
      <div>
        <p className="text-sm font-semibold text-accent-800">{title}</p>
        <p className="mt-1 text-xs text-accent-600">{description}</p>
      </div>
    </div>
  );
}
