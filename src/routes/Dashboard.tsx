import { motion } from 'framer-motion';
import { GitPullRequest, ShieldAlert, BrainCog, AlertTriangle, Plus, X, Calendar, User, Clock, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { seed } from '../seed/data';
import { loadRfcs } from '../lib/storage';
import { rfcSeeds } from '../lib/seed';
import { loadRcas } from '../lib/rcaStorage';
import { rcaSeeds } from '../lib/rcaSeed';
import { loadRisks } from '../lib/riskStorage';
import { riskSeeds } from '../lib/riskSeed';
import type React from 'react';
import { useState } from 'react';

type ModalType = 'rfc' | 'rca' | 'risk' | 'client' | null;

export default function Dashboard() {
  const { kpis, icClients } = seed;
  const rfcsReal = (loadRfcs() ?? rfcSeeds);
  const rcasReal = (loadRcas() ?? rcaSeeds);
  const risksReal = (loadRisks() ?? riskSeeds);
  const [selectedModal, setSelectedModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleItemClick = (type: ModalType, item: any) => {
    setSelectedModal(type);
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedModal(null);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Monitor your operations at a glance</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:ml-6">
          <KpiBarItem label="Pending RFCs" value={kpis.pendingRfcs} icon={GitPullRequest} />
          <KpiBarItem label="Open RCAs" value={kpis.openRcas} icon={BrainCog} />
          <KpiBarItem label="High/Critical Risks" value={kpis.highCriticalRisks} icon={ShieldAlert} />
          <KpiBarItem label="IC Caution Clients" value={kpis.icCautionClients} icon={AlertTriangle} />
        </div>
      </div>

      {/* Three-column tables */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="Change Requests" to="/rfc" actionLabel="New RFC" icon={GitPullRequest}>
          <CompactTable
            columns={["RFC", "Title", "Account", "Priority", "Status", "Date"]}
            rows={rfcsReal.map((r) => [r.id, r.title, r.account, r.priority, r.status, r.date])}
            onRowClick={(index) => handleItemClick('rfc', rfcsReal[index])}
          />
        </Panel>

        <Panel title="Root Cause" to="/rca" actionLabel="New RCA" icon={BrainCog}>
          <CompactTable
            columns={["RCA ID", "Title", "Client", "Owner", "Status", "Last update", "Actions open"]}
            rows={rcasReal.map((r) => [
              r.id,
              r.title,
              r.client,
              r.owner,
              r.status,
              (r.updatedAt || '').slice(0, 10),
              (r.actions || []).filter((a: any) => a.status !== 'Done').length,
            ])}
            onRowClick={(index) => handleItemClick('rca', rcasReal[index])}
          />
        </Panel>

        <Panel title="Risk Register" to="/risks" actionLabel="New Risk" icon={ShieldAlert}>
          <CompactTable
            columns={["Category", "Title/Ticket", "Client", "Impact", "Status", "Priority", "Owner", "Date"]}
            rows={risksReal.map((r) => [
              r.category,
              `${r.title}${r.ticket ? ` — ${r.ticket}` : ''}`,
              r.client,
              r.impact,
              r.status,
              r.priority,
              r.owner,
              r.date,
            ])}
            onRowClick={(index) => handleItemClick('risk', risksReal[index])}
          />
        </Panel>
      </section>

      {/* IC Caution full-width */}
      <section className="card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">IC Caution</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Clients requiring extra care</p>
            </div>
          </div>
          <Link to="/ic-caution" className="btn secondary">View board</Link>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <Th>Client</Th>
                <Th>Reason</Th>
                <Th>Tickets</Th>
                <Th>No update 24h</Th>
                <Th>Last feedback</Th>
              </tr>
            </thead>
            <tbody>
              {icClients.map((c) => (
                <tr 
                  key={c.id} 
                  className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => handleItemClick('client', c)}
                >
                  <Td className="font-medium">{c.name}</Td>
                  <Td>{c.reason}</Td>
                  <Td>{c.tickets ?? '—'}</Td>
                  <Td>{c.notUpdated24h ?? '—'}</Td>
                  <Td>{c.lastFeedback ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      {selectedModal && selectedItem && (
        <ItemModal 
          type={selectedModal} 
          item={selectedItem} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}

function KpiBarItem({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="card p-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors duration-200">
        <Icon className="h-5 w-5" />
      </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, to, actionLabel, children, icon: Icon }: { title: string; to: string; actionLabel: string; children: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="panel flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Icon className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
          <Link to={to} className="btn secondary sm"><Plus className="h-4 w-4" /> {actionLabel}</Link>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-700 flex-1">{children}</div>
    </div>
  );
}

function CompactTable({ columns, rows, onRowClick }: { columns: string[]; rows: (string | number)[][]; onRowClick?: (index: number) => void }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        <tr>
          {columns.map((c) => (
            <Th key={c}>{c}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr 
            key={i} 
            className={`border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={() => onRowClick?.(i)}
          >
            {r.map((cell, j) => (
              <Td key={j} className={`${j === 0 || j === 1 ? 'font-medium' : ''} py-2`}>{String(cell)}</Td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <Td colSpan={columns.length} className="text-center text-slate-500 py-6">No data</Td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-4 py-3 font-medium">{children}</th>; }
function Td({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) { return <td colSpan={colSpan} className={`px-4 py-3 ${className}`}>{children}</td>; }

function ItemModal({ type, item, onClose }: { type: ModalType; item: any; onClose: () => void }) {
  const getModalContent = () => {
    switch (type) {
      case 'rfc':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <GitPullRequest className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="text-sm text-slate-500">RFC {item.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={User} label="Requested By" value={item.requestedBy} />
              <InfoItem icon={Flag} label="Status" value={item.status} />
              <InfoItem icon={Calendar} label="Target Date" value={item.targetDate} />
              <InfoItem icon={Clock} label="Created" value={item.createdAt || 'N/A'} />
            </div>
          </div>
        );
      case 'rca':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BrainCog className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{item.incident}</h3>
                <p className="text-sm text-slate-500">RCA {item.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={User} label="Owner" value={item.owner} />
              <InfoItem icon={Flag} label="Status" value={item.status} />
              <InfoItem icon={Calendar} label="Created" value={item.createdAt} />
            </div>
          </div>
        );
      case 'risk':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="text-sm text-slate-500">Risk {item.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={User} label="Owner" value={item.owner} />
              <InfoItem icon={Flag} label="Severity" value={item.severity} />
              <InfoItem icon={Calendar} label="Created" value={item.createdAt} />
            </div>
          </div>
        );
      case 'client':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                <p className="text-sm text-slate-500">Client {item.id}</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoItem icon={Flag} label="Caution Reason" value={item.reason} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Item Details</h2>
          <button 
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors" 
            onClick={onClose} 
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {getModalContent()}
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
          <Link 
            to={`/${
              type === 'client'
                ? `ic-caution?client=${encodeURIComponent(item.id)}`
                : type === 'rca'
                ? `rca?id=${encodeURIComponent(item.id)}`
                : type === 'risk'
                ? `risks?id=${encodeURIComponent(item.id)}`
                : `rfc?id=${encodeURIComponent(item.id)}`
            }`}
            className="btn primary"
            onClick={onClose}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-slate-500" />
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="font-medium text-slate-900 dark:text-slate-100">{value}</div>
      </div>
    </div>
  );
}


