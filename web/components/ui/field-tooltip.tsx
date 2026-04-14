"use client";

import { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";
import clsx from "clsx";

interface FieldTooltipProps {
  message: string;
  className?: string;
}

export function FieldTooltip({ message, className }: FieldTooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const canPortal = typeof document !== "undefined";

  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: PointerEvent) => {
      if (
        triggerRef.current &&
        e.target instanceof Node &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onEsc);
    document.addEventListener("pointerdown", onClick);
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      setPos({
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - 280 - margin)),
        top: rect.bottom + 6,
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "inline-flex items-center justify-center rounded-full text-brand-400 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400",
          className,
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && canPortal && pos
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              style={{ left: pos.left, top: pos.top }}
              className="fixed z-[80] w-[min(272px,calc(100vw-1rem))] rounded-xl border border-border bg-white/95 px-3 py-2.5 text-xs leading-relaxed text-brand-700 shadow-lg backdrop-blur-sm"
            >
              {message}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
