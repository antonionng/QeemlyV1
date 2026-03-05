import clsx from "clsx";
import { forwardRef, InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, fullWidth, ...rest }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "h-12 rounded-[var(--radius-field)] border border-border bg-surface-1 px-4 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  ),
);

Input.displayName = "Input";

