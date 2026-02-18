// utils/friends/friendService.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FriendRequestRow,
  FriendRow,
  FriendEdge,
  FriendRequestsList,
  RelationshipStatus,
} from "./friendTypes";

/**
 * =============================================================================
 * FRIEND SERVICE
 * HOW TO USE
 * =============================================================================
 *
 * 1) Create a service instance:
 *
 *   import { createFriendService } from "@/utils/friends/friendService";
 *   import { supabase } from "@/utils/supabaseClient";
 *
 *   const friends = createFriendService(supabase);
 *
 * 2) Send a friend request (viewer -> other):
 *
 *   const { data: { user } } = await supabase.auth.getUser();
 *   await friends.sendFriendRequest({ requesterId: user!.id, recipientId: otherUserId });
 *
 * 3) Accept an incoming request:
 *
 *   await friends.acceptFriendRequest({ requestId });
 *
 * 4) Deny an incoming request:
 *
 *   await friends.denyFriendRequest({ requestId });
 *
 * 5) Cancel an outgoing request:
 *
 *   await friends.cancelFriendRequest({ requestId });
 *
 * 6) List friends:
 *
 *   const edges = await friends.getFriendsList({ userId: user!.id });
 *   // edges = [{ friend_user_id, created_at }, ...]
 *
 * 7) List requests (incoming + outgoing):
 *
 *   const { incoming, outgoing } = await friends.getFriendRequestsList({ userId: user!.id, status: "pending" });
 *
 * 8) Unfriend:
 *
 *   await friends.unfriend({ otherUserId });
 *
 * 9) Relationship status for UI buttons:
 *
 *   const status = await friends.getRelationshipStatus({ viewerId: user!.id, otherUserId });
 *   // status.kind: "friends" | "incoming_request" | "outgoing_request" | "none" | "self"
 *
 * =============================================================================
 */

const FRIEND_REQUESTS_TABLE = "friend_requests";
const FRIENDS_TABLE = "friends";

function canonicalPair(a: string, b: string): { user_low: string; user_high: string } {
  if (a === b) throw new Error("Cannot create relationship with self");
  return a < b ? { user_low: a, user_high: b } : { user_low: b, user_high: a };
}

function assertOk<T>(res: { data: T; error: any }, context: string): T {
  if (res.error) {
    const msg = res.error?.message ?? String(res.error);
    throw new Error(`${context}: ${msg}`);
  }
  return res.data;
}

type Pagination = { limit?: number; offset?: number };

export function createFriendService(supabase: SupabaseClient) {
  return {
    // ---------------------------------------------------------------------
    // FRIEND REQUESTS
    // ---------------------------------------------------------------------

    /**
     * Creates a new pending friend request.
     * - requesterId must match auth.uid() (enforced by RLS)
     * - status forced to 'pending'
     *
     * UI usage: "Add Friend" button.
     */
    async sendFriendRequest(params: { requesterId: string; recipientId: string }) {
      const { requesterId, recipientId } = params;
      if (requesterId === recipientId) throw new Error("Cannot send friend request to self");

      const res = await supabase
        .from(FRIEND_REQUESTS_TABLE)
        .insert({
          requester_id: requesterId,
          recipient_id: recipientId,
          status: "pending",
        })
        .select("*")
        .single();

      return assertOk<FriendRequestRow>(res as any, "sendFriendRequest");
    },

    /**
     * Cancel an outgoing pending request by setting status='canceled'.
     */
    async cancelFriendRequest(params: { requestId: string }) {
      const res = await supabase
        .from(FRIEND_REQUESTS_TABLE)
        .update({ status: "canceled" })
        .eq("id", params.requestId)
        .select("*")
        .single();

      return assertOk<FriendRequestRow>(res as any, "cancelFriendRequest");
    },

    /**
     * Deny an incoming pending request by setting status='denied'.
     */
    async denyFriendRequest(params: { requestId: string }) {
      const res = await supabase
        .from(FRIEND_REQUESTS_TABLE)
        .update({ status: "denied" })
        .eq("id", params.requestId)
        .select("*")
        .single();

      return assertOk<FriendRequestRow>(res as any, "denyFriendRequest");
    },

    /**
     * Accept an incoming pending request.
     *
     * Uses your RPC:
     *   accept_friend_request(request_id uuid)
     *
     * This RPC should:
     * - verify auth.uid() is recipient
     * - verify request is pending
     * - insert friends row (canonical)
     * - update request status to accepted
     */
    async acceptFriendRequest(params: { requestId: string }) {
      const res = await supabase.rpc("accept_friend_request", { request_id: params.requestId });
      assertOk<any>(res as any, "acceptFriendRequest");
      return true;
    },

    /**
     * Fetch incoming requests (recipient_id = userId).
     * You’ll want status='pending' usually.
     */
    async getIncomingRequests(params: {
      userId: string;
      status?: "pending" | "accepted" | "denied" | "canceled";
    } & Pagination) {
      const { userId, status, limit = 50, offset = 0 } = params;

      let q = supabase
        .from(FRIEND_REQUESTS_TABLE)
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) q = q.eq("status", status);

      const res = await q;
      return assertOk<FriendRequestRow[]>(res as any, "getIncomingRequests");
    },

    /**
     * Fetch outgoing requests (requester_id = userId).
     */
    async getOutgoingRequests(params: {
      userId: string;
      status?: "pending" | "accepted" | "denied" | "canceled";
    } & Pagination) {
      const { userId, status, limit = 50, offset = 0 } = params;

      let q = supabase
        .from(FRIEND_REQUESTS_TABLE)
        .select("*")
        .eq("requester_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) q = q.eq("status", status);

      const res = await q;
      return assertOk<FriendRequestRow[]>(res as any, "getOutgoingRequests");
    },

    /**
     * Fetch incoming + outgoing in parallel.
     */
    async getFriendRequestsList(params: {
      userId: string;
      status?: "pending" | "accepted" | "denied" | "canceled";
      limitPerSide?: number;
    }): Promise<FriendRequestsList> {
      const { userId, status, limitPerSide = 50 } = params;
      const [incoming, outgoing] = await Promise.all([
        this.getIncomingRequests({ userId, status, limit: limitPerSide }),
        this.getOutgoingRequests({ userId, status, limit: limitPerSide }),
      ]);
      return { incoming, outgoing };
    },

    // ---------------------------------------------------------------------
    // FRIENDS
    // ---------------------------------------------------------------------

    /**
     * Fetch raw rows from friends where user participates.
     */
    async getFriendRows(params: { userId: string } & Pagination) {
      const { userId, limit = 100, offset = 0 } = params;

      const res = await supabase
        .from(FRIENDS_TABLE)
        .select("*")
        .or(`user_low.eq.${userId},user_high.eq.${userId}`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      return assertOk<FriendRow[]>(res as any, "getFriendRows");
    },

    /**
     * Fetch a "directional" list: friend_user_id + created_at
     * (Usually what your UI wants.)
     */
    async getFriendsList(params: { userId: string } & Pagination) {
      const rows = await this.getFriendRows(params);
      const edges: FriendEdge[] = rows.map((r) => ({
        friend_user_id: r.user_low === params.userId ? r.user_high : r.user_low,
        created_at: r.created_at,
      }));
      return edges;
    },

    /**
     * True/false check based on canonical PK (fast).
     */
    async areFriends(params: { userA: string; userB: string }) {
      const { user_low, user_high } = canonicalPair(params.userA, params.userB);

      const res = await supabase
        .from(FRIENDS_TABLE)
        .select("user_low,user_high,created_at")
        .eq("user_low", user_low)
        .eq("user_high", user_high)
        .maybeSingle();

      const row = assertOk<FriendRow | null>(res as any, "areFriends");
      return Boolean(row);
    },

    /**
     * Unfriend using your RPC:
     *   unfriend(other_user_id uuid)
     */
    async unfriend(params: { otherUserId: string }) {
      const res = await supabase.rpc("unfriend", { other_user_id: params.otherUserId });
      assertOk<any>(res as any, "unfriend");
      return true;
    },

    // ---------------------------------------------------------------------
    // HELPERS (UI / BUTTON STATE)
    // ---------------------------------------------------------------------

    /**
     * Determine relationship between viewer and other user.
     * Useful for rendering:
     * - Add Friend
     * - Cancel Request
     * - Accept/Deny
     * - Friends / Unfriend
     */
    async getRelationshipStatus(params: {
      viewerId: string;
      otherUserId: string;
    }): Promise<RelationshipStatus> {
      const { viewerId, otherUserId } = params;
      if (viewerId === otherUserId) return { kind: "self" };

      // 1) friends?
      const friends = await this.areFriends({ userA: viewerId, userB: otherUserId });
      if (friends) return { kind: "friends" };

      // 2) outgoing pending?
      const outRes = await supabase
        .from(FRIEND_REQUESTS_TABLE)
        .select("*")
        .eq("requester_id", viewerId)
        .eq("recipient_id", otherUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      const outgoing = assertOk<FriendRequestRow[]>(outRes as any, "getRelationshipStatus(outgoing)");
      if (outgoing[0]) return { kind: "outgoing_request", request: outgoing[0] };

      // 3) incoming pending?
      const inRes = await supabase
        .from(FRIEND_REQUESTS_TABLE)
        .select("*")
        .eq("requester_id", otherUserId)
        .eq("recipient_id", viewerId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      const incoming = assertOk<FriendRequestRow[]>(inRes as any, "getRelationshipStatus(incoming)");
      if (incoming[0]) return { kind: "incoming_request", request: incoming[0] };

      return { kind: "none" };
    },
  };
}
