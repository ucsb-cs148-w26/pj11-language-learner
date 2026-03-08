"use client";

import { useMemo, useState } from "react";

export default function VoiceMessage({ url, isMine }: { url: string; isMine: boolean }) {
  const [loadError, setLoadError] = useState(false);

  const mimeGuess = useMemo(() => {
    const lower = url.toLowerCase();
    if (lower.includes(".m4a") || lower.includes(".mp4")) return "audio/mp4";
    if (lower.includes(".webm")) return "audio/webm";
    if (lower.includes(".mp3")) return "audio/mpeg";
    if (lower.includes(".wav")) return "audio/wav";
    if (lower.includes(".ogg")) return "audio/ogg";
    return undefined;
  }, [url]);

  return (
    <div className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
      <div
        className={[
          "rounded-2xl px-3 py-2 shadow-sm border",
          // light-blue bubble style (similar feel to text bubble)
          "bg-blue-soft border-blue/20",
        ].join(" ")}
      >
        <audio
          key={url}
          controls
          preload="metadata"
          className="h-9 w-56 sm:w-72"
          onError={() => setLoadError(true)}
        >
          {mimeGuess ? <source src={url} type={mimeGuess} /> : <source src={url} />}
          Your browser does not support audio playback.
        </audio>

        {loadError ? (
          <div className="mt-1 text-[11px] text-dark-red">
            Couldn’t play this audio in-browser.{" "}
            <a className="underline" href={url} target="_blank" rel="noreferrer">
              Open audio
            </a>
          </div>
        ) : null}
      </div>
      <span className="text-[10px] text-gray-muted px-1">Voice message</span>
    </div>
  );
}