import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const baseStyles =
  "relative inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:opacity-60 disabled:cursor-not-allowed";

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-sm hover:bg-brand-600 hover:shadow-md active:bg-brand-700",
  secondary:
    "bg-accent-200 text-brand-900 shadow-sm hover:bg-accent-300 active:bg-accent-400",
  ghost:
    "bg-white text-brand-700 ring-1 ring-border hover:bg-muted hover:ring-brand-200",
  outline:
    "text-brand-700 ring-1 ring-border hover:bg-brand-50 hover:ring-brand-200 bg-transparent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, className, variant = "primary", size = "md", fullWidth, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          sizeStyles[size],
          variants[variant],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

