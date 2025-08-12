export type KnowledgeStatus = 'Not started' | 'In progress' | 'Complete';

export type KnowledgeReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export type KnowledgeSection =
  | 'Printers' // legacy alias
  | 'Printing'
  | 'VPN'
  | 'Backup'
  | 'Licensing'
  | 'Active Directory'
  | 'Applications'
  | 'Change Control Request'
  | 'Email'
  | 'File Sharing'
  | 'Generic Note'
  | 'Grants Funding'
  | 'Hosted Services'
  | 'Internet/WAN'
  | 'LAN'
  | 'Remote Access'
  | 'Security'
  | 'Site Summary'
  | 'Student Inventory Tracking'
  | 'Vendors'
  | 'Virtualization'
  | 'Voice/PBX'
  | 'Wireless'
  // Core Assets (optional categories shown in screenshot)
  | 'Checklists'
  | 'Configurations'
  | 'Contacts'
  | 'Documents'
  | 'Domain Tracker'
  | 'Locations'
  | 'Networks'
  | 'Passwords'
  | 'SSL Tracker';

export interface KnowledgeAssignment {
  id: string;
  weekIso: string; // e.g. 2025-W32
  section: KnowledgeSection;
  engineer: string;
  companyIds: string[]; // from a fixed list of ~20 companies
  dueDate: string; // yyyy-mm-dd
  status: KnowledgeStatus;
  createdAt: string; // ISO timestamp
  submittedAt?: string; // when engineer submits as complete
  reviewStatus?: KnowledgeReviewStatus; // for review queue
}

export interface KnowledgeSnapshot {
  assignments: KnowledgeAssignment[];
}


