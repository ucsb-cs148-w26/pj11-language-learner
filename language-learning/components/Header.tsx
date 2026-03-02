"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "./ThemeToggle";

type UserProfile = {
  profilePicture: string;
};

function HeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const isNewUserOnboarding = searchParams.get("new") === "true";

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/chats", label: "Chats" },
    { href: "/discover", label: "Discover" },
    { href: "/friends", label: "Friends" },
  ];

  useEffect(() => {
    const getProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("profilePicture")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setUserProfile(data);
      } else {
        setUserProfile(null);
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session ?? null;
      setSession(currentSession);

      if (currentSession?.user) {
        getProfile(currentSession.user.id);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          getProfile(newSession.user.id);
        } else {
          setUserProfile(null);
        }

        setLoading(false);
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  const navItems =
    isNewUserOnboarding || loading
      ? []
      : session
      ? links
      : [{ href: "/auth/signin", label: "Sign in" }];

  return (
    <nav className="w-full bg-white border-b border-gray-border shadow-sm">
      <div className="mx-auto w-full h-full px-8 pt-3 pb-1.5 flex items-center text-lg justify-between">
        {/* Logo */}
        <div className="flex items-center">
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
          <div className="flex w-full mx-6 self-center gap-3 rounded-lg bg-blue-soft px-3.5 py-2 text-sm text-gray-muted border border-gray-border-soft">
            <svg
              className="h-4 w-4 text-gray-muted-2 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">
              Please complete your profile information to begin!
            </span>
          </div>
        ) : (
          <div className="flex w-full mx-6 gap-6 text-lg justify-start">
            {navItems.map(({ href, label }) => {
              const active =
                pathname === href || (pathname === "/" && href === "/dashboard");

              return (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className={`relative group transition ${
                    active
                      ? "font-semibold text-blue"
                      : "text-gray-muted hover:text-blue"
                  }`}
                >
                  {label}

                  {/* Active underline */}
                  {active && (
                    <span className="absolute left-1/2 -bottom-3.5 h-[2px] w-[60%] -translate-x-1/2 bg-blue rounded-full"></span>
                  )}

                  {/* Hover underline */}
                  {!active && (
                    <span className="absolute left-0 -bottom-3.5 h-[2px] w-0 bg-blue transition-all duration-300 group-hover:w-full"></span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side: Theme toggle + profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />

          {!loading && session && (
            <Link href="/profile" className="transition hover:opacity-80">
              {userProfile ? (
                <img
                  src={userProfile.profilePicture}
                  alt="Profile"
                  className="w-[40px] h-[40px] rounded-full object-cover border-2 border-gray-border-soft"
                />
              ) : (
                <div className="w-[40px] h-[40px] rounded-full bg-gray-soft-2 border-2 border-gray-border-soft flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-muted"
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
            </Link>
          )}
        </div>
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