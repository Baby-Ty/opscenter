import type { RiskItem } from './riskTypes';

const STORAGE_KEY = 'oc-risks';

export function loadRisks(): RiskItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RiskItem[];
  } catch {
    return null;
  }
}

export function saveRisks(items: RiskItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function nextRiskId(existing: RiskItem[]): string {
  const nums = existing.map((r) => Number((r.id.match(/RISK-(\d+)/)?.[1] ?? '0'))).filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `RISK-${max + 1}`;
}


