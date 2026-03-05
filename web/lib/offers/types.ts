export type OfferStatus = "draft" | "ready" | "sent" | "archived";
export type OfferExportFormat = "PDF" | "DOCX" | "JSON";
export type EmploymentType = "national" | "expat";

export interface Offer {
  id: string;
  workspace_id: string;
  employee_id: string | null;
  created_by: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  role_id: string;
  level_id: string;
  location_id: string;
  employment_type: EmploymentType;
  target_percentile: number;
  offer_value: number;
  offer_low: number;
  offer_high: number;
  currency: string;
  salary_breakdown: Record<string, unknown>;
  benchmark_snapshot: Record<string, unknown>;
  export_format: OfferExportFormat;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferPayload {
  employee_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  role_id: string;
  level_id: string;
  location_id: string;
  employment_type: EmploymentType;
  target_percentile: number;
  offer_value: number;
  offer_low: number;
  offer_high: number;
  currency: string;
  salary_breakdown?: Record<string, unknown>;
  benchmark_snapshot?: Record<string, unknown>;
  export_format?: OfferExportFormat;
  status?: OfferStatus;
}

export interface UpdateOfferPayload {
  employee_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  status?: OfferStatus;
  export_format?: OfferExportFormat;
  salary_breakdown?: Record<string, unknown>;
  benchmark_snapshot?: Record<string, unknown>;
}

export interface OfferExportPayload {
  version: string;
  generated_at: string;
  offer: Record<string, unknown>;
}
