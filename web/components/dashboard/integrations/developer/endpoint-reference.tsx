"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// API Endpoint Definitions
// ============================================================================

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  params?: EndpointParam[];
  requestBody?: string; // JSON schema example
  responseBody: string; // JSON example
}

const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string }> = {
  GET: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  POST: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  PATCH: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  DELETE: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

const ENDPOINTS: { group: string; endpoints: ApiEndpoint[] }[] = [
  {
    group: "Employees",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/employees",
        summary: "List employees",
        description: "Returns a paginated list of all employees in the workspace.",
        params: [
          { name: "page", type: "integer", required: false, description: "Page number (default: 1)" },
          { name: "per_page", type: "integer", required: false, description: "Items per page (default: 50, max: 200)" },
          { name: "department", type: "string", required: false, description: "Filter by department" },
          { name: "status", type: "string", required: false, description: "Filter by status (active/inactive)" },
        ],
        responseBody: JSON.stringify({
          data: [
            {
              id: "uuid",
              first_name: "Sarah",
              last_name: "Ahmed",
              email: "sarah@company.com",
              department: "Engineering",
              role_id: "software_engineer",
              level_id: "senior",
              location_id: "dubai",
              base_salary: 45000,
              currency: "AED",
              status: "active",
            },
          ],
          pagination: { page: 1, per_page: 50, total: 150 },
        }, null, 2),
      },
      {
        method: "POST",
        path: "/api/v1/employees",
        summary: "Create / bulk push employees",
        description: "Create one or more employee records. Existing employees (matched by email) will be updated.",
        requestBody: JSON.stringify({
          employees: [
            {
              first_name: "Sarah",
              last_name: "Ahmed",
              email: "sarah@company.com",
              department: "Engineering",
              role_id: "software_engineer",
              level_id: "senior",
              location_id: "dubai",
              base_salary: 45000,
              currency: "AED",
            },
          ],
        }, null, 2),
        responseBody: JSON.stringify({
          created: 1,
          updated: 0,
          failed: 0,
          errors: [],
        }, null, 2),
      },
      {
        method: "PATCH",
        path: "/api/v1/employees/:id",
        summary: "Update employee",
        description: "Update a single employee record. Only provided fields will be changed.",
        params: [
          { name: "id", type: "uuid", required: true, description: "Employee ID" },
        ],
        requestBody: JSON.stringify({
          base_salary: 48000,
          level_id: "staff",
        }, null, 2),
        responseBody: JSON.stringify({
          id: "uuid",
          first_name: "Sarah",
          last_name: "Ahmed",
          base_salary: 48000,
          level_id: "staff",
          updated_at: "2026-02-12T10:00:00Z",
        }, null, 2),
      },
    ],
  },
  {
    group: "Benchmarks",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/benchmarks",
        summary: "Query benchmarks",
        description: "Retrieve salary benchmark data filtered by role, level, and location.",
        params: [
          { name: "role_id", type: "string", required: false, description: "Filter by role" },
          { name: "level_id", type: "string", required: false, description: "Filter by level" },
          { name: "location_id", type: "string", required: false, description: "Filter by location" },
        ],
        responseBody: JSON.stringify({
          data: [
            {
              role_id: "software_engineer",
              level_id: "senior",
              location_id: "dubai",
              currency: "AED",
              p10: 30000,
              p25: 35000,
              p50: 42000,
              p75: 50000,
              p90: 60000,
              sample_size: 245,
            },
          ],
        }, null, 2),
      },
      {
        method: "POST",
        path: "/api/v1/benchmarks",
        summary: "Push benchmark data",
        description: "Upload benchmark data points. Existing entries (same role+level+location) will be updated.",
        requestBody: JSON.stringify({
          benchmarks: [
            {
              role_id: "software_engineer",
              level_id: "senior",
              location_id: "dubai",
              currency: "AED",
              p10: 30000,
              p25: 35000,
              p50: 42000,
              p75: 50000,
              p90: 60000,
            },
          ],
        }, null, 2),
        responseBody: JSON.stringify({
          created: 1,
          updated: 0,
        }, null, 2),
      },
    ],
  },
  {
    group: "Compensation History",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/compensation-history",
        summary: "Push compensation changes",
        description: "Record salary changes for employees. Used for trend analysis and audit trails.",
        requestBody: JSON.stringify({
          entries: [
            {
              employee_email: "sarah@company.com",
              effective_date: "2026-01-01",
              base_salary: 48000,
              bonus: 5000,
              currency: "AED",
              change_reason: "annual_review",
              change_percentage: 6.7,
            },
          ],
        }, null, 2),
        responseBody: JSON.stringify({
          created: 1,
          errors: [],
        }, null, 2),
      },
    ],
  },
  {
    group: "Sync Status",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/sync-status",
        summary: "Check integration sync status",
        description: "Returns the current status of all connected integrations and their latest sync results.",
        responseBody: JSON.stringify({
          integrations: [
            {
              provider: "bamboohr",
              status: "connected",
              last_sync_at: "2026-02-12T08:00:00Z",
              last_sync_status: "success",
              records_synced: 150,
            },
          ],
        }, null, 2),
      },
    ],
  },
];

// ============================================================================
// Component
// ============================================================================

export function EndpointReference() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoint((prev) => (prev === key ? null : key));
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPath(key);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-brand-900">API Reference</h3>
        <p className="mt-0.5 text-xs text-brand-500">
          All endpoints use <code className="px-1 py-0.5 bg-brand-50 rounded text-[11px]">Bearer &lt;api_key&gt;</code> authentication.
          Base URL: <code className="px-1 py-0.5 bg-brand-50 rounded text-[11px]">https://api.qeemly.com</code>
        </p>
      </div>

      {ENDPOINTS.map((group) => (
        <div key={group.group} className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-500">
            {group.group}
          </h4>

          <div className="space-y-1.5">
            {group.endpoints.map((endpoint) => {
              const key = `${endpoint.method}-${endpoint.path}`;
              const isExpanded = expandedEndpoint === key;
              const methodStyle = METHOD_COLORS[endpoint.method];

              return (
                <div
                  key={key}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  {/* Endpoint Header */}
                  <button
                    type="button"
                    onClick={() => toggleEndpoint(key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-50/50 transition-colors"
                  >
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold",
                        methodStyle.bg,
                        methodStyle.text
                      )}
                    >
                      {endpoint.method}
                    </span>
                    <code className="flex-1 text-xs font-mono text-brand-700">
                      {endpoint.path}
                    </code>
                    <span className="text-xs text-brand-500 hidden sm:inline">
                      {endpoint.summary}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-brand-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-brand-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-border bg-brand-50/20 px-4 py-4 space-y-4">
                      <p className="text-xs text-brand-700">{endpoint.description}</p>

                      {/* Parameters */}
                      {endpoint.params && endpoint.params.length > 0 && (
                        <div>
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-2">
                            Parameters
                          </h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-1.5 pr-4 font-semibold text-brand-700">Name</th>
                                  <th className="text-left py-1.5 pr-4 font-semibold text-brand-700">Type</th>
                                  <th className="text-left py-1.5 pr-4 font-semibold text-brand-700">Required</th>
                                  <th className="text-left py-1.5 font-semibold text-brand-700">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.params.map((param) => (
                                  <tr key={param.name} className="border-b border-border/50">
                                    <td className="py-1.5 pr-4">
                                      <code className="text-[11px] font-mono text-brand-800">{param.name}</code>
                                    </td>
                                    <td className="py-1.5 pr-4 text-brand-500">{param.type}</td>
                                    <td className="py-1.5 pr-4">
                                      {param.required ? (
                                        <span className="text-red-500 font-semibold">Yes</span>
                                      ) : (
                                        <span className="text-brand-400">No</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 text-brand-600">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {endpoint.requestBody && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
                              Request Body
                            </h5>
                            <button
                              onClick={() => handleCopy(endpoint.requestBody!, `req-${key}`)}
                              className="text-brand-400 hover:text-brand-600"
                            >
                              {copiedPath === `req-${key}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <pre className="rounded-lg bg-brand-900 p-3 text-[11px] font-mono text-brand-100 overflow-x-auto leading-relaxed">
                            {endpoint.requestBody}
                          </pre>
                        </div>
                      )}

                      {/* Response */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
                            Response
                          </h5>
                          <button
                            onClick={() => handleCopy(endpoint.responseBody, `res-${key}`)}
                            className="text-brand-400 hover:text-brand-600"
                          >
                            {copiedPath === `res-${key}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <pre className="rounded-lg bg-brand-900 p-3 text-[11px] font-mono text-brand-100 overflow-x-auto leading-relaxed">
                          {endpoint.responseBody}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
