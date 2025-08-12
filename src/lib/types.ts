export type RfcStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed';

export type RfcPriority = 'High' | 'Medium' | 'Low';

export interface ApprovalEntry {
  user: string;
  date: string; // yyyy-mm-dd
  note?: string;
  rejected?: boolean;
}

export interface RfcDetails {
  configItems: string;
  reason: string;
  workRequired: string;
  whatChanges: string;
  servicesAffected: string;
  monitoring: string;
  backup: string;
  security: string;
  testing: string;
  rollback: string;
  netsuritResp: string;
  customerResp: string;
  comments: string;
}

export interface RfcItem {
  id: string;
  title: string;
  account: string;
  ticket: string;
  submitter: string;
  date: string; // yyyy-mm-dd
  priority: RfcPriority;
  status: RfcStatus;
  notification: '48 Hour' | 'Emergency' | 'Custom';
  summary: string;
  details: RfcDetails;
  approvals: ApprovalEntry[];
}


