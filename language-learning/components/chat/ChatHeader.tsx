// Makes the header for a chat conversation, showing the partner's avatar, name, and language being learned.
// Made for ChatLayout.tsx.

import Link from "next/link";

type ChatHeaderProps = {
  partnerId: string; 
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string;
  language?: string;
};

export default function ChatHeader({
  partnerId,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  language,
}: ChatHeaderProps) {
  return (
    <div className="border-b px-5 py-4">
      <div className="flex items-center gap-3">
        <img
          src={partnerAvatarUrl}
          alt={`${partnerFirstName} ${partnerLastName}`}
          className="h-10 w-10 rounded-full object-cover"
        />

        <div>
          <Link href={`/profile/${partnerId}`} className="text-base font-semibold text-zinc-900 hover:underline">
            {partnerFirstName} {partnerLastName}
          </Link>

          {language && (
            <div className="text-sm text-zinc-500">
              Learning: <span className="font-medium text-zinc-700">{language}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
