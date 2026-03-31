"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import {
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { isFeatureEnabled } from "@/lib/release/ga-scope";

type AuthUser = {
  id: string;
  email?: string | null;
} | null;

type AuthProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
} | null;

type AuthenticatedMenuStatus = "loading" | "signed_out" | "signed_in";

type AuthenticatedMenuModel = {
  status: AuthenticatedMenuStatus;
  user: AuthUser;
  profile: AuthProfile;
  canAccessAdmin: boolean;
  userInitial: string;
  displayName: string;
  handleSignOut: () => Promise<void>;
};

type AuthenticatedUserMenuProps = {
  variant: "compact" | "marketing";
  dark?: boolean;
};

type AuthenticatedUserMenuContentProps = AuthenticatedUserMenuProps & {
  model: AuthenticatedMenuModel;
};

type AuthenticatedUserMenuMobileItemsProps = {
  model: AuthenticatedMenuModel;
  dark?: boolean;
};

type MenuDefinition = {
  key: string;
  label: string;
  href?: string;
  icon: ReactNode;
  variant?: "default" | "danger";
  onClick?: () => void;
};

async function fetchAdminAccess(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/workspaces/list");
    return response.ok;
  } catch {
    return false;
  }
}

function buildMenuDefinitions(model: AuthenticatedMenuModel, pathname: string | null): MenuDefinition[] {
  const items: MenuDefinition[] = [
    {
      key: "profile",
      label: "Profile",
      href: "/dashboard/profile",
      icon: <User className="h-4 w-4" />,
    },
    {
      key: "settings",
      label: "Account Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  if (isFeatureEnabled("billing")) {
    items.push({
      key: "billing",
      label: "Billing",
      href: "/dashboard/billing",
      icon: <CreditCard className="h-4 w-4" />,
    });
  }

  items.push(
    {
      key: "team",
      label: "Team",
      href: "/dashboard/team",
      icon: <Users className="h-4 w-4" />,
    },
    {
      key: "help",
      label: "Help",
      href: "/help",
      icon: <HelpCircle className="h-4 w-4" />,
    },
  );

  if (model.canAccessAdmin) {
    const isInAdmin = pathname?.startsWith("/admin") ?? false;
    items.push({
      key: "super-admin",
      label: isInAdmin ? "Dashboard" : "Super Admin",
      href: isInAdmin ? "/dashboard" : "/admin",
      icon: <Shield className="h-4 w-4" />,
    });
  }

  items.push({
    key: "sign-out",
    label: "Sign Out",
    icon: <LogOut className="h-4 w-4" />,
    variant: "danger",
    onClick: () => {
      void model.handleSignOut();
    },
  });

  return items;
}

function renderAvatar(model: AuthenticatedMenuModel, className: string) {
  if (model.profile?.avatar_url) {
    return (
      <img
        src={model.profile.avatar_url}
        alt={model.profile.full_name ?? "User avatar"}
        className={clsx(className, "object-cover")}
      />
    );
  }

  return (
    <div className={clsx(className, "items-center justify-center bg-brand-800 text-sm font-semibold text-white")}>
      <span>{model.userInitial}</span>
    </div>
  );
}

export function useAuthenticatedUserMenuModel(): AuthenticatedMenuModel {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [status, setStatus] = useState<AuthenticatedMenuStatus>("loading");
  const [user, setUser] = useState<AuthUser>(null);
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  const hydrateUser = useCallback(
    async (nextUser: AuthUser) => {
      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setCanAccessAdmin(false);
        setStatus("signed_out");
        return;
      }

      setUser(nextUser);
      setStatus("loading");

      const [{ data: nextProfile }, nextCanAccessAdmin] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", nextUser.id).single(),
        fetchAdminAccess(),
      ]);

      setProfile(nextProfile);
      setCanAccessAdmin(nextCanAccessAdmin);
      setStatus("signed_in");
    },
    [supabase],
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const {
          data: { user: nextUser },
        } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (!nextUser) {
          setUser(null);
          setProfile(null);
          setCanAccessAdmin(false);
          setStatus("signed_out");
          return;
        }

        await hydrateUser(nextUser);
      } catch {
        if (!mounted) {
          return;
        }

        setUser(null);
        setProfile(null);
        setCanAccessAdmin(false);
        setStatus("signed_out");
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      const nextUser = session?.user ?? null;
      void hydrateUser(nextUser);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser, supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router, supabase]);

  const fullName = profile?.full_name?.trim();
  const displayName = fullName || "Account";
  const userInitial = (fullName || user?.email || "U").charAt(0).toUpperCase();

  return {
    status,
    user,
    profile,
    canAccessAdmin,
    userInitial,
    displayName,
    handleSignOut,
  };
}

function AuthenticatedUserMenuContent({
  variant,
  dark = false,
  model,
}: AuthenticatedUserMenuContentProps) {
  const pathname = usePathname();

  if (model.status !== "signed_in") {
    return null;
  }

  const menuDefinitions = buildMenuDefinitions(model, pathname);

  return (
    <DropdownMenu
      align="right"
      trigger={
        variant === "compact" ? (
          <div className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full transition-colors hover:bg-brand-700 shrink-0">
            {renderAvatar(model, "flex h-9 w-9 overflow-hidden rounded-full")}
          </div>
        ) : (
          <div
            className={clsx(
              "flex h-14 max-w-[15rem] cursor-pointer items-center gap-3 rounded-full px-3 pr-4 text-left shadow-[0_4px_16px_rgba(17,18,51,0.2)] transition-colors",
              dark
                ? "bg-white/10 text-white ring-1 ring-white/12 hover:bg-white/15"
                : "bg-white text-brand-900 ring-1 ring-brand-100 hover:bg-brand-50",
            )}
          >
            {renderAvatar(model, "flex h-10 w-10 overflow-hidden rounded-full shrink-0")}
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{model.displayName}</span>
            <ChevronDown className={clsx("h-4 w-4 shrink-0", dark ? "text-white/70" : "text-brand-500")} />
          </div>
        )
      }
    >
      <div className="border-b border-border/50 px-4 py-3">
        <div className="font-semibold text-brand-900">{model.displayName}</div>
        {model.user?.email ? <div className="text-xs text-brand-600/80">{model.user.email}</div> : null}
      </div>

      <div className="py-1">
        {menuDefinitions.slice(0, -1).map((item) => (
          <DropdownItem key={item.key} icon={item.icon} href={item.href}>
            {item.label}
          </DropdownItem>
        ))}
      </div>

      <DropdownDivider />

      <DropdownItem
        icon={menuDefinitions[menuDefinitions.length - 1]?.icon}
        variant="danger"
        onClick={menuDefinitions[menuDefinitions.length - 1]?.onClick}
      >
        {menuDefinitions[menuDefinitions.length - 1]?.label}
      </DropdownItem>
    </DropdownMenu>
  );
}

export function AuthenticatedUserMenu({
  variant,
  dark = false,
}: Omit<AuthenticatedUserMenuProps, "model">) {
  const model = useAuthenticatedUserMenuModel();

  return <AuthenticatedUserMenuContent variant={variant} dark={dark} model={model} />;
}

export function AuthenticatedUserMenuFromModel(props: AuthenticatedUserMenuContentProps) {
  return <AuthenticatedUserMenuContent {...props} />;
}

export function AuthenticatedUserMenuMobileItems({
  model,
  dark = false,
}: AuthenticatedUserMenuMobileItemsProps) {
  const pathname = usePathname();
  const menuDefinitions = buildMenuDefinitions(model, pathname);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={clsx(
          "flex items-center gap-3 rounded-[24px] px-4 py-3",
          dark ? "bg-white/5 text-white" : "bg-brand-50 text-brand-900",
        )}
      >
        {renderAvatar(model, "flex h-10 w-10 overflow-hidden rounded-full shrink-0")}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{model.displayName}</div>
          {model.user?.email ? <div className="truncate text-xs opacity-80">{model.user.email}</div> : null}
        </div>
      </div>

      {menuDefinitions.map((item) =>
        item.href ? (
          <Link
            key={item.key}
            href={item.href}
            className={clsx(
              "inline-flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-semibold transition-colors",
              dark
                ? "bg-white/5 text-white hover:bg-white/10"
                : "bg-brand-50 text-brand-900 hover:bg-brand-100",
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center opacity-75">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={clsx(
              "inline-flex items-center gap-3 rounded-[24px] px-4 py-3 text-left text-sm font-semibold transition-colors",
              item.variant === "danger"
                ? dark
                  ? "bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
                : dark
                  ? "bg-white/5 text-white hover:bg-white/10"
                  : "bg-brand-50 text-brand-900 hover:bg-brand-100",
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center opacity-75">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ),
      )}
    </div>
  );
}
