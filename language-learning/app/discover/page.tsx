'use client'
import { useEffect, useState } from 'react';
import Header from "../components/Header";

type Partner = {
  id: string;
  first_name: string;
  last_name: string;
  level: string;
  native_language: string;
  target_languages: { language: string }[];
  profile_picture_url: string | null;
  bio: string | null;
};

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('language', search);
        if (levelFilter && levelFilter !== 'All') params.append('level', levelFilter);

        const res = await fetch(`/api/discover?${params.toString()}`);
        const data: Partner[] = await res.json();
        setPartners(data);
      } catch (err) {
        console.error('Failed to fetch partners', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [search, levelFilter]);

  const recommendedPartners = partners.slice(0, 5);

  const resetFilters = () => {
    setSearch('');
    setLevelFilter('All');
  };

  return (
    <div className="min-h-screen bg-white text-black w-full p-6">
      <Header />
      <h2 className="text-3xl font-bold mb-6 text-center">
        Discover Language Partners
      </h2>
      
      {/* horizontal cards */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Recommended for You</h3>
        <div className="flex space-x-4 overflow-x-auto pb-2 pt-2">
          {recommendedPartners.map((partner) => (
            <div
              key={partner.id}
              className="min-w-[200px] flex-shrink-0 border rounded-xl shadow-lg p-4 bg-white text-black hover:shadow-2xl transition transform hover:-translate-y-1"
            >
              <p className="font-bold text-lg mb-1">{partner.first_name}</p>
              <p className="text-gray-800 mb-1">
                Learning {partner.target_languages.map(t => t.language).join(', ')} ({partner.level})
              </p>
              <button className="mt-2 w-full py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                Connect
              </button>
            </div>
          ))}
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

          {/* partners list */}
          <div className="md:w-3/4 flex-1">
            {partners.length === 0 ? (
              <p className="text-gray-500">No partners found.</p>
            ) : (
              <ul className="space-y-4">
                {partners.map((partner) => (
                  <li
                    key={partner.id}
                    className="border p-4 rounded-lg shadow-sm hover:shadow-md transition bg-white text-black"
                  >
                    <p className="font-semibold text-lg">{partner.first_name}</p>
                    <p className="text-gray-800">
                      Learning {partner.target_languages.map(t => t.language).join(', ')} ({partner.level})
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
