// components/FriendActionButton.tsx
// hover color: #055690
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
      className: "bg-blue hover:bg-blue-dark text-white" 
    },
    pending_sent: { 
      label: "Cancel Request", 
      className: "bg-gray-soft-2 border border-gray-border-soft hover:bg-light-red hover:text-dark-red text-gray-muted" 
    },
    pending_received: { 
      label: "Accept Request", 
      className: "bg-green hover:bg-green-dark text-white" 
    },
    accepted: { 
      label: "Friends ✅", 
      className: "bg-gray-soft-2 text-gray-muted-2 cursor-default" 
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