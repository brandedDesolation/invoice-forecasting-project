"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { 
  TrendingUp, 
  BarChart3, 
  Activity, 
  Database, 
  Zap,
  Loader2
} from "lucide-react";
import { 
  analyticsApi, 
  AnalyticsOverview, 
  getErrorMessage 
} from "../../../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        
        let data;
        if (useCustomRange && customStartDate && customEndDate) {
          data = await analyticsApi.getOverview(30, customStartDate, customEndDate);
        } else {
          data = await analyticsApi.getOverview(timeRange);
        }
        
        setOverview(data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, useCustomRange, customStartDate, customEndDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="analytics">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="text-white">Loading analytics...</span>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="analytics">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading analytics</div>
              <div className="text-white/70 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!overview) {
    return null;
  }

  // Revenue breakdown for pie/bar chart
  const revenueBreakdown = [
    { name: 'Pending', value: overview.revenue.pending_revenue, color: '#f59e0b' },
    { name: 'Overdue', value: overview.revenue.overdue_revenue, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="analytics">
        {/* Analytics Section */}
        <section className="mb-32 scroll-mt-16 md:mb-40 lg:mb-48 lg:scroll-mt-24" aria-label="Analytics">
          <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">Analytics</h2>
          </div>
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Analytics & Insights</h1>
                <p className="text-white/70">Analyze your business data and gain valuable insights</p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={useCustomRange ? "custom" : timeRange}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setUseCustomRange(true);
                    } else {
                      setUseCustomRange(false);
                      setTimeRange(Number(e.target.value));
                    }
                  }}
                  className="px-4 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last year</option>
                  <option value="custom">Custom Range</option>
                </select>
                {useCustomRange && (
                  <>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-16 text-white/60 text-lg leading-relaxed">
              Comprehensive analytics and insights from your invoice data. Monitor trends, track performance metrics,
              and gain actionable insights to optimize your financial operations and forecasting accuracy.
            </p>

            {/* Key Metrics */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Key Metrics</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Revenue Growth</p>
                  <p className="text-3xl font-bold text-white mb-4">
                    {overview.revenue.revenue_change_percent !== undefined 
                      ? formatPercent(overview.revenue.revenue_change_percent)
                      : 'N/A'}
                  </p>
                  <span className="text-sm text-gray-500">vs last period</span>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Overdue Invoices</p>
                  <p className="text-3xl font-bold text-white mb-4">
                    {overview.invoices.overdue_invoices}
                  </p>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(overview.revenue.overdue_revenue)} overdue
                  </span>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Pending Invoices</p>
                  <p className="text-3xl font-bold text-white mb-4">
                    {overview.invoices.pending_invoices}
                  </p>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(overview.revenue.pending_revenue)} pending
                  </span>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Total Revenue</p>
                  <p className="text-3xl font-bold text-white mb-4 truncate" title={formatCurrency(overview.revenue.total_revenue)}>
                    {formatCurrency(overview.revenue.total_revenue)}
                  </p>
                  <span className="text-sm text-gray-500">
                    {overview.revenue.revenue_change_percent !== undefined 
                      ? `${formatPercent(overview.revenue.revenue_change_percent)} vs last period`
                      : 'All time'}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-6">Revenue Breakdown</h3>
              <div className="border border-gray-700 rounded-lg p-6 max-w-2xl">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff60"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#ffffff60"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Business Insights */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Business Insights</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="p-6 border border-gray-700 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center mb-2">
                        <Activity className="h-5 w-5 text-white mr-2" />
                        <h4 className="text-base font-medium text-white">Invoice Processing</h4>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        System has processed {overview.invoices.total_invoices} invoice{overview.invoices.total_invoices !== 1 ? 's' : ''} 
                        with {overview.invoices.pending_invoices} currently pending and {overview.invoices.overdue_invoices} overdue. 
                        {overview.invoices.overdue_invoices > 0 
                          ? ' Consider implementing automated follow-up systems for better collection rates.' 
                          : ' All invoices are current.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-3 h-3 rounded-full ${overview.invoices.overdue_invoices > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center mb-2">
                        <BarChart3 className="h-5 w-5 text-white mr-2" />
                        <h4 className="text-base font-medium text-white">Overdue Management</h4>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {overview.invoices.overdue_invoices} invoice{overview.invoices.overdue_invoices !== 1 ? 's are' : ' is'} currently overdue, 
                        totaling {formatCurrency(overview.revenue.overdue_revenue)}. 
                        {overview.invoices.overdue_invoices > 0 
                          ? ' Consider implementing automated follow-up systems for better collection rates.' 
                          : ' All invoices are current.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-5 w-5 text-white mr-2" />
                        <h4 className="text-base font-medium text-white">Revenue Growth</h4>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        Total revenue is {formatCurrency(overview.revenue.total_revenue)} with 
                        {overview.revenue.revenue_change_percent !== undefined && overview.revenue.revenue_change_percent > 0 
                          ? ` a ${formatPercent(overview.revenue.revenue_change_percent)} increase`
                          : overview.revenue.revenue_change_percent !== undefined 
                          ? ` a ${formatPercent(Math.abs(overview.revenue.revenue_change_percent))} decrease`
                          : ' no comparison data available'} 
                        {overview.revenue.revenue_change_percent !== undefined && overview.revenue.revenue_change_percent > 0 
                          ? ', indicating strong business growth and market expansion opportunities.' 
                          : '.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center mb-2">
                        <Database className="h-5 w-5 text-white mr-2" />
                        <h4 className="text-base font-medium text-white">Data Processing</h4>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        Analytics engine processed {overview.invoices.total_invoices} invoice{overview.invoices.total_invoices !== 1 ? 's' : ''} 
                        with {overview.invoices.pending_invoices} pending and {overview.invoices.overdue_invoices} overdue. 
                        Total revenue tracked is {formatCurrency(overview.revenue.total_revenue)}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">System Performance</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-6 border border-gray-700 rounded-lg w-full flex flex-col">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-400" title="Total Invoices">Total Invoices</p>
                      <p className="text-2xl font-bold text-white">
                        {overview.invoices.total_invoices}
                      </p>
                    </div>
                    <Database className="h-8 w-8 text-white flex-shrink-0 ml-4" />
                  </div>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg w-full flex flex-col">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-400" title="Pending Invoices">Pending Invoices</p>
                      <p className="text-2xl font-bold text-white">
                        {overview.invoices.pending_invoices}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-white flex-shrink-0 ml-4" />
                  </div>
                </div>

                <div className="p-6 border border-gray-700 rounded-lg w-full flex flex-col">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-400" title="Overdue Invoices">Overdue Invoices</p>
                      <p className="text-2xl font-bold text-white">
                        {overview.invoices.overdue_invoices}
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-white flex-shrink-0 ml-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
