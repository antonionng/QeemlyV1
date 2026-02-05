// Template definitions for CSV downloads

import type { UploadDataType } from "./column-detection";

export type TemplateColumn = {
  header: string;
  description: string;
  required: boolean;
  example: string;
};

export type Template = {
  type: UploadDataType;
  name: string;
  description: string;
  columns: TemplateColumn[];
};

export const EMPLOYEE_TEMPLATE: Template = {
  type: "employees",
  name: "Employee Data Template",
  description: "Upload your employee roster with compensation data",
  columns: [
    { header: "first_name", description: "Employee first name", required: true, example: "John" },
    { header: "last_name", description: "Employee last name", required: true, example: "Smith" },
    { header: "email", description: "Work email address", required: false, example: "john.smith@company.com" },
    { header: "department", description: "Department name", required: true, example: "Engineering" },
    { header: "role", description: "Job title or role", required: true, example: "Software Engineer" },
    { header: "level", description: "Career level (e.g., IC3, M1)", required: true, example: "IC3" },
    { header: "location", description: "Office location or city", required: true, example: "Dubai" },
    { header: "base_salary", description: "Annual base salary", required: true, example: "180000" },
    { header: "bonus", description: "Annual bonus amount", required: false, example: "18000" },
    { header: "equity", description: "Annual equity value", required: false, example: "50000" },
    { header: "currency", description: "Currency code (e.g., AED, SAR)", required: false, example: "AED" },
    { header: "status", description: "Employment status (active/inactive)", required: false, example: "active" },
    { header: "employment_type", description: "Type (local/expat)", required: false, example: "local" },
    { header: "hire_date", description: "Date of hire (YYYY-MM-DD)", required: false, example: "2023-01-15" },
    { header: "performance_rating", description: "Rating (low/meets/exceeds/exceptional)", required: false, example: "exceeds" },
  ],
};

export const BENCHMARK_TEMPLATE: Template = {
  type: "benchmarks",
  name: "Salary Benchmark Template",
  description: "Upload market salary benchmark data",
  columns: [
    { header: "role", description: "Job title or role name", required: true, example: "Software Engineer" },
    { header: "location", description: "City or market", required: true, example: "Dubai" },
    { header: "level", description: "Career level (e.g., IC3, M1)", required: true, example: "IC3" },
    { header: "currency", description: "Currency code", required: true, example: "AED" },
    { header: "p10", description: "10th percentile salary", required: true, example: "150000" },
    { header: "p25", description: "25th percentile salary", required: true, example: "165000" },
    { header: "p50", description: "50th percentile (median)", required: true, example: "180000" },
    { header: "p75", description: "75th percentile salary", required: true, example: "200000" },
    { header: "p90", description: "90th percentile salary", required: true, example: "230000" },
    { header: "sample_size", description: "Number of data points", required: false, example: "45" },
  ],
};

export const COMPENSATION_TEMPLATE: Template = {
  type: "compensation",
  name: "Compensation Update Template",
  description: "Bulk update employee compensation",
  columns: [
    { header: "email", description: "Employee email (for matching)", required: true, example: "john.smith@company.com" },
    { header: "new_base_salary", description: "New annual base salary", required: true, example: "195000" },
    { header: "new_bonus", description: "New annual bonus", required: false, example: "20000" },
    { header: "new_equity", description: "New annual equity value", required: false, example: "55000" },
    { header: "effective_date", description: "When changes take effect", required: false, example: "2024-04-01" },
    { header: "change_reason", description: "Reason for change", required: false, example: "Annual review" },
  ],
};

export function getTemplate(type: UploadDataType): Template {
  switch (type) {
    case "employees":
      return EMPLOYEE_TEMPLATE;
    case "benchmarks":
      return BENCHMARK_TEMPLATE;
    case "compensation":
      return COMPENSATION_TEMPLATE;
  }
}

/**
 * Generate CSV content for a template
 */
export function generateTemplateCsv(template: Template): string {
  const headers = template.columns.map((c) => c.header);
  const examples = template.columns.map((c) => c.example);
  
  return [
    headers.join(","),
    examples.join(","),
    // Add a second example row for employees
    ...(template.type === "employees"
      ? ["Jane,Doe,jane.doe@company.com,Product,Product Manager,IC4,Riyadh,220000,22000,60000,SAR,active,local,2022-06-01,meets"]
      : []),
    // Add a second example row for benchmarks
    ...(template.type === "benchmarks"
      ? ["Product Manager,Riyadh,IC4,SAR,200000,220000,250000,280000,320000,38"]
      : []),
  ].join("\n");
}

/**
 * Download a template as a CSV file
 */
export function downloadTemplate(type: UploadDataType): void {
  const template = getTemplate(type);
  const csv = generateTemplateCsv(template);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `qeemly-${type}-template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
