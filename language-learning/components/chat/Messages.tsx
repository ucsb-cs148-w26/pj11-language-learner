// Combines all message bubbles in a chat.
// Made for ChatRightPanel.tsx.

"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

export type ChatMessage = {
  id: string;
  sender: "me" | "partner";
  text: string;
  sentAt: string; // ISO string
};

type MessagesProps = {
  messages: ChatMessage[];
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  myNativeLanguage: string | null;
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
}: MessagesProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const sorted = [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sorted.length]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function handleSpeak(messageId: string, text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not supported in this browser.");
      return;
    }

    const synth = window.speechSynthesis;

    if (speakingMessageId === messageId && synth.speaking) {
      synth.cancel();
      setSpeakingMessageId(null);
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {setSpeakingMessageId(messageId);};
    utterance.onend = () => {setSpeakingMessageId((current) => (current === messageId ? null : current));};
    utterance.onerror = () => {setSpeakingMessageId((current) => (current === messageId ? null : current));};
    synth.speak(utterance);
  }

  let lastDay: string | null = null;

  return (
    <div className="space-y-3">
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
          <div key={m.id}>
            {showDivider ? <DateDivider label={formatDateLabel(d)} /> : null}

            <MessageBubble
              messageId={m.id}
              text={m.text}
              isMe={m.sender === "me"}
              time={showTime ? formatTimeLabel(d) : undefined}
              partnerFirstName={partnerFirstName}
              partnerLastName={partnerLastName}
              partnerAvatarUrl={partnerAvatarUrl}
              myNativeLanguage={myNativeLanguage}
              isSpeaking={speakingMessageId === m.id}
              onSpeak={() => handleSpeak(m.id, m.text)}
            />
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
