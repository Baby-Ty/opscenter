import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Download } from 'lucide-react';
import type { RiskItem, RiskImpact, RiskLikelihood, RiskPriority, RiskStatus, RiskMitigationItem } from '../lib/riskTypes';
import { riskSeeds } from '../lib/riskSeed';
import { loadRisks, saveRisks, nextRiskId } from '../lib/riskStorage';

type Filters = { severity: 'All' | RiskImpact; status: 'All' | RiskStatus; owner: string };
type SortKey = 'category' | 'title' | 'client' | 'impact' | 'status' | 'priority' | 'owner' | 'date';
type SortState = { key: SortKey; dir: 'asc' | 'desc' };

export default function RisksPageContent() {
  const [items, setItems] = useState<RiskItem[]>(() => loadRisks() ?? riskSeeds);
  const [filters, setFilters] = useState<Filters>({ severity: 'All', status: 'All', owner: '' });
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' });
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => saveRisks(items), [items]);

  // Open drawer when navigated with ?id=RISK-xxx
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) setDrawerId(id);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (filters.severity !== 'All' && r.impact !== filters.severity) return false;
      if (filters.status !== 'All' && r.status !== filters.status) return false;
      if (filters.owner && !r.owner.toLowerCase().includes(filters.owner.toLowerCase())) return false;
      return true;
    });
  }, [items, filters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const va = (a as any)[sort.key];
      const vb = (b as any)[sort.key];
      return String(va).localeCompare(String(vb)) * dir;
    });
    return list;
  }, [filtered, sort]);

  const kpis = useMemo(() => {
    const open = items.filter((r) => r.status !== 'Closed').length;
    const highCrit = items.filter((r) => r.impact === 'High' || r.impact === 'Critical').length;
    const pastDue = items.filter((r) => r.nextReviewDue && r.nextReviewDue < new Date().toISOString().slice(0, 10)).length;
    const mitigationsInProgress = items.reduce((acc, r) => acc + r.mitigations.filter((m) => m.status === 'In Progress').length, 0);
    return { open, highCrit, pastDue, mitigationsInProgress };
  }, [items]);

  function onCreate(draft: Omit<RiskItem, 'id'>) {
    const id = nextRiskId(items);
    setItems([{ id, ...draft }, ...items]);
    setDrawerId(id);
  }
  function onUpdate(updated: RiskItem) { setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r))); }
  function onDelete(id: string) { if (!confirm('Delete this risk?')) return; setItems((prev) => prev.filter((r) => r.id !== id)); setDrawerId(null); }

  function exportPdf() { window.print(); }

  const selected = items.find((r) => r.id === drawerId) ?? null;
  const ownerOptions = useMemo(() => Array.from(new Set(items.map((i) => i.owner))), [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Risk Register</h1>
          <p className="text-sm text-zinc-500">Track and mitigate operational risks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={exportPdf}><Download className="h-4 w-4" /> Export PDF</button>
                     <button className="btn secondary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Risk
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open risks" value={kpis.open} />
        <KpiCard label="High/Critical" value={kpis.highCrit} />
        <KpiCard label="Past-due reviews" value={kpis.pastDue} />
        <KpiCard label="Mitigations in progress" value={kpis.mitigationsInProgress} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <section>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Filters</h2>
            <select className="input" value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value as Filters['severity'] })} aria-label="Severity">
              {(['All', 'Low', 'Medium', 'High', 'Critical'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as Filters['status'] })} aria-label="Status">
              {(['All', 'Open', 'In Review', 'Mitigating', 'Closed'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input" value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })} aria-label="Owner">
              <option value="">All owners</option>
              {ownerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <button className="btn" onClick={() => setFilters({ severity: 'All', status: 'All', owner: '' })}>Clear</button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Category</Th>
                <Th>Title/Ticket</Th>
                <Th>Client</Th>
                <Th>Impact</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Owner</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 cursor-pointer" onClick={() => setDrawerId(r.id)}>
                  <Td>{r.category}</Td>
                  <Td className="font-medium">{r.title}{r.ticket ? ` — ${r.ticket}` : ''}</Td>
                  <Td>{r.client}</Td>
                  <Td><SeverityBadge impact={r.impact}>{r.impact}</SeverityBadge></Td>
                  <Td>{r.status}</Td>
                  <Td>{r.priority}</Td>
                  <Td>{r.owner}</Td>
                  <Td className="tabular-nums">{r.date}</Td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><Td colSpan={8} className="text-center text-zinc-500 py-8">No results</Td></tr>
              )}
            </tbody>
          </table>
        </section>

      </div>

      <AnimatePresence>
        {createOpen && (
          <Dialog title="New Risk" onClose={() => setCreateOpen(false)}>
            <NewRiskForm onCancel={() => setCreateOpen(false)} onSubmit={(draft) => { onCreate(draft); setCreateOpen(false); }} />
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <Drawer onClose={() => setDrawerId(null)}>
            <RiskDrawer item={selected} onUpdate={onUpdate} onDelete={() => onDelete(selected.id)} />
          </Drawer>
        )}
      </AnimatePresence>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">{children}</th>; }
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

function SeverityBadge({ impact, children }: { impact: RiskImpact; children: React.ReactNode }) {
  const map: Record<RiskImpact, string> = {
    Low: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300',
    Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    High: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300',
    Critical: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[impact]}`}>{children}</span>;
}

// Heatmap removed per request

function NewRiskForm({ onSubmit, onCancel }: { onSubmit: (draft: Omit<RiskItem, 'id'>) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Omit<RiskItem, 'id'>>({ category: '', title: '', ticket: '', client: '', owner: '', status: 'Open', priority: 'Medium', impact: 'Medium', likelihood: 'Possible', date: new Date().toISOString().slice(0,10), briefDescription: '', analysis: '', tags: [], mitigations: [], nextReviewDue: '' });
  const [tab, setTab] = useState<'core' | 'analysis' | 'mitigation'>('core');
  const [errors, setErrors] = useState<Record<string, string>>({});
  function validate() { const e: Record<string, string> = {}; if (!draft.title) e.title = 'Required'; if (!draft.client) e.client = 'Required'; if (!draft.owner) e.owner = 'Required'; setErrors(e); return Object.keys(e).length === 0; }
  return (
    <form className="space-y-4 max-h-[75vh] overflow-auto pr-2" onSubmit={(e) => { e.preventDefault(); if (!validate()) return; onSubmit(draft); }}>
      <div className="flex items-center gap-2 text-sm">
        {(['core', 'analysis', 'mitigation'] as const).map((t) => (<button key={t} type="button" className={`px-3 py-1.5 rounded-md border ${tab === t ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>))}
      </div>
      {tab === 'core' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Category" value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} />
          <Input label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} error={errors.title} required />
          <Input label="Ticket" value={draft.ticket || ''} onChange={(v) => setDraft({ ...draft, ticket: v })} />
          <Input label="Client" value={draft.client} onChange={(v) => setDraft({ ...draft, client: v })} error={errors.client} required />
          <Input label="Owner" value={draft.owner} onChange={(v) => setDraft({ ...draft, owner: v })} error={errors.owner} required />
          <Select label="Status" value={draft.status} onChange={(v) => setDraft({ ...draft, status: v as RiskStatus })} options={['Open','In Review','Mitigating','Closed']} />
          <Select label="Priority" value={draft.priority} onChange={(v) => setDraft({ ...draft, priority: v as RiskPriority })} options={['Low','Medium','High','Critical']} />
          <Select label="Impact" value={draft.impact} onChange={(v) => setDraft({ ...draft, impact: v as RiskImpact })} options={['Low','Medium','High','Critical']} />
          <Select label="Likelihood" value={draft.likelihood} onChange={(v) => setDraft({ ...draft, likelihood: v as RiskLikelihood })} options={['Rare','Unlikely','Possible','Likely','Almost Certain']} />
          <Input label="Date" type="date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
          <Input label="Next review due" type="date" value={draft.nextReviewDue || ''} onChange={(v) => setDraft({ ...draft, nextReviewDue: v })} />
        </div>
      )}
      {tab === 'analysis' && (
        <div className="space-y-3">
          <TextArea label="Brief Description" value={draft.briefDescription} onChange={(v) => setDraft({ ...draft, briefDescription: v })} />
          <TextArea label="Analysis" value={draft.analysis} onChange={(v) => setDraft({ ...draft, analysis: v })} />
          <TagsEditor value={draft.tags} onChange={(arr) => setDraft({ ...draft, tags: arr })} />
        </div>
      )}
      {tab === 'mitigation' && (
        <div className="space-y-3">
          <AddMitigationInline onAdd={(m) => setDraft({ ...draft, mitigations: [...draft.mitigations, m] })} />
          <ul className="space-y-2">
            {draft.mitigations.map((m) => (
              <li key={m.id} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="grid sm:grid-cols-2 gap-2 items-center">
                  <input className="input" value={m.title} onChange={(e) => setDraft({ ...draft, mitigations: draft.mitigations.map((x) => x.id === m.id ? { ...x, title: e.target.value } : x) })} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input" placeholder="Owner" value={m.owner} onChange={(e) => setDraft({ ...draft, mitigations: draft.mitigations.map((x) => x.id === m.id ? { ...x, owner: e.target.value } : x) })} />
                    <input className="input" type="date" value={m.dueDate} onChange={(e) => setDraft({ ...draft, mitigations: draft.mitigations.map((x) => x.id === m.id ? { ...x, dueDate: e.target.value } : x) })} />
                    <select className="input" value={m.status} onChange={(e) => setDraft({ ...draft, mitigations: draft.mitigations.map((x) => x.id === m.id ? { ...x, status: e.target.value as RiskMitigationItem['status'] } : x) })}>
                      {(['Open','In Progress','Done'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <button className="btn" type="button" onClick={() => setDraft({ ...draft, mitigations: draft.mitigations.filter((x) => x.id !== m.id) })}>Remove</button>
                </div>
              </li>
            ))}
            {draft.mitigations.length === 0 && <li className="text-sm text-zinc-500">No mitigation steps yet</li>}
          </ul>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn primary" type="submit">Save</button>
      </div>
    </form>
  );
}

function RiskDrawer({ item, onUpdate, onDelete }: { item: RiskItem; onUpdate: (r: RiskItem) => void; onDelete: () => void }) {
  const [working, setWorking] = useState<RiskItem>(item);
  const [tab, setTab] = useState<'overview' | 'analysis' | 'mitigation'>('overview');
  useEffect(() => setWorking(item), [item]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{working.title}</h3>
        <div className="flex items-center gap-2">
          <button className="btn primary" onClick={() => onUpdate(working)}>Save</button>
          <button className="btn danger" onClick={onDelete}>Delete</button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {(['overview','analysis','mitigation'] as const).map((t) => (
          <button key={t} className={`px-3 py-1.5 rounded-md border ${tab === t ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Input label="Category" value={working.category} onChange={(v) => setWorking({ ...working, category: v })} />
          <Input label="Title" value={working.title} onChange={(v) => setWorking({ ...working, title: v })} />
          <Input label="Ticket" value={working.ticket || ''} onChange={(v) => setWorking({ ...working, ticket: v })} />
          <Input label="Client" value={working.client} onChange={(v) => setWorking({ ...working, client: v })} />
          <Input label="Owner" value={working.owner} onChange={(v) => setWorking({ ...working, owner: v })} />
          <Select label="Status" value={working.status} onChange={(v) => setWorking({ ...working, status: v as RiskStatus })} options={['Open','In Review','Mitigating','Closed']} />
          <Select label="Priority" value={working.priority} onChange={(v) => setWorking({ ...working, priority: v as RiskPriority })} options={['Low','Medium','High','Critical']} />
          <Select label="Impact" value={working.impact} onChange={(v) => setWorking({ ...working, impact: v as RiskImpact })} options={['Low','Medium','High','Critical']} />
          <Select label="Likelihood" value={working.likelihood} onChange={(v) => setWorking({ ...working, likelihood: v as RiskLikelihood })} options={['Rare','Unlikely','Possible','Likely','Almost Certain']} />
          <Input label="Date" type="date" value={working.date} onChange={(v) => setWorking({ ...working, date: v })} />
          <Input label="Next review due" type="date" value={working.nextReviewDue || ''} onChange={(v) => setWorking({ ...working, nextReviewDue: v })} />
        </div>
      )}
      {tab === 'analysis' && (
        <div className="space-y-3">
          <TextArea label="Brief Description" value={working.briefDescription} onChange={(v) => setWorking({ ...working, briefDescription: v })} />
          <TextArea label="Analysis" value={working.analysis} onChange={(v) => setWorking({ ...working, analysis: v })} />
          <TagsEditor value={working.tags} onChange={(arr) => setWorking({ ...working, tags: arr })} />
        </div>
      )}
      {tab === 'mitigation' && (
        <div className="space-y-3">
          <AddMitigationInline onAdd={(m) => setWorking({ ...working, mitigations: [...working.mitigations, m] })} />
          <ul className="space-y-2">
            {working.mitigations.map((m) => (
              <li key={m.id} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                <div className="grid sm:grid-cols-2 gap-2 items-center">
                  <input className="input" value={m.title} onChange={(e) => setWorking({ ...working, mitigations: working.mitigations.map((x) => x.id === m.id ? { ...x, title: e.target.value } : x) })} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input" placeholder="Owner" value={m.owner} onChange={(e) => setWorking({ ...working, mitigations: working.mitigations.map((x) => x.id === m.id ? { ...x, owner: e.target.value } : x) })} />
                    <input className="input" type="date" value={m.dueDate} onChange={(e) => setWorking({ ...working, mitigations: working.mitigations.map((x) => x.id === m.id ? { ...x, dueDate: e.target.value } : x) })} />
                    <select className="input" value={m.status} onChange={(e) => setWorking({ ...working, mitigations: working.mitigations.map((x) => x.id === m.id ? { ...x, status: e.target.value as RiskMitigationItem['status'] } : x) })}>
                      {(['Open','In Progress','Done'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <button className="btn" onClick={() => setWorking({ ...working, mitigations: working.mitigations.filter((x) => x.id !== m.id) })}>Remove</button>
                </div>
              </li>
            ))}
            {working.mitigations.length === 0 && <li className="text-sm text-zinc-500">No mitigation steps yet</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function TagsEditor({ value, onChange }: { value: string[]; onChange: (arr: string[]) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs">
            {t}
            <button className="text-zinc-500 hover:text-zinc-700" onClick={() => onChange(value.filter((_, idx) => idx !== i))} aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input className="input" placeholder="Add tag" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && text) { onChange([...value, text]); setText(''); } }} />
        <button className="btn" onClick={() => { if (!text) return; onChange([...value, text]); setText(''); }}>Add</button>
      </div>
    </div>
  );
}

function AddMitigationInline({ onAdd }: { onAdd: (m: RiskMitigationItem) => void }) {
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_10rem_auto] gap-2">
      <input className="input" placeholder="Mitigation step" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="input" placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
      <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <button className="btn" onClick={() => { if (!title) return; onAdd({ id: crypto.randomUUID(), title, owner, dueDate: due, status: 'Open' }); setTitle(''); setOwner(''); setDue(''); }}>Add mitigation</button>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; error?: string }) { return (<label className="text-sm grid gap-1"><span>{label} {required && <span className="text-red-600">*</span>}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`input ${error ? 'border-red-500' : ''}`} />{error && <span className="text-xs text-red-600">{error}</span>}</label>); }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) { return (<label className="text-sm grid gap-1"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="input">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>); }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return (<label className="text-sm grid gap-1"><span>{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="input min-h-[80px]" /></label>); }


