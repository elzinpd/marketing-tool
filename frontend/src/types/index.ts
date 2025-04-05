import React from 'react';

export interface Campaign {
  id: number;
  name: string;
  platform: string;
  start_date: string;
  end_date: string | null;
  status: string;
  total_budget: number;
  spent_budget: number;
  client_id: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversion_rate: number;
  cpc: number;
  cost_per_conversion: number;
}

export interface Client {
  id: number;
  name: string;
  campaign_keywords: string;
  campaign_keywords_list?: string[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  template_path: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  name: string;
  client_id: number;
  start_date: string;
  end_date: string;
  template_id: number;
  status: string;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerformanceData {
  name: string;
  linkedin: number;
  rollworks: number;
  total: number;
}

export interface MetricCard {
  name: string;
  value: string;
  change: string;
  icon: React.ReactNode;
} 