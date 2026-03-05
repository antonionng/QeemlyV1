import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
};

const baseStyles =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-60";

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-sm hover:bg-brand-600 hover:shadow-md active:bg-brand-700",
  secondary:
    "bg-surface-3 text-text-primary shadow-sm hover:bg-accent-200 active:bg-accent-300",
  ghost:
    "bg-surface-1 text-text-secondary ring-1 ring-border hover:bg-surface-3 hover:text-text-primary",
  outline:
    "bg-transparent text-text-secondary ring-1 ring-border hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, className, variant = "primary", size = "md", fullWidth, isLoading, disabled, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={clsx(
          baseStyles,
          sizeStyles[size],
          variants[variant],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

