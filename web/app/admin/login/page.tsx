"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Shield, Mail, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${origin}/auth/callback?next=/admin` },
      });
      if (err) throw err;
      setMessage("Check your email for the login link.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e0e3eb] shadow-sm p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo href={null} />
          </div>

          {/* Admin badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f5f3ff] text-[#5C45FD] text-sm font-medium rounded-full">
              <Shield className="h-4 w-4" />
              Platform Administration
            </span>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[#0f0f1a]">Super Admin Access</h1>
            <p className="text-sm text-[#64748b] mt-1">
              Sign in with an authorized email to continue
            </p>
          </div>

          {/* Error message */}
          {error === "forbidden" && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-700 font-medium">Access denied</p>
              <p className="text-xs text-rose-600 mt-1">
                Your email is not on the super admin allowlist.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0f0f1a] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#e0e3eb] rounded-lg text-[#0f0f1a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#5C45FD]/20 focus:border-[#5C45FD] transition-colors"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#5C45FD] text-white text-sm font-medium rounded-lg hover:bg-[#4c38d4] transition-colors disabled:opacity-50"
            >
              {loading ? (
                "Sending link..."
              ) : (
                <>
                  Send magic link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Success/error message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${message.includes("Check") ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
              <p className={`text-sm ${message.includes("Check") ? "text-emerald-700" : "text-rose-700"}`}>
                {message}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#94a3b8] mt-6">
          Only authorized super admins can access this area.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-pulse text-[#64748b]">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
