import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Download, ChevronUp, ChevronDown } from 'lucide-react';
import type { RcaItem, RcaStatus, RcaActionItem } from '../lib/rcaTypes';
import { rcaSeeds } from '../lib/rcaSeed';
import { loadRcas, saveRcas, nextRcaId } from '../lib/rcaStorage';

type Filters = { status: 'All' | RcaStatus; customer: string; owner: string };
type SortKey = 'id' | 'title' | 'client' | 'owner' | 'status' | 'updatedAt' | 'actionsOpen';
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

export default function RcaPage() {
  const [items, setItems] = useState<RcaItem[]>(() => loadRcas() ?? rcaSeeds);
  const [filters, setFilters] = useState<Filters>({ status: 'All', customer: '', owner: '' });
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: 'updatedAt', dir: 'desc' });
  const [searchParams] = useSearchParams();

  useEffect(() => saveRcas(items), [items]);

  // Open drawer when navigated with ?id=RCA-xxx
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) setDrawerId(id);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (filters.status !== 'All' && r.status !== filters.status) return false;
      if (filters.customer && !r.client.toLowerCase().includes(filters.customer.toLowerCase())) return false;
      if (filters.owner && !r.owner.toLowerCase().includes(filters.owner.toLowerCase())) return false;
      return true;
    });
  }, [items, filters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const key = sort.key;
      const valA = key === 'actionsOpen' ? a.actions.filter((x) => x.status !== 'Done').length : (a as any)[key];
      const valB = key === 'actionsOpen' ? b.actions.filter((x) => x.status !== 'Done').length : (b as any)[key];
      if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * dir;
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
      return String(valA).localeCompare(String(valB)) * dir;
    });
    return list;
  }, [filtered, sort]);

  const kpis = useMemo(() => {
    const open = items.filter((r) => r.status !== 'Closed').length;
    const now = new Date();
    const last30 = items.filter((r) => r.status === 'Closed' && r.closedAt && (now.getTime() - new Date(r.closedAt).getTime()) / 86400000 <= 30).length;
    const avgCloseDays = (() => {
      const closed = items.filter((r) => r.closedAt);
      if (closed.length === 0) return 0;
      const days = closed.map((r) => (new Date(r.closedAt!).getTime() - new Date(r.createdAt).getTime()) / 86400000);
      return Math.round(days.reduce((a, b) => a + b, 0) / closed.length);
    })();
    const overdueActions = items.reduce((acc, r) => acc + r.actions.filter((a) => isOverdue(a)).length, 0);
    return { open, last30, avgCloseDays, overdueActions };
  }, [items]);

  function onCreate(draft: Omit<RcaItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = nextRcaId(items);
    const now = new Date().toISOString();
    setItems([{ id, createdAt: now, updatedAt: now, ...draft }, ...items]);
    setDrawerId(id);
  }

  function onUpdate(updated: RcaItem) {
    setItems((prev) => prev.map((r) => (r.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : r)));
  }

  function onDelete(id: string) {
    if (!confirm('Delete this RCA?')) return;
    setItems((prev) => prev.filter((r) => r.id !== id));
    setDrawerId(null);
  }

  function onCloseRca(id: string) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Closed', closedAt: new Date().toISOString() } : r)));
  }

  function exportJson() {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rca-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const selected = items.find((r) => r.id === drawerId) ?? null;

  const customerOptions = useMemo(() => Array.from(new Set(items.map((i) => i.client))), [items]);
  const ownerOptions = useMemo(() => Array.from(new Set(items.map((i) => i.owner))), [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Root Cause</h1>
          <p className="text-sm text-zinc-500">Analyze and action incidents to prevent repeats.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={exportJson}><Download className="h-4 w-4" /> Export JSON</button>
                     <button className="btn secondary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New RCA
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open RCAs" value={kpis.open} />
        <KpiCard label="Overdue actions" value={kpis.overdueActions} />
        <KpiCard label="Closed last 30d" value={kpis.last30} />
        <KpiCard label="Avg time to close (days)" value={kpis.avgCloseDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-3">Filters</h2>
            <div className="space-y-3">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as Filters['status'] })} className="input" aria-label="Status">
                {(['All', 'Open', 'In analysis', 'Actioning', 'Closed'] as const).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className="input" aria-label="Customer">
                <option value="">All customers</option>
                {customerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })} className="input" aria-label="Owner">
                <option value="">All owners</option>
                {ownerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <button className="btn" onClick={() => setFilters({ status: 'All', customer: '', owner: '' })}>Clear</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <SortableTh label="RCA ID" sortKey="id" sort={sort} setSort={setSort} />
                <SortableTh label="Title" sortKey="title" sort={sort} setSort={setSort} />
                <SortableTh label="Client" sortKey="client" sort={sort} setSort={setSort} />
                <SortableTh label="Owner" sortKey="owner" sort={sort} setSort={setSort} />
                <SortableTh label="Status" sortKey="status" sort={sort} setSort={setSort} />
                <SortableTh label="Last update" sortKey="updatedAt" sort={sort} setSort={setSort} />
                <SortableTh label="Actions open" sortKey="actionsOpen" sort={sort} setSort={setSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 cursor-pointer" onClick={() => setDrawerId(r.id)}>
                  <Td>{r.id}</Td>
                  <Td className="font-medium">{r.title}</Td>
                  <Td>{r.client}</Td>
                  <Td>{r.owner}</Td>
                  <Td><Badge tone={r.status}>{r.status}</Badge></Td>
                  <Td className="tabular-nums">{r.updatedAt.slice(0, 10)}</Td>
                  <Td>{r.actions.filter((a) => a.status !== 'Done').length}</Td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <Td colSpan={7} className="text-center text-zinc-500 py-8">No results</Td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <AnimatePresence>
      {createOpen && (
        <Dialog title="New RCA" onClose={() => setCreateOpen(false)}>
          <NewRcaForm
            onCancel={() => setCreateOpen(false)}
            onSubmit={(draft) => {
              onCreate(draft);
              setCreateOpen(false);
            }}
          />
        </Dialog>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {selected && (
        <Drawer onClose={() => setDrawerId(null)}>
          <RcaDrawer item={selected} onUpdate={onUpdate} onDelete={() => onDelete(selected.id)} onCloseRca={() => onCloseRca(selected.id)} />
        </Drawer>
      )}
      </AnimatePresence>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">{children}</th>; }
function SortableTh({ label, sortKey, sort, setSort }: { label: string; sortKey: SortKey; sort: SortState; setSort: (s: SortState) => void }) {
  const active = sort.key === sortKey;
  const dir = active ? sort.dir : undefined;
  function toggle() {
    if (!active) setSort({ key: sortKey, dir: 'asc' });
    else setSort({ key: sortKey, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
  }
  return (
    <th className="text-left px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300 select-none">
      <button onClick={toggle} className="inline-flex items-center gap-1 focus-ring rounded">
        {label}
        {dir === 'asc' && <ChevronUp className="h-4 w-4" />}
        {dir === 'desc' && <ChevronDown className="h-4 w-4" />}
      </button>
    </th>
  );
}
function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) { return <td colSpan={colSpan} className={`px-3 py-2 ${className}`}>{children}</td>; }

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950 shadow-sm">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center p-4" onKeyDown={(e) => e.key === 'Escape' && onClose()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <button className="text-zinc-500 hover:text-zinc-700" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div role="dialog" aria-modal="true" className="fixed inset-0 z-50" onKeyDown={(e) => e.key === 'Escape' && onClose()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }} className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl p-4 overflow-auto">
        {children}
      </motion.div>
    </motion.div>
  );
}

function NewRcaForm({ onSubmit, onCancel }: { onSubmit: (draft: Omit<RcaItem, 'id' | 'createdAt' | 'updatedAt'>) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Omit<RcaItem, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    client: '',
    owner: '',
    supportManager: '',
    slm: '',
    status: 'Open',
    method: '',
    slaType: '',
    summary: '',
    linkedIncidentIds: [],
    findings: [],
    actions: [],
    timeline: [],
    closedAt: undefined,
  });

  const [tab, setTab] = useState<'core' | 'findings' | 'actions' | 'timeline'>('core');
  const [errors, setErrors] = useState<Record<string, string>>({});
  function validate() {
    const e: Record<string, string> = {};
    if (!draft.title) e.title = 'Required';
    if (!draft.client) e.client = 'Required';
    if (!draft.owner) e.owner = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <form className="space-y-4 max-h-[75vh] overflow-auto pr-2" onSubmit={(e) => { e.preventDefault(); if (!validate()) return; onSubmit(draft); }}>
      <div className="flex items-center gap-2 text-sm">
        {(['core', 'findings', 'actions', 'timeline'] as const).map((t) => (
          <button key={t} type="button" className={`px-3 py-1.5 rounded-md border ${tab === t ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'core' && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} error={errors.title} required />
            <Input label="Client" value={draft.client} onChange={(v) => setDraft({ ...draft, client: v })} error={errors.client} required />
            <Input label="Owner" value={draft.owner} onChange={(v) => setDraft({ ...draft, owner: v })} error={errors.owner} required />
            <Input label="Support Manager" value={draft.supportManager} onChange={(v) => setDraft({ ...draft, supportManager: v })} />
            <Select label="Status" value={draft.status} onChange={(v) => setDraft({ ...draft, status: v as RcaItem['status'] })} options={['Open', 'In analysis', 'Actioning', 'Closed']} />
          </div>
          <TextArea label="Summary" value={draft.summary} onChange={(v) => setDraft({ ...draft, summary: v })} />
          <div>
            <div className="text-xs text-zinc-500 mb-1">Linked Incidents</div>
            <LinkedIdsEditor value={draft.linkedIncidentIds} onChange={(arr) => setDraft({ ...draft, linkedIncidentIds: arr })} />
          </div>
        </div>
      )}

      {tab === 'findings' && (
        <div className="space-y-3">
          <AddInline onAdd={(text) => text && setDraft({ ...draft, findings: [...draft.findings, text] })} placeholder="Add finding" />
          <ul className="space-y-2">
            {draft.findings.map((f, i) => (
              <li key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <input className="input" value={f} onChange={(e) => setDraft({ ...draft, findings: draft.findings.map((x, idx) => (idx === i ? e.target.value : x)) })} />
                  <button className="btn" type="button" onClick={() => setDraft({ ...draft, findings: draft.findings.filter((_, idx) => idx !== i) })}>Remove</button>
                </div>
              </li>
            ))}
            {draft.findings.length === 0 && <li className="text-sm text-zinc-500">No findings yet</li>}
          </ul>
        </div>
      )}

      {tab === 'actions' && (
        <div className="space-y-3">
          <AddActionInline onAdd={(a) => setDraft({ ...draft, actions: [...draft.actions, a] })} />
          <ul className="space-y-2">
            {draft.actions.map((a) => (
              <li key={a.id} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="grid sm:grid-cols-2 gap-2 items-center">
                  <input className="input" value={a.title} onChange={(e) => setDraft({ ...draft, actions: draft.actions.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)) })} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input" placeholder="Owner" value={a.owner} onChange={(e) => setDraft({ ...draft, actions: draft.actions.map((x) => (x.id === a.id ? { ...x, owner: e.target.value } : x)) })} />
                    <input className="input" type="date" value={a.dueDate} onChange={(e) => setDraft({ ...draft, actions: draft.actions.map((x) => (x.id === a.id ? { ...x, dueDate: e.target.value } : x)) })} />
                    <select className="input" value={a.status} onChange={(e) => setDraft({ ...draft, actions: draft.actions.map((x) => (x.id === a.id ? { ...x, status: e.target.value as RcaActionItem['status'] } : x)) })}>
                      {(['Open', 'In Progress', 'Done'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <button className="btn" type="button" onClick={() => setDraft({ ...draft, actions: draft.actions.filter((x) => x.id !== a.id) })}>Remove</button>
                </div>
              </li>
            ))}
            {draft.actions.length === 0 && <li className="text-sm text-zinc-500">No actions yet</li>}
          </ul>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-3">
          <AddTimelineInline onAdd={(t) => setDraft({ ...draft, timeline: [...draft.timeline, t] })} />
          <ul className="space-y-2">
            {draft.timeline.map((t, i) => (
              <li key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="text-xs text-zinc-500">{t.ts}</div>
                <div className="text-sm">{t.note}</div>
              </li>
            ))}
            {draft.timeline.length === 0 && <li className="text-sm text-zinc-500">No events yet</li>}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary">Save</button>
      </div>
    </form>
  );
}

function RcaDrawer({ item, onUpdate, onDelete, onCloseRca }: { item: RcaItem; onUpdate: (r: RcaItem) => void; onDelete: () => void; onCloseRca: () => void }) {
  const [tab, setTab] = useState<'overview' | 'findings' | 'actions' | 'timeline'>('overview');
  const [working, setWorking] = useState<RcaItem>(item);
  useEffect(() => setWorking(item), [item]);
  const [editingOverview, setEditingOverview] = useState(false);

  function pushFinding() {
    const text = prompt('Add finding');
    if (!text) return;
    onUpdate({ ...working, findings: [...working.findings, text] });
  }
  function deleteFinding(idx: number) {
    onUpdate({ ...working, findings: working.findings.filter((_, i) => i !== idx) });
  }
  function addAction() {
    const title = prompt('Action title');
    if (!title) return;
    const owner = prompt('Owner') || '';
    const dueDate = prompt('Due date (yyyy-mm-dd)') || '';
    const a: RcaActionItem = { id: crypto.randomUUID(), title, owner, dueDate, status: 'Open' };
    onUpdate({ ...working, actions: [...working.actions, a] });
  }
  function updateAction(id: string, patch: Partial<RcaActionItem>) {
    onUpdate({ ...working, actions: working.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  }
  function deleteAction(id: string) { onUpdate({ ...working, actions: working.actions.filter((a) => a.id !== id) }); }
  function addTimeline() {
    const ts = prompt('Timestamp (keep EST label)') || '';
    const note = prompt('Note') || '';
    if (!ts || !note) return;
    onUpdate({ ...working, timeline: [...working.timeline, { ts, note }] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{working.title}</h3>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => setEditingOverview((v) => !v)}>{editingOverview ? 'Cancel' : 'Edit Overview'}</button>
          {editingOverview && <button className="btn primary" onClick={() => { onUpdate(working); setEditingOverview(false); }}>Save</button>}
          {working.status !== 'Closed' && <button className="btn" onClick={onCloseRca}>Close RCA</button>}
          <button className="btn danger" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {(['overview', 'findings', 'actions', 'timeline'] as const).map((t) => (
          <button key={t} className={`px-3 py-1.5 rounded-md border ${tab === t ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <KV k="RCA ID" v={working.id} />
          {editingOverview ? <Input label="Title" value={working.title} onChange={(v) => setWorking({ ...working, title: v })} /> : <KV k="Title" v={working.title} />}
          {editingOverview ? <Input label="Client" value={working.client} onChange={(v) => setWorking({ ...working, client: v })} /> : <KV k="Client" v={working.client} />}
          {editingOverview ? <Input label="Owner" value={working.owner} onChange={(v) => setWorking({ ...working, owner: v })} /> : <KV k="Owner" v={working.owner} />}
          {editingOverview ? <Input label="Support Manager" value={working.supportManager} onChange={(v) => setWorking({ ...working, supportManager: v })} /> : <KV k="Support Manager" v={working.supportManager} />}
          {editingOverview ? (
            <Select label="Status" value={working.status} onChange={(v) => setWorking({ ...working, status: v as RcaItem['status'] })} options={['Open', 'In analysis', 'Actioning', 'Closed']} />
          ) : (
            <KV k="Status" v={working.status} />
          )}
          <KV k="Created" v={working.createdAt} />
          <KV k="Updated" v={working.updatedAt} />
          {editingOverview ? <TextArea label="Summary" value={working.summary} onChange={(v) => setWorking({ ...working, summary: v })} /> : <div className="sm:col-span-2"><KV k="Summary" v={working.summary} /></div>}
          <div className="sm:col-span-2">
            <div className="text-xs text-zinc-500 mb-1">Linked Incidents</div>
            {editingOverview ? (
              <LinkedIdsEditor value={working.linkedIncidentIds} onChange={(arr) => setWorking({ ...working, linkedIncidentIds: arr })} />
            ) : (
              <div className="flex flex-wrap gap-2">{working.linkedIncidentIds.map((id) => <span key={id} className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs">{id}</span>)}</div>
            )}
          </div>
        </div>
      )}

      {tab === 'findings' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500">What could have been done differently</div>
            <AddInline onAdd={(text) => text && onUpdate({ ...working, findings: [...working.findings, text] })} placeholder="Add finding" />
          </div>
          <ul className="space-y-2">
            {working.findings.map((f, i) => (
              <li key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <input className="input" value={f} onChange={(e) => onUpdate({ ...working, findings: working.findings.map((x, idx) => (idx === i ? e.target.value : x)) })} />
                  <button className="btn" onClick={() => deleteFinding(i)}>Remove</button>
                </div>
              </li>
            ))}
            {working.findings.length === 0 && <li className="text-sm text-zinc-500">No findings yet</li>}
          </ul>
        </div>
      )}

      {tab === 'actions' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500">Service Improvement Steps</div>
            <AddActionInline onAdd={(a) => onUpdate({ ...working, actions: [...working.actions, a] })} />
          </div>
          <ul className="space-y-2">
            {working.actions.map((a) => {
              const overdue = isOverdue(a);
              return (
                <li key={a.id} className={`rounded-md border p-2 ${overdue ? 'border-rose-300 dark:border-rose-900' : 'border-zinc-200 dark:border-zinc-800'}`}>
                  <div className="grid sm:grid-cols-2 gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={a.status === 'Done'} onChange={(e) => updateAction(a.id, { status: e.target.checked ? 'Done' : 'Open' })} />
                      <input className="input" value={a.title} onChange={(e) => updateAction(a.id, { title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input className="input" placeholder="Owner" value={a.owner} onChange={(e) => updateAction(a.id, { owner: e.target.value })} />
                      <input className="input" type="date" value={a.dueDate} onChange={(e) => updateAction(a.id, { dueDate: e.target.value })} />
                      <select className="input" value={a.status} onChange={(e) => updateAction(a.id, { status: e.target.value as RcaActionItem['status'] })}>
                        {(['Open', 'In Progress', 'Done'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>{overdue ? <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">Overdue</span> : <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">On track</span>}</span>
                    <button className="btn" onClick={() => deleteAction(a.id)}>Remove</button>
                  </div>
                </li>
              );
            })}
            {working.actions.length === 0 && <li className="text-sm text-zinc-500">No actions yet</li>}
          </ul>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-500">Timeline (timestamps shown as EST)</div>
            <AddTimelineInline onAdd={(t) => onUpdate({ ...working, timeline: [...working.timeline, t] })} />
          </div>
          <ul className="space-y-2">
            {working.timeline.map((t, i) => (
              <li key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="text-xs text-zinc-500">{t.ts}</div>
                <div className="text-sm">{t.note}</div>
              </li>
            ))}
            {working.timeline.length === 0 && <li className="text-sm text-zinc-500">No events yet</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) { return (<div><div className="text-xs text-zinc-500">{k}</div><div className="font-medium">{v || '-'}</div></div>); }
function Input({ label, value, onChange, type = 'text', required, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; error?: string }) { return (<label className="text-sm grid gap-1"><span>{label} {required && <span className="text-red-600">*</span>}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`input ${error ? 'border-red-500' : ''}`} />{error && <span className="text-xs text-red-600">{error}</span>}</label>); }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) { return (<label className="text-sm grid gap-1"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="input">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>); }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return (<label className="text-sm grid gap-1"><span>{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="input min-h-[80px]" /></label>); }

function isOverdue(a: RcaActionItem): boolean {
  if (!a.dueDate || a.status === 'Done') return false;
  const today = new Date().toISOString().slice(0, 10);
  return a.dueDate < today;
}

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    Open: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
    'In analysis': 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    Actioning: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
    Closed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  };
  const cls = map[tone] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{children}</span>;
}

function AddInline({ onAdd, placeholder }: { onAdd: (text: string) => void; placeholder: string }) {
  const [text, setText] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input className="input" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(text.trim()); setText(''); } }} />
      <button className="btn" onClick={() => { onAdd(text.trim()); setText(''); }}>Add</button>
    </div>
  );
}

function AddActionInline({ onAdd }: { onAdd: (a: RcaActionItem) => void }) {
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_10rem_auto] gap-2">
      <input className="input" placeholder="Action title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="input" placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
      <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <button className="btn" onClick={() => { if (!title) return; onAdd({ id: crypto.randomUUID(), title, owner, dueDate: due, status: 'Open' }); setTitle(''); setOwner(''); setDue(''); }}>Add action</button>
    </div>
  );
}

function AddTimelineInline({ onAdd }: { onAdd: (t: { ts: string; note: string }) => void }) {
  const [ts, setTs] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[16rem_1fr_auto] gap-2">
      <input className="input" placeholder="Timestamp (e.g., 2025-06-06 12:06 EST)" value={ts} onChange={(e) => setTs(e.target.value)} />
      <input className="input" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn" onClick={() => { if (!ts || !note) return; onAdd({ ts, note }); setTs(''); setNote(''); }}>Add event</button>
    </div>
  );
}

function LinkedIdsEditor({ value, onChange }: { value: string[]; onChange: (arr: string[]) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((id, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs">
            {id}
            <button className="text-zinc-500 hover:text-zinc-700" onClick={() => onChange(value.filter((_, idx) => idx !== i))} aria-label={`Remove ${id}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input className="input" placeholder="Add incident id" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && text) { onChange([...value, text]); setText(''); } }} />
        <button className="btn" onClick={() => { if (!text) return; onChange([...value, text]); setText(''); }}>Add</button>
      </div>
    </div>
  );
}



