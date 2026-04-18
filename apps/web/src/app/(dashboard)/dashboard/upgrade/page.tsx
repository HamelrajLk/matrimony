'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface PlanPrice {
  durationMonths: number;
  priceAmount: number;
  originalPrice: number;
  discountPercent: number;
}
interface Feature {
  id: number; key: string; title: string; icon: string;
  audience: string; sortOrder: number;
}
interface FeatureAssignment {
  id: number; included: boolean; quantity: string | null;
  note: string | null; sortOrder: number; feature: Feature;
}
interface Plan {
  id: number; value: string; label: string; description: string;
  badge: string | null; color: string; sortOrder: number;
  prices: PlanPrice[]; features: FeatureAssignment[];
}
interface MySubscription {
  id: number; status: string; expiresAt: string; durationMonths: number;
  plan: { value: string; label: string; color: string };
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const DURATION_OPTIONS = [
  { months: 3,  label: '3 Months' },
  { months: 6,  label: '6 Months' },
  { months: 12, label: '1 Year'   },
];

const BANK_INFO = {
  bankName:      'Commercial Bank of Ceylon PLC',
  accountName:   'The Wedding Partners (Pvt) Ltd',
  accountNumber: '8001234567',
  branch:        'Colombo 03',
  swiftCode:     'CCEYLKLX',
};

const FAQ = [
  { q: 'Can I upgrade my plan anytime?',
    a: 'Yes — you can upgrade at any time. Your remaining days will be credited.' },
  { q: 'Is there a refund policy?',
    a: 'We offer a 7-day refund if you are not satisfied with your premium membership.' },
  { q: 'How long does bank transfer activation take?',
    a: 'Bank transfers are verified within 24 hours on business days. You will receive a confirmation email once activated.' },
  { q: 'Will my profile be visible after my subscription expires?',
    a: 'Yes — your profile stays on Free-plan features after expiry.' },
];

/* ─── Shared input style ────────────────────────────────────────────────── */
const INP: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #E8D8CC', fontFamily: "'Outfit',sans-serif",
  fontSize: '0.9rem', color: '#2A1A1A', background: '#FFFBF7',
  outline: 'none', boxSizing: 'border-box',
};

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENT MODAL
═══════════════════════════════════════════════════════════════════════════ */
function PaymentModal({
  plan, duration, price, onClose, onBankSuccess,
}: {
  plan: Plan; duration: number; price: PlanPrice;
  onClose: () => void; onBankSuccess: () => void;
}) {
  const [step, setStep]           = useState<'choose' | 'stripe' | 'bank' | 'bank-done'>('choose');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied]       = useState<string | null>(null);
  const [form, setForm]           = useState({ senderName: '', senderBank: '', transferRef: '' });
  const [receipt, setReceipt]     = useState<File | null>(null);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleStripe() {
    setSubmitting(true);
    try {
      const res = await api.post('/api/payments/stripe/create-checkout-session', {
        planId: plan.id, durationMonths: duration,
      });
      window.location.href = res.data.url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start payment');
      setSubmitting(false);
    }
  }

  async function handleBankSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.senderName.trim() || !form.transferRef.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('planId', String(plan.id));
      fd.append('durationMonths', String(duration));
      fd.append('senderName', form.senderName);
      fd.append('senderBank', form.senderBank);
      fd.append('transferRef', form.transferRef);
      if (receipt) fd.append('receipt', receipt);
      await api.post('/api/payments/bank-transfer', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStep('bank-done');
      onBankSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── overlay ── */
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(42,26,18,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500,
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
        }}
      >

        {/* ── modal header ── */}
        <div style={{
          padding: '26px 28px 18px',
          background: `linear-gradient(135deg,${plan.color}14,${plan.color}06)`,
          borderBottom: '1px solid #F0E8E0',
          borderRadius: '24px 24px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.35rem', color: '#2A1A1A', margin: 0 }}>
              {step === 'bank-done' ? '🎉 Transfer Submitted!' : `Upgrade to ${plan.label}`}
            </h2>
            {step !== 'bank-done' && (
              <p style={{ fontFamily: "'Outfit',sans-serif", color: '#7A6A5A', fontSize: '0.86rem', marginTop: 4 }}>
                {duration} months ·{' '}
                <strong style={{ color: plan.color }}>£{price.priceAmount.toLocaleString()}</strong>
                {price.discountPercent > 0 && (
                  <span style={{ marginLeft: 8, color: '#4ABEAA', fontWeight: 700, fontSize: '0.78rem' }}>
                    Save {price.discountPercent}%
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F5EDE6', border: 'none', borderRadius: '50%',
              width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >✕</button>
        </div>

        <div style={{ padding: '24px 28px 30px' }}>

          {/* ════ STEP: choose method ════ */}
          {step === 'choose' && (
            <>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.92rem', color: '#2A1A1A', textAlign: 'center', marginBottom: 18 }}>
                Choose your payment method
              </p>

              {/* Stripe card */}
              <button
                onClick={() => setStep('stripe')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                  padding: '18px 20px', borderRadius: 16, border: '2px solid #E8D8CC',
                  background: '#FFFBF7', cursor: 'pointer', textAlign: 'left',
                  marginBottom: 12, transition: 'border-color 0.18s, box-shadow 0.18s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#635BFF'; el.style.boxShadow = '0 4px 18px #635BFF22'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E8D8CC'; el.style.boxShadow = 'none'; }}
              >
                {/* stripe logo placeholder */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#635BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: '1rem', letterSpacing: '-1px' }}>S</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A' }}>
                    Pay with Card
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#7A6A5A', marginTop: 2 }}>
                    Visa, Mastercard, Amex · Secured by Stripe
                  </div>
                </div>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: '#635BFF', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  Instant →
                </span>
              </button>

              {/* Bank transfer card */}
              <button
                onClick={() => setStep('bank')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                  padding: '18px 20px', borderRadius: 16, border: '2px solid #E8D8CC',
                  background: '#FFFBF7', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#F4A435'; el.style.boxShadow = '0 4px 18px #F4A43522'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E8D8CC'; el.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.5rem' }}>
                  🏦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A' }}>
                    Bank Transfer (Sri Lanka)
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#7A6A5A', marginTop: 2 }}>
                    Direct bank deposit · Activated within 24 hours
                  </div>
                </div>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: '#F4A435', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  Details →
                </span>
              </button>

              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.76rem', color: '#9A8A7A', textAlign: 'center', marginTop: 20 }}>
                🔒 Payments are safe and encrypted.
              </p>
            </>
          )}

          {/* ════ STEP: stripe confirm ════ */}
          {step === 'stripe' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>💳</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.15rem', color: '#2A1A1A', marginBottom: 8 }}>
                Secure Card Payment
              </h3>
              <p style={{ fontFamily: "'Outfit',sans-serif", color: '#7A6A5A', fontSize: '0.88rem', lineHeight: 1.65, marginBottom: 24 }}>
                You'll be redirected to Stripe's secure checkout.<br />
                <strong style={{ color: plan.color }}>£{price.priceAmount.toLocaleString()}</strong> will be charged for {duration} months.
              </p>
              <button
                onClick={handleStripe}
                disabled={submitting}
                style={{
                  width: '100%', padding: '14px', borderRadius: 50, border: 'none',
                  background: submitting ? '#aaa' : '#635BFF', color: '#fff',
                  fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.97rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {submitting
                  ? 'Redirecting to Stripe…'
                  : `🔒 Pay £${price.priceAmount.toLocaleString()} with Stripe`}
              </button>
              <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', cursor: 'pointer', marginTop: 14 }}>
                ← Back
              </button>
            </div>
          )}

          {/* ════ STEP: bank transfer ════ */}
          {step === 'bank' && (
            <div>
              {/* Bank account details box */}
              <div style={{ background: '#FFF8F0', border: '1.5px solid #F4A43540', borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
                <p style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.8rem', color: '#E8735A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🏦 Bank Account Details
                </p>
                {([
                  { label: 'Bank Name',      value: BANK_INFO.bankName,      key: 'bank'   },
                  { label: 'Account Name',   value: BANK_INFO.accountName,   key: 'name'   },
                  { label: 'Account Number', value: BANK_INFO.accountNumber, key: 'acc'    },
                  { label: 'Branch',         value: BANK_INFO.branch,        key: 'branch' },
                  { label: 'SWIFT / BIC',    value: BANK_INFO.swiftCode,     key: 'swift'  },
                  { label: 'Amount to Pay',  value: `£${price.priceAmount.toLocaleString()}`, key: 'amount' },
                ] as { label: string; value: string; key: string }[]).map(row => (
                  <div
                    key={row.key}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #F0E0D0' }}
                  >
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#7A6A5A', fontWeight: 500, flexShrink: 0, marginRight: 8 }}>
                      {row.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.86rem', fontWeight: 700, color: '#2A1A1A', wordBreak: 'break-all', textAlign: 'right' }}>
                        {row.value}
                      </span>
                      <button
                        onClick={() => copyText(row.value, row.key)}
                        title="Copy"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: copied === row.key ? '#4ABEAA' : '#BBA898', padding: 2, flexShrink: 0 }}
                      >
                        {copied === row.key ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#7A6A5A', marginBottom: 16, lineHeight: 1.55 }}>
                After making the transfer, fill in the details below so we can verify your payment and activate your plan.
              </p>

              <form onSubmit={handleBankSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#5A4A3A', display: 'block', marginBottom: 5 }}>
                    Your Full Name (as shown on transfer) *
                  </label>
                  <input
                    style={INP}
                    placeholder="e.g. Kasun Perera"
                    value={form.senderName}
                    onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#5A4A3A', display: 'block', marginBottom: 5 }}>
                    Your Bank Name
                  </label>
                  <input
                    style={INP}
                    placeholder="e.g. People's Bank, Sampath Bank…"
                    value={form.senderBank}
                    onChange={e => setForm(f => ({ ...f, senderBank: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#5A4A3A', display: 'block', marginBottom: 5 }}>
                    Transfer Reference / Transaction ID *
                  </label>
                  <input
                    style={INP}
                    placeholder="e.g. TXN123456789"
                    value={form.transferRef}
                    onChange={e => setForm(f => ({ ...f, transferRef: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#5A4A3A', display: 'block', marginBottom: 5 }}>
                    Upload Receipt / Screenshot <span style={{ color: '#9A8A7A', fontWeight: 400 }}>(optional but recommended)</span>
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '10px 14px', borderRadius: 10, border: '1.5px dashed #E8D8CC',
                    background: receipt ? '#F0FAF5' : '#FFFBF7',
                    fontFamily: "'Outfit',sans-serif", fontSize: '0.86rem', color: receipt ? '#4ABEAA' : '#9A8A7A',
                    transition: 'border-color 0.2s',
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>{receipt ? '✅' : '📎'}</span>
                    <span>{receipt ? receipt.name : 'Click to attach receipt (JPG, PNG, PDF)'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      style={{ display: 'none' }}
                      onChange={e => setReceipt(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {receipt && (
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      style={{ background: 'none', border: 'none', color: '#E8735A', fontFamily: "'Outfit',sans-serif", fontSize: '0.78rem', cursor: 'pointer', marginTop: 4 }}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 50, border: 'none',
                    background: submitting ? '#ccc' : 'linear-gradient(135deg,#F4A435,#E8735A)',
                    color: '#fff', fontFamily: "'Outfit',sans-serif", fontWeight: 700,
                    fontSize: '0.94rem', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 4,
                  }}
                >
                  {submitting ? 'Submitting…' : '✓ Submit Transfer Details'}
                </button>
              </form>

              <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', cursor: 'pointer', marginTop: 14, display: 'block', width: '100%', textAlign: 'center' }}>
                ← Back
              </button>
            </div>
          )}

          {/* ════ STEP: bank done ════ */}
          {step === 'bank-done' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>✅</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.25rem', color: '#2A1A1A', marginBottom: 10 }}>
                Transfer Details Submitted!
              </h3>
              <p style={{ fontFamily: "'Outfit',sans-serif", color: '#7A6A5A', fontSize: '0.88rem', lineHeight: 1.7 }}>
                Thank you! Our team will verify your payment and activate your{' '}
                <strong style={{ color: plan.color }}>{plan.label}</strong> plan within{' '}
                <strong>24 hours</strong>.<br /><br />
                You'll receive an email confirmation once your subscription is live.
              </p>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ marginTop: 24, padding: '12px 36px' }}
              >
                Got it, thanks! →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function UpgradePage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();

  const [plans, setPlans]               = useState<Plan[]>([]);
  const [mySubscription, setMySubscription] = useState<MySubscription | null>(null);
  const [duration, setDuration]         = useState(3);
  const [loading, setLoading]           = useState(true);
  const [openFaq, setOpenFaq]           = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const toastShown = useRef(false);

  /* handle Stripe redirect — verify session to activate subscription */
  useEffect(() => {
    if (toastShown.current) return;
    const payment   = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (payment === 'success' && sessionId) {
      toastShown.current = true;
      api.post('/api/payments/stripe/verify-session', { sessionId })
        .then(() => {
          toast.success('🎉 Payment successful! Your subscription is now active.');
          refreshSubscription();
        })
        .catch(() => toast.error('Payment received but activation failed — contact support.'))
        .finally(() => router.replace('/dashboard/upgrade'));
    } else if (payment === 'cancelled') {
      toastShown.current = true;
      toast.error('Payment was cancelled.');
      router.replace('/dashboard/upgrade');
    }
  }, [searchParams, router]);

  /* load plans + current subscription */
  useEffect(() => {
    (async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get('/api/subscriptions/plans?audience=INDIVIDUAL'),
          api.get('/api/subscriptions/me').catch(() => ({ data: { data: null } })),
        ]);
        setPlans(plansRes.data.data || []);
        setMySubscription(subRes.data.data || null);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function refreshSubscription() {
    try {
      const res = await api.get('/api/subscriptions/me');
      setMySubscription(res.data.data || null);
    } catch { /* silent */ }
  }

  /* feature comparison helpers */
  const allFeatureKeys: string[] = [];
  const featureByKey: Record<string, Feature> = {};
  plans.forEach(p => p.features.forEach(a => {
    if (!featureByKey[a.feature.key]) {
      featureByKey[a.feature.key] = a.feature;
      allFeatureKeys.push(a.feature.key);
    }
  }));
  allFeatureKeys.sort((a, b) => (featureByKey[a]?.sortOrder ?? 0) - (featureByKey[b]?.sortOrder ?? 0));
  const getAssignment = (plan: Plan, key: string) => plan.features.find(a => a.feature.key === key);

  const isCurrentPlan = (plan: Plan) => {
    if (!mySubscription) return plan.value === 'FREE';
    return mySubscription.plan.value === plan.value;
  };
  const getPriceForDuration = (plan: Plan, months: number): PlanPrice | null =>
    plan.prices.find(p => p.durationMonths === months) ?? null;

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✨</div>
          <p style={{ color: 'var(--text-mid)', fontFamily: "'Outfit',sans-serif" }}>Loading plans…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Payment Modal */}
      {selectedPlan && (() => {
        const price = getPriceForDuration(selectedPlan, duration);
        if (!price) return null;
        return (
          <PaymentModal
            plan={selectedPlan}
            duration={duration}
            price={price}
            onClose={() => setSelectedPlan(null)}
            onBankSuccess={refreshSubscription}
          />
        );
      })()}

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg,#FFF8F2 0%,#FDEEE0 50%,#FFF5F0 100%)',
        padding: '60px 20px 40px', textAlign: 'center', borderBottom: '1px solid #F0E8E0',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👑</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--text-dark)', marginBottom: 12 }}>
          Find Your Perfect Match, Faster
        </h1>
        <p style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--text-mid)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.65 }}>
          Upgrade your membership to unlock premium features and connect with more serious matches.
        </p>
        {mySubscription && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff',
            border: `2px solid ${mySubscription.plan.color}`, borderRadius: 50,
            padding: '8px 20px', fontFamily: "'Outfit',sans-serif",
            fontWeight: 600, color: mySubscription.plan.color, fontSize: '0.9rem',
          }}>
            ✅ Current Plan: {mySubscription.plan.label} · Expires{' '}
            {new Date(mySubscription.expiresAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* ── Duration toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '32px 20px 8px' }}>
        {DURATION_OPTIONS.map(opt => (
          <button
            key={opt.months}
            onClick={() => setDuration(opt.months)}
            style={{
              fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.95rem',
              padding: '10px 22px', borderRadius: 50,
              border: duration === opt.months ? 'none' : '2px solid #E0D8D0',
              background: duration === opt.months ? 'linear-gradient(135deg,#F4A435,#E8735A)' : '#fff',
              color: duration === opt.months ? '#fff' : 'var(--text-mid)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {opt.label}
            {opt.months === 12 && (
              <span style={{ marginLeft: 6, background: '#E8735A', color: '#fff', borderRadius: 50, fontSize: '0.7rem', padding: '2px 7px' }}>
                Best Deal
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Plan cards ── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '24px 20px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 20,
      }}>
        {plans.map(plan => {
          const price    = getPriceForDuration(plan, duration);
          const isCurrent  = isCurrentPlan(plan);
          const isFeatured = plan.value === 'DIAMOND';
          const planIcon   = plan.value === 'FREE' ? '🌸' : plan.value === 'GOLD' ? '✨' : plan.value === 'DIAMOND' ? '💎' : '👑';

          return (
            <div
              key={plan.id}
              style={{
                background: '#fff', borderRadius: 24, overflow: 'hidden', position: 'relative',
                border: isFeatured ? `2px solid ${plan.color}` : '1.5px solid #F0E8E0',
                boxShadow: isFeatured ? `0 8px 32px ${plan.color}22` : '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 16px 40px ${plan.color}33`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = isFeatured ? `0 8px 32px ${plan.color}22` : '0 2px 12px rgba(0,0,0,0.06)'; }}
            >
              {plan.badge && (
                <div style={{ position: 'absolute', top: 14, right: 14, background: plan.color, color: '#fff', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.68rem', borderRadius: 50, padding: '3px 10px' }}>
                  {plan.badge}
                </div>
              )}

              {/* card header */}
              <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #F5EDE6', background: `linear-gradient(135deg,${plan.color}10,${plan.color}06)` }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{planIcon}</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.35rem', color: plan.color, marginBottom: 4 }}>
                  {plan.label}
                </h2>
                <p style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--text-mid)', fontSize: '0.83rem', lineHeight: 1.45 }}>
                  {plan.description}
                </p>
                {/* price */}
                <div style={{ marginTop: 16 }}>
                  {plan.value === 'FREE' ? (
                    <div>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '2rem', color: 'var(--text-dark)' }}>Free</span>
                      <span style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 6 }}>forever</span>
                    </div>
                  ) : price ? (
                    <div>
                      <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.85rem', color: 'var(--text-dark)' }}>
                        £{price.priceAmount.toLocaleString()}
                      </span>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        <span style={{ textDecoration: 'line-through', marginRight: 6 }}>£{price.originalPrice.toLocaleString()}</span>
                        <span style={{ color: '#4ABEAA', fontWeight: 700 }}>Save {price.discountPercent}%</span>
                      </div>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        for {duration} months
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* feature list */}
              <div style={{ padding: '16px 24px 20px' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {plan.features.slice(0, 8).map(a => (
                    <li key={a.feature.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: '1px solid #FAF5F0', fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem' }}>
                      <span style={{ fontSize: '0.95rem', flexShrink: 0, marginTop: 1 }}>{a.included ? '✅' : '❌'}</span>
                      <div>
                        <span style={{ color: a.included ? 'var(--text-dark)' : 'var(--text-muted)', fontWeight: a.included ? 500 : 400 }}>
                          {a.feature.title}
                        </span>
                        {a.quantity && (
                          <span style={{ marginLeft: 4, color: plan.color, fontWeight: 600, fontSize: '0.78rem' }}>
                            ({a.quantity})
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div style={{ marginTop: 20 }}>
                  {isCurrent ? (
                    <div style={{ textAlign: 'center', padding: '10px', borderRadius: 50, background: '#F5F5F5', fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: 'var(--text-mid)', fontSize: '0.88rem' }}>
                      ✓ Current Plan
                    </div>
                  ) : plan.value === 'FREE' ? (
                    <div style={{ textAlign: 'center', padding: '10px', borderRadius: 50, background: '#F5F5F5', fontFamily: "'Outfit',sans-serif", color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                      Default Plan
                    </div>
                  ) : price ? (
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        width: '100%', padding: '12px', borderRadius: 50, border: 'none',
                        background: `linear-gradient(135deg,${plan.color},${plan.color}CC)`,
                        color: '#fff', fontFamily: "'Outfit',sans-serif", fontWeight: 700,
                        fontSize: '0.93rem', cursor: 'pointer', transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                    >
                      Upgrade to {plan.label}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Feature comparison table ── */}
      {plans.length > 0 && allFeatureKeys.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 0' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-dark)', textAlign: 'center', marginBottom: 8 }}>
            Compare All Features
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Outfit',sans-serif", marginBottom: 28, fontSize: '0.9rem' }}>
            See exactly what you get with each plan
          </p>
          <div style={{ overflowX: 'auto', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Outfit',sans-serif" }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#FFF8F2,#FDEEE0)' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.88rem', borderBottom: '2px solid #F0E8E0' }}>
                    Feature
                  </th>
                  {plans.map(p => (
                    <th key={p.id} style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 700, color: p.color, fontSize: '0.88rem', borderBottom: '2px solid #F0E8E0' }}>
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatureKeys.map((key, i) => {
                  const feat = featureByKey[key];
                  return (
                    <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAF9' }}>
                      <td style={{ padding: '11px 20px', color: 'var(--text-dark)', fontSize: '0.86rem', borderBottom: '1px solid #F5EDE6' }}>
                        <span style={{ marginRight: 7 }}>{feat.icon}</span>{feat.title}
                      </td>
                      {plans.map(plan => {
                        const a = getAssignment(plan, key);
                        return (
                          <td key={plan.id} style={{ padding: '11px 20px', textAlign: 'center', fontSize: '0.84rem', borderBottom: '1px solid #F5EDE6' }}>
                            {!a ? (
                              <span style={{ color: '#CCC' }}>—</span>
                            ) : a.included ? (
                              <>
                                <span style={{ color: '#4ABEAA', fontWeight: 700 }}>✓</span>
                                {a.quantity && <div style={{ color: plan.color, fontWeight: 600, fontSize: '0.73rem', marginTop: 2 }}>{a.quantity}</div>}
                              </>
                            ) : (
                              <span style={{ color: '#E0D0C8' }}>✗</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Why upgrade ── */}
      <div style={{ maxWidth: 900, margin: '60px auto 0', padding: '0 20px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-dark)', marginBottom: 8 }}>
          Why Upgrade Your Membership?
        </h2>
        <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg,#F4A435,#E8735A)', borderRadius: 2, margin: '0 auto 32px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 18 }}>
          {[
            { icon: '💌', title: 'More Connections',  desc: 'Send unlimited interests and messages to potential partners' },
            { icon: '🔍', title: 'Smarter Search',    desc: "Advanced filters to find exactly who you're looking for" },
            { icon: '⭐', title: 'Stand Out',         desc: 'Profile highlights and boosts to get noticed by the right people' },
            { icon: '📞', title: 'Direct Contact',    desc: 'Access phone and email of your matches directly' },
            { icon: '🛡️', title: 'Verified Trust',   desc: 'Verification badge builds trust with potential matches' },
            { icon: '🎧', title: 'Priority Help',     desc: 'Dedicated support team to assist your matrimony journey' },
          ].map(b => (
            <div key={b.title} style={{ background: '#fff', borderRadius: 20, padding: '22px 14px', border: '1.5px solid #F0E8E0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.9rem', marginBottom: 10 }}>{b.icon}</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: 6 }}>{b.title}</h3>
              <p style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--text-muted)', fontSize: '0.81rem', lineHeight: 1.55 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 680, margin: '60px auto 0', padding: '0 20px' }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.45rem', color: 'var(--text-dark)', textAlign: 'center', marginBottom: 24 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #F0E8E0', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '15px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: '0.93rem',
                  color: 'var(--text-dark)', textAlign: 'left',
                }}
              >
                {item.q}
                <span style={{ color: '#F4A435', fontWeight: 700, flexShrink: 0, marginLeft: 12, fontSize: '1.1rem' }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 15px', paddingTop: 10, fontFamily: "'Outfit',sans-serif", color: 'var(--text-mid)', fontSize: '0.86rem', lineHeight: 1.65, borderTop: '1px solid #F5EDE6' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Link href="/dashboard" style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--text-muted)', fontSize: '0.88rem', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
