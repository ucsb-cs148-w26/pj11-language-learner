'use client'
import { useState, useMemo } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DiscoverPagination from "./DiscoverPagination";
import { useDiscoverData } from "./useDiscoverData";
import { createFriendService } from "@/utils/friends/friendService";
import { FriendActionButton } from "./FriendActionButton";

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function DiscoverPage() {
  const {
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
    handleFriendAction,
  } = useDiscoverData();

  return (
      <div className="mx-auto p-6 text-zinc-900 w-full">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Discover Partners
          </h1>
        </header>

        {/* Recommended Section */}
        <section className="mb-12">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Recommended for You
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {loadingRecs ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-40 min-w-[280px] animate-pulse rounded-2xl bg-zinc-100 border border-zinc-200" />
              ))
            ) : (
              recommended.map((partner) => (
                <Link 
                  key={partner.id} 
                  href={`/profile/${partner.id}`}
                  className="min-w-[280px] flex-shrink-0 border border-zinc-200 rounded-2xl p-6 bg-white hover:border-zinc-300 transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200">
                      {partner.first_name?.[0] || 'U'}
                    </div>
                    <p className="font-semibold text-zinc-900">{partner.first_name}</p>
                  </div>
                  <p className="text-sm text-zinc-600 mb-4">
                    Learning <span className="text-zinc-900 font-medium">{partner.target_language}</span>
                    <span className="mx-1">•</span>
                    {partner.level}
                  </p>
                  <FriendActionButton 
                    partner={partner} 
                    onAction={handleFriendAction} 
                  />
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Main Grid: Filters + List */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="md:w-64 space-y-6">
            <div className="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm">
              <h3 className="font-semibold text-zinc-900 mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase mb-1.5 block">Language</label>
                  <select
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition bg-zinc-50"
                  >
                    <option value="">All</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase mb-1.5 block">Proficiency</label>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition bg-zinc-50"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={resetFilters}
                  className="w-full py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
              All Potential Matches
            </h3>
            {loadingFilt ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 w-full bg-zinc-100 animate-pulse rounded-2xl border border-zinc-200" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-200 rounded-2xl">
                <p className="text-zinc-500 text-sm">No partners match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <DiscoverPagination
                  page={page}
                  totalPages={totalPages}
                  showingCount={showingCount}
                  onPrev={goPrevPage}
                  onNext={goNextPage}
                />
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((partner) => (
                    <Link
                      key={partner.id}
                      href={`/profile/${partner.id}`}
                      className="group border border-zinc-200 p-5 rounded-2xl hover:border-zinc-300 transition bg-white shadow-sm flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 transition">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">{partner.first_name}</p>
                          <p className="text-sm text-zinc-600">
                            Learning {partner.target_language} • {partner.level}
                          </p>
                        </div>
                      </div>

                      {/* Container for the two buttons */}
                      <div className="flex items-center gap-3">
                        <FriendActionButton 
                          partner={partner} 
                          onAction={handleFriendAction} 
                        />
                        <div className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition">
                          View Profile
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
