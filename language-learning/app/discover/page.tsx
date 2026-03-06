'use client'
import Link from "next/link";
import DiscoverPagination from "./DiscoverPagination";
import { useDiscoverData } from "./useDiscoverData";
import { FriendActionButton } from "./FriendActionButton";
import Avatar from "@/components/Avatar";

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
      <div className="mx-auto p-6 text-gray-text w-full">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-text">
            Discover Partners
          </h1>
        </header>

        {/* Recommended Section */}
        <section className="mb-12">
          <h3 className="text-sm font-medium text-gray-muted-2 uppercase tracking-wider mb-4">
            Recommended for You
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {loadingRecs ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-40 min-w-[280px] animate-pulse rounded-2xl bg-gray-soft-2 border border-gray-border-soft" />
              ))
            ) : (
              recommended.map((partner) => (
                <Link 
                  key={partner.id} 
                  href={`/profile/${partner.id}`}
                  className="min-w-[280px] flex-shrink-0 border border-gray-border-soft rounded-2xl p-6 bg-off-white hover:border-gray-border transition-all shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={partner.profile_picture_url}
                      alt={`${partner.first_name}'s avatar`}
                      size="w-10 h-10"
                      iconSize="w-5 h-5"
                      imgClassName="border border-gray-border-soft"
                    />
                    <p className="font-semibold text-gray-text">{partner.first_name}</p>
                  </div>
                  <p className="text-sm text-gray-muted mb-4">
                    {(() => {
                      const first = partner.targets && partner.targets.length > 0 ? partner.targets[0] : null;
                      return (
                        <>
                          Learning <span className="text-gray-text font-medium">{first?.name || 'Unknown'}</span>
                          <span className="mx-1">•</span>
                          {first?.level || 'Beginner'}
                        </>
                      );
                    })()}
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
            <div className="rounded-2xl border border-gray-border-soft p-6 bg-off-white shadow-sm">
              <h3 className="font-semibold text-gray-text mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-muted-2 uppercase mb-1.5 block">Language</label>
                  <select
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-2.5 text-sm border border-gray-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-blue/10 transition bg-off-white"
                  >
                    <option value="">All</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-muted-2 uppercase mb-1.5 block">Proficiency</label>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full p-2.5 text-sm border border-gray-border-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-blue/10 transition bg-off-white"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={resetFilters}
                  className="w-full py-2 text-xs font-medium text-gray-muted-2 hover:text-gray-text transition"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-muted-2 uppercase tracking-wider mb-4">
              All Potential Matches
            </h3>
            {loadingFilt ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 w-full bg-gray-soft-2 animate-pulse rounded-2xl border border-gray-border-soft" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-border-soft rounded-2xl">
                <p className="text-gray-muted-2 text-sm">No partners match your current filters.</p>
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
                      className="group border border-gray-border-soft p-5 rounded-2xl hover:border-gray-border transition bg-off-white shadow-sm flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar
                          src={partner.profile_picture_url}
                          alt={partner.first_name || 'User'}
                          size="w-12 h-12"
                          iconSize="w-6 h-6"
                          className="group-hover:bg-gray-soft-2 transition"
                        />
                        <div>
                          <p className="font-semibold text-gray-text">{partner.first_name}</p>
                          <p className="text-sm text-gray-muted">
                            {(() => {
                              const first = partner.targets && partner.targets.length > 0 ? partner.targets[0] : null;
                              return (
                                <>
                                  Learning <span className="text-gray-text font-medium">{first?.name || 'Unknown'}</span>
                                  <span className="mx-1">•</span>
                                  {first?.level || 'Beginner'}
                                </>
                              );
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Container for the two buttons */}
                      <div className="flex items-center gap-3">
                        <FriendActionButton 
                          partner={partner} 
                          onAction={handleFriendAction} 
                        />
                        <div className="px-4 py-2 text-sm font-medium border border-gray-border-soft rounded-xl bg-off-white hover:bg-gray-soft-2 transition">
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
