import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileJson,
  FolderInput,
  GitBranch,
  ShieldCheck,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export type AdminNavGroup = {
  heading: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    heading: "Overview",
    items: [
      {
        href: "/admin",
        label: "Platform Overview",
        icon: ShieldCheck,
        description: "Tenant, user, and publish visibility",
      },
    ],
  },
  {
    heading: "Platform Administration",
    items: [
      {
        href: "/admin/tenants",
        label: "Tenants",
        icon: Building2,
        description: "Workspace management and activity",
      },
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        description: "Platform operator and tenant access",
      },
    ],
  },
  {
    heading: "Market Data Workbench",
    items: [
      {
        href: "/admin/workbench",
        label: "Workbench Home",
        icon: Activity,
        description: "Queues, coverage, and next actions",
      },
      {
        href: "/admin/sources",
        label: "Sources",
        icon: Database,
        description: "Source configuration and health",
      },
      {
        href: "/admin/runs",
        label: "Runs",
        icon: GitBranch,
        description: "Ingestion runs and operator controls",
      },
      {
        href: "/admin/inbox",
        label: "Inbox",
        icon: FolderInput,
        description: "Manual CSV and PDF research intake",
      },
      {
        href: "/admin/snapshots",
        label: "Snapshots",
        icon: FileJson,
        description: "Raw source payload staging",
      },
      {
        href: "/admin/review",
        label: "Review & Normalize",
        icon: CheckCircle2,
        description: "Mapping, confidence, and governance",
      },
      {
        href: "/admin/freshness",
        label: "Freshness & Quality",
        icon: Clock3,
        description: "Coverage strength, confidence, and staleness",
      },
      {
        href: "/admin/benchmarks",
        label: "Benchmarks",
        icon: BarChart3,
        description: "Published shared-market benchmark rows",
      },
      {
        href: "/admin/publish",
        label: "Publish",
        icon: ShieldCheck,
        description: "Promote reviewed data into the live market layer",
      },
    ],
  },
];

export const LEGACY_ADMIN_ROUTE_REDIRECTS: Record<string, string> = {
  "/admin/insights": "/admin",
  "/admin/pipeline": "/admin/workbench",
};
