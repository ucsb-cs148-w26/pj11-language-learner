"use client";

import Link from "next/link";

export type FriendListItem = {
  id: string;
  name: string;
  profileHref: string;
  chatHref: string;
  avatarUrl?: string | null;
};

export default function FriendsList({
  friends = [],
  showHeader = true,
  showSubHeader = true,
  onRemove,
  removingIds,
}: {
  friends?: FriendListItem[];
  showHeader?: boolean;
  showSubHeader?: boolean;
  onRemove?: (friendId: string) => Promise<void> | void;
  removingIds?: Set<string>;
}) {
  const sorted = [...friends].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-300 bg-white">
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="pl-3 text-xl font-semibold text-zinc-900">Friends</h2>

          <button
            className="mr-2 rounded-xl border border-zinc-400 bg-white px-4 py-2 text-sm font-medium text-zinc-900 opacity-80"
            disabled
          >
            Requests
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-zinc-700">No friends yet.</p>
          <Link
            href="/discover"
            className="mt-3 inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Find partners
          </Link>
        </div>
      ) : (
        <div>
          {showSubHeader && (
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900">
              <div className="pl-2">Name</div>
              <div className="text-right pr-[48px]">Chat</div>
              <div className="text-right pr-[40px]">Remove</div>
            </div>
          )}

          {sorted.map((f) => {
            const isRemoving = removingIds?.has(f.id) ?? false;

            return (
              <div
                key={f.id}
                className="grid h-17 grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-zinc-200 px-4 py-3 text-sm"
              >
                <Link
                  href={f.profileHref}
                  className="flex items-center gap-3 min-w-0 rounded-lg px-0 py-0 bg-transparent transition"
                >
                  <img
                    src={f.avatarUrl ?? "/default-avatar.jpg"}
                    alt={f.name}
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-zinc-900">
                      {f.name}
                    </div>
                  </div>
                </Link>

                <Link
                  href={f.chatHref}
                  className="mr-7 justify-self-end font-medium text-zinc-900 underline underline-offset-4 decoration-zinc-400 hover:decoration-zinc-700"
                >
                  Chat 💬
                </Link>

                <button
                  className="removeBtn mr-4 justify-self-end"
                  disabled={!onRemove || isRemoving}
                  onClick={async () => {
                    if (!onRemove) return;
                    await onRemove(f.id);
                  }}
                >
                  {isRemoving ? "Removing…" : "Remove 🗑️"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .removeBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 8px;
          border-radius: 8px;
          background: white;
          color: rgba(0, 0, 0, 1);
          font-weight: 500;
          transition: background 160ms ease, transform 160ms ease,
            opacity 160ms ease;
          border: 1px solid rgba(44, 44, 49, 0.45);
        }

        .removeBtn:hover {
          background: rgba(251, 229, 229, 1);
          transform: translateY(-1px);
        }

        .removeBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}