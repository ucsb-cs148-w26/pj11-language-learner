"use client";

import Link from "next/link";

export type FriendListItem = {
  id: string;
  name: string;
  profileHref: string;
  chatHref: string;
};

export default function FriendsList({
  friends = [],
  showHeader = true,
}: {
  friends?: FriendListItem[];
  showHeader?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-xl font-semibold text-zinc-900">Friends</h2>
          <button
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 opacity-60"
            disabled
          >
            Requests
          </button>
        </div>
      )}

      {friends.length === 0 ? (
        <div className="px-4 pb-4">
          <p className="text-sm text-zinc-700">No friends yet.</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-3 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 text-center">
            <div>Name</div>
            <div>Chat</div>
            <div>Remove</div>
          </div>


          {friends.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-3 items-center gap-3 border-t border-zinc-100 px-4 py-3 text-sm text-center"
            >
              <Link
                href={f.profileHref}
                className="inline-block rounded-lg px-2 py-1 transition hover:-translate-y-[1px] hover:bg-zinc-100"
              >
                {f.name}
              </Link>

              <Link
                href={f.chatHref}
                className="inline-block rounded-lg px-2 py-1 transition hover:-translate-y-[1px] hover:bg-zinc-100"
              >
                Chat Now
              </Link>

              <button className="rounded-lg border border-zinc-200 bg-white px-3 py-1 opacity-50" disabled>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}