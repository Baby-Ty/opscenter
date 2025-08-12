import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type Client = {
  id: string | number;
  name: string;
  deskId: string | number;
  owner: string;
  openTickets: number;
  noUpdate24h: number;
  slaAtRisk: number;
  lastRating: 'sad' | 'happy' | 'excited' | null;
  lastTouch: string; // ISO
  planStart: string; // ISO
  planEnd: string; // ISO
};

type Ticket = {
  id: string;
  clientId: string | number;
  title: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved';
  owner: string;
  lastTouch: string; // ISO
  promisedBy: string | null; // ISO
  slaRisk: boolean;
};

type Rating = {
  id: string;
  clientId: string | number;
  value: 'sad' | 'happy' | 'excited';
  note?: string;
  createdAt: string; // ISO
};

type Task = {
  id: string;
  clientId: string | number;
  title: string;
  owner: string;
  due: string; // ISO
  done: boolean;
};

const getRatingEmoji = (value: Client['lastRating']) => {
  switch (value) {
    case 'excited':
      return '😊';
    case 'happy':
      return '🙂';
    case 'sad':
      return '😞';
    default:
      return '—';
  }
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();
const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

export default function IcCautionPage() {
  // Mock single service board data (adapted from drafts multi-desk)
  const deskId = 'IC-1';
  const clients: Client[] = [
    { id: 'C-1001', name: 'Umbrella Co', deskId, owner: 'AM-4', openTickets: 7, noUpdate24h: 2, slaAtRisk: 1, lastRating: 'happy', lastTouch: '2025-08-10T12:30:00Z', planStart: '2025-08-01', planEnd: '2025-09-15' },
    { id: 'C-1002', name: 'Apex Health', deskId, owner: 'AM-2', openTickets: 3, noUpdate24h: 0, slaAtRisk: 0, lastRating: 'excited', lastTouch: '2025-08-11T09:10:00Z', planStart: '2025-07-20', planEnd: '2025-09-01' },
    { id: 'C-1003', name: 'Nordic Freight', deskId, owner: 'AM-1', openTickets: 5, noUpdate24h: 1, slaAtRisk: 2, lastRating: 'sad', lastTouch: '2025-08-11T07:05:00Z', planStart: '2025-08-05', planEnd: '2025-10-05' },
    { id: 'C-1004', name: 'Blue River Labs', deskId, owner: 'AM-3', openTickets: 2, noUpdate24h: 0, slaAtRisk: 0, lastRating: 'happy', lastTouch: '2025-08-10T18:45:00Z', planStart: '2025-07-10', planEnd: '2025-08-30' },
    { id: 'C-1005', name: 'Starlight Media', deskId, owner: 'AM-4', openTickets: 4, noUpdate24h: 1, slaAtRisk: 1, lastRating: null, lastTouch: '2025-08-09T22:11:00Z', planStart: '2025-08-01', planEnd: '2025-09-20' },
  ];

  const tickets: Ticket[] = [
    { id: 'T-1', clientId: 'C-1001', title: 'SLA breach on P1 queue', status: 'in_progress', owner: 'AM-4', lastTouch: '2025-08-11T12:10:00Z', promisedBy: '2025-08-12T16:00:00Z', slaRisk: true },
    { id: 'T-2', clientId: 'C-1001', title: 'Escalation: callback missed', status: 'open', owner: 'AM-4', lastTouch: '2025-08-11T10:40:00Z', promisedBy: null, slaRisk: false },
    { id: 'T-3', clientId: 'C-1003', title: 'Reopen spike investigation', status: 'open', owner: 'AM-1', lastTouch: '2025-08-11T08:00:00Z', promisedBy: '2025-08-13T12:00:00Z', slaRisk: true },
    { id: 'T-4', clientId: 'C-1002', title: 'Weekly healthcheck', status: 'resolved', owner: 'AM-2', lastTouch: '2025-08-10T14:00:00Z', promisedBy: null, slaRisk: false },
    { id: 'T-5', clientId: 'C-1005', title: 'Response delays on EU region', status: 'waiting', owner: 'AM-4', lastTouch: '2025-08-10T19:30:00Z', promisedBy: null, slaRisk: false },
  ];

  const ratings: Rating[] = [
    { id: 'R-1', clientId: 'C-1001', value: 'happy', createdAt: '2025-08-11T09:00:00Z', note: 'Good response' },
    { id: 'R-2', clientId: 'C-1003', value: 'sad', createdAt: '2025-08-11T07:30:00Z', note: 'Still waiting' },
    { id: 'R-3', clientId: 'C-1002', value: 'excited', createdAt: '2025-08-11T08:15:00Z' },
    { id: 'R-4', clientId: 'C-1005', value: 'happy', createdAt: '2025-08-10T20:00:00Z' },
  ];

  const initialTasks: Task[] = [
    { id: 'X-1', clientId: 'C-1001', title: 'Schedule success review', owner: 'AM-4', due: '2025-08-18', done: false },
    { id: 'X-2', clientId: 'C-1003', title: 'Draft comms for reopen fix', owner: 'AM-1', due: '2025-08-14', done: false },
  ];

  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  const [slaOnly, setSlaOnly] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const owners = useMemo(() => Array.from(new Set(clients.map((c) => c.owner))), [clients]);

  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todays = clients.filter((c) => c.lastTouch.startsWith(today));
    return {
      openTickets: clients.reduce((s, c) => s + c.openTickets, 0),
      noUpdate24h: clients.reduce((s, c) => s + c.noUpdate24h, 0),
      slaAtRisk: clients.reduce((s, c) => s + c.slaAtRisk, 0),
      todaysNegative: todays.filter((c) => c.lastRating === 'sad').length,
      todaysNeutral: todays.filter((c) => c.lastRating === 'happy').length,
      todaysPositive: todays.filter((c) => c.lastRating === 'excited').length,
    };
  }, [clients]);

  const rows = useMemo(() => {
    return clients
      .filter((r) => !ownerFilter || r.owner === ownerFilter)
      .filter((r) => !slaOnly || r.slaAtRisk > 0)
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [clients, ownerFilter, slaOnly, search]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => String(c.id) === String(selectedClientId)) || null;
  }, [selectedClientId, clients]);

  const selectedTickets = useMemo(() => tickets.filter((t) => String(t.clientId) === String(selectedClientId)), [tickets, selectedClientId]);
  const selectedRatings = useMemo(() => ratings.filter((r) => String(r.clientId) === String(selectedClientId)), [ratings, selectedClientId]);
  const selectedTasks = useMemo(() => initialTasks.filter((t) => String(t.clientId) === String(selectedClientId)), [initialTasks, selectedClientId]);

  const openClient = (id: string | number) => {
    setSelectedClientId(id);
    setIsModalOpen(true);
  };

  const closeClient = () => {
    setIsModalOpen(false);
    setSelectedClientId(null);
  };

  // Open a specific client when navigated with ?client=C-xxxx
  const clientParam = searchParams.get('client');
  useMemo(() => {
    if (clientParam) {
      setSelectedClientId(clientParam);
      setIsModalOpen(true);
    }
  }, [clientParam]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">IC Caution</h1>
        <p className="text-gray-600 dark:text-gray-400">Single service board overview</p>
      </div>

      {/* KPI Bar */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Open Tickets', key: 'openTickets', value: kpis.openTickets },
          { label: 'No Update 24h', key: 'noUpdate24h', value: kpis.noUpdate24h },
          { label: 'SLA at Risk', key: 'slaAtRisk', value: kpis.slaAtRisk },
          { label: "Today's Negative", key: 'todaysNegative', value: kpis.todaysNegative },
          { label: "Today's Neutral", key: 'todaysNeutral', value: kpis.todaysNeutral },
          { label: "Today's Positive", key: 'todaysPositive', value: kpis.todaysPositive },
        ].map((i) => (
          <div key={i.key} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-950">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 font-medium">{i.label}</div>
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-lg font-semibold border bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">
              {i.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select
          className="input w-[200px]"
          value={ownerFilter ?? 'all'}
          onChange={(e) => setOwnerFilter(e.target.value === 'all' ? undefined : e.target.value)}
        >
          <option value="all">All owners</option>
          {owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded border-zinc-300" checked={slaOnly} onChange={(e) => setSlaOnly(e.target.checked)} />
          SLA at Risk only
        </label>
      </div>

      {/* Clients table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Client</th>
              <th className="text-left px-4 py-2 font-medium">Open Tickets</th>
              <th className="text-left px-4 py-2 font-medium">No Update 24h</th>
              <th className="text-left px-4 py-2 font-medium">SLA at Risk</th>
              <th className="text-left px-4 py-2 font-medium">Last Rating</th>
              <th className="text-left px-4 py-2 font-medium">Last Touch</th>
              <th className="text-left px-4 py-2 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={String(c.id)}
                className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/60 cursor-pointer"
                onClick={() => openClient(c.id)}
              >
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium border bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">
                    {c.openTickets}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium border ${
                    c.noUpdate24h > 0 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                  }`}>
                    {c.noUpdate24h}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium border ${
                    c.slaAtRisk > 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800'
                  }`}>
                    {c.slaAtRisk}
                  </span>
                </td>
                <td className="px-4 py-2 text-lg">{getRatingEmoji(c.lastRating)}</td>
                <td className="px-4 py-2">{formatDate(c.lastTouch)}</td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{c.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-10 text-zinc-500">No clients found.</div>
        )}
      </div>

      {/* Client modal */}
      {isModalOpen && selectedClient && (
        <ClientModal
          client={selectedClient}
          tickets={selectedTickets}
          ratings={selectedRatings}
          initialTasks={selectedTasks}
          onClose={closeClient}
        />
      )}
    </div>
  );
}

function ClientModal({
  client,
  tickets,
  ratings,
  initialTasks,
  onClose,
}: {
  client: Client;
  tickets: Ticket[];
  ratings: Rating[];
  initialTasks: Task[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'feedback' | 'tickets' | 'tasks' | 'notes' | 'relationships'>('overview');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [notes, setNotes] = useState<Array<{ id: string; content: string; author: string; createdAt: string }>>([
    { id: 'n1', content: 'Client prefers email communication over phone calls', author: client.owner, createdAt: '2025-08-10T10:30:00Z' },
  ]);
  const [noteDraft, setNoteDraft] = useState('');

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    setTasks((prev) => [
      ...prev,
      { id: `t-${Date.now()}`, clientId: client.id, title, owner: client.owner, due: new Date(Date.now() + 7 * 86400000).toISOString(), done: false },
    ]);
    setNewTask('');
  };

  const toggleTask = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const addNote = () => {
    const content = noteDraft.trim();
    if (!content) return;
    setNotes((prev) => [{ id: `n-${Date.now()}`, content, author: client.owner, createdAt: new Date().toISOString() }, ...prev]);
    setNoteDraft('');
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">{client.name}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Desk {String(client.deskId)} • Owner: {client.owner}</p>
              </div>
              <button className="btn" onClick={onClose}>Close</button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {(['overview', 'feedback', 'tickets', 'tasks', 'notes', 'relationships'] as const).map((t) => (
                <button
                  key={t}
                  className={`px-3 py-1.5 rounded-md border text-sm ${
                    tab === t
                      ? 'bg-indigo-600 text-white border-transparent'
                      : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <MetricCard label="Open Tickets" value={client.openTickets} tone="neutral" />
                  <MetricCard label="No Update 24h" value={client.noUpdate24h} tone={client.noUpdate24h > 0 ? 'warning' : 'neutral'} />
                  <MetricCard label="SLA at Risk" value={client.slaAtRisk} tone={client.slaAtRisk > 0 ? 'danger' : 'neutral'} />
                  <MetricCard label="Last Rating" value={getRatingEmoji(client.lastRating)} tone="neutral" />
                  <MetricCard label="Last Touch" value={formatDate(client.lastTouch)} tone="neutral" />
                </div>

                <div className="border rounded-lg p-4 border-zinc-200 dark:border-zinc-800">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 font-medium">Success Plan</div>
                  <div className="text-sm">Owner: <span className="font-medium">{client.owner}</span></div>
                  <div className="text-sm">Start: {formatDate(client.planStart)} • End: {formatDate(client.planEnd)}</div>
                  <ul className="list-disc pl-5 mt-3 text-sm space-y-1">
                    <li>Stabilize SLA on critical queues</li>
                    <li>Reduce reopen rate by 20%</li>
                    <li>Increase positive feedback to 75%</li>
                  </ul>
                </div>
              </div>
            )}

            {tab === 'feedback' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {ratings.length === 0 && <div className="text-sm text-zinc-500">No feedback yet.</div>}
                {ratings.map((r) => (
                  <div key={r.id} className="border rounded-md p-3 border-zinc-200 dark:border-zinc-800">
                    <div className="text-lg">{getRatingEmoji(r.value)}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">{formatDateTime(r.createdAt)}</div>
                    {r.note && <div className="text-sm mt-1">{r.note}</div>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'tickets' && (
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Title</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-left px-4 py-2 font-medium">Owner</th>
                      <th className="text-left px-4 py-2 font-medium">Last Touch</th>
                      <th className="text-left px-4 py-2 font-medium">Promised By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 && (
                      <tr>
                        <td className="px-4 py-8 text-center text-zinc-500" colSpan={5}>No tickets found for this client</td>
                      </tr>
                    )}
                    {tickets.map((t) => (
                      <tr key={t.id} className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="px-4 py-2 font-medium">{t.title}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            t.status === 'resolved'
                              ? 'bg-zinc-100 text-zinc-700 border-zinc-200'
                              : t.slaRisk
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{t.owner}</td>
                        <td className="px-4 py-2">{formatDate(t.lastTouch)}</td>
                        <td className="px-4 py-2">{t.promisedBy ? formatDateTime(t.promisedBy) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'tasks' && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 border-zinc-200 dark:border-zinc-800">
                  <div className="font-medium mb-2">Add task</div>
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Enter task description..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
                    <button className="btn primary" onClick={addTask} disabled={!newTask.trim()}>Add</button>
                  </div>
                </div>
                <div className="border rounded-lg p-4 border-zinc-200 dark:border-zinc-800">
                  <div className="font-medium mb-3">Current Tasks ({tasks.length})</div>
                  {tasks.length === 0 && <div className="text-sm text-zinc-500">No tasks yet.</div>}
                  <div className="space-y-2">
                    {tasks.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${t.done ? 'line-through text-zinc-500' : ''}`}>{t.title}</div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Owner: {t.owner}{t.due && ` • Due: ${formatDate(t.due)}`}</div>
                        </div>
                        <button className="btn danger" onClick={() => deleteTask(t.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'notes' && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 border-zinc-200 dark:border-zinc-800">
                  <div className="font-medium mb-2">Add note</div>
                  <textarea className="input min-h-[100px]" placeholder="Enter your note here..." value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
                  <div className="mt-2 flex justify-end">
                    <button className="btn primary" onClick={addNote} disabled={!noteDraft.trim()}>Add note</button>
                  </div>
                </div>
                <div className="border rounded-lg p-4 border-zinc-200 dark:border-zinc-800">
                  <div className="font-medium mb-3">Notes History ({notes.length})</div>
                  {notes.length === 0 && <div className="text-sm text-zinc-500">No notes yet.</div>}
                  <div className="space-y-3">
                    {notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <div className="mb-1">{n.content}</div>
                        <div className="text-xs text-zinc-500">{n.author} • {formatDate(n.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'relationships' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 border-zinc-200 dark:border-zinc-800">
                  <div className="font-medium mb-2">Primary Contacts</div>
                  <div className="space-y-2 text-sm">
                    <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200">John Smith — CTO — john.smith@{client.name.toLowerCase().replace(/\s+/g, '')}.com</div>
                    <div className="p-3 rounded-lg bg-zinc-50/50 border border-zinc-200">Sarah Johnson — PM — sarah.johnson@{client.name.toLowerCase().replace(/\s+/g, '')}.com</div>
                  </div>
                </div>
                <div className="border rounded-lg p-4 border-zinc-200 dark:border-zinc-800">
                  <div className="font-medium mb-2">Account Information</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-zinc-600">Account Manager</span><span className="font-medium">{client.owner}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Customer Since</span><span className="font-medium">Jan 2024</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Industry</span><span className="font-medium">Software</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Company Size</span><span className="font-medium">50–200</span></div>
                    <div className="flex justify-between"><span className="text-zinc-600">Time Zone</span><span className="font-medium">EST (UTC-5)</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number | string; tone: 'neutral' | 'warning' | 'danger' }) {
  const toneClasses =
    tone === 'danger'
      ? 'bg-red-50/50 border-red-200'
      : tone === 'warning'
      ? 'bg-orange-50/50 border-orange-200'
      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800';
  const badgeClasses =
    tone === 'danger'
      ? 'bg-red-100 text-red-700 border-red-200'
      : tone === 'warning'
      ? 'bg-orange-100 text-orange-700 border-orange-200'
      : 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800';
  return (
    <div className={`border rounded-lg p-4 ${toneClasses}`}>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 font-medium">{label}</div>
      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-lg font-semibold border ${badgeClasses}`}>{value}</div>
    </div>
  );
}

