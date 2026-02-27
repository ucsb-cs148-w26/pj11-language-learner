"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/lib/supabaseClient";

import { createFriendService } from "@/utils/friends/friendService";
import type { FriendRequestRow, FriendRequestsList } from "@/utils/friends/friendTypes";

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

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  profile_picture_url: string | null;
};

export default function FriendRequests({
  userId,
  incomingRequests,
  outgoingRequests,
  showHeader = true,
  showSubHeader = true,
}: {
  userId: string;
  incomingRequests?: IncomingRequestItem[];
  outgoingRequests?: OutgoingRequestItem[];
  showHeader?: boolean;
  showSubHeader?: boolean;
}) {
  const router = useRouter();
  const friendSvc = useMemo(() => createFriendService(supabase), []);

  const [incoming, setIncoming] = useState<IncomingRequestItem[]>(incomingRequests ?? []);
  const [outgoing, setOutgoing] = useState<OutgoingRequestItem[]>(outgoingRequests ?? []);

  const [loading, setLoading] = useState<boolean>(!incomingRequests && !outgoingRequests);
  const [error, setError] = useState<string | null>(null);

  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [denyingIds, setDenyingIds] = useState<Set<string>>(new Set());
  const [cancelingIds, setCancelingIds] = useState<Set<string>>(new Set());

  const [chatPrompt, setChatPrompt] = useState<{ conversationId: string; name: string } | null>(
    null
  );

  const sortedIncoming = useMemo(() => {
    return [...incoming].sort((a, b) =>
      a.from.name.localeCompare(b.from.name, undefined, { sensitivity: "base" })
    );
  }, [incoming]);

  const sortedOutgoing = useMemo(() => {
    return [...outgoing].sort((a, b) =>
      a.to.name.localeCompare(b.to.name, undefined, { sensitivity: "base" })
    );
  }, [outgoing]);

  const withRowLoading = async (
    setFn: Dispatch<SetStateAction<Set<string>>>,
    requestId: string,
    fn: () => Promise<void>
  ) => {
    setFn((prev) => new Set(prev).add(requestId));
    try {
      await fn();
    } finally {
      setFn((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  async function hydrateRequests(list: FriendRequestsList) {
    const rows: FriendRequestRow[] = [...(list.incoming ?? []), ...(list.outgoing ?? [])];

    const ids = Array.from(
      new Set(rows.flatMap((r) => [r.requester_id, r.recipient_id]).filter(Boolean))
    );

    if (ids.length === 0) {
      return {
        incomingItems: [] as IncomingRequestItem[],
        outgoingItems: [] as OutgoingRequestItem[],
      };
    }

    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, first_name, profile_picture_url")
      .in("user_id", ids);

    if (profErr) throw profErr;

    const profileMap = new Map<string, { name: string; avatarUrl: string | null }>();

    (profiles as ProfileRow[] | null)?.forEach((p) => {
      profileMap.set(p.user_id, {
        name: p.first_name ?? "Unknown",
        avatarUrl: p.profile_picture_url ?? null,
      });
    });

    const incomingItems: IncomingRequestItem[] = (list.incoming ?? []).map((r) => {
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

    const outgoingItems: OutgoingRequestItem[] = (list.outgoing ?? []).map((r) => {
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

    return { incomingItems, outgoingItems };
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (incomingRequests || outgoingRequests) return;

      try {
        setLoading(true);
        setError(null);

        const list = await friendSvc.getFriendRequestsList({ userId, status: "pending" });
        const { incomingItems, outgoingItems } = await hydrateRequests(list);

        if (!cancelled) {
          setIncoming(incomingItems);
          setOutgoing(outgoingItems);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load requests.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [friendSvc, userId, incomingRequests, outgoingRequests]);

  async function handleAccept(requestId: string, name: string) {
    setError(null);

    await withRowLoading(setAcceptingIds, requestId, async () => {
      const conversationId = await friendSvc.acceptFriendRequest({ requestId });

      if (!conversationId) {
        throw new Error("Accept succeeded but no conversationId was returned.");
      }

      setIncoming((prev) => prev.filter((r) => r.requestId !== requestId));
      setChatPrompt({ conversationId, name });
    });
  }

  async function handleDeny(requestId: string) {
    setError(null);

    await withRowLoading(setDenyingIds, requestId, async () => {
      await friendSvc.denyFriendRequest({ requestId });
      setIncoming((prev) => prev.filter((r) => r.requestId !== requestId));
    });
  }

  async function handleCancel(requestId: string) {
    setError(null);

    await withRowLoading(setCancelingIds, requestId, async () => {
      await friendSvc.cancelFriendRequest({ requestId });
      setOutgoing((prev) => prev.filter((r) => r.requestId !== requestId));
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-border bg-white">
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="pl-3 text-xl font-semibold text-gray-text">Requests</h2>
          <Link
            href="/dashboard"
            className="mr-2 rounded-xl border border-gray-border bg-white px-4 py-2 text-sm font-medium text-gray-text opacity-80"
          >
            Friends
          </Link>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-4 rounded-xl border border-dark-red/20 bg-light-red px-4 py-3 text-sm text-dark-red">
          {error}
        </div>
      )}

      {chatPrompt && (
        <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-border bg-off-white px-4 py-3 text-sm text-gray-text">
          <div>
            You’re now friends with <span className="font-semibold">{chatPrompt.name}</span>. Open
            your chat?
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-xl bg-gray-text px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              onClick={() => {
                router.push(`/chats?c=${encodeURIComponent(chatPrompt.conversationId)}`);
              }}
            >
              Go to chat
            </button>
            <button
              className="rounded-xl border border-gray-border bg-white px-3 py-2 text-sm font-medium text-gray-text"
              onClick={() => setChatPrompt(null)}
            >
              Stay here
            </button>
          </div>
        </div>
      )}

      {showSubHeader && (
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-off-white px-4 py-3 text-sm font-semibold text-gray-text">
          <div className="pl-2">Incoming</div>
          <div className="pr-[40px] text-right">Accept</div>
          <div className="pr-[40px] text-right">Deny</div>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-muted">Loading requests…</p>
        </div>
      ) : sortedIncoming.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-muted">No incoming requests.</p>
          <Link
            href="/discover"
            className="mt-3 inline-block rounded-xl bg-gray-text px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Find partners
          </Link>
        </div>
      ) : (
        <div>
          {sortedIncoming.map((r) => {
            const isAccepting = acceptingIds.has(r.requestId);
            const isDenying = denyingIds.has(r.requestId);

            return (
              <div
                key={r.requestId}
                className="grid h-17 grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-gray-border-soft px-4 py-3 text-sm"
              >
                <Link
                  href={r.from.profileHref}
                  className="flex min-w-0 items-center gap-3 rounded-lg bg-transparent px-0 py-0 transition"
                >
                  <img
                    src={r.from.avatarUrl ?? "/default-avatar.jpg"}
                    alt={r.from.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-gray-text">{r.from.name}</div>
                  </div>
                </Link>

                <button
                  className="acceptBtn mr-4 justify-self-end"
                  disabled={isAccepting || isDenying}
                  onClick={() => handleAccept(r.requestId, r.from.name)}
                >
                  {isAccepting ? "Accepting…" : "Accept ✅"}
                </button>

                <button
                  className="denyBtn mr-4 justify-self-end"
                  disabled={isAccepting || isDenying}
                  onClick={() => handleDeny(r.requestId)}
                >
                  {isDenying ? "Denying…" : "Deny ✖️"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3 bg-off-white px-4 py-3 text-sm font-semibold text-gray-text">
        <div className="pl-2">Pending (Sent)</div>
        <div className="pr-[40px] text-right">Cancel</div>
      </div>

      {sortedOutgoing.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-muted">No pending requests sent.</p>
        </div>
      ) : (
        <div>
          {sortedOutgoing.map((r) => {
            const isCanceling = cancelingIds.has(r.requestId);

            return (
              <div
                key={r.requestId}
                className="grid h-17 grid-cols-[1fr_auto] items-center gap-3 border-t border-gray-border-soft px-4 py-3 text-sm"
              >
                <Link
                  href={r.to.profileHref}
                  className="flex min-w-0 items-center gap-3 rounded-lg bg-transparent px-0 py-0 transition"
                >
                  <img
                    src={r.to.avatarUrl ?? "/default-avatar.jpg"}
                    alt={r.to.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-gray-text">{r.to.name}</div>
                  </div>
                </Link>

                <button
                  className="denyBtn mr-4 justify-self-end"
                  disabled={isCanceling}
                  onClick={() => handleCancel(r.requestId)}
                >
                  {isCanceling ? "Canceling…" : "Cancel 🚫"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .acceptBtn,
        .denyBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 8px;
          border-radius: 8px;
          background: white;
          color: rgba(0, 0, 0, 1);
          font-weight: 500;
          transition: background 160ms ease, transform 160ms ease, opacity 160ms ease;
          border: 1px solid rgba(44, 44, 49, 0.45);
        }

        .acceptBtn:hover {
          background: rgba(232, 246, 235, 1);
          transform: translateY(-1px);
        }

        .denyBtn:hover {
          background: rgba(251, 229, 229, 1);
          transform: translateY(-1px);
        }

        .acceptBtn:disabled,
        .denyBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}