'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { loginWithEmail } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { loginSchema, type LoginForm } from '@/lib/validations';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    try {
      const res = await loginWithEmail(data.email, data.password);
      setAuth(res.user, res.token);
      toast.success('Welcome back! 💕');
      if (res.role === 'PARTNER') {
        router.push('/partners/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const errStyle: React.CSSProperties = { color: '#E8735A', fontSize: '0.78rem', marginTop: '4px' };

  return (
    <div
      style={{
        background: 'white',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(244,164,53,0.12)',
        border: '1px solid rgba(244,164,53,0.15)',
        animation: 'slideUp 0.4s ease',
      }}
    >
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: '#2A1A1A', marginBottom: '6px', textAlign: 'center' }}>
        Welcome Back 💕
      </h2>
      <p style={{ color: '#888', textAlign: 'center', fontSize: '0.88rem', marginBottom: '28px' }}>
        Sign in to your account
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2A1A1A', display: 'block', marginBottom: '6px' }}>Email</label>
          <input {...register('email')} className="sf" type="email" placeholder="you@example.com" />
          {errors.email && <p style={errStyle}>{errors.email.message}</p>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2A1A1A' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: '#E8735A', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input {...register('password')} className="sf" type={showPass ? 'text' : 'password'} placeholder="Your password" style={{ paddingRight: '44px' }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p style={errStyle}>{errors.password.message}</p>}
        </div>

        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spinSlow 0.7s linear infinite' }} />}
          {loading ? 'Signing In...' : 'Sign In →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: '#888' }}>
        Don't have an account?{' '}
        <Link href="/signup" style={{ color: '#E8735A', fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
      </p>
    </div>
  );
}
