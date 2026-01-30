// Where the user types their chat message and sends it.
// Made for ChatRightPanel.tsx.

"use client";

import { useState } from "react";

export default function MessageComposer() {
  const [text, setText] = useState("");
  const [suppressDisabledStyle, setSuppressDisabledStyle] = useState(false);

  const canSend = text.trim().length > 0;

  function onSend() {
    if (!canSend) return;
    // TO DO: actually send the message somewhere
    setText("");
    setSuppressDisabledStyle(true)
  }

  return (
    <div className="flex items-stretch gap-3">
        {/* Text box */}
        <div className="flex-1">
        <label className="sr-only">Message</label>
        <textarea
            rows={1}
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="
            h-12 w-full resize-none rounded-2xl px-4 py-3 text-sm leading-5
            border border-zinc-200 bg-zinc-50 text-zinc-900
            placeholder:text-zinc-500
            outline-none transition
            focus:border-zinc-200
            focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-300/60
            "
        />
        </div>

        {/* Send button */}
        <button
            type="button"
            onClick={onSend}
            onMouseLeave={() => setSuppressDisabledStyle(false)}
            disabled={!canSend}
            className={[
                "group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-5",
                "text-sm font-medium shadow-sm transition",
                "active:scale-[0.98] active:translate-y-[1px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-950/60",
                "bg-blue-950 text-white",

                !canSend && !suppressDisabledStyle ? "opacity-50 pointer-events-none cursor-default" : "hover:bg-blue-900",
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
