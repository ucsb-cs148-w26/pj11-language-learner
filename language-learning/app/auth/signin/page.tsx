// app/auth/signin/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Force dynamic rendering - auth pages shouldn't be prerendered
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
      // Note: User will be redirected to Google, so we don't need to handle success here
    } catch (e) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white w-full flex items-center justify-center">
      <main className="mx-auto max-w-lg p-6 w-full">
        <div className="w-full space-y-6">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Sign In</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in to your account to continue
          </p>
        </header>

        {/* Sign In Form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? "Signing in with Google..." : "Continue with Google"}
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}
