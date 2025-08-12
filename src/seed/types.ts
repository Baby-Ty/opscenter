export type Rfc = {
  id: string;
  title: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Implemented';
  requestedBy: string;
  targetDate: string; // ISO date
};

export type Risk = {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  owner: string;
  createdAt: string;
};

export type Rca = {
  id: string;
  incident: string;
  owner: string;
  status: 'Open' | 'In Progress' | 'Completed';
  createdAt: string;
};

export type IcClient = {
  id: string;
  name: string;
  reason: string;
  tickets?: number;            // open ticket count
  notUpdated24h?: number;      // tickets without update in 24h
  lastFeedback?: string;       // brief last feedback summary or rating
};


// IT Service Management mock types

export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'New' | 'In Progress' | 'On Hold' | 'Resolved' | 'Closed';

export type TicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';

export interface IncidentSla {
  policy: string;      // e.g., "Response 1h / Resolution 4h"
  dueBy: string;       // ISO
  breached?: boolean;
}

export interface Incident {
  id: string;          // e.g., INC-1234
  title: string;
  client: string;
  priority: IncidentPriority;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: IncidentStatus;
  owner: string;
  openedAt: string;    // ISO
  lastUpdatedAt: string; // ISO
  sla: IncidentSla;
  relatedRfcId?: string;
  relatedRcaId?: string;
}

export interface Ticket {
  id: string;          // e.g., T-1001
  title: string;
  client: string;
  status: TicketStatus;
  owner: string;
  lastTouch: string;   // ISO
  promisedBy?: string; // ISO
  slaRisk?: boolean;
}

export type ProblemStatus = 'Open' | 'Known Error' | 'Closed';

export interface Problem {
  id: string;          // e.g., PRB-1001
  title: string;
  status: ProblemStatus;
  owner: string;
  createdAt: string;   // ISO
  linkedIncidentIds: string[];
  workaround?: string;
  rcaId?: string;      // link to an RCA when completed
}

export interface SlaSummary {
  queue: string;               // e.g., "P1 Incidents", "Response Time"
  targetPercent: number;       // e.g., 95
  achievedPercent: number;     // e.g., 92
  breachesToday: number;       // e.g., 2
  weekTrend: number[];         // sparkline-ready percentages
}


