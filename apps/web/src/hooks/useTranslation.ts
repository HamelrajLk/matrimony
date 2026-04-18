'use client';
import { useLangStore } from '@/store/langStore';
import en from '@/i18n/en.json';
import ta from '@/i18n/ta.json';
import si from '@/i18n/si.json';

const dicts = { en, ta, si } as const;

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function useTranslation() {
  const locale = useLangStore((s) => s.locale);

  function t(path: string, fallback?: string): string {
    return (
      getNestedValue(dicts[locale], path) ??
      getNestedValue(dicts['en'], path) ??
      fallback ??
      path
    );
  }

  return { t, locale };
}
