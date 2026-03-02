import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createFriendService } from "@/utils/friends/friendService";
import type { FriendRequestRow, FriendRequestsList } from "@/utils/friends/friendTypes";

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  profile_picture_url: string | null;
};

type RequestUser = {
  id: string;
  name: string;
  profileHref: string;
  avatarUrl?: string | null;
};

type IncomingRequestItem = {
  requestId: string;
  from: RequestUser;
};

type OutgoingRequestItem = {
  requestId: string;
  to: RequestUser;
};

type RequestsPayload = {
  incomingRequests: IncomingRequestItem[];
  outgoingRequests: OutgoingRequestItem[];
};

async function hydrateRequests(
  supabase: Awaited<ReturnType<typeof createClient>>,
  list: FriendRequestsList
): Promise<RequestsPayload> {
  const rows: FriendRequestRow[] = [...(list.incoming ?? []), ...(list.outgoing ?? [])];

  const ids = Array.from(
    new Set(rows.flatMap((r) => [r.requester_id, r.recipient_id]).filter(Boolean))
  );

  if (ids.length === 0) {
    return { incomingRequests: [], outgoingRequests: [] };
  }

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("user_id, first_name, profile_picture_url")
    .in("user_id", ids);

  if (profErr) throw new Error(profErr.message || "Failed to load profiles");

  const profileMap = new Map<string, { name: string; avatarUrl: string | null }>();

  (profiles as ProfileRow[] | null)?.forEach((p) => {
    profileMap.set(p.user_id, {
      name: p.first_name ?? "Unknown",
      avatarUrl: p.profile_picture_url ?? null,
    });
  });

  const incomingRequests: IncomingRequestItem[] = (list.incoming ?? []).map((r) => {
    const prof = profileMap.get(r.requester_id) ?? { name: "Unknown", avatarUrl: null };
    return {
      requestId: r.id,
      from: {
        id: r.requester_id,
        name: prof.name,
        avatarUrl: prof.avatarUrl,
        profileHref: `/profile/${r.requester_id}`,
      },
    };
  });

  const outgoingRequests: OutgoingRequestItem[] = (list.outgoing ?? []).map((r) => {
    const prof = profileMap.get(r.recipient_id) ?? { name: "Unknown", avatarUrl: null };
    return {
      requestId: r.id,
      to: {
        id: r.recipient_id,
        name: prof.name,
        avatarUrl: prof.avatarUrl,
        profileHref: `/profile/${r.recipient_id}`,
      },
    };
  });

  return { incomingRequests, outgoingRequests };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendSvc = createFriendService(supabase);
    const list = await friendSvc.getFriendRequestsList({ userId: user.id, status: "pending" });
    const payload = await hydrateRequests(supabase, list);

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}