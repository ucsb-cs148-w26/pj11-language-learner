"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";

type UserProfile = {
  profilePicture: string | null;
};

// logo color: #0f78c1
// highlight color: #539bcd

function HeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const isNewUserOnboarding = searchParams.get("new") === "true";

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/chats", label: "Chats" },
    { href: "/discover", label: "Discover" },
    { href: "/friends", label: "Friends" },
  ];

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/requests");
        if (res.ok) {
          const body = await res.json();
          setPendingRequestCount(body.incomingRequests?.length ?? 0);
        }
      } catch {
        // ignore
      }
    };

    const getProfile = async () => {
      try {
        const res = await fetch("/api/profile/me");
        if (res.ok) {
          const body = await res.json();
          setUserProfile({ profilePicture: body.profile?.profilePicture ?? null });
        } else {
          setUserProfile(null);
        }
      } catch {
        setUserProfile(null);
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session ?? null;
      setSession(currentSession);
      if (currentSession?.user) {
        getProfile();
        fetchPendingCount();
      } else {
        setUserProfile(null);
        setPendingRequestCount(0);
      }

      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          getProfile();
          fetchPendingCount();
        } else {
          setUserProfile(null);
          setPendingRequestCount(0);
        }

        setLoading(false);
      }
    );

    function handleAvatarChanged() {
      getProfile();
    }

    function handleRequestsChanged() {
      fetchPendingCount();
    }

    window.addEventListener("avatar-changed", handleAvatarChanged);
    window.addEventListener("requests-changed", handleRequestsChanged);

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("avatar-changed", handleAvatarChanged);
      window.removeEventListener("requests-changed", handleRequestsChanged);
    };
  }, []);

  const navItems =
    isNewUserOnboarding || loading
      ? []
      : session
      ? links
      : [{ href: "/auth/signin", label: "Sign in" }];

  return (
    <nav className="w-full bg-white border-b border-gray-border shadow-sm">
      <div className="mx-auto w-full h-full px-4 pt-3 pb-1.5 flex items-center text-lg justify-between">
        {/* Logo */}
        {/* <Link href="/" className="flex items-center"> */}
        <div className="flex items-center">
          <Image 
            src="/lingo.png" 
            alt="App Logo"
            height={60}
            width={120}
            className="h-auto w-[120px] bg-transparent cursor-pointer"
            priority
          />
        </div>
        {/* </Link> */}

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

                  {/* Friend request badge */}
                  {label === "Friends" && pendingRequestCount > 0 && (
                    <span className="absolute -top-1 -right-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                      {pendingRequestCount}
                    </span>
                  )}

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

          {!loading && session && !isNewUserOnboarding && (
            <Link href="/profile" className="transition hover:opacity-80">
              <Avatar
                src={userProfile?.profilePicture}
                alt="Profile"
                size="w-10 h-10"
                iconSize="w-5 h-5"
                imgClassName="border-2 border-gray-border-soft"
              />
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