'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPassword } from '@/lib/auth';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/lib/validations';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordForm) {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch {
      setSent(true); // Always show success to avoid email enumeration
    } finally {
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '24px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(244,164,53,0.12)',
    border: '1px solid rgba(244,164,53,0.15)',
    animation: 'slideUp 0.4s ease',
    textAlign: 'center',
  };

  if (sent) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: '#2A1A1A', marginBottom: '12px' }}>
          Check Your Email
        </h2>
        <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.9rem' }}>
          If an account exists for that email, we've sent a password reset link. Check your inbox.
        </p>
        <Link href="/login" style={{ color: '#E8735A', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: '#2A1A1A', marginBottom: '8px', textAlign: 'center' }}>
        Forgot Password? 🔑
      </h2>
      <p style={{ color: '#888', textAlign: 'center', fontSize: '0.88rem', marginBottom: '28px' }}>
        Enter your email and we'll send a reset link
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2A1A1A', display: 'block', marginBottom: '6px' }}>Email</label>
          <input {...register('email')} className="sf" type="email" placeholder="you@example.com" />
          {errors.email && <p style={{ color: '#E8735A', fontSize: '0.78rem', marginTop: '4px' }}>{errors.email.message}</p>}
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Sending...' : 'Send Reset Link →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#888' }}>
        <Link href="/login" style={{ color: '#E8735A', fontWeight: 600, textDecoration: 'none' }}>← Back to Login</Link>
      </p>
    </div>
  );
}
