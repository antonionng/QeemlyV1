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
        "min-h-28 rounded-3xl border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-brand-500 focus:border-brand-300 focus:outline-none",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  ),
);

Textarea.displayName = "Textarea";


