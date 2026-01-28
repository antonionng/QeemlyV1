"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Bell,
  BookmarkPlus,
  Check,
  Download,
  Mail,
  Scale,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBenchmarksContext } from "@/lib/benchmarks/context";

type ActionState = {
  saved: boolean;
  alertSet: boolean;
};

export function QuickActionsWidget() {
  const { selectedRole, selectedBenchmark } = useBenchmarksContext();
  const [actionState, setActionState] = useState<ActionState>({
    saved: false,
    alertSet: false,
  });

  const handleSave = () => {
    setActionState((prev) => ({ ...prev, saved: !prev.saved }));
  };

  const handleSetAlert = () => {
    setActionState((prev) => ({ ...prev, alertSet: !prev.alertSet }));
  };

  const handleExport = () => {
    // In real app, this would trigger export
    alert("Exporting benchmark data...");
  };

  const handleShare = () => {
    // In real app, this would open share modal
    alert("Share functionality coming soon!");
  };

  const handleCompare = () => {
    // In real app, this would open comparison view
    alert("Compare mode coming soon!");
  };

  if (!selectedRole) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-brand-700">No role selected</p>
          <p className="text-xs text-accent-500">Select a role for quick actions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={actionState.saved ? "primary" : "outline"}
          size="sm"
          onClick={handleSave}
          className={clsx(
            "h-10 justify-start gap-2",
            actionState.saved && "bg-brand-500 text-white hover:bg-brand-600"
          )}
        >
          {actionState.saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <BookmarkPlus className="h-4 w-4" />
          )}
          {actionState.saved ? "Saved" : "Save"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-10 justify-start gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={actionState.alertSet ? "primary" : "outline"}
          size="sm"
          onClick={handleSetAlert}
          className={clsx(
            "h-10 justify-start gap-2",
            actionState.alertSet && "bg-amber-500 text-white hover:bg-amber-600"
          )}
        >
          <Bell className="h-4 w-4" />
          {actionState.alertSet ? "Alert On" : "Set Alert"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCompare}
          className="h-10 justify-start gap-2"
        >
          <Scale className="h-4 w-4" />
          Compare
        </Button>
      </div>

      {/* Tertiary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="h-10 justify-start gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (selectedBenchmark) {
              window.location.href = `mailto:?subject=Benchmark: ${selectedRole.title}&body=Check out this salary benchmark data.`;
            }
          }}
          className="h-10 justify-start gap-2"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
      </div>

      {/* Status indicator */}
      {(actionState.saved || actionState.alertSet) && (
        <div className="mt-auto rounded-lg bg-brand-50 p-3">
          <p className="text-xs text-brand-700">
            {actionState.saved && actionState.alertSet
              ? "Benchmark saved and alert set"
              : actionState.saved
              ? "Benchmark saved to watchlist"
              : "Price alert configured"}
          </p>
        </div>
      )}
    </div>
  );
}
