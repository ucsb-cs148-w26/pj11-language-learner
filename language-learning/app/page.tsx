"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Nunito } from "next/font/google";

// import Header from "../components/Header";
import { supabase } from "@/lib/supabaseClient";
import DashboardPage from "./dashboard/page";

const bodyFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const FONTS = {
  brand: '"Nunito","Quicksand","Baloo 2","Varela Round","system-ui",sans-serif',
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {loading ? null : session ? <DashboardPage /> : <Landing />}
    </>
  );
}

function Landing() {
  const [hover, setHover] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 30,
          fontFamily: FONTS.brand,
          fontSize: 20,
          fontWeight: 900,
          color: "#0b0b0b",
        }}
      >
        ☺︎Language Learner
      </div>

      <div
        className={bodyFont.className}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 64px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 960,
            border: "2px dashed rgba(15, 47, 137, 0.28)",
            borderRadius: 18,
            padding: "36px 28px",
            background: "rgba(12, 255, 255, 0.02)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 700,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <h1
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: "#0f3089ff",
                textAlign: "center",
                margin: "22px 0 30px",
                lineHeight: 1.05,
              }}
            >
              Practice a Language Here
            </h1>

            <p
              style={{
                fontSize: 20,
                color: "rgba(23, 45, 133, 1)",
                textAlign: "center",
                margin: "0 0 48px",
                lineHeight: 2.5,
              }}
            >
              - Find a language partner in UCSB -<br />
              - Match by target language and shared interests -<br />
              - Chat daily and stay motivated together -<br />
              - Make practice feel natural, fun, and low-pressure -
            </p>

            <Link
              href="/auth/signin"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 18px",
                borderRadius: 14,
                background: "#111",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 750,
                fontSize: 24,
                minWidth: 180,
                transition: "all 160ms ease",
                transform: hover ? "translateY(-3px) scale(1.02)" : "none",
                boxShadow: hover
                  ? "0 18px 36px rgba(0,0,0,0.22)"
                  : "0 12px 28px rgba(0,0,0,0.14)",
                filter: hover ? "brightness(1.03)" : "none",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}