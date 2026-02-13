import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Skip middleware if env vars are not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Create response early
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
      }
    );

    // refreshing the auth token
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/register") &&
      !request.nextUrl.pathname.startsWith("/auth") &&
      request.nextUrl.pathname.startsWith("/dashboard")
    ) {
      // no user, redirect to login page
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    // If there's any error with auth, just continue without blocking
    console.error("Middleware auth error:", error);
    return NextResponse.next();
  }
}
