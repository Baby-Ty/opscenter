import type { KnowledgeAssignment, KnowledgeSnapshot, KnowledgeSection } from './knowledgeTypes';

const STORAGE_KEY = 'oc-knowledge-assignments-v1';
const FOCUS_KEY = 'oc-knowledge-week-focus-v1';

export function loadKnowledge(): KnowledgeAssignment[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KnowledgeSnapshot | KnowledgeAssignment[];
    // Backward/forward compat if we ever wrap in an object
    return Array.isArray(parsed) ? parsed : parsed.assignments;
  } catch (err) {
    return null;
  }
}

export function saveKnowledge(assignments: KnowledgeAssignment[]) {
  try {
    const snapshot: KnowledgeSnapshot = { assignments };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    // ignore
  }
}

export function nextKnowledgeId(existing: KnowledgeAssignment[]): string {
  const nums = existing
    .map((a) => Number((a.id.match(/KC-(\d+)/)?.[1] ?? '0')))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `KC-${max + 1}`;
}

export function getIsoWeek(date: Date): string {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = tmp.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

export function defaultDueDateForWeek(isoWeek: string): string {
  // Return Friday of the given ISO week in yyyy-mm-dd
  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);
  // ISO week: Thursday is in week year. Start from Jan 4th to get week 1
  const simple = new Date(Date.UTC(year, 0, 4));
  const dow = simple.getUTCDay() || 7;
  const week1Monday = new Date(simple);
  week1Monday.setUTCDate(simple.getUTCDate() - (dow - 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  const y = friday.getUTCFullYear();
  const m = String(friday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(friday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  'Active Directory',
  'Applications',
  'Backup',
  'Change Control Request',
  'Email',
  'File Sharing',
  'Generic Note',
  'Grants Funding',
  'Hosted Services',
  'Internet/WAN',
  'LAN',
  'Licensing',
  'Printing',
  'Remote Access',
  'Security',
  'Site Summary',
  'Student Inventory Tracking',
  'Vendors',
  'Virtualization',
  'Voice/PBX',
  'VPN',
  'Wireless',
  'Checklists',
  'Configurations',
  'Contacts',
  'Documents',
  'Domain Tracker',
  'Locations',
  'Networks',
  'Passwords',
  'SSL Tracker',
];

export const KNOWLEDGE_ENGINEERS: string[] = [
  'Alice',
  'Bob',
  'Charlie',
  'Danielle',
];

export const KNOWLEDGE_COMPANIES: { id: string; name: string }[] = [
  { id: 'C01', name: 'Acme Industries' },
  { id: 'C02', name: 'Globex Corp' },
  { id: 'C03', name: 'Initech' },
  { id: 'C04', name: 'Umbrella Health' },
  { id: 'C05', name: 'Hooli Systems' },
  { id: 'C06', name: 'Soylent Foods' },
  { id: 'C07', name: 'Stark Manufacturing' },
  { id: 'C08', name: 'Wayne Enterprises' },
];

const COLS_KEY = 'oc-knowledge-visible-cols-v1';
export function loadVisibleColumns(): KnowledgeSection[] | null {
  try {
    const raw = localStorage.getItem(COLS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KnowledgeSection[];
    return parsed.filter((s) => KNOWLEDGE_SECTIONS.includes(s));
  } catch {
    return null;
  }
}
export function saveVisibleColumns(cols: KnowledgeSection[]) {
  try {
    const valid = cols.filter((s) => KNOWLEDGE_SECTIONS.includes(s));
    localStorage.setItem(COLS_KEY, JSON.stringify(valid));
  } catch {
    // ignore
  }
}

type WeekFocusMap = Record<string, string[]>; // weekIso -> companyIds
export function getWeekFocusCompanies(weekIso: string): string[] {
  try {
    const raw = localStorage.getItem(FOCUS_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as WeekFocusMap;
    const arr = map[weekIso] ?? [];
    return arr.filter((id) => KNOWLEDGE_COMPANIES.some((c) => c.id === id)).slice(0, 4);
  } catch {
    return [];
  }
}
export function setWeekFocusCompanies(weekIso: string, companyIds: string[]) {
  try {
    const raw = localStorage.getItem(FOCUS_KEY);
    const map: WeekFocusMap = raw ? (JSON.parse(raw) as WeekFocusMap) : {};
    map[weekIso] = companyIds.filter((id) => KNOWLEDGE_COMPANIES.some((c) => c.id === id)).slice(0, 4);
    localStorage.setItem(FOCUS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}


