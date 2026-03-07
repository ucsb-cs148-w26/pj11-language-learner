// Makes the header for a chat conversation, showing the partner's avatar, name, and language being learned.
// Made for ChatRightPanel.tsx.

import Link from "next/link";
import Avatar from "@/components/Avatar";

type ChatHeaderProps = {
  partnerId: string; 
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  targetLanguages?: string[];
};

export default function ChatHeader({
  partnerId,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  targetLanguages,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-gray-border-soft px-5 py-4">
      <div className="flex items-center gap-3">
        <Avatar src={partnerAvatarUrl} alt={`${partnerFirstName} ${partnerLastName}`} />

        <div>
          <Link href={`/profile/${partnerId}`} className="text-base font-semibold text-gray-text hover:underline">
            {partnerFirstName} {partnerLastName}
          </Link>

          {targetLanguages && targetLanguages.length > 0 ? (
            <div className="text-sm text-gray-muted-2">
              Learning:{" "}
              <span className="font-medium text-gray-muted">
                {targetLanguages.join(", ")}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-muted-2">
              Learning: <span className="font-medium text-gray-muted">Unknown</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
