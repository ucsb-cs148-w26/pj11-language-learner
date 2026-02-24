"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

// logo color: #0f78c1
// highlight color: #539bcd

function HeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isNewUserOnboarding = searchParams.get("new") === "true";

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/chats", label: "Chats" },
    { href: "/discover", label: "Discover" },
    { href: "/requests", label: "Requests" },
  ];

  const [userProfile, setUserProfile] = useState<{ profilePicture: string } | null>(null);
  useEffect(() => {
    const getProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles') // Replace with your actual table name
        .select('profilePicture')
        .eq('id', userId)
        .single();
      
      if (data) setUserProfile(data);
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) getProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) getProfile(newSession.user.id);
      else setUserProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const navItems = 
  isNewUserOnboarding || loading
    ? []
      : session
        ? links
        : !loading
          ? [
              { href: "/auth/signin", label: "Sign in" },
            ]
          : [];

  return (
    <nav className="w-full bg-white border-b shadow-sm">
      <div className="mx-auto w-full h-full px-4 pt-3 pb-1.5 flex items-center text-lg justify-between">
        {/* placeholder for logo */}
        <div className="flex shrink-0"> 
          <Image 
            src="/lingo.png" 
            alt="App Logo"
            height={60}
            width={120}
            className="h-auto w-[120px]"
            priority
          />
        </div>
        {isNewUserOnboarding ? (
        <div className="flex w-full mx-6 self-center gap-3 rounded-lg bg-sky-100 px-4 py-2 text-sm text-zinc-600 border border-zinc-200">
          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Please complete your profile information to begin!</span>
        </div>
      ) : (
        <div className="flex w-full pt-1 mx-6 gap-6 text-lg justify-start">
          {navItems.map(({ href, label }: { href: string; label: string }) => {
            const active = pathname === href || (pathname === "/" && href === "/dashboard");

            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`relative group transition ${
                  active
                    ? "font-semibold text-brand"
                    : "text-gray-700 hover:text-[#539bcd]"
                }`}
              >
                {label}

                {/* Active underline */}
                {active && (
                  <span className="absolute left-1/2 -bottom-3.5 h-[2px] w-[60%] -translate-x-1/2 bg-brand rounded-full"></span>
                )}

                {/* Hover underline */}
                {!active && (
                  <span className="absolute left-0 -bottom-3.5 h-[2px] w-0 bg-[#539bcd] transition-all duration-300 group-hover:w-full"></span>
                )}
              </Link>
            );
          })}
        </div> 
        )}
        {!isNewUserOnboarding && !loading && session && (
          <Link href="/profile" className="flex-shrink-0 transition hover:opacity-80">
            <div className="justify-end">
              {userProfile ? (
                <img
                  src={userProfile.profilePicture}
                  alt="Profile"
                  className="w-[40px] h-[40px] rounded-full object-cover border-2 border-zinc-200"
                />
              ) : (
                <div className="w-[40px] h-[40px] rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
