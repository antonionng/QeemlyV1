export interface Report {
  id: string;
  workspace_id: string;
  title: string;
  type_id: 'overview' | 'benchmark' | 'compliance' | 'custom';
  status: 'Scheduled' | 'Ready' | 'In Review' | 'Building';
  owner: string;
  tags: string[];
  schedule_cadence: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | null;
  schedule_next_run: string | null;
  recipients: string[];
  config: Record<string, unknown>;
  result_data: Record<string, unknown> | null;
  format: 'PDF' | 'XLSX' | 'Slides';
  template_id: string | null;
  template_version: number | null;
  last_run_id: string | null;
  build_error: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReportPayload {
  title: string;
  type_id?: Report['type_id'];
  owner?: string;
  template_id?: string;
  tags?: string[];
  schedule_cadence?: Report['schedule_cadence'];
  recipients?: string[];
  config?: Record<string, unknown>;
  format?: Report['format'];
}

export interface GenerateReportPayload {
  trigger_source?: 'manual' | 'schedule' | 'api' | 'template';
}

export interface ReportTemplate {
  id: string;
  workspace_id: string | null;
  slug: string;
  title: string;
  type_id: Report['type_id'];
  category: string | null;
  description: string;
  cadence: string | null;
  coverage: string | null;
  confidence: 'High' | 'Medium' | 'Low';
  owner: string | null;
  tags: string[];
  config: Record<string, unknown>;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ReportRun {
  id: string;
  workspace_id: string;
  report_id: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  triggered_by: string | null;
  trigger_source: 'manual' | 'schedule' | 'api' | 'template';
  attempt_number: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  result_data: Record<string, unknown> | null;
  artifact_url: string | null;
  artifact_format: Report['format'] | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateReportPayload {
  title?: string;
  status?: Report['status'];
  tags?: string[];
  schedule_cadence?: Report['schedule_cadence'];
  schedule_next_run?: string | null;
  recipients?: string[];
  config?: Record<string, unknown>;
  result_data?: Record<string, unknown> | null;
  last_run_at?: string | null;
  build_error?: string | null;
  format?: Report['format'];
}
