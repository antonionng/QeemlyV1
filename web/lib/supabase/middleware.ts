import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
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

    const pathname = request.nextUrl.pathname;
    const isDashboard = pathname.startsWith("/dashboard");
    const isPublic =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/auth");

    if (!user && !isPublic && isDashboard) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Role-based routing for authenticated dashboard users
    if (user && isDashboard) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      const isEmployeeArea = pathname.startsWith("/dashboard/me");

      if (role === "employee" && !isEmployeeArea) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/me";
        return NextResponse.redirect(url);
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
      const allowlist = (process.env.QEEMLY_SUPERADMINS || "ag@experrt.com")
        .split(",")
        .map((e) => e.trim().toLowerCase());
      if (!allowlist.includes(email || "")) {
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
    return NextResponse.next();
  }
}
