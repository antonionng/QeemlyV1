export interface AdvisoryRationale {
  point: string;
  supporting_data: string;
}

export interface AdvisoryRisk {
  type: 'low-confidence' | 'high-uplift' | 'compression' | 'retention' | 'budget-impact' | 'equity-gap';
  label: string;
  severity: 'low' | 'medium' | 'high';
  detail: string;
}

export interface AdvisoryTalkTrack {
  audience: 'manager' | 'employee' | 'finance';
  label: string;
  points: string[];
}

export interface QeemlyAdvisory {
  employee_id: string;
  recommendation_summary: string;
  rationale: AdvisoryRationale[];
  risks: AdvisoryRisk[];
  confidence_score: number;
  confidence_explanation: string;
  talk_tracks: AdvisoryTalkTrack[];
  generated_at: string;
}
