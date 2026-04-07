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
  contact_email?: string;
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  date: string;
  dealId?: number;
}

export interface UserSettings {
  fullName: string;
  email: string;
  currency: 'Indian Rupee (₹)' | 'US Dollar ($)';
  timezone: string;
  aiInsights: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  primaryColor: 'emerald' | 'blue' | 'violet' | 'rose';
}
