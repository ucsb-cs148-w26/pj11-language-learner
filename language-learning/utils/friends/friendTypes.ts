// utils/friends/friendTypes.ts

export type FriendRequestStatus = "pending" | "accepted" | "denied" | "canceled";

export type FriendRequestRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
  updated_at: string;
};

export type FriendRow = {
  user_low: string;
  user_high: string;
  created_at: string;
};

// Useful “directional” view of a friend relationship from the viewer’s perspective
export type FriendEdge = {
  friend_user_id: string;
  created_at: string;
};

// For list UIs
export type FriendRequestsList = {
  incoming: FriendRequestRow[];
  outgoing: FriendRequestRow[];
};

export type RelationshipStatus =
  | { kind: "self" }
  | { kind: "friends" }
  | { kind: "incoming_request"; request: FriendRequestRow }
  | { kind: "outgoing_request"; request: FriendRequestRow }
  | { kind: "none" };