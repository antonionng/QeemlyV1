import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

export const SALARY_INPUT_STEP = 250;

type SalaryInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  fullWidth?: boolean;
};

export const SalaryInput = forwardRef<HTMLInputElement, SalaryInputProps>(
  ({ className, fullWidth, step, min, ...rest }, ref) => (
    <input
      ref={ref}
      type="number"
      inputMode="decimal"
      step={step ?? SALARY_INPUT_STEP}
      min={min ?? 0}
      className={clsx(
        "h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  ),
);

SalaryInput.displayName = "SalaryInput";
