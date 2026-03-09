// Combines all message bubbles in a chat.
// Made for ChatRightPanel.tsx.

"use client";

import { useEffect, useRef, useState } from "react";
import { detectAll } from "tinyld/light";
import MessageBubble from "./MessageBubble";

// Maps lowercase display language names (as stored in the DB) to ISO 639-1 codes
const LANG_NAME_TO_ISO639: Record<string, string> = {
  english: "en", spanish: "es", french: "fr", german: "de", portuguese: "pt",
  italian: "it", dutch: "nl", polish: "pl", swedish: "sv", norwegian: "no",
  danish: "da", finnish: "fi", turkish: "tr", romanian: "ro", czech: "cs",
  slovak: "sk", hungarian: "hu", japanese: "ja", chinese: "zh", korean: "ko",
  arabic: "ar", russian: "ru", hindi: "hi", bengali: "bn", vietnamese: "vi",
  thai: "th", catalan: "ca", hebrew: "he", greek: "el", ukrainian: "uk",
  croatian: "hr", serbian: "sr", bulgarian: "bg", latvian: "lv", lithuanian: "lt",
  estonian: "et", slovenian: "sl", malay: "ms", indonesian: "id", tagalog: "tl",
  swahili: "sw", persian: "fa", farsi: "fa", urdu: "ur", mandarin: "zh",
  "mandarin chinese": "zh", "portuguese (brazil)": "pt", "portuguese (portugal)": "pt",
};

// Maps ISO 639-1 codes to BCP-47 language tags for SpeechSynthesis
const ISO639_TO_BCP47: Record<string, string> = {
  en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-PT",
  it: "it-IT", nl: "nl-NL", pl: "pl-PL", sv: "sv-SE", no: "nb-NO",
  da: "da-DK", fi: "fi-FI", tr: "tr-TR", ro: "ro-RO", cs: "cs-CZ",
  sk: "sk-SK", hu: "hu-HU", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR",
  ar: "ar-SA", ru: "ru-RU", hi: "hi-IN", bn: "bn-BD", vi: "vi-VN",
  th: "th-TH", ca: "ca-ES", he: "he-IL", el: "el-GR", uk: "uk-UA",
  hr: "hr-HR", sr: "sr-RS", bg: "bg-BG", lv: "lv-LV", lt: "lt-LT",
  et: "et-EE", sl: "sl-SI", ms: "ms-MY", id: "id-ID", tl: "tl-PH",
  sw: "sw-KE", fa: "fa-IR", ur: "ur-PK",
};

export type ChatMessage = {
  id: string;
  sender: "me" | "partner";
  content?: string;
  text?: string; // backward compatibility
  type?: "text" | "voice";
  sentAt: string;
};

type MessagesProps = {
  messages: ChatMessage[];
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  myNativeLanguage: string | null;
  targetLanguages: string[];
};

function dateKey(d: Date) {
  // Bucket by local calendar day
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDateLabel(d: Date) {
  // Example: "Jan 21, 2026"
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function formatTimeLabel(d: Date) {
  // Example: "3:41 PM"
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function minutesBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-border-soft" />
      <div className="rounded-full bg-gray-soft-2 px-3 py-1 text-xs font-medium text-gray-muted">
        {label}
      </div>
      <div className="h-px flex-1 bg-gray-border-soft" />
    </div>
  );
}

export default function Messages({
  messages,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  myNativeLanguage,
  targetLanguages,
}: MessagesProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speakError, setSpeakError] = useState<{ messageId: string; message: string } | null>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const normalized = messages.map((m) => {
    const content =
      (typeof m.content === "string" && m.content) ||
      (typeof m.text === "string" && m.text) ||
      "";

    const type: "text" | "voice" =
      m.type === "voice" || m.type === "text"
        ? m.type
        : /^https?:\/\//i.test(content)
          ? "voice"
          : "text";

    return { ...m, content, type };
  });

  const sorted = [...normalized].sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sorted.length, sorted[sorted.length - 1]?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    function loadVoices() {
      const v = synth.getVoices();
      if (v.length > 0) voicesRef.current = v;
    }
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      synth.cancel();
    };
  }, []);

  function hasVoiceFor(langTag: string): boolean {
    const voices = voicesRef.current;
    if (voices.length === 0) return true; // not loaded yet, proceed and let timeout handle it
    const prefix = langTag.split("-")[0];
    return voices.some(v => v.lang === langTag || v.lang.startsWith(prefix + "-") || v.lang === prefix);
  }

  type LangDetectResult =
    | { tag: string; kind: "detected" }
    | { tag: string; kind: "too_short" }
    | { tag: string; kind: "undetermined" };

  // Convert hint language display names (e.g. "Spanish") to ISO 639-1 codes (e.g. "es")
  function hintIsoCodes(): string[] {
    const names = [
      ...(myNativeLanguage ? [myNativeLanguage] : []),
      ...targetLanguages,
    ];
    return names
      .map((n) => LANG_NAME_TO_ISO639[n.toLowerCase().trim()])
      .filter((code): code is string => !!code);
  }

  function detectLangTag(text: string): LangDetectResult {
    // Fast Unicode checks for scripts with distinct character ranges
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return { tag: "ja-JP", kind: "detected" };
    if (/[\uAC00-\uD7A3]/.test(text)) return { tag: "ko-KR", kind: "detected" };
    if (/[\u4E00-\u9FFF]/.test(text)) return { tag: "zh-CN", kind: "detected" };
    if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return { tag: "ar-SA", kind: "detected" };
    if (/[\u0400-\u04FF]/.test(text)) return { tag: "ru-RU", kind: "detected" };

    const trimmed = text.trim();
    if (trimmed.length < 10) return { tag: "en-US", kind: "too_short" };

    const results = detectAll(trimmed);
    if (results.length === 0) return { tag: "en-US", kind: "undetermined" };

    const top = results[0];

    // Prefer a hint language if it appears in results with >= 50% of the top accuracy.
    // This biases toward known languages without overriding a confident detection.
    const hints = new Set(hintIsoCodes());
    if (hints.size > 0) {
      const hintMatch = results.find((r) => hints.has(r.lang));
      if (hintMatch && hintMatch.accuracy >= top.accuracy * 0.5) {
        const tag = ISO639_TO_BCP47[hintMatch.lang];
        if (tag) return { tag, kind: "detected" };
      }
    }

    const tag = ISO639_TO_BCP47[top.lang];
    if (tag) return { tag, kind: "detected" };
    return { tag: "en-US", kind: "undetermined" };
  }

  function setErr(messageId: string, message: string) {
    setSpeakError({ messageId, message });
  }

  function handleSpeak(messageId: string, text: string, type: "text" | "voice") {
    if (type === "voice") return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setErr(messageId, "Your browser doesn't support text-to-speech.");
      return;
    }

    const synth = window.speechSynthesis;

    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    if (speakingMessageId === messageId && synth.speaking) {
      synth.cancel();
      setSpeakingMessageId(null);
      setSpeakError(null);
      return;
    }

    synth.cancel();
    setSpeakError(null);

    const result = detectLangTag(text);

    if (result.kind === "too_short") {
      setErr(messageId, "Message is too short to detect language.");
      return;
    }

    if (result.kind === "undetermined") {
      setErr(messageId, "Language could not be identified.");
      return;
    }

    // result.kind === "detected"
    if (!hasVoiceFor(result.tag)) {
      const langName = new Intl.DisplayNames(["en"], { type: "language" }).of(result.tag) ?? result.tag;
      setErr(messageId, `Language detected: ${langName}, no matching voice installed.`);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = result.tag;

    let started = false;
    utterance.onstart = () => {
      started = true;
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      setSpeakingMessageId(messageId);
    };
    utterance.onend = () => { setSpeakingMessageId((current) => (current === messageId ? null : current)); };
    utterance.onerror = (event) => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      setSpeakingMessageId((current) => (current === messageId ? null : current));
      if (event.error !== "canceled" && event.error !== "interrupted") {
        setErr(messageId, "Speech failed.");
      }
    };
    synth.speak(utterance);

    speakTimeoutRef.current = setTimeout(() => {
      speakTimeoutRef.current = null;
      if (!started) {
        setErr(messageId, "Voice unavailable (may not be installed).");
        setSpeakingMessageId((current) => (current === messageId ? null : current));
      }
    }, 750);
  }

  let lastDay: string | null = null;

  return (
    <div className="w-full space-y-3">
      {sorted.map((m, idx) => {
        const d = new Date(m.sentAt);
        const day = dateKey(d);

        const showDivider = day !== lastDay;
        if (showDivider) lastDay = day;

        const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
        let showTime = true;

        if (!showDivider && next) {
          const nextDate = new Date(next.sentAt);
          const sameSender = next.sender === m.sender;
          const withinFiveMinutes = minutesBetween(nextDate, d) <= 5;

          if (sameSender && withinFiveMinutes) {
            showTime = false;
          }
        }

        return (
          <div key={m.id} className="w-full">
            {showDivider ? <DateDivider label={formatDateLabel(d)} /> : null}

            <MessageBubble
              messageId={m.id}
              content={m.content}
              type={m.type}
              isMe={m.sender === "me"}
              time={showTime ? formatTimeLabel(d) : undefined}
              partnerFirstName={partnerFirstName}
              partnerLastName={partnerLastName}
              partnerAvatarUrl={partnerAvatarUrl}
              myNativeLanguage={myNativeLanguage}
              isSpeaking={speakingMessageId === m.id}
              speakError={speakError?.messageId === m.id ? speakError.message : null}
              onSpeak={m.type === "text" ? () => handleSpeak(m.id, m.content, m.type) : undefined}
            />
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
