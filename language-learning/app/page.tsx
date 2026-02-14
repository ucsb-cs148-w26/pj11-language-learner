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
    <div className={`${bodyFont.className} min-h-[calc(100dvh-80px)] w-full flex items-center justify-center bg-white px-6`}>
      <div className="w-full max-w-3xl border-2 border-dashed flex flex-col items-center text-center border-blue-200 rounded-2xl p-10 bg-cyan-50/20">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-6">
            Language Learner
          </h1>

          <p className="text-lg text-blue-900/90 leading-8 mb-10">
              Find a language partner at UCSB<br />
              Learn from each other<br />
              Chat and stay motivated together <br />
              Natural, fun, and low-pressure practice
          </p>

          <div className="flex justify-center"></div>
          <Link
            href="/auth/signin"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="rounded-xl bg-black text-white font-bold text-xl px-6 py-3 transition hover:-translate-y-1 hover:shadow-xl"
          >
            Sign in
          </Link>
      </div>
    </div>
  );
}