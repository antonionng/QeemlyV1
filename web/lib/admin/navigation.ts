import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  Database,
  FolderInput,
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
        href: "/admin/intake",
        label: "Data Intake",
        icon: FolderInput,
        description: "Manual uploads, automated sources, and recent activity",
      },
      {
        href: "/admin/market",
        label: "Market Overview",
        icon: Database,
        description: "Live coverage, freshness, benchmarks, and advanced controls",
      },
    ],
  },
];

export const LEGACY_ADMIN_ROUTE_REDIRECTS: Record<string, string> = {
  "/admin/insights": "/admin",
  "/admin/pipeline": "/admin/market",
};
