"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import type { OverviewInteractionTarget } from "@/lib/dashboard/overview-interactions";

type OverviewInteractiveSurfaceProps = {
  target: OverviewInteractionTarget;
  onInteract?: (target: OverviewInteractionTarget) => void;
  children: ReactNode;
  className?: string;
  tooltipTestId?: string;
  testId?: string;
};

const useSafeLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function OverviewInteractiveSurface({
  target,
  onInteract,
  children,
  className,
  tooltipTestId,
  testId,
}: OverviewInteractiveSurfaceProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const canPortal = typeof document !== "undefined";
  const sharedClassName = clsx(
    "group block w-full text-left rounded-[16px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
    className,
  );

  useSafeLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      const tooltipWidth = tooltipRef.current?.offsetWidth ?? 280;
      const left = Math.min(
        Math.max(margin, rect.left),
        window.innerWidth - tooltipWidth - margin,
      );
      const top = rect.bottom + 10;
      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {target.action === "link" ? (
        <a
          ref={(node) => {
            triggerRef.current = node;
          }}
          href={target.href}
          className={sharedClassName}
          aria-describedby={tooltipId}
          data-overview-action={target.action}
          data-overview-target={target.id}
          data-overview-href={target.href}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={(event) => {
            if (!onInteract || !isPrimaryUnmodifiedClick(event)) {
              return;
            }
            event.preventDefault();
            onInteract(target);
          }}
          data-testid={testId}
        >
          {children}
          {tooltipTestId ? (
            <span className="sr-only" data-testid={tooltipTestId}>
              {target.tooltip.title}
            </span>
          ) : null}
        </a>
      ) : (
        <button
          ref={(node) => {
            triggerRef.current = node;
          }}
          type="button"
          className={sharedClassName}
          aria-describedby={tooltipId}
          data-overview-action={target.action}
          data-overview-target={target.id}
          data-overview-href=""
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => onInteract?.(target)}
          data-testid={testId}
        >
          {children}
          {tooltipTestId ? (
            <span className="sr-only" data-testid={tooltipTestId}>
              {target.tooltip.title}
            </span>
          ) : null}
        </button>
      )}
      {canPortal && position
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              data-testid={tooltipTestId}
              className={clsx(
                "fixed z-[85] w-[min(320px,calc(100vw-1.5rem))]",
                "rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm",
                open ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              style={{ left: position.left, top: position.top }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">
                {target.tooltip.title}
              </p>
              <p className="mt-2 text-xl font-bold leading-none text-brand-900">
                {target.tooltip.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-accent-600">
                {target.tooltip.description}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function isPrimaryUnmodifiedClick(event: ReactMouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
