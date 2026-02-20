export interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  status: 'Lead' | 'Opportunity' | 'Customer' | 'Inactive';
  last_contact: string;
  value: number;
}

export interface Deal {
  id: number;
  title: string;
  contact_id: number;
  contact_name?: string;
  stage: 'Discovery' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  value: number;
  close_date: string;
}

export interface Task {
  id: number;
  title: string;
  due_date: string;
  status: 'Pending' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
}

export interface Stats {
  pipelineValue: number;
  activeDeals: number;
  newLeads: number;
  winRate: number;
}
