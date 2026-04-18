'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SavedSearch {
  id: number;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
}

interface Props {
  token: string | null;
}

export default function SearchDropdown({ token }: Props) {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API}/api/searches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { data: [] })
      .then(data => {
        if (mountedRef.current) {
          setSearches(data.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [token]);

  function goTo(path: string) {
    router.push(path);
  }

  return (
    <div
      className="absolute left-0 top-full mt-1 z-[200]"
      style={{
        width: 280,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.13)',
        border: '1px solid #F0E4D0',
        overflow: 'hidden',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-[#F0E4D0]"
        style={{ background: '#FFFBF7' }}
      >
        <span
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: '#9A8A7A', letterSpacing: '0.08em' }}
        >
          🔖 Saved Searches
        </span>
        <button
          onClick={() => goTo('/dashboard/browse?newSearch=1')}
          className="flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1 border cursor-pointer transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg,#F4A435,#E8735A)',
            color: 'white',
            border: 'none',
          }}
        >
          + New
        </button>
      </div>

      {/* Saved searches list */}
      <div className="py-1" style={{ maxHeight: 220, overflowY: 'auto' }}>
        {loading ? (
          /* Skeleton */
          <div className="px-4 py-2 flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div
                  className="rounded-lg flex-1"
                  style={{
                    height: 14,
                    background: 'linear-gradient(90deg,#F0E4D0 25%,#FFFBF7 50%,#F0E4D0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                  }}
                />
                <div
                  className="rounded-lg flex-shrink-0"
                  style={{ width: 28, height: 12, background: '#F0E4D0', borderRadius: 6 }}
                />
              </div>
            ))}
          </div>
        ) : searches.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <div className="text-2xl mb-1">🔍</div>
            <p className="text-xs" style={{ color: '#9A8A7A' }}>No saved searches yet</p>
            <button
              onClick={() => goTo('/dashboard/browse?newSearch=1')}
              className="mt-2 text-xs font-semibold cursor-pointer bg-transparent border-none"
              style={{ color: '#E8735A' }}
            >
              Create your first search →
            </button>
          </div>
        ) : (
          searches.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FFFBF7] transition-colors group"
            >
              <button
                onClick={() => goTo(`/dashboard/browse?savedSearchId=${s.id}`)}
                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer bg-transparent border-none text-left"
              >
                <span className="text-sm flex-shrink-0" style={{ color: '#F4A435' }}>📌</span>
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: '#2A1A1A' }}
                >
                  {s.name}
                </span>
              </button>
              <button
                onClick={() => goTo(`/dashboard/browse?editSearch=${s.id}`)}
                className="text-xs font-medium flex-shrink-0 ml-2 cursor-pointer bg-transparent border-none transition-all opacity-0 group-hover:opacity-100 hover:underline"
                style={{ color: '#E8735A' }}
              >
                Edit
              </button>
            </div>
          ))
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#F0E4D0' }} />

      {/* Regular search row */}
      <button
        onClick={() => goTo('/dashboard/browse')}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFFBF7] transition-colors cursor-pointer bg-transparent border-none text-left"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs"
          style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}
        >
          🔍
        </div>
        <span className="text-sm font-semibold" style={{ color: '#E8735A' }}>
          Regular Search
        </span>
        <span className="ml-auto text-[#9A8A7A] text-xs">→</span>
      </button>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
