"use client";

import { Calendar, Bell } from "lucide-react";

const EVENTS = [
  { date: "Feb 05", title: "Insurance Renewal", type: "Urgent" },
  { date: "Feb 12", title: "VAT Filing Q1", type: "Regular" },
  { date: "Mar 01", title: "Emiratization Report", type: "Mandatory" },
];

export function ComplianceCalendarWidget() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-brand-900">Upcoming Deadlines</h5>
        <Bell className="h-4 w-4 text-brand-400" />
      </div>

      <div className="space-y-3">
        {EVENTS.map((event) => (
          <div key={event.title} className="flex items-center gap-3 rounded-lg border border-border/40 p-2 hover:bg-brand-50/50 transition-colors">
            <div className="flex flex-col items-center justify-center rounded bg-brand-50 px-2 py-1 text-brand-600">
              <span className="text-[10px] font-bold uppercase">{event.date.split(' ')[0]}</span>
              <span className="text-xs font-bold leading-none">{event.date.split(' ')[1]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-brand-900 truncate">{event.title}</p>
              <p className={`text-[9px] font-medium uppercase tracking-tighter ${
                event.type === 'Urgent' ? 'text-red-500' : 
                event.type === 'Mandatory' ? 'text-amber-600' : 
                'text-brand-400'
              }`}>{event.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
