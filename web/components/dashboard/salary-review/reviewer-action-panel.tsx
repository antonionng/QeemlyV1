"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ReviewerActionPanel({
  disabled,
  disabledReason,
  onAction,
  eyebrow = "Actions",
  title = "Reviewer Actions",
  description = "Record the decision and optional note for the current approval step.",
}: {
  disabled?: boolean;
  disabledReason?: string;
  onAction: (action: "approve" | "return" | "reject", note: string) => Promise<void> | void;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const [note, setNote] = useState("");

  return (
    <Card className="dash-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-500">{eyebrow}</p>
      <h3 className="mt-2 text-base font-semibold text-accent-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-accent-600">{description}</p>

      {disabled && disabledReason ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
          {disabledReason}
        </div>
      ) : null}

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add reviewer context"
        className="mt-4 min-h-24 w-full rounded-xl border border-accent-200 bg-accent-50/30 px-3 py-2 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
      />

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button disabled={disabled} onClick={() => onAction("approve", note)}>
          Approve
        </Button>
        <Button disabled={disabled} variant="outline" onClick={() => onAction("return", note)}>
          Return For Revision
        </Button>
        <Button disabled={disabled} variant="outline" onClick={() => onAction("reject", note)}>
          Reject
        </Button>
      </div>
    </Card>
  );
}
