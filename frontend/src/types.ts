export interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  token?: string;
}

export interface Client {
  id: number;
  name: string;
  industry: string;
  contact_email: string;
  contact_person: string;
  created_at: string;
  updated_at: string;
  linkedin_account_id?: string;
  status: string;
}

export interface Campaign {
  id: number;
  name: string;
  client_id: number;
  platform: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  conversion_rate: number;
  cpc: number;
  cpa: number;
} 