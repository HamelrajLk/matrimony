'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MatchmakerProfileForm from '@/components/matchmaker/MatchmakerProfileForm';

function NewMatchmakerProfilePageInner() {
  const searchParams = useSearchParams();
  const gender = searchParams.get('gender') ?? '';
  return <MatchmakerProfileForm prefillGender={gender} />;
}

export default function NewMatchmakerProfilePage() {
  return (
    <Suspense fallback={null}>
      <NewMatchmakerProfilePageInner />
    </Suspense>
  );
}
