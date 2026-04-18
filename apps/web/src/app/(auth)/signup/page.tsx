import { Suspense } from 'react';
import SignupForm, { type LookupGender, type LookupPartnerType } from './SignupForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchLookupData(): Promise<{ genders: LookupGender[]; partnerTypes: LookupPartnerType[] }> {
  try {
    const res = await fetch(`${API_URL}/api/profiles/lookup`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('lookup failed');
    const data = await res.json();
    return {
      genders: data.genders ?? [],
      partnerTypes: data.partnerTypes ?? [],
    };
  } catch {
    // If API is unreachable during build/render, return empty — form handles this gracefully
    return { genders: [], partnerTypes: [] };
  }
}

export default async function SignupPage() {
  const { genders, partnerTypes } = await fetchLookupData();

  return (
    <Suspense>
      <SignupForm genders={genders} partnerTypes={partnerTypes} />
    </Suspense>
  );
}
