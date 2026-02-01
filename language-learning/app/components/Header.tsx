"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
    !loading && session
      ? links
      : !loading
        ? [
            { href: "/login", label: "Log in" },
            { href: "/signup", label: "Sign up" },
          ]
        : [];
  

  return (
    <nav className="w-full border-b bg-white shadow-sm mb-10">
      <div className="mx-auto max-w-5xl px-8 py-5 flex gap-10 text-lg justify-center">
        {navItems.map(({ href, label }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`relative group transition ${
                active
                  ? "font-semibold text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {label}

              {/* Active underline */}
              {active && (
                <span className="absolute left-1/2 -bottom-1 h-[2px] w-[60%] -translate-x-1/2 bg-blue-600 rounded-full"></span>
              )}

              {/* Hover underline */}
              {!active && (
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
