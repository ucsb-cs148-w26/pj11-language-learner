"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Nunito } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import DashboardPage from "./dashboard/page";
import Image from "next/image";
import React from "react";

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
  return (
    <div className={`${bodyFont.className} min-h-[calc(100dvh-80px)] w-full bg-background`}>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-14 pb-14">
        <Image
          src="/logov2.png"
          alt="Lingo Connect logo"
          width={300}
          height={300}
          className="mb-6 drop-shadow-md"
          priority
        />

        <p className="text-lg text-gray-muted max-w-xl leading-relaxed pt-8 mb-8">
          The easiest way to find a language partner at UCSB, practice,
          and make friends along the way.
        </p>

        <Link
          href="/auth/signin"
          className="rounded-xl bg-blue text-white font-bold text-base px-7 py-3 transition hover:bg-blue-dark hover:-translate-y-0.5 hover:shadow-lg"
        >
          Get started
        </Link>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-4xl px-6">
        <div className="h-px bg-gray-border-soft" />
      </div>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title="Find a partner"
          body="Connect with fellow learners studying the same language, at the same level. Learn together, stay accountable, and grow faster."
        />

        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4 4 4" />
              <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
            </svg>
          }
          title="Language exchange"
          body="Practice with a fluent speaker in the language you are learning. Or, assist someone learning a language you are fluent in."
        />

        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8l6 6" />
              <path d="M4 14l6-6 2-3" />
              <path d="M2 5h12" />
              <path d="M7 2h1" />
              <path d="M22 22l-5-10-5 10" />
              <path d="M14 18h6" />
            </svg>
          }
          title="Instant translation"
          body="Instantly see messages translated into your native language, so nothing gets lost in conversation."
        />

        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          }
          title="Text to speech"
          body="Hear messages read aloud. Train your ear on natural pronunciation."
        />

        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
            </svg>
          }
          title="AI Tutor"
          body="Get instant grammar feedback on your messages from an AI language tutor."
        />

        <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12c2.5-3 5.2-4.5 8-4.5s5.5 1.5 8 4.5c-2.5 3-5.2 4.5-8 4.5S6.5 15 4 12Z" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          }
          title="Phonetics"
          body="See a pronunciation guide for the language you are learning in every message sent."
        />

        {/* <FeatureCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          }
          title="Make friends"
          body="Language learning is more fun with friends. Chat, learn, and get to know other UCSB students."
        /> */}

      </section>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-border-soft bg-gray-soft-2 px-5 py-5 flex flex-col gap-3 hover:shadow-sm transition">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-soft text-blue">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-text text-base mb-1">{title}</h3>
        <p className="text-sm text-gray-muted leading-relaxed">{body}</p>
      </div>
    </div>
  );
}