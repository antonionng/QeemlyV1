import clsx from "clsx";
import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  muted?: boolean;
  clickable?: boolean;
  glow?: boolean;
};

export function Card({
  children,
  className,
  muted = false,
  clickable = false,
  glow = false,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[var(--dash-card-radius,1rem)] border border-border bg-surface-1 text-text-primary shadow-[var(--dash-card-shadow)] transition-all duration-200",
        muted && "bg-surface-3",
        clickable && "hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
        glow && "hover:shadow-[var(--overlay-shadow)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

