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
      // Check for OAuth errors in BOTH query params and hash params
      // Supabase can return errors in either location
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      
      // Check query params for errors first
      const errorFromQuery = searchParams.get("error");
      const errorDescFromQuery = searchParams.get("error_description");
      const errorCodeFromQuery = searchParams.get("error_code");
      
      // Check hash params for errors
      let errorFromHash: string | null = null;
      let errorDescFromHash: string | null = null;
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace("#", ""));
        errorFromHash = hashParams.get("error");
        errorDescFromHash = hashParams.get("error_description");
      }
      
      // Use error from query params if available, otherwise from hash
      const err = errorFromQuery || errorFromHash;
      const desc = errorDescFromQuery || errorDescFromHash;
      
      if (err) {
        console.warn("OAuth error detected:", { err, desc, errorCodeFromQuery });
        
        // If it's a database error during user creation, there might be a trigger failing
        // When this happens, Supabase aborts the entire OAuth flow, so no user is created
        // We need to show a clear error message
        if (err === "server_error" && desc?.includes("Database error saving new user")) {
          console.error("Database error during user creation - OAuth flow was aborted");
          console.error("The database trigger on auth.users is failing, preventing user creation");
          console.error("Please check your Supabase database triggers and fix the issue");
          
          setError(
            "Database error during user creation. " +
            "A database trigger on the auth.users table is failing, which prevents new users from being created. " +
            "Please check your Supabase database triggers and ensure they're working correctly. " +
            "See DATABASE_TRIGGER_GUIDE.md for help fixing this issue."
          );
          return;
        } else {
          // For other errors, show them to the user
          const errorMessage = `${err}${desc ? `: ${decodeURIComponent(desc)}` : ""}`;
          setError(errorMessage);
          return;
        }
      }

      // With detectSessionInUrl: true, Supabase automatically handles PKCE flow
      // Check for code in both query params and hash (PKCE can use either)
      const codeFromQuery = searchParams.get("code");
      let codeFromHash: string | null = null;
      let accessTokenFromHash: string | null = null;
      
      // Reuse hash from above, parse it for code and access_token
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace("#", ""));
        codeFromHash = hashParams.get("code");
        accessTokenFromHash = hashParams.get("access_token");
      }
      
      const code = codeFromQuery || codeFromHash;
      
      // If we have an access_token in hash, Supabase might have already processed it
      // Try to get session immediately
      if (accessTokenFromHash && !code) {
        console.log("Found access_token in hash, Supabase should have processed it");
      }
      
      // Log for debugging
      console.log("Callback URL params:", {
        hasQueryCode: !!codeFromQuery,
        hasHashCode: !!codeFromHash,
        hasHash: !!hash,
        hash: hash.substring(0, 100), // First 100 chars for debugging
        searchParams: Array.from(searchParams.entries()),
      });

      // Wait for Supabase to process the URL (PKCE flow needs time to exchange)
      // Try multiple times with increasing delays
      let session = null;
      let sessionError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
        const result = await supabase.auth.getSession();
        session = result.data.session;
        sessionError = result.error;
        
        if (session) {
          console.log(`Session found on attempt ${attempt + 1}`);
          break;
        }
        
        if (sessionError) {
          console.warn(`Session error on attempt ${attempt + 1}:`, sessionError);
        }
      }

      try {
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          // If we have a code, try manual exchange
          if (code) {
            console.log("No session found, attempting manual code exchange");
            const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error("Code exchange error:", exchangeError);
              setError(exchangeError.message || "Failed to exchange code for session");
              return;
            }
            
            if (!sessionData.session) {
              console.error("Code exchange succeeded but no session returned");
              setError("Failed to establish session after code exchange");
              return;
            }
            
            console.log("Session established via manual exchange");
            // Session should now be set, continue below
          } else {
            // No code and no session - check if user might already be authenticated
            // or if this is a direct navigation
            const currentUrl = typeof window !== "undefined" ? window.location.href : "N/A";
            console.error("No session and no authorization code found");
            console.error("Full URL:", currentUrl);
            console.error("Query params:", Array.from(searchParams.entries()));
            console.error("Hash:", hash.substring(0, 200));
            
            // Try one more time to get user (in case session exists but getSession failed)
            const { data: { user: finalUserCheck } } = await supabase.auth.getUser();
            if (finalUserCheck) {
              console.log("User found via getUser(), redirecting to dashboard");
              router.push("/dashboard");
              router.refresh();
              return;
            }
            
            setError(
              "No session found and no authorization code received. " +
              "This might be a redirect URL mismatch. " +
              "Please check that your Supabase redirect URL matches: " +
              (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "/auth/callback") +
              "\n\nCheck your browser console for detailed URL information."
            );
            return;
          }
        } else {
          console.log("Session found automatically");
        }

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError("Failed to get user information");
          return;
        }

        console.log("Authenticated user:", user.id, user.email);

        // Check if profile exists, create if it doesn't
        const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error when no row exists

        console.log("Profile check result:", { existingProfile, profileCheckError });

        // If profile doesn't exist, create one using upsert (safer than insert)
        if (!existingProfile) {
          console.log("No profile found, creating new profile for user:", user.id);
          const profileData = {
            user_id: user.id,
            email: user.email || null,
            updated_at: new Date().toISOString()
          };
          console.log("Attempting to insert profile:", profileData);
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select();

          if (createError) {
            console.error("Failed to create profile - Full error:", createError);
            console.error("Error code:", createError.code);
            console.error("Error message:", createError.message);
            console.error("Error details:", createError.details);
            console.error("Error hint:", createError.hint);
            // Show error to user so they know something went wrong
            setError(`Failed to create profile: ${createError.message} (Code: ${createError.code}). This might be a permissions issue. Please check your Supabase RLS policies or try editing your profile manually.`);
            return;
          }
          
          if (!newProfile || newProfile.length === 0) {
            console.error("Profile insert returned no data - this might indicate an RLS policy issue");
            setError("Profile creation may have failed. Please check your Supabase dashboard or try editing your profile. This is likely an RLS (Row Level Security) policy issue.");
            return;
          }
          
          console.log("Profile created successfully:", newProfile);
          
          // Verify the profile was actually created by querying it back
          const { data: verifyProfile, error: verifyError } = await supabase
            .from('profiles')
            .select('user_id, email, level')
            .eq('user_id', user.id)
            .single();
          
          if (verifyError || !verifyProfile) {
            console.error("Profile verification failed:", verifyError);
            console.error("This suggests the profile was not actually created, likely due to RLS policies");
            setError("Profile creation verification failed. The profile may not have been created due to Row Level Security (RLS) policies. Please check your Supabase RLS policies for the 'profiles' table.");
            return;
          }
          
          console.log("Profile verified successfully:", verifyProfile);
        } else {
          console.log("Profile already exists:", existingProfile);
        }
        
        // check need for onboarding setup redirect
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              user_id, 
              first_name, 
              native_language, 
              profile_target_languages!inner(language_id)
              `)
            .eq('user_id', user.id)
            .maybeSingle();
        
        const hasTL = profile?.profile_target_languages && profile.profile_target_languages.length > 0;
        const needsOnboarding = !hasTL || !profile?.first_name || !profile?.native_language;

        if (needsOnboarding) {
          console.log("Redirecting to onboarding...");
          router.push("/profile/edit?new=true");
        } else {
          console.log("Redirecting to dashboard");
          router.push("/dashboard");
        }
        router.refresh();

      } catch (e) {
        const msg = e instanceof Error ? e.message : "An unexpected error occurred";
        setError(msg);
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  if (error) {
    const isDatabaseError = error.includes("Database error") || error.includes("database trigger");
    return (
      <main className="mx-auto max-w-lg p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="w-full">
          <div className="rounded-2xl border border-dark-red/20 bg-light-red p-6">
            <h1 className="text-xl font-semibold text-dark-red mb-2">Authentication Error</h1>
            <p className="text-sm text-dark-red mb-4 whitespace-pre-line">{error}</p>
            {isDatabaseError && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">How to fix:</p>
                <ol className="text-xs text-yellow-700 space-y-2 list-decimal list-inside">
                  <li>Go to your Supabase Dashboard → Database → Triggers</li>
                  <li>Check for triggers on the <code className="bg-yellow-100 px-1 rounded">auth.users</code> table</li>
                  <li>Review the trigger function code for errors</li>
                  <li>Check RLS policies that might be blocking the trigger</li>
                  <li>See <code className="bg-yellow-100 px-1 rounded">DATABASE_TRIGGER_GUIDE.md</code> for detailed help</li>
                  <li>Or run <code className="bg-yellow-100 px-1 rounded">supabase_fix_trigger.sql</code> in your SQL Editor</li>
                </ol>
                <p className="text-xs text-yellow-700 mt-3">
                  <strong>Note:</strong> Until the trigger is fixed, new users cannot be created via OAuth.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/auth/signin")}
                className="flex-1 rounded-xl bg-dark-red px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full p-6 bg-white min-h-screen flex items-center justify-center">
      <div className="w-full text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-text"></div>
        <p className="mt-4 text-sm text-gray-muted">Completing sign in...</p>
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-text"></div>
            <p className="mt-4 text-sm text-gray-muted">Loading...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
