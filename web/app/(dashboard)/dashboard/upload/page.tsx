"use client";

import { useEffect } from "react";
import { UploadWizard } from "@/components/dashboard/upload";
import { useUploadStore } from "@/lib/upload";

export default function UploadPage() {
  const { reset } = useUploadStore();

  // Reset wizard state when page loads
  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="h-full bg-brand-50/30">
      <div className="mx-auto max-w-5xl py-8 px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <UploadWizard mode="page" />
        </div>
      </div>
    </div>
  );
}
