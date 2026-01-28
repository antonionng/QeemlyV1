"use client";

import { Badge } from "@/components/ui/badge";
import { Globe, Users, Plane, AlertTriangle, CheckCircle2 } from "lucide-react";

const DATA = [
  { label: "Total Expat Staff", value: "84", color: "brand" },
  { label: "Renewals Pending", value: "12", color: "amber" },
  { label: "Critical Expiry", value: "3", color: "red" },
  { label: "New Processing", value: "5", color: "emerald" },
];

export function VisaComplianceWidget() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {DATA.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/40 bg-white/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-500">{item.label}</p>
            <p className={`mt-1 text-xl font-bold ${
              item.color === "red" ? "text-red-600" : 
              item.color === "amber" ? "text-amber-600" : 
              item.color === "emerald" ? "text-emerald-600" : 
              "text-brand-900"
            }`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h5 className="text-xs font-bold text-brand-900 uppercase tracking-tight">Timeline view</h5>
        <div className="relative space-y-4 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-brand-100">
          {[
            {
              title: "Sarah Jenkins (Senior Designer)",
              desc: "Emirates ID expiry in 14 days",
              type: "Critical",
              icon: AlertTriangle,
              iconColor: "text-red-500",
              bgColor: "bg-red-50",
            },
            {
              title: "Ahmed Al-Farsi (Engineer)",
              desc: "Work Permit renewal successful",
              type: "Success",
              icon: CheckCircle2,
              iconColor: "text-emerald-500",
              bgColor: "bg-emerald-50",
            },
            {
              title: "Li Chen (Product Manager)",
              desc: "Visa application submitted",
              type: "Update",
              icon: Plane,
              iconColor: "text-brand-500",
              bgColor: "bg-brand-50",
            },
          ].map((step, idx) => (
            <div key={idx} className="relative pl-7">
              <div className={`absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 ${
                step.type === "Critical" ? "border-red-500" : 
                step.type === "Success" ? "border-emerald-500" : 
                "border-brand-500"
              } z-10`}>
                <div className={`h-1.5 w-1.5 rounded-full ${
                  step.type === "Critical" ? "bg-red-500" : 
                  step.type === "Success" ? "bg-emerald-500" : 
                  "bg-brand-500"
                }`} />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-900">{step.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[11px] text-brand-500">{step.desc}</p>
                  <Badge variant="ghost" className={`h-4 text-[9px] px-1.5 ${step.bgColor} ${step.iconColor} border-transparent`}>
                    {step.type}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
