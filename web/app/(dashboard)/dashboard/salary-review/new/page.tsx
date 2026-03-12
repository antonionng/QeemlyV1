"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UploadModal } from "@/components/dashboard/upload";
import { SalaryReviewWizard } from "@/components/salary-review";
import { buildSalaryReviewCsv } from "@/lib/salary-review/export";
import { useSalaryReview } from "@/lib/salary-review";

function SalaryReviewWizardPageContent() {
  const router = useRouter();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const {
    employees,
    isLoading,
    loadEmployeesFromDb,
    loadCycles,
    loadLatestProposal,
    loadApprovalProposalList,
    resetReview,
  } = useSalaryReview();

  useEffect(() => {
    void (async () => {
      await loadEmployeesFromDb();
      await loadCycles();
      await loadLatestProposal();
      await loadApprovalProposalList();
    })();
  }, [loadApprovalProposalList, loadCycles, loadEmployeesFromDb, loadLatestProposal]);

  const handleExport = () => {
    const csv = buildSalaryReviewCsv(employees);
    if (!csv.trim() || csv.split("\n").length <= 1) {
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `salary-review-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
          <p className="mt-3 text-brand-600">Loading salary review wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SalaryReviewWizard
        onBack={() => router.push("/dashboard/salary-review")}
        onImport={() => setShowUploadModal(true)}
        onExport={handleExport}
        onReset={resetReview}
        onSubmitSuccess={(proposalId) => {
          const nextUrl = proposalId
            ? `/dashboard/salary-review?tab=approvals&proposalId=${proposalId}`
            : "/dashboard/salary-review?tab=approvals";
          router.push(nextUrl);
        }}
      />
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        type="compensation"
        onSuccess={() => {
          void loadEmployeesFromDb();
          setShowUploadModal(false);
        }}
      />
    </>
  );
}

export default function SalaryReviewWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
            <p className="mt-3 text-brand-600">Loading salary review wizard...</p>
          </div>
        </div>
      }
    >
      <SalaryReviewWizardPageContent />
    </Suspense>
  );
}
