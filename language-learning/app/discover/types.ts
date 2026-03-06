export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export type DiscoverPartner = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  native_language: string | null;
  profile_picture_url: string | null;
  updated_at: string | null;
  targets: CandidateTarget[];
  friendship: {
    status: FriendshipStatus,
    request_id: string | null,
  }
};

export type DiscoverListResponse = {
  items: DiscoverPartner[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DiscoverRow = {
  user_id: string;
  language_id: number;
  level: string | null;
  profiles: {
    first_name: string | null;
    native_language: string | null;
    updated_at: string | null;
  } | Array<{
    first_name: string | null;
    native_language: string | null;
    updated_at: string | null;
  }> | null;
  lang: {
    name: string | null;
  } | Array<{
    name: string | null;
  }> | null;
};

export type UserTargetRow = {
  language_id: number;
  level: string | null;
  lang: {
    name: string | null;
  } | Array<{
    name: string | null;
  }> | null;
};

export type CandidateTarget = {
  language_id: number;
  name: string;
  level: string;
};

export type Candidate = {
  id: string;
  first_name: string | null;
  last_name?: string | null;
  native_language: string | null;
  profile_picture_url?: string | null;
  updated_at: string | null;
  targets: CandidateTarget[];
  friendship: {
    status: FriendshipStatus,
    request_id: string |null,
  }
};

