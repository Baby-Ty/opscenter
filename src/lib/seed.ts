import type { RfcItem } from './types';

// Two examples seeded from the prompt: DR GPO change and Exchange rule example
export const rfcSeeds: RfcItem[] = [
  {
    id: 'RFC-1027',
    title: 'DR: Group Policy Update to Harden RDP and Local Admin',
    account: 'Maine Health (DR Site)',
    ticket: 'INC-45821',
    submitter: 'Ops - A. Patel',
    date: '2025-08-10',
    priority: 'High',
    status: 'Pending Approval',
    notification: '48 Hour',
    summary:
      'Apply new GPO baselines to DR OU to disable legacy protocols, restrict local admin, enforce RDP NLA, and align with production settings.',
    details: {
      configItems: 'Active Directory (DR OU), Group Policy Objects, Domain Controllers',
      reason: 'Reduce attack surface in DR, align with production security baselines, and address audit findings.',
      workRequired:
        'Backup current GPOs, import hardened templates, link to DR OU, run gpresult verification on representative hosts.',
      whatChanges:
        'RDP NLA enforced, SMB signing required, disable LM/NTLMv1, restrict local admin group memberships, update audit policies.',
      servicesAffected:
        'Domain-joined servers at DR during gpupdate interval; potential brief policy refresh CPU spikes.',
      monitoring: 'Event logs, SIEM alerts for failed logons, GPO processing times via perf counters.',
      backup: 'Export existing GPOs with GPMC before changes; create system restore points on pilot hosts.',
      security: 'Aligns with CIS benchmarks; reduces lateral movement paths.',
      testing: 'Pilot on 3 DR compute hosts; validate RDP access and application functions; roll out in waves.',
      rollback: 'Unlink new GPOs and re-link previous GPO backups; force gpupdate /force.',
      netsuritResp: 'Plan, implement, validate, and document changes; coordinate with CAB.',
      customerResp: 'Provide maintenance window and pilot host list; validate application behavior.',
      comments: 'Schedule outside of business hours; notify stakeholders 48 hours prior.',
    },
    approvals: [
      { user: 'SecOps - J. Chen', date: '2025-08-11', note: 'Looks good, aligns with prod.', rejected: false },
    ],
  },
  {
    id: 'RFC-1033',
    title: 'Exchange Online Transport Rule for External Tagging',
    account: 'Apex Health',
    ticket: 'REQ-7742',
    submitter: 'Ops - K. Wong',
    date: '2025-08-09',
    priority: 'Medium',
    status: 'Draft',
    notification: 'Custom',
    summary:
      'Create an Exchange transport rule to prepend "[External]" to subject lines for messages from outside the organization.',
    details: {
      configItems: 'Exchange Online, Transport Rules',
      reason: 'Improve user awareness to reduce phishing click-through.',
      workRequired: 'Define rule conditions and exception list; test with pilot users; communicate change.',
      whatChanges: 'New transport rule adds subject tag when sender is external; exceptions for trusted partners.',
      servicesAffected: 'Email subject lines for external messages; no delivery impact expected.',
      monitoring: 'Message trace and Security & Compliance alerts; user feedback channel.',
      backup: 'Export existing rules; snapshot current configuration via PowerShell.',
      security: 'No elevated risk; improves user awareness.',
      testing: 'Pilot group of 10 users; validate exceptions; monitor for false positives.',
      rollback: 'Disable or delete the transport rule; re-import previous configuration if required.',
      netsuritResp: 'Configure, test, communicate, and document change.',
      customerResp: 'Provide list of trusted partner domains; notify staff.',
      comments: 'Coordinate with comms; optional banner styling in Outlook.',
    },
    approvals: [],
  },
];


