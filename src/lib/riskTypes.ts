export type RiskStatus = 'Open' | 'In Review' | 'Mitigating' | 'Closed';
export type RiskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskImpact = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskLikelihood = 'Rare' | 'Unlikely' | 'Possible' | 'Likely' | 'Almost Certain';

export interface RiskMitigationItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string; // yyyy-mm-dd
  status: 'Open' | 'In Progress' | 'Done';
}

export interface RiskItem {
  id: string;
  category: string;
  title: string;
  ticket?: string;
  client: string;
  owner: string;
  status: RiskStatus;
  priority: RiskPriority;
  impact: RiskImpact;
  likelihood: RiskLikelihood;
  date: string; // yyyy-mm-dd
  briefDescription: string;
  analysis: string;
  tags: string[];
  mitigations: RiskMitigationItem[];
  nextReviewDue?: string; // yyyy-mm-dd
}


