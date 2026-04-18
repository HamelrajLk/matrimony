import type { Metadata } from 'next';
import Link from 'next/link';
import PetalRain from '@/components/landing/ui/PetalRain';

export const metadata: Metadata = {
  title: 'The Wedding Partners — Join Us',
  description: 'Sign up or log in to The Wedding Partners platform.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFBF7 0%, #FFF0E6 50%, #FFFBF7 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradShift 12s ease infinite',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Outfit', sans-serif",
        overflow: 'hidden',
      }}
    >
      <PetalRain />

      {/* Brand — clickable, goes to landing page */}
      <Link
        href="/"
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          textDecoration: 'none',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '2.4rem',
            animation: 'heartbeat 2s ease-in-out infinite',
            display: 'inline-block',
            marginBottom: '8px',
          }}
        >
          💍
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#2A1A1A',
            margin: 0,
            transition: 'color 0.2s',
          }}
        >
          The Wedding Partners
        </h1>
        <p style={{ color: '#E8735A', fontSize: '0.85rem', margin: '4px 0 0', fontWeight: 500 }}>
          Sri Lanka's Premier Wedding Platform
        </p>
      </Link>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}
