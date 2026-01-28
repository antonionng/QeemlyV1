"use client";

import { History, User, FileText, Shield, Clock } from "lucide-react";

const LOGS = [
  {
    action: "Document Uploaded",
    target: "Trade License 2026.pdf",
    user: "John Doe",
    time: "2 hours ago",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    action: "Policy Acknowledged",
    target: "Remote Work Policy",
    user: "Sarah Smith",
    time: "4 hours ago",
    icon: Shield,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    action: "Risk Score Updated",
    target: "Data Privacy Area",
    user: "System (AI)",
    time: "6 hours ago",
    icon: History,
    color: "text-brand-500",
    bgColor: "bg-brand-50",
  },
  {
    action: "User Access Changed",
    target: "Emily Brown (Admin)",
    user: "Admin Team",
    time: "1 day ago",
    icon: User,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
];

export function AuditLogWidget() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-brand-900">Activity History</h5>
        <button className="text-xs font-bold text-brand-600 hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {LOGS.map((log, idx) => (
          <div key={idx} className="flex gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${log.bgColor} ${log.color}`}>
              <log.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 border-b border-border/40 pb-3 last:border-0">
              <div className="flex items-start justify-between">
                <p className="text-xs font-bold text-brand-900 truncate pr-2">
                  {log.action}: <span className="font-medium text-brand-600">{log.target}</span>
                </p>
                <div className="flex items-center gap-1 shrink-0 text-[10px] text-brand-400">
                  <Clock className="h-3 w-3" />
                  {log.time}
                </div>
              </div>
              <p className="mt-0.5 text-[11px] text-brand-500">
                Performed by <span className="font-medium text-brand-700">{log.user}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
