/**
 * Shared helpers for profile forms.
 * Enum-based dropdown options (marital status, eating habits, etc.) are now
 * served from the database via GET /api/profiles/lookup — do NOT add them back here.
 */

/**
 * Derive unique currencies from the lookup countries array.
 * Returns sorted list of { value: 'LKR', label: 'LKR (Sri Lanka)' }
 * Falls back to a hardcoded minimal list while lookup is loading.
 */
export function buildCurrencyOptions(
  countries: { name: string; currency?: string | null }[],
): { value: string; label: string }[] {
  const seen = new Set<string>();
  const result: { value: string; label: string }[] = [];
  for (const c of countries) {
    if (c.currency && !seen.has(c.currency)) {
      seen.add(c.currency);
      result.push({ value: c.currency, label: `${c.currency} — ${c.name}` });
    }
  }
  return result.sort((a, b) => {
    // LKR first, then alphabetical
    if (a.value === 'LKR') return -1;
    if (b.value === 'LKR') return 1;
    return a.value.localeCompare(b.value);
  });
}
