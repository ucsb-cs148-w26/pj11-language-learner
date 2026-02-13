'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DiscoverListResponse, DiscoverPartner } from "./types";

const PAGE_SIZE = 10;

type ConversationIdRow = {
  conversation_id: string;
};

type ConversationUserRow = {
  user_id: string;
};

export function useDiscoverData() {
  const [recommended, setRecommended] = useState<DiscoverPartner[]>([]);
  const [filtered, setFiltered] = useState<DiscoverPartner[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [excludeUserIds, setExcludeUserIds] = useState<string[]>([]);

  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingFilt, setLoadingFilt] = useState(true);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [languages, setLanguages] = useState<Array<{ id: number; name: string }>>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showingCount, setShowingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadCurrentUserAndExclusions = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const me = data.user?.id ?? null;
        if (!mounted) return;
        setCurrentUserId(me);

        if (!me) {
          setExcludeUserIds([]);
          return;
        }

        const excluded = new Set<string>([me]);

        const { data: myParticipation } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", me);

        const conversationIds = ((myParticipation as ConversationIdRow[]) ?? []).map(
          (row) => row.conversation_id,
        );

        if (conversationIds.length > 0) {
          const { data: partnerRows } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .in("conversation_id", conversationIds)
            .neq("user_id", me);

          for (const row of (partnerRows as ConversationUserRow[]) ?? []) {
            if (row.user_id) excluded.add(row.user_id);
          }
        }

        setExcludeUserIds([...excluded]);
      } catch (e) {
        console.error(e);
      }
    };
    loadCurrentUserAndExclusions();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoadingRecs(true);
      try {
        const params = new URLSearchParams({ recommended: "true" });
        if (currentUserId) params.set("currentUserId", currentUserId);
        if (excludeUserIds.length > 0) params.set("excludeUserIds", excludeUserIds.join(","));
        const res = await fetch(`/api/discover?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as DiscoverPartner[];
          setRecommended(data);
        }
      } catch (e) {
        console.error(e);
      }
      setLoadingRecs(false);
    };
    fetchRecs();
  }, [currentUserId, excludeUserIds]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from("languages")
          .select("id, name")
          .order("name", { ascending: true });

        if (error) throw error;
        setLanguages((data as Array<{ id: number; name: string }>) || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, levelFilter]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingFilt(true);
      try {
        const params = new URLSearchParams({
          language: search,
          level: levelFilter,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (currentUserId) params.set("currentUserId", currentUserId);
        if (excludeUserIds.length > 0) params.set("excludeUserIds", excludeUserIds.join(","));
        const res = await fetch(`/api/discover?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as DiscoverListResponse | DiscoverPartner[];
          const items = Array.isArray(data) ? data : data.items || [];
          setFiltered(items);
          setTotalPages(Array.isArray(data) ? 1 : data.totalPages || 1);
          setShowingCount(items.length);
          if (!Array.isArray(data) && typeof data.page === "number") {
            setPage(data.page);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoadingFilt(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, levelFilter, page, currentUserId, excludeUserIds]);

  const resetFilters = () => {
    setSearch("");
    setLevelFilter("All");
    setPage(1);
  };

  const goPrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const goNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  return {
    recommended,
    filtered,
    loadingRecs,
    loadingFilt,
    search,
    levelFilter,
    languages,
    page,
    totalPages,
    showingCount,
    setSearch,
    setLevelFilter,
    resetFilters,
    goPrevPage,
    goNextPage,
  };
}

