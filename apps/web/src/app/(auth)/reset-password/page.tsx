'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { resetPassword } from '@/lib/auth';
import { resetPasswordSchema, type ResetPasswordForm } from '@/lib/validations';

function getStrength(pw: string) {
  if (!pw) return { label: '', color: '#ddd', width: '0%' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return [
    { label: 'Weak', color: '#E8735A', width: '25%' },
    { label: 'Fair', color: '#F4A435', width: '50%' },
    { label: 'Strong', color: '#4ABEAA', width: '75%' },
    { label: 'Very Strong', color: '#3A9E8A', width: '100%' },
  ][score - 1] || { label: 'Weak', color: '#E8735A', width: '25%' };
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const pw = watch('password', '');
  const strength = getStrength(pw);
  const errStyle: React.CSSProperties = { color: '#E8735A', fontSize: '0.78rem', marginTop: '4px' };

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '24px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(244,164,53,0.12)',
    border: '1px solid rgba(244,164,53,0.15)',
    animation: 'slideUp 0.4s ease',
  };

  async function onSubmit(data: ResetPasswordForm) {
    if (!token) { toast.error('Invalid reset link.'); return; }
    setLoading(true);
    try {
      await resetPassword(token, data.password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: '#2A1A1A', marginBottom: '12px' }}>
          Password Reset!
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: '#2A1A1A', marginBottom: '8px', textAlign: 'center' }}>
        Set New Password 🔐
      </h2>
      <p style={{ color: '#888', textAlign: 'center', fontSize: '0.88rem', marginBottom: '28px' }}>
        Choose a strong password for your account
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2A1A1A', display: 'block', marginBottom: '6px' }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input {...register('password')} className="sf" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" style={{ paddingRight: '44px' }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {pw && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ height: '4px', background: '#f0e4d0', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'all 0.3s', borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: strength.color }}>{strength.label}</span>
            </div>
          )}
          {errors.password && <p style={errStyle}>{errors.password.message}</p>}
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2A1A1A', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
          <input {...register('confirmPassword')} className="sf" type="password" placeholder="Repeat password" />
          {errors.confirmPassword && <p style={errStyle}>{errors.confirmPassword.message}</p>}
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Resetting...' : 'Reset Password →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
        <Link href="/login" style={{ color: '#E8735A', fontWeight: 600, textDecoration: 'none' }}>← Back to Login</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
