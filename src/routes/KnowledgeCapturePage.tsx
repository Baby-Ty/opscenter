import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Send as SendIcon, Mail as MailIcon } from 'lucide-react';
import type { KnowledgeAssignment, KnowledgeSection, KnowledgeStatus, KnowledgeReviewStatus } from '../lib/knowledgeTypes';
import { defaultDueDateForWeek, getIsoWeek, loadKnowledge, saveKnowledge, nextKnowledgeId, KNOWLEDGE_COMPANIES, KNOWLEDGE_ENGINEERS, KNOWLEDGE_SECTIONS, loadVisibleColumns, saveVisibleColumns, getWeekFocusCompanies, setWeekFocusCompanies } from '../lib/knowledgeStorage';

type DrawerState = {
  open: boolean;
  draft: Omit<KnowledgeAssignment, 'id' | 'createdAt' | 'submittedAt' | 'reviewStatus'>;
};

export default function KnowledgeCapturePage() {
  const [weekIso, setWeekIso] = useState<string>(() => getIsoWeek(new Date()));
  const [assignments, setAssignments] = useState<KnowledgeAssignment[]>(() => loadKnowledge() ?? []);
  const [toast, setToast] = useState<string>('');
  const [focusCompanies, setFocusCompanies] = useState<string[]>(() => getWeekFocusCompanies(getIsoWeek(new Date())));
  useEffect(() => setWeekFocusCompanies(weekIso, focusCompanies), [weekIso, focusCompanies]);

  useEffect(() => saveKnowledge(assignments), [assignments]);

  const weekAssignments = useMemo(() => assignments.filter((a) => a.weekIso === weekIso), [assignments, weekIso]);

  const kpis = useMemo(() => {
    const created = assignments.filter((a) => isInSameCalendarWeek(a.createdAt, weekIso)).length;
    const sectionsCovered = new Set(weekAssignments.map((a) => a.section)).size;
    const total = weekAssignments.length;
    const completed = weekAssignments.filter((a) => a.status === 'Complete').length;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const overdue = weekAssignments.filter((a) => a.status !== 'Complete' && a.dueDate < todayYmd()).length;
    return { created, sectionsCovered, pct, overdue };
  }, [assignments, weekAssignments]);

  function prevWeek() { setWeekIso(shiftIsoWeek(weekIso, -1)); }
  function nextWeek() { setWeekIso(shiftIsoWeek(weekIso, 1)); }

  function upsertSingleAssignment(section: KnowledgeSection, engineer: string, companyId: string | null) {
    const due = defaultDueDateForWeek(weekIso);
    setAssignments((prev) => {
      const existing = prev.find((a) => a.weekIso === weekIso && a.section === section && a.engineer === engineer);
      if (!companyId) {
        // clear assignment for this cell
        return existing ? prev.filter((a) => a !== existing) : prev;
      }
      if (existing) {
        return prev.map((a) => (a === existing ? { ...a, companyIds: [companyId], dueDate: due } : a));
      }
      const id = nextKnowledgeId(prev);
      const newItem: KnowledgeAssignment = { id, createdAt: new Date().toISOString(), submittedAt: undefined, reviewStatus: 'Pending', weekIso, section, engineer, companyIds: [companyId], dueDate: due, status: 'Not started' };
      return [newItem, ...prev];
    });
  }

  function updateStatus(id: string, status: KnowledgeStatus) {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status, submittedAt: status === 'Complete' ? new Date().toISOString() : a.submittedAt } : a)));
  }

  function setReview(id: string, reviewStatus: KnowledgeReviewStatus) {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, reviewStatus } : a)));
  }

  function sendTasks(engineer: string) {
    // Simulate sending tasks for this engineer for the selected week
    const hasAny = assignments.some((a) => a.weekIso === weekIso && a.engineer === engineer);
    setToast(hasAny ? `Tasks sent to ${engineer} via Teams and Email` : `No tasks to send for ${engineer}`);
    setTimeout(() => setToast(''), 2000);
  }

  const gridEngineers = KNOWLEDGE_ENGINEERS;
  const [visibleSections, setVisibleSections] = useState<KnowledgeSection[]>(() => loadVisibleColumns() ?? (['Printing', 'VPN', 'Backup', 'Licensing'] as KnowledgeSection[]));
  useEffect(() => saveVisibleColumns(visibleSections), [visibleSections]);

  const cellData: Record<string, KnowledgeAssignment[]> = useMemo(() => {
    const map: Record<string, KnowledgeAssignment[]> = {};
    for (const eng of gridEngineers) {
      for (const sec of visibleSections) {
        const key = `${eng}__${sec}`;
        map[key] = weekAssignments.filter((a) => a.engineer === eng && a.section === sec);
      }
    }
    return map;
  }, [weekAssignments, gridEngineers, visibleSections]);

  const reviewQueue = useMemo(
    () => assignments.filter((a) => a.weekIso === weekIso && a.status === 'Complete' && (a.reviewStatus ?? 'Pending') === 'Pending'),
    [assignments, weekIso]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge Capture</h1>
          <p className="text-sm text-zinc-500">Assign and track weekly section-based capture tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /> Prev</button>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {weekIso}</div>
          <button className="btn" onClick={nextWeek}>Next <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CompanyProgressCard
            key={i}
            companies={KNOWLEDGE_COMPANIES}
            value={focusCompanies[i] ?? ''}
            onChange={(id) => {
              const next = [...focusCompanies];
              next[i] = id;
              // ensure uniqueness across the four slots
              for (let j = 0; j < next.length; j++) {
                if (j !== i && next[j] === id) next[j] = '';
              }
              setFocusCompanies(next.filter(Boolean));
            }}
            stats={companyStats(assignments, weekIso, focusCompanies[i] ?? '')}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h2 className="text-base font-semibold">Assignments</h2></div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Engineer</Th>
                {visibleSections.map((s, idx) => (
                  <Th key={s}>
                    <ColumnSelector
                      value={s}
                      onChange={(next) => setVisibleSections((prev) => {
                        const copy = [...prev];
                        copy[idx] = next;
                        // prevent duplicate columns by swapping if selected exists elsewhere
                        for (let i = 0; i < copy.length; i++) {
                          if (i !== idx && copy[i] === next) {
                            copy[i] = s; // swap
                          }
                        }
                        return copy;
                      })}
                      options={KNOWLEDGE_SECTIONS}
                    />
                  </Th>
                ))}
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {gridEngineers.map((eng) => (
                <tr key={eng} className="border-t border-zinc-200 dark:border-zinc-800">
                  <Td className="font-medium">{eng}</Td>
                  {visibleSections.map((sec) => {
                    const key = `${eng}__${sec}`;
                    const items = cellData[key];
                    const totalCompanies = items.reduce((acc, a) => acc + a.companyIds.length, 0);
                    const status = deriveCellStatus(items);
                    return (
                      <Td key={sec}>
                        <div className={`rounded-md px-2 py-2 border ${status.border}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-zinc-500">{items.length} task{items.length !== 1 ? 's' : ''}</span>
                            <span className="text-xs">{totalCompanies} companies</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div className={`h-full ${status.bar}`} style={{ width: `${status.pct}%` }} />
                          </div>
                          <div className="mt-2">
                            <CellCompanyDropdown
                              companies={focusCompanies}
                              value={items[0]?.companyIds[0] ?? ''}
                              onChange={(companyId) => upsertSingleAssignment(sec, eng, companyId || null)}
                            />
                          </div>
                          {/* status dropdown removed per request */}
                        </div>
                      </Td>
                    );
                  })}
                  <Td>
                    <button
                      className="w-full h-full min-w-[7.5rem] rounded-md border border-indigo-300/70 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 p-3 grid gap-2 place-items-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      onClick={() => sendTasks(eng)}
                    >
                      <div className="text-sm font-semibold leading-tight text-center">
                        <div>Send</div>
                        <div>tasks</div>
                      </div>
                      <div className="flex items-center gap-2 opacity-90">
                        <SendIcon className="h-4 w-4" />
                        <MailIcon className="h-4 w-4" />
                      </div>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Review Queue</h2>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <Th>Section</Th>
                <Th>Engineer</Th>
                <Th>Company count</Th>
                <Th>Submitted</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {reviewQueue.map((a) => (
                <tr key={a.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <Td>{a.section}</Td>
                  <Td>{a.engineer}</Td>
                  <Td>{a.companyIds.length}</Td>
                  <Td className="tabular-nums">{(a.submittedAt ?? '').slice(0, 10)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button className="btn" onClick={() => setReview(a.id, 'Approved')}>Approve</button>
                      <button className="btn danger" onClick={() => setReview(a.id, 'Rejected')}>Reject</button>
                    </div>
                  </Td>
                </tr>
              ))}
              {reviewQueue.length === 0 && (
                <tr><Td colSpan={5} className="text-center text-zinc-500 py-6">No completed assignments awaiting review</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 grid place-items-center text-zinc-600"><Icon className="h-4 w-4" /></div>
        <div>
          <div className="text-sm text-zinc-500">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-3 py-2 font-medium text-zinc-600 dark:text-zinc-300">{children}</th>; }
function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) { return <td colSpan={colSpan} className={`px-3 py-2 ${className}`}>{children}</td>; }

function ColumnSelector({ value, onChange, options }: { value: KnowledgeSection; onChange: (v: KnowledgeSection) => void; options: KnowledgeSection[] }) {
  return (
    <div className="inline-flex items-center gap-2">
      <select className="input text-sm" value={value} onChange={(e) => onChange(e.target.value as KnowledgeSection)}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function FocusCompaniesEditor({ allCompanies, value, onChange }: { allCompanies: { id: string; name: string }[]; value: string[]; onChange: (arr: string[]) => void }) {
  const options = allCompanies;
  function setAt(i: number, id: string) {
    const arr = [...value];
    arr[i] = id;
    onChange(Array.from(new Set(arr.filter(Boolean))).slice(0, 4));
  }
  function remove(id: string) { onChange(value.filter((v) => v !== id)); }
  function addFirstAvailable() {
    const first = options.find((o) => !value.includes(o.id));
    if (first) onChange([...value, first.id].slice(0, 4));
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((id, i) => {
          const comp = options.find((o) => o.id === id);
          return (
            <div key={id} className="inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <select className="text-sm bg-transparent outline-none" value={id} onChange={(e) => setAt(i, e.target.value)}>
                {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <button className="text-zinc-500 hover:text-zinc-700" onClick={() => remove(id)} aria-label="Remove">×</button>
            </div>
          );
        })}
        {value.length < 4 && (
          <button type="button" className="btn" onClick={addFirstAvailable}>Add</button>
        )}
      </div>
    </div>
  );
}

function CellCompanyDropdown({ companies, value, onChange }: { companies: string[]; value: string; onChange: (id: string) => void }) {
  const list = companies;
  return (
    <select className="input text-xs" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select company</option>
      {list.map((id) => <option key={id} value={id}>{companyLabel(id)}</option>)}
      {list.length === 0 && <option value="" disabled>(No focus companies set)</option>}
    </select>
  );
}

function companyLabel(id: string): string {
  const c = KNOWLEDGE_COMPANIES.find((x) => x.id === id);
  return c ? c.name : id;
}

function focusProgressPercent(assignments: KnowledgeAssignment[], weekIso: string, focusCompanies: string[]): number {
  const targets = new Set(focusCompanies);
  if (targets.size === 0) return 0;
  const week = assignments.filter((a) => a.weekIso === weekIso && a.status === 'Complete' && a.companyIds[0] && targets.has(a.companyIds[0]));
  const done = week.length;
  // Define denominator as engineers * visible sections, but simplified: focus completion out of engineers for any section
  const total = KNOWLEDGE_ENGINEERS.length * 1; // 1 assignment per engineer minimum across any section
  return Math.min(100, Math.round((done / total) * 100));
}

function CompanyProgressCard({ companies, value, onChange, stats }: { companies: { id: string; name: string }[]; value: string; onChange: (id: string) => void; stats: { pct: number; created: number; covered: number } }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950 shadow-sm space-y-3">
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select company</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="text-xs text-zinc-500">{value ? companyLabel(value) : 'No company selected'}</div>
      <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${stats.pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>Created: {stats.created}</span>
        <span>Sections: {stats.covered}</span>
        <span>{stats.pct}%</span>
      </div>
    </div>
  );
}

function companyStats(assignments: KnowledgeAssignment[], weekIso: string, companyId: string) {
  if (!companyId) return { pct: 0, created: 0, covered: 0 };
  const week = assignments.filter((a) => a.weekIso === weekIso && a.companyIds[0] === companyId);
  const created = week.length;
  const covered = new Set(week.map((a) => a.section)).size;
  const total = week.length;
  const completed = week.filter((a) => a.status === 'Complete').length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { pct, created, covered };
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[32rem] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <button className="text-zinc-500 hover:text-zinc-700" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AssignmentForm({ initial, onSubmit, onCancel }: { initial: DrawerState['draft']; onSubmit: (d: DrawerState['draft']) => void; onCancel: () => void }) {
  const [data, setData] = useState(initial);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setData(initial), [initial]);

  async function submit() {
    setError('');
    setSending(true);
    // simulate save + Teams send
    try {
      await new Promise((res) => setTimeout(res, 600));
      onSubmit(data);
    } catch (e) {
      setError('Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Section" value={data.section} onChange={(v) => setData({ ...data, section: v as KnowledgeSection })} options={KNOWLEDGE_SECTIONS} />
        <Select label="Engineer" value={data.engineer} onChange={(v) => setData({ ...data, engineer: v })} options={KNOWLEDGE_ENGINEERS} />
        <MultiSelect label="Companies" value={data.companyIds} onChange={(arr) => setData({ ...data, companyIds: arr })} options={KNOWLEDGE_COMPANIES} />
        <Input label="Due date" type="date" value={data.dueDate} onChange={(v) => setData({ ...data, dueDate: v })} />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">Week: {data.weekIso}</div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn primary inline-flex items-center gap-2" onClick={submit} disabled={sending}><Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Create & Send via Teams'}</button>
        </div>
      </div>
      {error && <div className="text-sm text-rose-600">{error}</div>}
    </form>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="text-sm grid gap-1">
      <span>{label}</span>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="text-sm grid gap-1">
      <span>{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </label>
  );
}

function MultiSelect({ label, value, onChange, options }: { label: string; value: string[]; onChange: (arr: string[]) => void; options: { id: string; name: string }[] }) {
  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  }
  return (
    <div className="text-sm grid gap-1">
      <span>{label}</span>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 max-h-40 overflow-auto grid grid-cols-2 gap-1">
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
            <span>{o.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function deriveCellStatus(items: KnowledgeAssignment[]): { pct: number; bar: string; border: string } {
  if (items.length === 0) return { pct: 0, bar: 'bg-zinc-300 dark:bg-zinc-700', border: 'border-zinc-200 dark:border-zinc-800' };
  const counts = {
    complete: items.filter((i) => i.status === 'Complete').length,
    progress: items.filter((i) => i.status === 'In progress').length,
  };
  const pct = Math.round((counts.complete / items.length) * 100);
  const color = counts.complete === items.length
    ? 'bg-emerald-500'
    : counts.progress > 0 || counts.complete > 0
    ? 'bg-amber-500'
    : 'bg-rose-500';
  const border = counts.complete === items.length
    ? 'border-emerald-300 dark:border-emerald-900'
    : counts.progress > 0 || counts.complete > 0
    ? 'border-amber-300 dark:border-amber-900'
    : 'border-rose-300 dark:border-rose-900';
  return { pct, bar: color, border };
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function isInSameCalendarWeek(createdAtIso: string, weekIso: string): boolean {
  const d = new Date(createdAtIso);
  return getIsoWeek(d) === weekIso;
}

function shiftIsoWeek(iso: string, delta: number): string {
  const [yearStr, weekStr] = iso.split('-W');
  let year = Number(yearStr);
  let week = Number(weekStr) + delta;
  // Normalize week across year boundaries
  while (week < 1) {
    year -= 1;
    week += weeksInYear(year);
  }
  while (week > weeksInYear(year)) {
    week -= weeksInYear(year);
    year += 1;
  }
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function weeksInYear(year: number): number {
  const d = new Date(Date.UTC(year, 11, 31));
  const week = getIsoWeek(d);
  return Number(week.split('-W')[1]);
}


