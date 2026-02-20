// components/FriendActionButton.tsx
import { DiscoverPartner, FriendshipStatus } from "@/app/discover/types";

interface Props {
  partner: DiscoverPartner;
  onAction: (partner: DiscoverPartner) => Promise<void>;
}

export function FriendActionButton({ partner, onAction }: Props) {
  const status = partner.friendship.status;

  // Define styles and labels based on status
  const config: Record<FriendshipStatus, { label: string; className: string }> = {
    none: { 
      label: "Connect", 
      className: "bg-blue-600 hover:bg-blue-700 text-white" 
    },
    pending_sent: { 
      label: "Cancel Request", 
      className: "bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-700" 
    },
    pending_received: { 
      label: "Accept Request", 
      className: "bg-green-600 hover:bg-green-700 text-white" 
    },
    accepted: { 
      label: "Friends ✅", 
      className: "bg-gray-100 text-gray-500 cursor-default" 
    },
  };

  const { label, className } = config[status];

  return (
    <button
      onClick={(e) => {
        e.preventDefault(); // Prevent navigating if the card is a link
        e.stopPropagation();
        onAction(partner);
      }}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}
    >
      {label}
    </button>
  );
}