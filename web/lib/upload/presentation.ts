import type { UploadDataType } from "./column-detection";
import type { UploadImportMode } from "./upload-state";
import type { Employee } from "@/lib/employees";
import type { UploadProcessedBenchmark, UploadProcessedEmployee } from "./api";
import { LEVELS, LOCATIONS, ROLES } from "@/lib/dashboard/dummy-data";

type SelectableUploadType = {
  id: UploadDataType;
  title: string;
  description: string;
  features: string[];
};

type FileUploadGuidance = {
  helperText: string;
  matchingRule: string;
  templateHint: string;
};

type ConfirmSummaryCopy = {
  title: string;
  body: string;
};

type ValidationLegendItem = {
  id: "ready" | "warning" | "error" | "excluded";
  label: string;
  description: string;
};

export type UploadedEmployeePreviewRow = {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  locationLabel: string;
  actionLabel: "Created" | "Updated";
  benchmarkLabel: string;
  insightLabel: string;
};

export type UploadedBenchmarkPreviewRow = {
  id: string;
  roleTitle: string;
  locationLabel: string;
  levelLabel: string;
  actionLabel: "Created" | "Updated";
  sampleSizeLabel: string;
  insightLabel: string;
};

const SELECTABLE_UPLOAD_TYPES: SelectableUploadType[] = [
  {
    id: "employees",
    title: "Employee Data",
    description: "Import your employee roster with compensation details",
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
    description: "Upload company benchmark bands as an internal overlay",
    features: [
      "Role and location mappings",
      "Percentile data (P10-P90)",
      "Sample sizes for confidence",
      "Supports company policy overlays",
    ],
  },
];

export function getSelectableUploadTypes(): SelectableUploadType[] {
  return SELECTABLE_UPLOAD_TYPES;
}

export function getUploadHeaderSubtitle(dataType: UploadDataType | null): string | null {
  if (dataType === "employees") {
    return "Import employee data and compare it against Qeemly market benchmarks.";
  }
  if (dataType === "benchmarks") {
    return "Import company benchmark bands as an overlay on top of Qeemly market data.";
  }
  if (dataType === "compensation") {
    return "Bulk update compensation for existing employees.";
  }
  return null;
}

export function getFileUploadGuidance(
  dataType: UploadDataType,
  importMode: UploadImportMode,
): FileUploadGuidance {
  if (dataType === "employees") {
    return {
      helperText: "Upload a CSV or Excel file with your latest roster. Use the template if you need the expected format.",
      matchingRule:
        importMode === "replace"
          ? "Replace mode will remove your current employee roster first, then load the file as the new source of truth. Qeemly market data stays untouched."
          : "Incremental mode matches existing employees by email when available. Matched rows are updated, and new rows are created.",
      templateHint:
        "Include email whenever possible so repeated imports can update the right employee instead of creating a duplicate.",
    };
  }

  if (dataType === "benchmarks") {
    return {
      helperText: "Upload a CSV or Excel file with role, level, location, and percentile columns.",
      matchingRule:
        importMode === "replace"
          ? "Replace mode will remove your current company benchmark overlay first, then load the file as the new overlay."
          : "Incremental mode updates matching company benchmark rows and creates new ones for unmatched cohorts.",
      templateHint:
        "Your uploaded company benchmark bands stay separate from Qeemly market data, which remains the primary benchmark source.",
    };
  }

  return {
    helperText: "Upload a CSV or Excel file with employee identifiers and compensation fields.",
    matchingRule: "Compensation updates match existing employees by email.",
    templateHint: "Only include the compensation fields you want to update.",
  };
}

export function getConfirmSummaryCopy(
  dataType: UploadDataType,
  importMode: UploadImportMode,
): ConfirmSummaryCopy {
  if (dataType === "employees" && importMode === "replace") {
    return {
      title: "This import will replace your current employee roster",
      body:
        "We will remove your current employee roster for this workspace and replace it with the file you are importing. Qeemly market data will not be changed.",
    };
  }

  if (dataType === "employees") {
    return {
      title: "This import will update matching employees and add new ones",
      body:
        "Rows with a matching email will be updated. Rows without a match will be created as new employees. Existing employees not included in the file will stay unchanged.",
    };
  }

  if (dataType === "benchmarks" && importMode === "replace") {
    return {
      title: "This import will replace your company benchmark overlay",
      body:
        "We will remove your current company benchmark overlay for this workspace and replace it with this file. Qeemly market data will remain available.",
    };
  }

  if (dataType === "benchmarks") {
    return {
      title: "This import will update matching benchmark rows and add new ones",
      body:
        "Matching company benchmark rows will be updated, and new benchmark rows will be created for new cohorts. Qeemly market data remains the primary benchmark source.",
    };
  }

  return {
    title: "This import will update existing compensation records",
    body:
      "Existing employees will be matched by email and their compensation will be updated. Unmatched rows will be reported so you can fix them.",
  };
}

export function getValidationLegend(_dataType: UploadDataType): ValidationLegendItem[] {
  return [
    {
      id: "ready",
      label: "Ready",
      description: "The row can be imported as-is.",
    },
    {
      id: "warning",
      label: "Warning",
      description: "The row can be imported, but you should review the flagged fields.",
    },
    {
      id: "error",
      label: "Error",
      description: "The row cannot be imported until the required issue is fixed.",
    },
    {
      id: "excluded",
      label: "Excluded",
      description: "The row will be skipped during import.",
    },
  ];
}

export function buildUploadedEmployeePreviewRows(
  employees: Employee[],
  processedEmployees: UploadProcessedEmployee[],
): UploadedEmployeePreviewRow[] {
  const employeeByEmail = new Map(
    employees.map((employee) => [employee.email.toLowerCase(), employee] as const),
  );

  return processedEmployees
    .map((processed) => {
      const employee = employeeByEmail.get(processed.email.toLowerCase());
      if (!employee) return null;

      const benchmarkLabel = employee.hasBenchmark
        ? employee.benchmarkContext?.source === "market"
          ? "Benchmarked"
          : "Matched to company overlay"
        : "Needs mapping";

      const insightLabel = employee.hasBenchmark
        ? `${employee.marketComparison >= 0 ? "+" : ""}${employee.marketComparison}% vs market median`
        : "Add role, level, or location to benchmark this employee.";

      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        email: employee.email,
        roleTitle: employee.role.title,
        locationLabel: employee.location.city,
        actionLabel: processed.action === "created" ? "Created" : "Updated",
        benchmarkLabel,
        insightLabel,
      } satisfies UploadedEmployeePreviewRow;
    })
    .filter((row): row is UploadedEmployeePreviewRow => row !== null);
}

export function buildUploadedBenchmarkPreviewRows(
  benchmarks: Array<{
    role_id: string;
    location_id: string;
    level_id: string;
    currency: string;
    p50?: number | null;
    sample_size?: number | null;
    valid_from?: string | null;
  }>,
  processedBenchmarks: UploadProcessedBenchmark[],
): UploadedBenchmarkPreviewRow[] {
  const benchmarkByKey = new Map(
    benchmarks.map((benchmark) => [
      `${benchmark.role_id}::${benchmark.location_id}::${benchmark.level_id}::${benchmark.valid_from ?? ""}`,
      benchmark,
    ] as const),
  );

  return processedBenchmarks
    .map((processed) => {
      const benchmark = benchmarkByKey.get(
        `${processed.roleId}::${processed.locationId}::${processed.levelId}::${processed.validFrom}`,
      );
      if (!benchmark) return null;

      const role = ROLES.find((entry) => entry.id === processed.roleId);
      const location = LOCATIONS.find((entry) => entry.id === processed.locationId);
      const level = LEVELS.find((entry) => entry.id === processed.levelId);

      return {
        id: `${processed.roleId}-${processed.locationId}-${processed.levelId}-${processed.validFrom}`,
        roleTitle: role?.title || processed.roleId,
        locationLabel: location?.city || processed.locationId,
        levelLabel: level?.name || processed.levelId,
        actionLabel: processed.action === "created" ? "Created" : "Updated",
        sampleSizeLabel:
          typeof benchmark.sample_size === "number" && benchmark.sample_size > 0
            ? `Sample size: ${benchmark.sample_size}`
            : "Sample size not provided",
        insightLabel:
          typeof benchmark.p50 === "number" && benchmark.p50 > 0
            ? `Median: ${benchmark.p50.toLocaleString("en-US")} ${benchmark.currency}`
            : `Currency: ${benchmark.currency}`,
      } satisfies UploadedBenchmarkPreviewRow;
    })
    .filter((row): row is UploadedBenchmarkPreviewRow => row !== null);
}
