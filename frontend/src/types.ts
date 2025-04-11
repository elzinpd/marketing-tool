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
  campaign_keywords?: string;
  campaign_keywords_list?: string[];
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

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  start_date: string;
  end_date: string;
  day_metrics?: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }>;
}

export interface Report {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  client_id: number;
}

export interface ReportTemplate {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
} 