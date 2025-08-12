import { GitPullRequest, ShieldAlert, BrainCog, AlertTriangle } from 'lucide-react';
import type { Rfc, Risk, Rca, IcClient, Incident, Ticket, Problem, SlaSummary } from './types';

export const seed = {
  kpis: {
    pendingRfcs: 8,
    openRcas: 3,
    highCriticalRisks: 5,
    icCautionClients: 4,
  },
  rfcs: [
    { id: 'RFC-1021', title: 'Upgrade API gateway to v3.6', status: 'Pending', requestedBy: 'A. Patel', targetDate: '2025-08-20' },
    { id: 'RFC-1019', title: 'Rotate database credentials', status: 'Approved', requestedBy: 'K. Wong', targetDate: '2025-08-15' },
  ] as Rfc[],
  risks: [
    { id: 'RISK-221', title: 'Single point of failure in build agents', severity: 'High', owner: 'S. Brooks', createdAt: '2025-08-01' },
    { id: 'RISK-233', title: 'Unpatched OpenSSL on edge nodes', severity: 'Critical', owner: 'J. Chen', createdAt: '2025-08-10' },
  ] as Risk[],
  rcas: [
    { id: 'RCA-77', incident: 'Checkout latency spike 07/20', owner: 'P. Gomez', status: 'Open', createdAt: '2025-07-21' },
  ] as Rca[],
  icClients: [
    { id: 'C-5541', name: 'Apex Health', reason: 'Repeated payment declines', tickets: 7, notUpdated24h: 2, lastFeedback: '🙂 Good response' },
    { id: 'C-5782', name: 'Nordic Freight', reason: 'High chargeback ratio', tickets: 5, notUpdated24h: 1, lastFeedback: '😞 Waiting on fix' },
  ] as IcClient[],
  // ITSM mock datasets
  incidents: [
    {
      id: 'INC-45821',
      title: 'P1: RDP access failing for multiple users',
      client: 'Maine Health (DR Site)',
      priority: 'P1',
      severity: 'Critical',
      status: 'In Progress',
      owner: 'Ops - A. Patel',
      openedAt: '2025-08-10T10:05:00Z',
      lastUpdatedAt: '2025-08-11T12:15:00Z',
      sla: { policy: 'Response 15m / Restore 4h', dueBy: '2025-08-10T14:05:00Z', breached: false },
      relatedRfcId: 'RFC-1027',
      relatedRcaId: 'RCA-3765008',
    },
    {
      id: 'INC-46210',
      title: 'Email external tagging not applied for trusted partner',
      client: 'Apex Health',
      priority: 'P3',
      severity: 'Low',
      status: 'On Hold',
      owner: 'Ops - K. Wong',
      openedAt: '2025-08-09T08:30:00Z',
      lastUpdatedAt: '2025-08-10T15:20:00Z',
      sla: { policy: 'Response 4h / Resolve 3d', dueBy: '2025-08-12T08:30:00Z', breached: false },
      relatedRfcId: 'RFC-1033',
    },
  ] as Incident[],
  tickets: [
    { id: 'T-1001', title: 'Escalation: callback missed', client: 'Maine Health (DR Site)', status: 'Open', owner: 'AM-4', lastTouch: '2025-08-11T10:40:00Z' },
    { id: 'T-1002', title: 'SLA breach on P1 queue', client: 'Umbrella Co', status: 'In Progress', owner: 'AM-4', lastTouch: '2025-08-11T12:10:00Z', promisedBy: '2025-08-12T16:00:00Z', slaRisk: true },
    { id: 'T-1003', title: 'Weekly healthcheck', client: 'Apex Health', status: 'Resolved', owner: 'AM-2', lastTouch: '2025-08-10T14:00:00Z' },
  ] as Ticket[],
  problems: [
    {
      id: 'PRB-2001',
      title: 'Intermittent RDP failures in DR OU',
      status: 'Known Error',
      owner: 'SecOps - J. Chen',
      createdAt: '2025-08-10T11:00:00Z',
      linkedIncidentIds: ['INC-45821'],
      workaround: 'Retry connection after GP refresh; use VPN profile B',
      rcaId: 'RCA-3765008',
    },
  ] as Problem[],
  slaSummary: [
    { queue: 'P1 Incidents', targetPercent: 95, achievedPercent: 92, breachesToday: 1, weekTrend: [96, 95, 94, 93, 92, 94, 92] },
    { queue: 'Response Time', targetPercent: 90, achievedPercent: 88, breachesToday: 3, weekTrend: [89, 90, 88, 87, 89, 90, 88] },
  ] as SlaSummary[],
  activity: [
    { id: 'a1', title: 'RFC approved', description: 'Rotate database credentials', time: '2h ago', icon: <GitPullRequest className="h-4 w-4" /> },
    { id: 'a2', title: 'Risk escalated', description: 'Unpatched OpenSSL on edge nodes', time: '4h ago', icon: <ShieldAlert className="h-4 w-4" /> },
    { id: 'a3', title: 'RCA opened', description: 'Checkout latency spike 07/20', time: '1d ago', icon: <BrainCog className="h-4 w-4" /> },
    { id: 'a4', title: 'Client flagged', description: 'Nordic Freight added to IC caution', time: '1d ago', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'a5', title: 'RFC submitted', description: 'Upgrade API gateway to v3.6', time: '2d ago', icon: <GitPullRequest className="h-4 w-4" /> },
    { id: 'a6', title: 'Risk review', description: 'Build agent SPOF mitigation planned', time: '3d ago', icon: <ShieldAlert className="h-4 w-4" /> },
  ],
};

export type SeedData = typeof seed;


