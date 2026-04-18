'use client';
import { useLangStore } from '@/store/langStore';

interface TranslatableLookup {
  name?: string | null;
  label?: string | null;
  nameTa?: string | null;
  nameSi?: string | null;
  labelTa?: string | null;
  labelSi?: string | null;
}

export function useLookupLabel() {
  const locale = useLangStore((s) => s.locale);

  function getLabel(item: TranslatableLookup | null | undefined): string {
    if (!item) return '';
    const base = item.name ?? item.label ?? '';
    if (locale === 'ta') return item.nameTa || item.labelTa || base;
    if (locale === 'si') return item.nameSi || item.labelSi || base;
    return base;
  }

  return { getLabel };
}
