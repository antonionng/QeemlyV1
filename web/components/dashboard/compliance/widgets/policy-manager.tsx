"use client";

import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const POLICIES = [
  { name: "Code of Conduct", rate: 98, status: "Success" },
  { name: "Remote Work Policy", rate: 84, status: "Pending" },
  { name: "Data Protection (GDPR)", rate: 100, status: "Success" },
  { name: "Anti-Bribery Policy", rate: 72, status: "Critical" },
];

export function PolicyManagerWidget() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-brand-900">Policy Compliance</h5>
        <div className="text-[11px] font-medium text-brand-500">
          Avg. Completion: <span className="font-bold text-brand-900">88.5%</span>
        </div>
      </div>

      <div className="space-y-4">
        {POLICIES.map((policy) => (
          <div key={policy.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-brand-400" />
                <span className="text-xs font-medium text-brand-700">{policy.name}</span>
              </div>
              <Badge 
                variant="ghost" 
                className={`h-5 text-[9px] px-1.5 ${
                  policy.status === "Success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  policy.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                  "bg-red-50 text-red-600 border-red-100"
                }`}
              >
                {policy.rate}% Signed
              </Badge>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className={`h-full ${
                  policy.status === "Success" ? "bg-emerald-500" :
                  policy.status === "Pending" ? "bg-amber-500" :
                  "bg-red-500"
                }`} 
                style={{ width: `${policy.rate}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
