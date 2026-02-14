'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DiscoverListResponse, DiscoverPartner } from "./types";

const PAGE_SIZE = 10;

export function useDiscoverData() {
  const [recommended, setRecommended] = useState<DiscoverPartner[]>([]);
  const [filtered, setFiltered] = useState<DiscoverPartner[]>([]);

  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingFilt, setLoadingFilt] = useState(true);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [languages, setLanguages] = useState<Array<{ id: number; name: string }>>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showingCount, setShowingCount] = useState(0);

  useEffect(() => {
  async function fetchRecs() {
    setLoadingRecs(true);
    const res = await fetch(`/api/discover?recommended=true`);
    if (res.ok) {
      const data = await res.json();
      setRecommended(data);
    }
    setLoadingRecs(false);
  }
  fetchRecs();
}, []);

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
  }, [search, levelFilter, page]);

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
    resetFilters: () => { setSearch(""); setLevelFilter("All"); setPage(1); },
    goPrevPage: () => setPage((p) => Math.max(1, p - 1)),
    goNextPage: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}

