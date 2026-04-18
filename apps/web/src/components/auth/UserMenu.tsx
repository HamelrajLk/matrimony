'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { logoutFromAPI } from '@/lib/auth';

export default function UserMenu() {
  const router = useRouter();
  const { user, token, clearAuth, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isAuthenticated || !user) return null;

  const initials = user.email.slice(0, 2).toUpperCase();
  const roleLabel = user.role === 'PARTNER' ? 'Partner' : 'Individual';
  const roleColor = user.role === 'PARTNER' ? '#7B8FE8' : '#E8735A';
  const dashboardPath = user.role === 'PARTNER' ? '/partners/dashboard' : '/dashboard';

  async function handleLogout() {
    try { if (token) await logoutFromAPI(token); } catch {}
    clearAuth();
    router.push('/');
    setOpen(false);
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Avatar */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #F4A435, #E8735A)',
          border: 'none', cursor: 'pointer', color: 'white',
          fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(244,164,53,0.4)',
        }}
        aria-label="User menu"
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '48px', right: 0, background: 'white',
          borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          border: '1px solid rgba(244,164,53,0.15)', padding: '8px', minWidth: '200px',
          zIndex: 1000, animation: 'slideUp 0.2s ease',
        }}>
          {/* User info */}
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f5ebe0', marginBottom: '6px' }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: '#2A1A1A', fontSize: '0.88rem', marginBottom: '4px' }}>
              {user.email}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: roleColor, background: `${roleColor}18`, padding: '2px 8px', borderRadius: '20px' }}>
              {roleLabel}
            </span>
          </div>

          {/* Menu items */}
          {[
            { label: '🏠 Dashboard', path: dashboardPath },
            { label: '👤 My Profile', path: `${dashboardPath}/profile` },
            { label: '⚙️ Settings', path: `${dashboardPath}/settings` },
          ].map(({ label, path }) => (
            <button key={path} onClick={() => { router.push(path); setOpen(false); }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#2A1A1A', transition: 'background 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FFFBF7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {label}
            </button>
          ))}

          <div style={{ borderTop: '1px solid #f5ebe0', marginTop: '6px', paddingTop: '6px' }}>
            <button onClick={handleLogout}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#E8735A', fontWeight: 600, transition: 'background 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF0EC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
