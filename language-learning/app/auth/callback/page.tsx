// app/auth/callback/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the code and other params from the URL
      const code = searchParams.get("code");
      
      if (code) {
        try {
          // Exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }

          // Successfully authenticated, redirect to dashboard
          router.push("/dashboard");
          router.refresh();
        } catch (e) {
          const msg = e instanceof Error ? e.message : "An unexpected error occurred";
          setError(msg);
        }
      } else {
        // Check if user is already authenticated (in case of direct navigation)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setError("No authorization code received");
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <main className="mx-auto max-w-lg p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="w-full">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Authentication Error</h1>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push("/auth/signin")}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6 bg-white min-h-screen flex items-center justify-center">
      <div className="w-full text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
        <p className="mt-4 text-sm text-zinc-600">Completing sign in...</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg p-6 bg-white min-h-screen flex items-center justify-center">
          <div className="w-full text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
            <p className="mt-4 text-sm text-zinc-600">Loading...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
