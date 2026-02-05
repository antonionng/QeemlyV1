"use client";

import { Users, BarChart3, DollarSign, Download, ArrowRight } from "lucide-react";
import { useUploadStore, type UploadDataType, downloadTemplate } from "@/lib/upload";
import clsx from "clsx";

const DATA_TYPES: {
  id: UploadDataType;
  title: string;
  description: string;
  icon: typeof Users;
  features: string[];
}[] = [
  {
    id: "employees",
    title: "Employee Data",
    description: "Import your employee roster with compensation details",
    icon: Users,
    features: [
      "Employee names and contact info",
      "Department, role, and level",
      "Base salary, bonus, and equity",
      "Hire dates and performance ratings",
    ],
  },
  {
    id: "benchmarks",
    title: "Salary Benchmarks",
    description: "Upload market salary data for benchmarking",
    icon: BarChart3,
    features: [
      "Role and location mappings",
      "Percentile data (P10-P90)",
      "Sample sizes for confidence",
      "Supports multiple markets",
    ],
  },
  {
    id: "compensation",
    title: "Compensation Updates",
    description: "Bulk update salaries for existing employees",
    icon: DollarSign,
    features: [
      "Match by email address",
      "Update base, bonus, equity",
      "Set effective dates",
      "Track change reasons",
    ],
  },
];

export function StepDataType() {
  const { dataType, setDataType, nextStep } = useUploadStore();

  const handleSelect = (type: UploadDataType) => {
    setDataType(type);
  };

  const handleContinue = () => {
    if (dataType) {
      nextStep();
    }
  };

  const handleDownloadTemplate = (type: UploadDataType, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadTemplate(type);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-900">
          What type of data are you uploading?
        </h2>
        <p className="text-sm text-brand-600 mt-1">
          Select the type of data to get started with the appropriate template
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {DATA_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = dataType === type.id;

          return (
            <div
              key={type.id}
              onClick={() => handleSelect(type.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(type.id);
                }
              }}
              className={clsx(
                "relative flex flex-col rounded-xl border-2 p-5 text-left transition-all cursor-pointer",
                isSelected
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                  : "border-border hover:border-brand-300 hover:bg-brand-50/50"
              )}
            >
              <div
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-lg mb-3",
                  isSelected ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="font-semibold text-brand-900 mb-1">{type.title}</h3>
              <p className="text-sm text-brand-600 mb-3">{type.description}</p>

              <ul className="space-y-1.5 mb-4 flex-1">
                {type.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-brand-700">
                    <span className="text-brand-400 mt-0.5">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => handleDownloadTemplate(type.id, e)}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download template
              </button>

              {isSelected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!dataType}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            dataType
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-brand-100 text-brand-400 cursor-not-allowed"
          )}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
