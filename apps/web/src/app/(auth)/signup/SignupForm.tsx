'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpIndividual, signUpPartner, verifyEmailOtp, resendVerificationOtp } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import {
  individualSignupSchema,
  partnerSignupSchema,
  type IndividualSignupForm,
  type PartnerSignupForm,
  type PartnerService,
} from '@/lib/validations';

type Role = 'USER' | 'PARTNER';
type Step = 1 | 2 | 3 | 4;

export interface LookupGender { value: string; label: string; icon?: string }
export interface LookupPartnerType { value: string; label: string; icon?: string }

interface Props {
  genders: LookupGender[];
  partnerTypes: LookupPartnerType[];
}

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: '', color: '#ddd', width: '0%' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: 'Weak', color: '#E8735A', width: '25%' },
    { label: 'Fair', color: '#F4A435', width: '50%' },
    { label: 'Strong', color: '#4ABEAA', width: '75%' },
    { label: 'Very Strong', color: '#3A9E8A', width: '100%' },
  ];
  return map[score - 1] || map[0];
}

const errStyle: React.CSSProperties = { color: '#E8735A', fontSize: '0.78rem', marginTop: '4px', display: 'block' };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#2A1A1A', display: 'block', marginBottom: '6px' };
const formCardStyle: React.CSSProperties = {
  background: 'white',
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  padding: '40px 36px',
  width: '100%',
  maxWidth: '480px',
  boxShadow: '0 20px 60px rgba(244,164,53,0.12)',
  border: '1px solid rgba(244,164,53,0.15)',
  animation: 'slideUp 0.4s ease',
};

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: 'rgba(232,115,90,0.08)',
      border: '1px solid rgba(232,115,90,0.3)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#E8735A',
      fontSize: '0.85rem',
      marginBottom: '16px',
      fontWeight: 500,
    }}>
      {message}
    </div>
  );
}

export default function SignupForm({ genders, partnerTypes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const preselectedRole = searchParams.get('role') as Role | null;
  const [step, setStep] = useState<Step>(preselectedRole ? 2 : 1);
  const [role, setRole] = useState<Role | null>(preselectedRole);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PartnerService[]>([]);

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync role from query param after mount
  useEffect(() => {
    const r = searchParams.get('role') as Role | null;
    if (r && r !== role) {
      setRole(r);
      setStep(2);
    }
  }, [searchParams]);

  // OTP resend countdown
  useEffect(() => {
    if (step !== 3) return;
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown, step]);

  const indForm = useForm<IndividualSignupForm>({ resolver: zodResolver(individualSignupSchema) });
  const partForm = useForm<PartnerSignupForm>({
    resolver: zodResolver(partnerSignupSchema),
    defaultValues: { services: [] },
  });

  const watchIndPass = indForm.watch('password', '');
  const watchPartPass = partForm.watch('password', '');
  const passStrengthInd = getPasswordStrength(watchIndPass);
  const passStrengthPart = getPasswordStrength(watchPartPass);

  function switchRole(newRole: Role) {
    setRole(newRole);
    setFormError('');
    indForm.reset();
    partForm.reset();
    setSelectedServices([]);
  }

  function toggleService(val: PartnerService) {
    const next = selectedServices.includes(val)
      ? selectedServices.filter((s) => s !== val)
      : [...selectedServices, val];
    setSelectedServices(next);
    partForm.setValue('services', next);
    partForm.clearErrors('services');
  }

  async function onIndividualSubmit(data: IndividualSignupForm) {
    setLoading(true);
    setFormError('');
    try {
      const res = await signUpIndividual({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        gender: data.gender,
        phone: data.phone,
        country: data.country,
      });
      setAuth(res.user, res.token);
      setRegisteredEmail(data.email);
      setResendCooldown(60);
      setStep(3);
    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onPartnerSubmit(data: PartnerSignupForm) {
    if (selectedServices.length === 0) {
      partForm.setError('services', { message: 'Select at least one service' });
      return;
    }
    setLoading(true);
    setFormError('');
    try {
      const res = await signUpPartner({
        businessName: data.businessName,
        contactPerson: data.contactPerson,
        businessEmail: data.businessEmail,
        phone: data.phone,
        password: data.password,
        services: selectedServices,
      });
      setAuth(res.user, res.token);
      setRegisteredEmail(data.businessEmail);
      setResendCooldown(60);
      setStep(3);
    } catch (err: any) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    setOtpError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  async function onOtpSubmit() {
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setOtpError('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      await verifyEmailOtp(registeredEmail, otp);
      setStep(4);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    try {
      await resendVerificationOtp(registeredEmail);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP.');
    }
  }

  const cardStyle = (selected: boolean): React.CSSProperties => ({
    background: selected ? 'rgba(244, 164, 53, 0.06)' : 'white',
    border: selected ? '2px solid #F4A435' : '2px solid #F0E4D0',
    borderRadius: '20px',
    padding: '32px 24px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    position: 'relative',
    boxShadow: selected ? '0 0 0 4px rgba(244,164,53,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
    flex: 1,
    minWidth: '140px',
  });

  // ── Step 1 ───────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={formCardStyle}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: '#2A1A1A', marginBottom: '8px', textAlign: 'center' }}>
          Create Your Account
        </h2>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '28px', fontSize: '0.9rem' }}>
          Choose how you'd like to join us
        </p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { r: 'USER' as Role, emoji: '👤', title: 'Individual', desc: "I'm looking for my life partner" },
            { r: 'PARTNER' as Role, emoji: '🤝', title: 'Partner', desc: 'I offer wedding services' },
          ].map(({ r, emoji, title, desc }) => (
            <div key={r} style={cardStyle(role === r)} onClick={() => setRole(r)}>
              {role === r && (
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#F4A435', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
              )}
              <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>{emoji}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 700, color: '#2A1A1A', marginBottom: '6px' }}>{title}</div>
              <div style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {role && (
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setStep(2)}>
            Continue →
          </button>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#888' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#E8735A', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    );
  }

  // ── Step 2a: Individual form ─────────────────────────────────────────────────
  if (step === 2 && role === 'USER') {
    return (
      <div style={{ ...formCardStyle, maxWidth: '500px' }}>
        <button onClick={() => { setStep(1); setFormError(''); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', padding: 0 }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: '#2A1A1A', marginBottom: '6px' }}>
          👤 Individual Sign Up
        </h2>
        <p style={{ color: '#9A8A7A', fontSize: '0.85rem', marginBottom: '24px' }}>
          Find your perfect life partner
        </p>

        {formError && <ErrorBanner message={formError} />}

        <form onSubmit={indForm.handleSubmit(onIndividualSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input {...indForm.register('firstName')} className="sf" placeholder="e.g. Arun" />
              {indForm.formState.errors.firstName && <span style={errStyle}>{indForm.formState.errors.firstName.message}</span>}
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input {...indForm.register('lastName')} className="sf" placeholder="e.g. Silva" />
              {indForm.formState.errors.lastName && <span style={errStyle}>{indForm.formState.errors.lastName.message}</span>}
            </div>
          </div>

          <div>
            <label style={labelStyle}>I am a *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {genders.map((g) => {
                const selected = indForm.watch('gender') === g.value;
                return (
                  <label key={g.value} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: selected ? 'rgba(244,164,53,0.08)' : '#FFFBF7', border: `2px solid ${selected ? '#F4A435' : '#F0E4D0'}`, borderRadius: '12px', padding: '12px 16px', transition: 'all 0.2s', fontFamily: "'Outfit',sans-serif", fontSize: '0.9rem', fontWeight: selected ? 600 : 400, color: selected ? '#2A1A1A' : '#666' }}>
                    <input type="radio" {...indForm.register('gender')} value={g.value} style={{ display: 'none' }} />
                    {g.icon && <span style={{ fontSize: '1.3rem' }}>{g.icon}</span>}
                    {g.label}
                  </label>
                );
              })}
            </div>
            {indForm.formState.errors.gender && <span style={errStyle}>{indForm.formState.errors.gender.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input {...indForm.register('email')} className="sf" type="email" placeholder="you@example.com" />
            {indForm.formState.errors.email && <span style={errStyle}>{indForm.formState.errors.email.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input {...indForm.register('password')} className="sf" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {watchIndPass && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ height: '4px', background: '#f0e4d0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: passStrengthInd.width, background: passStrengthInd.color, transition: 'all 0.3s', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: passStrengthInd.color }}>{passStrengthInd.label}</span>
              </div>
            )}
            {indForm.formState.errors.password && <span style={errStyle}>{indForm.formState.errors.password.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input {...indForm.register('confirmPassword')} className="sf" type={showConfirmPass ? 'text' : 'password'} placeholder="Repeat password" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                {showConfirmPass ? '🙈' : '👁️'}
              </button>
            </div>
            {indForm.formState.errors.confirmPassword && <span style={errStyle}>{indForm.formState.errors.confirmPassword.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Phone <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <input {...indForm.register('phone')} className="sf" type="tel" placeholder="+94 77 123 4567" />
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            Offering wedding services?{' '}
            <button onClick={() => switchRole('PARTNER')} style={{ background: 'none', border: 'none', color: '#F4A435', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
              Register as a Partner →
            </button>
          </p>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#E8735A', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2b: Partner form ────────────────────────────────────────────────────
  if (step === 2 && role === 'PARTNER') {
    return (
      <div style={{ ...formCardStyle, maxWidth: '520px' }}>
        <button onClick={() => { setStep(1); setFormError(''); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', padding: 0 }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: '#2A1A1A', marginBottom: '6px' }}>
          🤝 Partner Sign Up
        </h2>
        <p style={{ color: '#9A8A7A', fontSize: '0.85rem', marginBottom: '24px' }}>
          Showcase your wedding services to thousands of couples
        </p>

        {formError && <ErrorBanner message={formError} />}

        <form onSubmit={partForm.handleSubmit(onPartnerSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Business / Partner Name *</label>
            <input {...partForm.register('businessName')} className="sf" placeholder="Your business name" />
            {partForm.formState.errors.businessName && <span style={errStyle}>{partForm.formState.errors.businessName.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Contact Person Name *</label>
            <input {...partForm.register('contactPerson')} className="sf" placeholder="Your full name" />
            {partForm.formState.errors.contactPerson && <span style={errStyle}>{partForm.formState.errors.contactPerson.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Contact Email *</label>
            <input {...partForm.register('businessEmail')} className="sf" type="email" placeholder="business@example.com" />
            {partForm.formState.errors.businessEmail && <span style={errStyle}>{partForm.formState.errors.businessEmail.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Phone *</label>
            <input {...partForm.register('phone')} className="sf" type="tel" placeholder="+94 77 123 4567" />
            {partForm.formState.errors.phone && <span style={errStyle}>{partForm.formState.errors.phone.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input {...partForm.register('password')} className="sf" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {watchPartPass && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ height: '4px', background: '#f0e4d0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: passStrengthPart.width, background: passStrengthPart.color, transition: 'all 0.3s', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: passStrengthPart.color }}>{passStrengthPart.label}</span>
              </div>
            )}
            {partForm.formState.errors.password && <span style={errStyle}>{partForm.formState.errors.password.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input {...partForm.register('confirmPassword')} className="sf" type={showConfirmPass ? 'text' : 'password'} placeholder="Repeat password" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                {showConfirmPass ? '🙈' : '👁️'}
              </button>
            </div>
            {partForm.formState.errors.confirmPassword && <span style={errStyle}>{partForm.formState.errors.confirmPassword.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>
              Services Offered *{' '}
              <span style={{ color: '#9A8A7A', fontWeight: 400, fontSize: '0.78rem' }}>(select all that apply)</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {partnerTypes.map(({ label, value }) => {
                const selected = selectedServices.includes(value as PartnerService);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleService(value as PartnerService)}
                    style={{
                      background: selected ? 'rgba(244,164,53,0.1)' : '#FFFBF7',
                      border: selected ? '1.5px solid #F4A435' : '1.5px solid #F0E4D0',
                      borderRadius: '10px',
                      padding: '8px 6px',
                      fontSize: '0.75rem',
                      fontFamily: "'Outfit',sans-serif",
                      color: selected ? '#E8735A' : '#666',
                      cursor: 'pointer',
                      fontWeight: selected ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {selected ? '✓ ' : ''}{label}
                  </button>
                );
              })}
            </div>
            {partForm.formState.errors.services && <span style={errStyle}>{partForm.formState.errors.services.message}</span>}
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating Account...' : 'Create Partner Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            Looking for a life partner?{' '}
            <button onClick={() => switchRole('USER')} style={{ background: 'none', border: 'none', color: '#F4A435', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
              Register as Individual →
            </button>
          </p>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#E8735A', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 3: OTP verification ─────────────────────────────────────────────────
  if (step === 3) {
    const maskedEmail = registeredEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, '•') + c);

    return (
      <div style={{ ...formCardStyle, maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px', animation: 'heartbeat 2s ease-in-out infinite', display: 'inline-block' }}>📧</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: '#2A1A1A', marginBottom: '8px' }}>
          Verify Your Email
        </h2>
        <p style={{ color: '#7A6A5A', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '28px' }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: '#2A1A1A' }}>{maskedEmail}</strong>
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '8px' }} onPaste={handleOtpPaste}>
          {otpDigits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              style={{
                width: '48px',
                height: '56px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                fontFamily: "'Playfair Display',serif",
                border: otpError ? '2px solid #E8735A' : digit ? '2px solid #F4A435' : '2px solid #F0E4D0',
                borderRadius: '12px',
                background: digit ? 'rgba(244,164,53,0.06)' : '#FFFBF7',
                outline: 'none',
                color: '#2A1A1A',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        {otpError && <span style={{ ...errStyle, display: 'block', textAlign: 'center', marginBottom: '12px' }}>{otpError}</span>}

        <button
          className="btn-primary"
          onClick={onOtpSubmit}
          disabled={loading || otpDigits.join('').length < 6}
          style={{ width: '100%', marginTop: '8px', opacity: (loading || otpDigits.join('').length < 6) ? 0.7 : 1 }}
        >
          {loading ? 'Verifying...' : 'Verify & Continue →'}
        </button>

        <div style={{ marginTop: '20px' }}>
          {resendCooldown > 0 ? (
            <p style={{ fontSize: '0.83rem', color: '#aaa' }}>
              Resend code in <strong style={{ color: '#7A6A5A' }}>{resendCooldown}s</strong>
            </p>
          ) : (
            <button onClick={handleResendOtp} style={{ background: 'none', border: 'none', color: '#E8735A', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              Resend Code
            </button>
          )}
        </div>

        <p style={{ fontSize: '0.8rem', color: '#bbb', marginTop: '12px' }}>
          Wrong email?{' '}
          <button onClick={() => { setStep(2); setOtpDigits(['', '', '', '', '', '']); setOtpError(''); }} style={{ background: 'none', border: 'none', color: '#9A8A7A', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}>
            Go back
          </button>
        </p>
      </div>
    );
  }

  // ── Step 4: Success ──────────────────────────────────────────────────────────
  return (
    <div style={{ ...formCardStyle, textAlign: 'center', maxWidth: '420px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'heartbeat 1.5s ease-in-out infinite', display: 'inline-block' }}>💍</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2A1A1A', marginBottom: '12px' }}>
        Welcome to The Wedding Partners!
      </h2>
      <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '28px', fontSize: '0.9rem' }}>
        {role === 'PARTNER'
          ? 'Your partner account is verified. Start showcasing your services to thousands of couples.'
          : "Your account is verified. Let's find your perfect match and plan your dream wedding!"}
      </p>
      <button className="btn-primary" style={{ width: '100%' }} onClick={() => router.push(role === 'PARTNER' ? '/partners/dashboard' : '/dashboard')}>
        Go to Dashboard →
      </button>
    </div>
  );
}
