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
        "rounded-2xl border border-border bg-white transition-all duration-200",
        muted && "bg-muted border-muted",
        clickable && "hover:-translate-y-1 hover:shadow-md cursor-pointer",
        glow && "hover:shadow-[0_8px_20px_rgba(15,15,26,0.06)] hover:-translate-y-0.5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

