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
        "h-12 rounded-full border border-border bg-white px-4 text-sm text-foreground placeholder:text-brand-500 focus:border-brand-300 focus:outline-none",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  ),
);

Input.displayName = "Input";

