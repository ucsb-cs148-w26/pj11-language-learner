import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { sseBroker } from "@/lib/sse-broker";

const VOICE_BUCKET = "voice";

function parseStorageUrl(url: string): { bucket: string | null; path: string | null } {
  const markers = [
    "/storage/v1/object/public/",
    "/storage/v1/object/sign/",
    "/storage/v1/object/authenticated/",
  ];

  const marker = markers.find((m) => url.includes(m));
  if (!marker) return { bucket: null, path: null };

  const tail = url.slice(url.indexOf(marker) + marker.length).split("?")[0];
  const [bucket, ...rest] = tail.split("/");
  return {
    bucket: bucket || null,
    path: rest.length ? decodeURIComponent(rest.join("/")) : null,
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;

  const { data: membership, error: memberErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr) {
    return NextResponse.json(
      { error: memberErr.message || "Failed to verify membership" },
      { status: 500 }
    );
  }

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id,conversation_id,sender_id,body,type,voice_bucket,voice_path,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to load messages" }, { status: 500 });
  }

  const messages = await Promise.all(
    (data ?? []).map(async (m) => {
      let resolvedContent = m.body ?? "";
      let path = m.voice_path?.trim().replace(/^\/+/, "") ?? null;

      // CHANGED: robust voice detection
      const effectiveType: "text" | "voice" =
        m.type === "voice" || !!path || resolvedContent.startsWith("voice:")
          ? "voice"
          : "text";

      if (effectiveType === "voice" && !path) {
        if (resolvedContent.startsWith("voice:")) {
          path = resolvedContent.slice("voice:".length).trim().replace(/^\/+/, "") || null;
        } else {
          const parsed = parseStorageUrl(resolvedContent);
          path = parsed.path?.trim().replace(/^\/+/, "") ?? null;
        }
      }

      if (effectiveType === "voice" && path) {
        const { data: signed } = await supabase.storage.from(VOICE_BUCKET).createSignedUrl(path, 60 * 60);
        if (signed?.signedUrl) resolvedContent = signed.signedUrl;
      }

      return {
        ...m,
        type: effectiveType, // CHANGED
        content: resolvedContent,
        voice_bucket: effectiveType === "voice" ? VOICE_BUCKET : null,
        voice_path: path,
      };
    })
  );

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;
  const payload = await req.json();

  const rawContent =
    typeof payload?.content === "string"
      ? payload.content.trim()
      : typeof payload?.text === "string"
        ? payload.text.trim()
        : "";

  // support direct and nested extras payloads
  let voicePath: string | null =
    typeof payload?.voicePath === "string"
      ? payload.voicePath.trim().replace(/^\/+/, "")
      : typeof payload?.extras?.voicePath === "string"
        ? payload.extras.voicePath.trim().replace(/^\/+/, "")
        : null;

  const incomingType: "text" | "voice" =
    payload?.type === "voice" || !!voicePath || rawContent.startsWith("voice:")
      ? "voice"
      : "text";

  const voiceBucketRaw =
    typeof payload?.voiceBucket === "string" && payload.voiceBucket.trim()
      ? payload.voiceBucket.trim().toLowerCase()
      : typeof payload?.extras?.voiceBucket === "string" && payload.extras.voiceBucket.trim()
        ? payload.extras.voiceBucket.trim().toLowerCase()
        : VOICE_BUCKET;

  // force canonical bucket
  const voiceBucket = incomingType === "voice" ? VOICE_BUCKET : null;

  if (incomingType === "voice" && voiceBucketRaw !== VOICE_BUCKET) {
    return NextResponse.json({ error: "Unsupported voice bucket" }, { status: 400 });
  }

  // NEW: parse voice: marker
  if (incomingType === "voice" && !voicePath && rawContent.startsWith("voice:")) {
    voicePath = rawContent.slice("voice:".length).trim().replace(/^\/+/, "") || null;
  }

  // existing URL parse fallback
  if (incomingType === "voice" && !voicePath && rawContent) {
    const parsed = parseStorageUrl(rawContent);
    voicePath = parsed.path?.trim().replace(/^\/+/, "") ?? null;
  }

  if (incomingType === "voice" && !voicePath) {
    return NextResponse.json({ error: "voicePath is required for voice messages" }, { status: 400 });
  }

  if (incomingType === "text" && !rawContent) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  const bodyToStore =
    incomingType === "voice"
      ? (rawContent || `voice:${voicePath}`)
      : rawContent;

  const { data: membership, error: memberErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr) {
    return NextResponse.json(
      { error: memberErr.message || "Failed to verify membership" },
      { status: 500 }
    );
  }

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: bodyToStore,
      type: incomingType,
      voice_bucket: voiceBucket,
      voice_path: incomingType === "voice" ? voicePath : null,
    })
    .select("id, created_at, body, type, voice_bucket, voice_path")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }

  // NEW: ensure response content is playable for private bucket
  let responseContent = inserted.body;
  if (inserted.type === "voice" && inserted.voice_path) {
    const { data: signed, error: signErr } = await supabase.storage
      .from(VOICE_BUCKET)
      .createSignedUrl(inserted.voice_path, 60 * 60);

    if (!signErr && signed?.signedUrl) {
      responseContent = signed.signedUrl;
    } else {
      console.error("[voice][POST] sign failed", {
        id: inserted.id,
        bucket: VOICE_BUCKET,
        path: inserted.voice_path,
        error: signErr?.message,
      });
    }
  }

  // after successful insert + response shaping
  sseBroker.broadcast(
    conversationId, // must match roomId used by EventSource
    "message",
    {
      id: inserted.id,
      conversationId,
      senderId: user.id,
      content: responseContent,
      type: inserted.type,
      createdAt: inserted.created_at,
    },
    user.id // exclude sender optional
  );

  return NextResponse.json({
    success: true,
    message: {
      id: inserted.id,
      created_at: inserted.created_at,
      content: responseContent,
      type: inserted.type,
      voice_bucket: inserted.voice_bucket,
      voice_path: inserted.voice_path,
    },
  });
}
