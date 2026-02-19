"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useEffect, useState, Suspense } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

function HeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isNewUserOnboarding = searchParams.get("new") === "true";

  const links = [
    { href: "/profile", label: "Profile" },
    { href: "/chats", label: "Chats" },
    { href: "/discover", label: "Discover" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  useEffect(() => {
    // 1) Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    // 2) Listen for auth changes (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
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
    <nav className="w-full h-16 bg-white border-b shadow-sm">
      <div className="mx-auto w-full h-full px-8 pt-4 pb-1 flex items-end gap-8 text-base justify-between">
        {/* placeholder for logo */}
        <div className="pb-1.4 flex item-center"> 
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500 group-hover:text-sky-600 transition-colors">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>
        {isNewUserOnboarding ? (
        <div className="flex w-full self-center gap-3 rounded-lg bg-sky-100 px-4 py-2 text-sm text-zinc-600 border border-zinc-200">
          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Please complete your profile information to begin!</span>
        </div>
      ) : (
        <div className="flex w-full gap-6 text-base justify-start">
          {navItems.map(({ href, label }: { href: string; label: string }) => {
            const active = pathname === href || (pathname === "/" && href === "/dashboard");

            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`relative group transition ${
                  active
                    ? "font-semibold text-sky-700"
                    : "text-gray-700 hover:text-sky-600"
                }`}
              >
                {label}

                {/* Active underline */}
                {active && (
                  <span className="absolute left-1/2 -bottom-1 h-[2px] w-[60%] -translate-x-1/2 bg-sky-700 rounded-full"></span>
                )}

                {/* Hover underline */}
                {!active && (
                  <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-sky-500 transition-all duration-300 group-hover:w-full"></span>
                )}
              </Link>
            );
          })}
        </div> 
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
