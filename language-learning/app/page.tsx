"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Nunito } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import DashboardPage from "./dashboard/page";
import Image from "next/image";
import logo from "./logo.png";

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
    <div className={`${bodyFont.className} min-h-[calc(100dvh-80px)] w-full flex items-start justify-center bg-background px-6 pt-10`} >
      <div className="w-full max-w-5xl border-2 border-dashed flex flex-col items-center text-center border-blue-soft rounded-2xl p-20 bg-blue-soft/20">
          <h1 className="text-4xl font-extrabold text-blue-dark mb-10">
            Lingo Connect
          </h1>

          <p className="text-lg text-gray-text leading-8 mb-18">
            Set up your profile first<br />
            Get matched with a UCSB partner by target language and proficiency level<br />
            Chat and stay motivated together<br />
            Try tools like translation and text-to-speech
          </p>

          <Link
            href="/auth/signin"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="rounded-xl bg-blue text-white font-bold text-xl px-5 py-2 transition hover:bg-blue-dark hover:-translate-y-1 hover:shadow-xl"
          >
            Sign in
          </Link>
      </div>
    </div>
  );
}