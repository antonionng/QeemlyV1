import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin/super-admins";

function redirectForProtectedArea(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !pathname.startsWith("/auth")) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectForProtectedArea(request, pathname);
  }

  const response = NextResponse.next();

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
        global: {
          fetch: (url, options) =>
            Promise.race([
              fetch(url, options),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Supabase auth timeout")), 5000)
              ),
            ]),
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isDashboard = pathname.startsWith("/dashboard");
    const isOnboardingPath =
      pathname === "/onboarding" || pathname.startsWith("/onboarding/");
    const isProtected = isDashboard || isOnboardingPath;
    const isPublic =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/auth");

    if (!user && !isPublic && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Role-based routing for authenticated dashboard users
    if (user && (isDashboard || isOnboardingPath)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, workspace_id")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      const isEmployeeArea = pathname.startsWith("/dashboard/me");

      if (role === "employee" && !isEmployeeArea) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/me";
        return NextResponse.redirect(url);
      }

      const isApiPath = pathname.startsWith("/api");
      const isExemptDashboardPath =
        pathname.startsWith("/dashboard/upload") ||
        pathname.startsWith("/dashboard/benchmarks") ||
        pathname.startsWith("/dashboard/settings");

      const hasSkippedOnboarding = request.cookies.get("onboarding_skipped")?.value === "1";

      if (
        role === "admin" &&
        !isSuperAdminEmail(user.email?.toLowerCase()) &&
        !isOnboardingPath &&
        !isApiPath &&
        !isExemptDashboardPath &&
        !hasSkippedOnboarding &&
        profile?.workspace_id
      ) {
        const { data: workspaceSettings, error: workspaceSettingsError } = await supabase
          .from("workspace_settings")
          .select("onboarding_completed_at, is_configured")
          .eq("workspace_id", profile.workspace_id)
          .maybeSingle();

        if (!workspaceSettingsError) {
          const needsOnboarding =
            workspaceSettings == null ||
            (workspaceSettings.onboarding_completed_at == null &&
              workspaceSettings.is_configured === false);

          if (needsOnboarding) {
            const url = request.nextUrl.clone();
            url.pathname = "/onboarding";
            return NextResponse.redirect(url);
          }
        }
      }
    }

    // Platform admin: /admin requires super-admin allowlist
    const isAdminArea = pathname.startsWith("/admin");
    const isAdminLogin = pathname === "/admin/login";
    if (isAdminArea && !isAdminLogin && !pathname.startsWith("/auth")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
      const email = user.email?.toLowerCase();
      if (!isSuperAdminEmail(email)) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("error", "forbidden");
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (error) {
    console.error("Middleware auth error:", error);
    return redirectForProtectedArea(request, pathname);
  }
}
