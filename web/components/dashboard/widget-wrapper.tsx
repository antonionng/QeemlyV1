"use client";

import clsx from "clsx";
import { GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getWidgetDefinition } from "@/lib/dashboard/widget-registry";

type WidgetWrapperProps = {
  widgetId: string;
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
  isDragging?: boolean;
};

export function WidgetWrapper({
  widgetId,
  children,
  onRemove,
  className,
  isDragging = false,
}: WidgetWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const widget = getWidgetDefinition(widgetId);

  // Body scroll lock when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isExpanded]);

  if (!widget) return null;

  const Icon = widget.icon;

  const renderCardContent = (expanded: boolean) => (
    <>
      {/* Widget Header */}
      <div
        className={clsx(
          "flex items-center justify-between gap-2 border-b border-border/40 px-5 py-4",
          expanded ? "bg-white border-b-2" : "bg-white/60 backdrop-blur-md sticky top-0 z-10"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Drag Handle - Hidden when expanded */}
          {!expanded && (
            <div
              className={clsx(
                "drag-handle flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg",
                "text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-600",
                "active:cursor-grabbing"
              )}
            >
              <GripVertical className="h-5 w-5" />
            </div>
          )}

          {/* Icon + Title */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 shadow-sm border border-brand-100">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-brand-900 tracking-tight">
              {widget.name}
            </h3>
            {expanded && widget.description && (
              <p className="text-xs text-brand-600 truncate max-w-md">
                {widget.description}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div
          className={clsx(
            "flex items-center gap-2 transition-all duration-200",
            isHovered || expanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          )}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={clsx(
              "flex h-8 px-2 items-center justify-center rounded-lg transition-all",
              expanded
                ? "bg-brand-900 text-white hover:bg-brand-800"
                : "text-brand-500 hover:bg-brand-50 hover:text-brand-700 border border-transparent hover:border-brand-100"
            )}
            aria-label={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-semibold pr-1">Exit Fullscreen</span>
              </>
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          {!expanded && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-400 transition-all hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100"
              aria-label="Remove widget"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div
        className={clsx(
          "flex-1 overflow-auto p-5 widget-scroll",
          expanded ? "bg-white" : ""
        )}
      >
        {children}
      </div>
    </>
  );

  return (
    <>
      <div
        className={clsx(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300",
          "bg-white/90 backdrop-blur-sm",
          isDragging
            ? "shadow-2xl ring-2 ring-brand-500/30 scale-[1.02] z-10"
            : "shadow-sm hover:shadow-xl hover:shadow-brand-900/5 hover:-translate-y-0.5",
          "border-border/50",
          isExpanded ? "opacity-0 pointer-events-none" : "z-0",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderCardContent(false)}
      </div>

      {isExpanded &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-300">
            {renderCardContent(true)}
          </div>,
          document.body
        )}
    </>
  );
}

