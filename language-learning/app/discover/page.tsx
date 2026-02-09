'use client'
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function DiscoverPage() {
  const [recommended, setRecommended] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  const[loadingRecs, setLoadingRecs] = useState(true);
  const[loadingFilt, setLoadingFilt] = useState(true);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');

  const router = useRouter();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoadingRecs(true)
      try {
        const res = await fetch(`/api/discover?recommended=true`);
        if (res.ok) {
          const data = await res.json();
          setRecommended(data);
        }
      } catch (e) { console.error(e); }
      setLoadingRecs(false);
    };
    fetchRecs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingFilt(true)
      try {
        const url = `/api/discover?language=${search}&level=${levelFilter}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setFiltered(data);
        }
      } catch (e) { console.error(e); }
      setLoadingFilt(false)
    }, 400);
    return () => clearTimeout(timer);
  }, [search, levelFilter]);

  async function handleConnect(partnerUserId: string) {
    try {
      setConnectingId(partnerUserId);

      const { data, error } = await supabase.rpc("start_conversation_no_dupe", {
        partner_id: partnerUserId,
      });

      if (error) throw error;

      const conversationId = data as string;

      // Navigate to chats and auto-select that conversation
      router.push(`/chats?c=${encodeURIComponent(conversationId)}`);
    } catch (e) {
      console.error(e);
      alert("Could not start conversation. Check console for details.");
    } finally {
      setConnectingId(null);
    }
  }

  const resetFilters = () => {
    setSearch('');
    setLevelFilter('All');
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 w-full">
      <main className="mx-auto max-w-6xl p-6">
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleConnect(partner.id);
                    }}
                    disabled={connectingId === partner.id}
                    className="w-full py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:opacity-90 transition"
                  >
                    {connectingId === partner.id ? "Connecting..." : "Connect"}
                  </button>
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
                  <input
                    type="text"
                    placeholder="e.g. Spanish"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition bg-zinc-50"
                  />
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
              <div className="grid grid-cols-1 gap-4">
                {filtered.map((partner) => (
                  <Link
                    key={partner.id}
                    href={`/profile/${partner.id}`}
                    className="group border border-zinc-200 p-5 rounded-2xl hover:border-zinc-300 transition bg-white shadow-sm flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">{partner.first_name}</p>
                        <p className="text-sm text-zinc-600">
                          Learning {partner.target_language} • {partner.level}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-xl bg-zinc-50 transition">
                      View Profile
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}