'use client';
import { useEffect } from 'react';
import { useLangStore } from '@/store/langStore';

export default function HtmlLangSync() {
  const locale = useLangStore((s) => s.locale);
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);
  return null;
}
