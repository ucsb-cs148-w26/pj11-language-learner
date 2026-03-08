"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const VOICE_BUCKET = "voice";

export type VoiceRecorderHandle = {
  hasDraft: () => boolean;
  sendDraft: () => Promise<boolean>;
  discardDraft: () => void;
  isRecording: () => boolean;
};

type VoiceRecorderProps = {
  userId: string;
  onSendVoice?: (payload: { voicePath: string; voiceBucket: string; content?: string }) => Promise<void> | void;
  onDraftChange?: (hasDraft: boolean) => void;
};

const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(function VoiceRecorder(
  { userId, onSendVoice, onDraftChange },
  ref
) {
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [draftBlob, setDraftBlob] = useState<Blob | null>(null);
  const [draftMime, setDraftMime] = useState<string>("audio/webm");
  const [draftUrl, setDraftUrl] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    onDraftChange?.(!!draftBlob);
  }, [draftBlob, onDraftChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaStream.current?.getTracks().forEach((t) => t.stop());
      if (draftUrl) URL.revokeObjectURL(draftUrl);
    };
  }, [draftUrl]);

  function pickMimeType() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    for (const t of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  }

  function startTimer() {
    startedAtRef.current = Date.now();
    setRecordingMs(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRecordingMs(Date.now() - startedAtRef.current), 100);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  const startRecording = async () => {
    if (uploading || isRecording) return;
    setError(null);

    if (draftUrl) URL.revokeObjectURL(draftUrl);
    setDraftBlob(null);
    setDraftUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;

      const mimeType = pickMimeType() || "audio/webm";
      const recorder = new MediaRecorder(stream, pickMimeType() ? { mimeType } : undefined);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: recorder.mimeType || mimeType });
        mediaStream.current?.getTracks().forEach((t) => t.stop());
        mediaStream.current = null;
        mediaRecorder.current = null;
        audioChunks.current = [];
        stopTimer();

        if (blob.size < 1024) {
          setError("Recording too short or empty.");
          return;
        }

        const localUrl = URL.createObjectURL(blob);
        setDraftBlob(blob);
        setDraftMime(recorder.mimeType || mimeType);
        setDraftUrl(localUrl);
      };

      recorder.start(300);
      setIsRecording(true);
      startTimer();
    } catch {
      setError("Microphone unavailable.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorder.current;
    if (!recorder || recorder.state === "inactive") return;
    setIsRecording(false);
    try {
      recorder.requestData();
    } catch {}
    recorder.stop();
  };

  const toggleRecording = async () => {
    if (isRecording) stopRecording();
    else await startRecording();
  };

  const uploadVoiceMemo = async (blob: Blob, mimeType: string) => {
    setUploading(true);
    const ext = mimeType.includes("mp4") ? "m4a" : "webm";
    const fileName = `${userId}/${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(VOICE_BUCKET)
        .upload(fileName, blob, { contentType: mimeType, upsert: false });

      if (uploadError) throw uploadError;

      await onSendVoice?.({
        voiceBucket: VOICE_BUCKET,
        voicePath: fileName,
        content: `voice:${fileName}`, // fallback body marker
      });

      return true;
    } catch (err) {
      console.error("Voice upload/send failed", err);
      setError("Voice send failed.");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const discardDraft = () => {
    if (draftUrl) URL.revokeObjectURL(draftUrl);
    setDraftBlob(null);
    setDraftUrl(null);
    setDraftMime("audio/webm");
    setError(null);
  };

  const sendDraft = async () => {
    if (!draftBlob || uploading) return false;
    const ok = await uploadVoiceMemo(draftBlob, draftMime);
    if (ok) discardDraft();
    return ok;
  };

  useImperativeHandle(ref, () => ({
    hasDraft: () => !!draftBlob,
    sendDraft,
    discardDraft,
    isRecording: () => isRecording,
  }));

  const seconds = (recordingMs / 1000).toFixed(1);

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <div className="flex items-center gap-2 rounded-full bg-red-50 px-2 py-1 border border-red-200">
          <div className="flex items-end gap-[2px] h-4">
            <span className="w-1 h-2 bg-red-500 rounded-sm animate-pulse" />
            <span className="w-1 h-4 bg-red-500 rounded-sm animate-pulse [animation-delay:120ms]" />
            <span className="w-1 h-3 bg-red-500 rounded-sm animate-pulse [animation-delay:240ms]" />
            <span className="w-1 h-4 bg-red-500 rounded-sm animate-pulse [animation-delay:360ms]" />
            <span className="w-1 h-2 bg-red-500 rounded-sm animate-pulse [animation-delay:480ms]" />
          </div>
          <span className="text-xs text-red-700 font-medium">{seconds}s</span>
        </div>
      )}

      {draftUrl ? (
        <>
          <audio controls preload="metadata" src={draftUrl} className="h-9 w-44 sm:w-56" />
          <button
            type="button"
            onClick={discardDraft}
            disabled={uploading}
            className="rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-700 disabled:opacity-60"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={toggleRecording}
          className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${
            isRecording ? "bg-red-600 scale-110" : "bg-blue hover:bg-blue-dark"
          } text-white shadow-md disabled:opacity-60`}
          disabled={uploading}
          title={isRecording ? "Click to stop recording" : "Click to start recording"}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <span className="block h-3 w-3 rounded-sm bg-white" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      )}

      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
});

export default VoiceRecorder;