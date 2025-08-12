import type { RcaItem } from './rcaTypes';

const STORAGE_KEY = 'oc-rcas';

export function loadRcas(): RcaItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RcaItem[];
  } catch {
    return null;
  }
}

export function saveRcas(items: RcaItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function nextRcaId(existing: RcaItem[]): string {
  const nums = existing
    .map((r) => Number((r.id.match(/RCA-(\d+)/)?.[1] ?? '0')))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `RCA-${max + 1}`;
}


