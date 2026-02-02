'use client'
import { useState, useEffect, useCallback } from 'react';
import Link from "next/link";

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function DiscoverPage() {
  const [recommended, setRecommended] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  const[loadingRecs, setLoadingRecs] = useState(true);
  const[loadingFilt, setLoadingFilt] = useState(true);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');

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


  const resetFilters = () => {
    setSearch('');
    setLevelFilter('All');
  };

  return (
    <div className="min-h-screen bg-white text-black w-full">

      <main className="w-full p-6">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Discover Language Partners
        </h2>
      
        {/* recommended */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Recommended for You</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2 pt-2">
            {loadingRecs ? (
              <div className="flex space-x-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-32 w-48 bg-gray-200 rounded-xl" />)}
              </div>
            ) : (
              <div className="flex space-x-4 overflow-x-auto pb-2 pt-2">
                {recommended.length > 0 ? recommended.map((partner) => (
                  <div key={partner.id} className="min-w-[200px] flex-shrink-0 border rounded-xl shadow-lg p-4 bg-white hover:shadow-2xl transition">
                    <p className="font-bold text-lg mb-1">{partner.first_name}</p>
                    <p className="text-gray-800 mb-1">Learning {partner.target_language} ({partner.level})</p>
                    <button className="mt-2 w-full py-1 bg-blue-500 text-white rounded-md">Connect</button>
                  </div>
                )) : <p className="text-gray-500">No recommendations found.</p>}
              </div>
            )}
          </div>
        </section>

        {/* filtered list */}
        <section>
          <h3 className="text-xl font-semibold mb-4">All Learners</h3>
          <div className="flex flex-col md:flex-row gap-6">

            {/* sidebar */}
            <aside className="md:w-1/4 border border-gray-200 p-4 rounded-lg shadow-sm bg-white">
              <h3 className="font-semibold mb-4 text-lg">Filters</h3>

              {/* language search */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Language</label>
                <input
                  type="text"
                  placeholder="Search language..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                />
              </div>

              {/* level filter */}
              <div className="mb-4">
                <label className="block mb-1 font-medium">Level</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* reset button */}
              <button
                onClick={resetFilters}
                className="w-full py-2 mt-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Reset Filters
              </button>
            </aside>

            {/* matches list */}
            <div className="md:w-3/4 flex-1">
              {loadingFilt ? (
                <div className="space-y-4">
                   {[1,2,3].map(i => <div key={i} className="h-20 w-full bg-gray-100 animate-pulse rounded-lg" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">No partners match your search.</p>
                  <button onClick={resetFilters} className="text-blue-500 underline mt-2">Clear all filters</button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {filtered.map((partner) => (
                    <li key={partner.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition bg-white">
                      <p className="font-semibold text-lg">{partner.first_name}</p>
                      <p className="text-gray-800">Learning {partner.target_language} ({partner.level})</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
