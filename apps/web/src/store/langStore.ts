'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'ta' | 'si';

interface LangState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'twp-lang' }
  )
);
