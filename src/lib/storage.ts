import type { RfcItem } from './types';

const STORAGE_KEY = 'oc-rfcs';

export function loadRfcs(): RfcItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RfcItem[];
  } catch (err) {
    return null;
  }
}

export function saveRfcs(items: RfcItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    // ignore
  }
}

export function nextRfcId(existing: RfcItem[]): string {
  const nums = existing
    .map((r) => Number((r.id.match(/RFC-(\d+)/)?.[1] ?? '0')))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `RFC-${max + 1}`;
}


