"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

type DropdownMenuProps = {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
};

export function DropdownMenu({
  trigger,
  children,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
      </button>

      {open && (
        <div
          className={clsx(
            "dropdown-enter absolute top-full z-50 mt-2 min-w-[220px] rounded-xl border border-border/60 bg-white py-1.5 shadow-lg shadow-brand-900/10",
            align === "right" ? "right-0" : "left-0"
          )}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

type DropdownItemProps = {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
  className?: string;
};

export function DropdownItem({
  icon,
  children,
  onClick,
  href,
  variant = "default",
  className,
}: DropdownItemProps) {
  const baseClasses = clsx(
    "flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
    variant === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-brand-800/90 hover:bg-brand-50 hover:text-brand-900",
    className
  );

  if (href) {
    return (
      <a href={href} className={baseClasses} role="menuitem">
        {icon && <span className="flex h-5 w-5 items-center justify-center opacity-70">{icon}</span>}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses} role="menuitem">
      {icon && <span className="flex h-5 w-5 items-center justify-center opacity-70">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1.5 h-px bg-border/60" role="separator" />;
}

type DropdownLabelProps = {
  children: ReactNode;
  className?: string;
};

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={clsx(
        "px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-600/70",
        className
      )}
    >
      {children}
    </div>
  );
}

