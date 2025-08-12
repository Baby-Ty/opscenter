export type RcaStatus = 'Open' | 'In analysis' | 'Actioning' | 'Closed';
export type RcaMethod = 'Timeline' | '5 Whys' | 'Fishbone' | 'Other';
export type RcaActionStatus = 'Open' | 'In Progress' | 'Done';

export interface RcaActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string; // yyyy-mm-dd
  status: RcaActionStatus;
}

export interface RcaTimelineEvent {
  ts: string; // keep as provided (e.g., "2025-06-06 12:06 EST")
  note: string;
}

export interface RcaItem {
  id: string;
  title: string;
  client: string;
  owner: string;
  supportManager: string;
  slm: string;
  status: RcaStatus;
  method: RcaMethod | string;
  slaType: string;
  summary: string;
  linkedIncidentIds: string[];
  findings: string[];
  actions: RcaActionItem[];
  timeline: RcaTimelineEvent[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  closedAt?: string; // ISO
}


