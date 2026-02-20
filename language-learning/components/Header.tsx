"use client";
import Link from "next/link";
import Image from "next/image";
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
    { href: "/requests", label: "Requests" },
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
    <nav className="w-full bg-white border-b shadow-sm">
      <div className="mx-auto w-full h-full px-8 pt-3.5 pb-1 flex items-center text-lg justify-between">
        {/* placeholder for logo */}
        <div className="flex pb-1 item-center"> 
          <Image 
            src="/logo.png" 
            alt="App Logo"
            width={50} 
            height={50}
            className="rounded-full"
            priority
          />
        </div>
        {isNewUserOnboarding ? (
        <div className="flex w-full mx-6 self-center gap-3 rounded-lg bg-sky-100 px-3.5 py-2 text-sm text-zinc-600 border border-zinc-200">
          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Please complete your profile information to begin!</span>
        </div>
      ) : (
        <div className="flex w-full mx-6 gap-6 text-lg justify-start">
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
                  <span className="absolute left-1/2 -bottom-3.5 h-[2px] w-[60%] -translate-x-1/2 bg-sky-700 rounded-full"></span>
                )}

                {/* Hover underline */}
                {!active && (
                  <span className="absolute left-0 -bottom-3.5 h-[2px] w-0 bg-sky-500 transition-all duration-300 group-hover:w-full"></span>
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
