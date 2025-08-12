import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft, Check, X, Filter } from 'lucide-react';
import type { RfcItem, RfcPriority, RfcStatus, ApprovalEntry } from '../lib/types';
import { rfcSeeds } from '../lib/seed';
import { loadRfcs, saveRfcs, nextRfcId } from '../lib/storage';
import type React from 'react';

type View = 'dashboard' | 'detail';

type Filters = {
  q: string;
  status: 'All' | RfcStatus;
  priority: 'All' | RfcPriority;
  onlyMine: boolean;
};

const statusOptions: Array<'All' | RfcStatus> = [
  'All',
  'Draft',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Scheduled',
  'In Progress',
  'Completed',
];

const priorityOptions: Array<'All' | RfcPriority> = ['All', 'High', 'Medium', 'Low'];

export default function RfcPage() {
  const [items, setItems] = useState<RfcItem[]>(() => loadRfcs() ?? rfcSeeds);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ q: '', status: 'All', priority: 'All', onlyMine: false });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    saveRfcs(items);
  }, [items]);

  // Open detail view when navigated with ?id=RFC-1234
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedId(id);
      setView('detail');
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return items.filter((r) => {
      if (filters.status !== 'All' && r.status !== filters.status) return false;
      if (filters.priority !== 'All' && r.priority !== filters.priority) return false;
      if (q && !(`${r.id} ${r.title} ${r.account}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, filters]);

  const kpis = useMemo(() => {
    const pendingApproval = items.filter((r) => r.status === 'Pending Approval').length;
    const scheduled = items.filter((r) => r.status === 'Scheduled').length;
    const inProgress = items.filter((r) => r.status === 'In Progress').length;
    const completed = items.filter((r) => r.status === 'Completed').length;
    return { pendingApproval, scheduled, inProgress, completed };
  }, [items]);

  const selected = items.find((r) => r.id === selectedId) ?? null;

  function handleCreate(draft: Omit<RfcItem, 'id'>) {
    const id = nextRfcId(items);
    const newItem: RfcItem = { id, ...draft };
    setItems([newItem, ...items]);
    setSelectedId(id);
    setView('detail');
  }

  function handleApprove(note?: string) {
    if (!selected) return;
    const entry: ApprovalEntry = { user: 'You', date: new Date().toISOString().slice(0, 10), note };
    setItems((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status: 'Approved', approvals: [...r.approvals, entry] } : r)));
  }

  function handleReject(note: string) {
    if (!selected) return;
    const entry: ApprovalEntry = { user: 'You', date: new Date().toISOString().slice(0, 10), note, rejected: true };
    setItems((prev) => prev.map((r) => (r.id === selected.id ? { ...r, status: 'Rejected', approvals: [...r.approvals, entry] } : r)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Change Requests</h1>
          <p className="text-sm text-zinc-500">Lightweight workflow replacing docs and email ping-pong.</p>
        </div>
        <div className="flex items-center gap-2">
          <NewRfcDialog onCreate={handleCreate} />
        </div>
      </div>

      {view === 'dashboard' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Pending approval" value={kpis.pendingApproval} />
            <KpiCard label="Scheduled" value={kpis.scheduled} />
            <KpiCard label="In progress" value={kpis.inProgress} />
            <KpiCard label="Completed" value={kpis.completed} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</h2>
              <input
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder="Search by id, title, account"
                className="input"
                aria-label="Search"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as Filters['status'] }))}
                  className="input"
                  aria-label="Status"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value as Filters['priority'] }))}
                  className="input"
                  aria-label="Priority"
                >
                  {priorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.onlyMine}
                  onChange={(e) => setFilters((f) => ({ ...f, onlyMine: e.target.checked }))}
                />
                Only my RFCs
              </label>
            </div>
          </section>
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <Th>RFC</Th>
                  <Th>Title</Th>
                  <Th>Account</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 cursor-pointer"
                    onClick={() => {
                      setSelectedId(r.id);
                      setView('detail');
                    }}
                  >
                    <Td>{r.id}</Td>
                    <Td className="font-medium">{r.title}</Td>
                    <Td>{r.account}</Td>
                    <Td>
                      <Badge tone={r.priority}>{r.priority}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={r.status}>{r.status}</Badge>
                    </Td>
                    <Td className="tabular-nums">{r.date}</Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <Td colSpan={6} className="text-center text-slate-500 py-8">
                      No results
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
        </>
      )}

      {view === 'detail' && selected && (
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <button onClick={() => setView('dashboard')} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 focus-ring rounded-md px-2 py-1 inline-flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selected.title}</h2>
              <div className="flex items-center gap-2">
                <Badge tone={selected.priority}>{selected.priority}</Badge>
                <Badge tone={selected.status}>{selected.status}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ApproveReject onApprove={handleApprove} onReject={handleReject} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-4">
              <Card>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <KV k="RFC" v={selected.id} />
                  <KV k="Account" v={selected.account} />
                  <KV k="Ticket" v={selected.ticket || '-'} />
                  <KV k="Submitted" v={selected.date} />
                  <KV k="Notification" v={selected.notification} />
                  <KV k="Submitter" v={selected.submitter} />
                </div>
              </Card>

              <Tabs
                tabs={[
                  { key: 'details', label: 'Details' },
                  { key: 'plans', label: 'Plans' },
                  { key: 'impacts', label: 'Impacts' },
                  { key: 'history', label: 'History' },
                ]}
              >
                <Tab key="details">
                  <Card>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Configuration Items" value={selected.details.configItems} />
                      <Field label="Reason" value={selected.details.reason} />
                      <Field label="Work Required" value={selected.details.workRequired} />
                      <Field label="What will be changed" value={selected.details.whatChanges} />
                      <Field label="Services Affected" value={selected.details.servicesAffected} />
                    </div>
                  </Card>
                </Tab>
                <Tab key="plans">
                  <Card>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Testing" value={selected.details.testing} />
                      <Field label="Rollback" value={selected.details.rollback} />
                      <Field label="Monitoring" value={selected.details.monitoring} />
                      <Field label="Backup" value={selected.details.backup} />
                      <Field label="Security" value={selected.details.security} />
                    </div>
                  </Card>
                </Tab>
                <Tab key="impacts">
                  <Card>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Notification" value={selected.notification} />
                      <Field label="Customer Responsibilities" value={selected.details.customerResp} />
                      <Field label="Netsurit Responsibilities" value={selected.details.netsuritResp} />
                      <Field label="Comments" value={selected.details.comments} />
                    </div>
                  </Card>
                </Tab>
                <Tab key="history">
                  <Card>
                    <ul className="space-y-2 text-sm">
                      {selected.approvals.length === 0 && <li className="text-zinc-500">No approvals yet</li>}
                      {selected.approvals.map((a, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className={`h-6 w-6 rounded-full grid place-items-center text-white ${a.rejected ? 'bg-red-500' : 'bg-emerald-600'}`}>
                            {a.rejected ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium">{a.user}</div>
                            <div className="text-zinc-500">{a.date}{a.note ? ` — ${a.note}` : ''}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Tab>
              </Tabs>
            </div>

            <div className="space-y-3">
              <Card>
                <div className="grid gap-2">
                  <button className="btn" onClick={() => handleApprove()}>Approve</button>
                  <button className="btn" onClick={() => handleReject('Rejected via quick action')}>Reject</button>
                  <button className="btn" onClick={() => {/* TODO: notify client */}}>Notify Client</button>
                  <button className="btn" onClick={() => {/* TODO: send to CAB */}}>Send to CAB</button>
                  <button className="btn" onClick={() => {/* TODO: link ticket */}}>Link Ticket</button>
                  <button className="btn" onClick={() => {/* TODO: assign owner */}}>Assign Owner</button>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">{children}</th>;
}
function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-3 py-2 ${className}`}>{children}</td>;
}

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    High: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
    Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    Low: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300',
    Approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    'Pending Approval': 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
    Rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
    Draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Scheduled: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
    'In Progress': 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300',
    Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  };
  const cls = map[tone] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`badge ${cls}`}>{children}</span>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card p-6">{children}</div>;
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950 shadow-sm">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{k}</div>
      <div className="font-medium">{v || '-'}</div>
    </div>
  );
}

function Tabs({ tabs, children }: { tabs: { key: string; label: string }[]; children: React.ReactNode }) {
  const [key, setKey] = useState(tabs[0]?.key ?? '');
  const content = Array.isArray(children) ? children.find((c: any) => c.key === key) : children;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 rounded-lg text-sm border font-medium transition-all duration-200 ${key === t.key ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
            onClick={() => setKey(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{content}</div>
    </div>
  );
}

function Tab({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="font-medium whitespace-pre-wrap text-slate-900 dark:text-slate-100">{value || '-'}</div>
    </div>
  );
}

function ApproveReject({ onApprove, onReject }: { onApprove: (note?: string) => void; onReject: (reason: string) => void }) {
  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  return (
    <div className="flex items-center gap-2">
      <button className="btn" onClick={() => setOpenApprove(true)}><Check className="h-4 w-4" /> Approve</button>
      <button className="btn" onClick={() => setOpenReject(true)}><X className="h-4 w-4" /> Reject</button>

      {openApprove && (
        <Dialog onClose={() => setOpenApprove(false)} title="Approve RFC">
          <div className="space-y-3">
            <label className="text-sm grid gap-1">
              <span>Note (optional)</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button className="btn" onClick={() => setOpenApprove(false)}>Cancel</button>
              <button className="btn primary" onClick={() => { onApprove(note || undefined); setOpenApprove(false); }}>Approve</button>
            </div>
          </div>
        </Dialog>
      )}

      {openReject && (
        <Dialog onClose={() => setOpenReject(false)} title="Reject RFC">
          <div className="space-y-3">
            <label className="text-sm grid gap-1">
              <span>Reason</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="input" />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button className="btn" onClick={() => setOpenReject(false)}>Cancel</button>
              <button className="btn danger" onClick={() => { onReject(reason || ''); setOpenReject(false); }}>Reject</button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center p-4" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NewRfcDialog({ onCreate }: { onCreate: (item: Omit<RfcItem, 'id'>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New RFC
      </button>
      {open && (
        <Dialog onClose={() => setOpen(false)} title="New RFC">
          <NewRfcForm
            onCancel={() => setOpen(false)}
            onSubmit={(data) => {
              onCreate(data);
              setOpen(false);
            }}
          />
        </Dialog>
      )}
    </>
  );
}

function NewRfcForm({ onSubmit, onCancel }: { onSubmit: (item: Omit<RfcItem, 'id'>) => void; onCancel: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState<Omit<RfcItem, 'id'>>({
    title: '',
    account: '',
    ticket: '',
    submitter: 'You',
    date: today,
    priority: 'Medium',
    status: 'Draft',
    notification: '48 Hour',
    summary: '',
    details: {
      configItems: '',
      reason: '',
      workRequired: '',
      whatChanges: '',
      servicesAffected: '',
      monitoring: '',
      backup: '',
      security: '',
      testing: '',
      rollback: '',
      netsuritResp: '',
      customerResp: '',
      comments: '',
    },
    approvals: [],
  });

  const [tab, setTab] = useState<'core' | 'plans' | 'resp'>('core');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!data.title) e.title = 'Required';
    if (!data.account) e.account = 'Required';
    if (!data.priority) e.priority = 'Required';
    if (!data.summary) e.summary = 'Required';
    if (!data.details.reason) e.reason = 'Required';
    if (!data.details.testing) e.testing = 'Required';
    if (!data.details.rollback) e.rollback = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <form
      className="space-y-4 max-h-[80vh] overflow-auto pr-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit(data);
      }}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Title" value={data.title} onChange={(v) => setData({ ...data, title: v })} error={errors.title} required />
        <Input label="Account" value={data.account} onChange={(v) => setData({ ...data, account: v })} error={errors.account} required />
        <Input label="Ticket Number" value={data.ticket} onChange={(v) => setData({ ...data, ticket: v })} />
        <Select
          label="Priority"
          value={data.priority}
          onChange={(v) => setData({ ...data, priority: v as RfcPriority })}
          options={['High', 'Medium', 'Low']}
          error={errors.priority}
          required
        />
        <Input label="Submission Date" type="date" value={data.date} onChange={(v) => setData({ ...data, date: v })} />
        <Select
          label="Notification Requirement"
          value={data.notification}
          onChange={(v) => setData({ ...data, notification: v as RfcItem['notification'] })}
          options={['48 Hour', 'Emergency', 'Custom']}
        />
      </div>

      <TextArea label="Summary" value={data.summary} onChange={(v) => setData({ ...data, summary: v })} error={errors.summary} required />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <button type="button" className={`px-3 py-1.5 rounded-md border ${tab === 'core' ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => setTab('core')}>Core Details</button>
          <button type="button" className={`px-3 py-1.5 rounded-md border ${tab === 'plans' ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => setTab('plans')}>Plans</button>
          <button type="button" className={`px-3 py-1.5 rounded-md border ${tab === 'resp' ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'}`} onClick={() => setTab('resp')}>Responsibilities</button>
        </div>
        {tab === 'core' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <TextArea label="Configuration Items" value={data.details.configItems} onChange={(v) => setData({ ...data, details: { ...data.details, configItems: v } })} />
            <TextArea label="Reason" value={data.details.reason} onChange={(v) => setData({ ...data, details: { ...data.details, reason: v } })} error={errors.reason} required />
            <TextArea label="Work Required" value={data.details.workRequired} onChange={(v) => setData({ ...data, details: { ...data.details, workRequired: v } })} />
            <TextArea label="What will be changed" value={data.details.whatChanges} onChange={(v) => setData({ ...data, details: { ...data.details, whatChanges: v } })} />
            <TextArea label="Services Affected" value={data.details.servicesAffected} onChange={(v) => setData({ ...data, details: { ...data.details, servicesAffected: v } })} />
          </div>
        )}
        {tab === 'plans' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <TextArea label="Testing" value={data.details.testing} onChange={(v) => setData({ ...data, details: { ...data.details, testing: v } })} error={errors.testing} required />
            <TextArea label="Rollback" value={data.details.rollback} onChange={(v) => setData({ ...data, details: { ...data.details, rollback: v } })} error={errors.rollback} required />
            <Input label="Monitoring" value={data.details.monitoring} onChange={(v) => setData({ ...data, details: { ...data.details, monitoring: v } })} />
            <Input label="Backup" value={data.details.backup} onChange={(v) => setData({ ...data, details: { ...data.details, backup: v } })} />
            <Input label="Security" value={data.details.security} onChange={(v) => setData({ ...data, details: { ...data.details, security: v } })} />
          </div>
        )}
        {tab === 'resp' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <TextArea label="Netsurit responsibilities" value={data.details.netsuritResp} onChange={(v) => setData({ ...data, details: { ...data.details, netsuritResp: v } })} />
            <TextArea label="Customer responsibilities" value={data.details.customerResp} onChange={(v) => setData({ ...data, details: { ...data.details, customerResp: v } })} />
            <TextArea label="Additional comments" value={data.details.comments} onChange={(v) => setData({ ...data, details: { ...data.details, comments: v } })} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" className="btn" disabled>Export to PDF</button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={() => onSubmit({ ...data, status: 'Draft' })}>Save Draft</button>
          <button type="submit" className="btn primary" onClick={() => setData((d) => ({ ...d, status: 'Pending Approval' }))}>Submit for Approval</button>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </form>
  );
}

function Input({ label, value, onChange, type = 'text', required, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; error?: string }) {
  return (
    <label className="text-sm grid gap-1">
      <span>
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`input ${error ? 'border-red-500' : ''}`} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Select({ label, value, onChange, options, required, error }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; error?: string }) {
  return (
    <label className="text-sm grid gap-1">
      <span>
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`input ${error ? 'border-red-500' : ''}`}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function TextArea({ label, value, onChange, required, error }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: string }) {
  return (
    <label className="text-sm grid gap-1">
      <span>
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className={`input min-h-[80px] ${error ? 'border-red-500' : ''}`} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}



