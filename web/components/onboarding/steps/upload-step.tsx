"use client";

import { Upload, FileSpreadsheet, SkipForward } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboardingStore } from "@/lib/onboarding";

export function UploadStep({ onNext }: { onNext: () => void }) {
  const skipUpload = useOnboardingStore((s) => s.skipUpload);
  const isLoading = useOnboardingStore((s) => s.isLoading);

  const handleSkip = async () => {
    await skipUpload();
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-900">
            Upload employee data
          </h2>
          <p className="text-sm text-brand-500">
            Optional. You can always upload later from the dashboard.
          </p>
        </div>
      </div>

      {/* Explanation */}
      <Card className="p-5">
        <p className="text-sm leading-relaxed text-brand-700">
          Qeemly already has market benchmark data ready for you. Uploading your
          employee roster lets us show exactly where each role sits against the
          market. You can always upload later.
        </p>
      </Card>

      {/* Option cards */}
      <div className="grid gap-3">
        <Link href="/dashboard/upload" className="block">
          <Card clickable className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-900">
                Upload Employee Data
              </p>
              <p className="mt-0.5 text-xs text-brand-500">
                Import a CSV or Excel file with your employee roster and
                compensation data.
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/upload" className="block">
          <Card clickable className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
              <Upload className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-900">
                Upload Company Pay Bands
              </p>
              <p className="mt-0.5 text-xs text-brand-500">
                Import your pay band structure to compare against market
                benchmarks.
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Skip */}
      <div className="flex justify-end pt-2">
        <Button
          variant="ghost"
          onClick={handleSkip}
          isLoading={isLoading}
          className="px-6"
        >
          <SkipForward className="mr-1.5 h-4 w-4" />
          Skip for now
        </Button>
      </div>
    </div>
  );
}
