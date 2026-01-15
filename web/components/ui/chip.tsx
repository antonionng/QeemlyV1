import clsx from "clsx";
import { HTMLAttributes } from "react";

type ChipProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
};

export function Chip({ children, className, active = false, ...rest }: ChipProps) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-brand-800",
        active
          ? "border-brand-200 bg-brand-100 shadow-sm"
          : "border-border bg-white hover:border-brand-200",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}





