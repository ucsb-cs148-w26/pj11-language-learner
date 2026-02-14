'use client'

type DiscoverPaginationProps = {
  page: number;
  totalPages: number;
  showingCount: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function DiscoverPagination({
  page,
  totalPages,
  showingCount,
  onPrev,
  onNext,
}: DiscoverPaginationProps) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-sm text-zinc-600">
        page {`<${page}/${totalPages}>`} showing {showingCount} users
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

