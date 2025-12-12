"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Sparkles, X } from "lucide-react";

type AiExplainTooltipProps = {
  message: string;
  label?: string;
  className?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(Boolean(mq.matches));
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

export function AiExplainTooltip({ message, label = "Explain", className }: AiExplainTooltipProps) {
  const tooltipId = useId();
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const fullMessage = useMemo(() => message.trim(), [message]);

  useEffect(() => setMounted(true), []);

  // Close on outside click / Esc.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Position tooltip above other UI by portaling to <body> and using fixed coords.
  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      const desiredTop = rect.bottom + 8;
      let desiredLeft = rect.left;

      // Clamp horizontally after measuring tooltip width (if available).
      const tooltipEl = tooltipRef.current;
      const maxWidth = Math.min(420, window.innerWidth - margin * 2);
      const tooltipWidth = tooltipEl?.offsetWidth ?? maxWidth;
      desiredLeft = Math.min(desiredLeft, window.innerWidth - margin - tooltipWidth);
      desiredLeft = Math.max(margin, desiredLeft);

      setPos({ left: desiredLeft, top: desiredTop });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // Type-out effect when opened (subtle + respects reduced motion).
  useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion) {
      setTyped(fullMessage);
      return;
    }

    setTyped("");
    let i = 0;
    const stepMs = 14;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(fullMessage.slice(0, i));
      if (i >= fullMessage.length) window.clearInterval(id);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [open, fullMessage, prefersReducedMotion]);

  return (
    <div ref={containerRef} className={clsx("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={tooltipId}
        className={clsx(
          "inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-700",
          "hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles className="h-4 w-4 text-brand-500" />
        {label}
      </button>

      {open && mounted && pos
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              style={{ left: pos.left, top: pos.top }}
              className={clsx(
                "fixed z-[80] w-[min(420px,calc(100vw-2rem))]",
                "rounded-2xl border border-border bg-white/95 p-4 text-sm text-brand-800 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-sm",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 ring-1 ring-border">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">AI helper</p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-brand-500 hover:bg-muted hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-brand-800">{typed}</p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}


