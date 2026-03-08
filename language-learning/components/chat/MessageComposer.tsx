// Where the user types their chat message and sends it.
// Made for ChatRightPanel.tsx.

"use client";

import { useEffect, useRef, useState } from "react";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import VoiceRecorder, { type VoiceRecorderHandle } from "./VoiceRecorder";

const profanityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function censorProfanity(input: string): string {
  const matches = profanityMatcher.getAllMatches(input, true);
  let out = input;

  for (let i = matches.length - 1; i >= 0; i--) {
    const { startIndex, endIndex } = englishDataset.getPayloadWithPhraseMetadata(matches[i]);
    out = out.slice(0, startIndex) + "*".repeat(endIndex - startIndex) + out.slice(endIndex);
  }

  return out;
}

type MessageComposerProps = {
  onSend: (
    content: string,
    type?: "text" | "voice",
    extras?: { voicePath?: string; voiceBucket?: string }
  ) => Promise<void> | void;
  onTypingChange?: (isTyping: boolean) => Promise<void> | void;
  chatId: string;
  userId: string;
};

export default function MessageComposer({ onSend, onTypingChange, chatId, userId }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [suppressDisabledStyle, setSuppressDisabledStyle] = useState(false);
  const [hasVoiceDraft, setHasVoiceDraft] = useState(false);

  const voiceRecorderRef = useRef<VoiceRecorderHandle | null>(null);

  const canSendText = text.trim().length > 0;
  const canSend = canSendText || hasVoiceDraft;

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  function clearTypingTimeout() {
    if (!typingTimeoutRef.current) return;

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
  }

  function emitTyping(isTyping: boolean) {
    if (isTypingRef.current === isTyping) return;

    isTypingRef.current = isTyping;
    void onTypingChange?.(isTyping);
  }

  function scheduleTypingStop() {
    clearTypingTimeout();
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 2200);
  }

  useEffect(() => {
    return () => {
      clearTypingTimeout();
      emitTyping(false);
    };
  }, []);

  async function handleSend() {
    if (!canSend) return;

    if (canSendText) {
      const trimmed = text.trim();
      const sanitized = censorProfanity(trimmed);
      clearTypingTimeout();
      emitTyping(false);
      setText("");
      await onSend(sanitized, "text");
      setSuppressDisabledStyle(true);
      return;
    }

    // voice draft path (uses existing Send button)
    const sent = await voiceRecorderRef.current?.sendDraft();
    if (sent) setSuppressDisabledStyle(true);
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  }

  function handleChange(nextValue: string) {
    setText(nextValue);

    if (nextValue.trim().length === 0) {
      clearTypingTimeout();
      emitTyping(false);
      return;
    }

    emitTyping(true);
    scheduleTypingStop();
  }

  return (
    <div className="flex items-center gap-3">
        {/* Text box */}
        <div className="flex-1">
        <label className="sr-only">Message</label>
        <textarea
            rows={1}
            placeholder="Type a message…"
            value={text}
            onBlur={() => {
              clearTypingTimeout();
              emitTyping(false);
            }}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="
            h-12 w-full resize-none rounded-2xl px-4 py-3 text-sm leading-5
            border border-gray-border-soft bg-off-white text-gray-text
            placeholder:text-gray-muted-2
            outline-none transition
            focus:border-gray-border-soft
            focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-border/60
            "
        />
        </div>

        {/* Voice Recorder button */}
        <VoiceRecorder
          ref={voiceRecorderRef}
          userId={userId}
          onDraftChange={setHasVoiceDraft}
          onSendVoice={({ content, voicePath, voiceBucket }) =>
            onSend(content ?? "", "voice", { voicePath, voiceBucket })
          }
        />

        {/* Send button */}
        <button
            type="button"
            onClick={handleSend}
            onMouseLeave={() => setSuppressDisabledStyle(false)}
            disabled={!canSend}
            className={[
                "group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-5",
                "text-sm font-medium shadow-sm transition",
                "active:scale-[0.98] active:translate-y-[1px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue/60",
                "bg-blue-dark text-white",

                !canSend && !suppressDisabledStyle ? "opacity-50 pointer-events-none cursor-default" : "hover:bg-blue-dark",
            ].join(" ")}
        >
        {/* Default content: "Send" */}
        <div className="flex items-center gap-2 translate-x-0 opacity-100 transition duration-300 group-hover:-translate-x-[160%] group-hover:opacity-0">
            <span>Send</span>
        </div>

        {/* Hover content: Arrow slides in */}
        <div className="absolute flex items-center translate-x-[160%] opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <svg
                width="24"
                height="24"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                aria-hidden="true"
            >
            <path
                d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
            />
            </svg>
        </div>
      </button>
    </div>
  );
}
