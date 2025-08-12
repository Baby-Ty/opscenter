import type { RcaItem } from './rcaTypes';

export const rcaSeeds: RcaItem[] = [
  {
    id: 'RCA-3765008',
    title: 'SmileBack Negative Review: Ticket 3765008 (CCI)',
    client: 'Community Concepts',
    owner: 'Alvin Basdeo',
    supportManager: 'Alvin Basdeo',
    slm: 'Paul Barnard',
    status: 'In analysis',
    method: 'Timeline',
    slaType: 'SLA',
    summary:
      'Customer reported negative experience linked to ticket 3765008. Investigating workflow timing, communication, and handoffs.',
    linkedIncidentIds: ['3765008'],
    findings: [],
    actions: [],
    timeline: [
      { ts: '2025-06-06 12:06 EST', note: 'Ticket came in and began processing' },
      { ts: '2025-06-06 12:19 EST', note: 'Ticket landed on mains board' },
      { ts: '2025-06-06 12:24 EST', note: 'Ticket discussed internally and assigned' },
      { ts: '2025-06-06 12:49 EST', note: 'Ticket acknowledged' },
      { ts: '2025-06-06 13:50 EST', note: 'Updated and rescheduled for 8:30 AM next day' },
      { ts: '2025-06-06 13:50 EST', note: 'Authorized QB install; user not connected to QB share; will call to check mapped drive' },
    ],
    createdAt: '2025-06-20T00:00:00Z',
    updatedAt: '2025-06-20T00:00:00Z',
  },
];


