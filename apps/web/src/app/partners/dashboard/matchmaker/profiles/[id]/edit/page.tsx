'use client';
import { use } from 'react';
import MatchmakerProfileForm from '@/components/matchmaker/MatchmakerProfileForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditMatchmakerProfilePage({ params }: Props) {
  const { id } = use(params);
  return <MatchmakerProfileForm profileId={Number(id)} />;
}
