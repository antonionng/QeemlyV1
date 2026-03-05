import clsx from "clsx";
import { forwardRef, TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fullWidth?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, fullWidth, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        "min-h-28 rounded-[var(--radius-field)] border border-border bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  ),
);

Textarea.displayName = "Textarea";


