import clsx from "clsx";
import { HTMLAttributes } from "react";

type Variant = "muted" | "brand" | "ghost";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

export function Badge({ children, className, variant = "muted", ...rest }: BadgeProps) {
  const variants: Record<Variant, string> = {
    muted: "bg-muted text-brand-800",
    brand: "bg-brand-500 text-white",
    ghost: "bg-white text-brand-700 border border-border",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

