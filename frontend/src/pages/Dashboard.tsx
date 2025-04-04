import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Download, Award, DollarSign, RefreshCw, Settings, PieChart, BarChart2 } from 'lucide-react';
import { Campaign, CampaignMetrics, PerformanceData, MetricCard } from '../types';
import { getCampaigns, getCampaignMetrics } from '../services/api';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campaignsData = await getCampaigns();
        setCampaigns(campaignsData);
        
        if (campaignsData.length > 0) {
          const metricsData = await getCampaignMetrics(
            campaignsData[0].id,
            format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            format(new Date(), 'yyyy-MM-dd')
          );
          setMetrics(metricsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const performanceData: PerformanceData[] = campaigns.map(campaign => ({
    name: format(new Date(campaign.start_date), 'MMM'),
    linkedin: campaign.platform === 'LinkedIn' ? campaign.spent_budget : 0,
    rollworks: campaign.platform === 'Rollworks' ? campaign.spent_budget : 0,
    total: campaign.spent_budget
  }));

  const metricCards: MetricCard[] = metrics ? [
    { name: 'Impressions', value: metrics.impressions.toLocaleString(), change: '+12%', icon: <BarChart2 className="h-4 w-4" /> },
    { name: 'Clicks', value: metrics.clicks.toLocaleString(), change: '+8%', icon: <Award className="h-4 w-4" /> },
    { name: 'Conversions', value: metrics.conversions.toLocaleString(), change: '+15%', icon: <DollarSign className="h-4 w-4" /> },
    { name: 'CTR', value: `${(metrics.ctr * 100).toFixed(2)}%`, change: '-3%', icon: <PieChart className="h-4 w-4" /> },
  ] : [];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ad Campaign Performance Dashboard</h1>
            <p className="text-sm text-gray-500">Last updated: {format(new Date(), 'MMMM d, yyyy')} at {format(new Date(), 'hh:mm a')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-md">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Last Report: March 25, 2025</span>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-md">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Next Report: April 15, 2025</span>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Generate PowerPoint
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm" 
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="all">All Platforms</option>
              <option value="linkedin">LinkedIn</option>
              <option value="rollworks">RollWorks</option>
            </select>
            <select 
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
          <button className="flex items-center text-blue-600 text-sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 border-b border-gray-200">
        <div className="flex space-x-6">
          {['overview', 'campaigns', 'optimization', 'reports'].map((tab) => (
            <button 
              key={tab}
              className={`py-3 border-b-2 ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              } font-medium capitalize`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-4 gap-6">
              {metricCards.map((metric, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                      <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                    </div>
                    <div className={`${
                      metric.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    } px-2 py-1 rounded text-xs font-medium`}>
                      {metric.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Performance Trends</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="linkedin" stroke="#0077B5" strokeWidth={2} />
                    <Line type="monotone" dataKey="rollworks" stroke="#4A154B" strokeWidth={2} />
                    <Line type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Campaign Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Campaign</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Platform</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Spend</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Impressions</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Clicks</th>
                    <th className="px-4 py-3 font-medium text-gray-500">CTR</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Conversions</th>
                    <th className="px-4 py-3 font-medium text-gray-500">CPA</th>
                    <th className="px-4 py-3 font-medium text-gray-500">ROI</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{campaign.name}</td>
                      <td className="px-4 py-3">{campaign.platform}</td>
                      <td className="px-4 py-3">${campaign.spent_budget.toLocaleString()}</td>
                      <td className="px-4 py-3">{metrics?.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3">{metrics?.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3">{(metrics?.ctr || 0).toFixed(2)}%</td>
                      <td className="px-4 py-3">{metrics?.conversions.toLocaleString()}</td>
                      <td className="px-4 py-3">${(metrics?.cost_per_conversion || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-green-600">387%</td>
                      <td className="px-4 py-3">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">AI-Powered Optimization Recommendations</h2>
            <div className="space-y-4">
              <div className="p-4 border border-green-200 bg-green-50 rounded-md">
                <h4 className="font-medium text-green-800">Budget Optimization Opportunity</h4>
                <p className="text-sm text-green-700 mt-1">
                  Shifting 20% of budget from "C-Suite Targeting" to "Q1 Product Launch" could increase overall conversions by ~18%
                </p>
              </div>
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-800">Performance Alert</h4>
                <p className="text-sm text-blue-700 mt-1">
                  "Dev Conference" campaign showing 32% higher CPA than other campaigns - audience refinement recommended
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Automated Reporting</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                <div>
                  <h3 className="font-medium">Monthly Executive Summary</h3>
                  <p className="text-sm text-gray-500 mt-1">Template: Executive-Brief-Q1-2025.pptx</p>
                  <p className="text-sm text-gray-500">Schedule: Every 1st of month</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">Edit</button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">Generate Now</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 