"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, Bot, Building2, Download, Loader2, Sparkles, TrendingUp } from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { AnalyticsOverview, LearningLoopSummary, analyticsApi, getErrorMessage, SupplierAnalyticsSummary } from "../../../lib/api";
import { downloadCsv } from "../../../lib/csv";

const ranges = [30, 60, 90];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [supplierRangeSummary, setSupplierRangeSummary] = useState<SupplierAnalyticsSummary | null>(null);
  const [learningLoop, setLearningLoop] = useState<LearningLoopSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const resolveMonthWindow = (selectedDays: number, startDate?: string, endDate?: string) => {
    if (startDate && endDate) {
      const dayDiff = Math.max(
        Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        1
      );
      if (dayDiff <= 30) return 3;
      if (dayDiff <= 60) return 4;
      return 6;
    }

    if (selectedDays <= 30) return 3;
    if (selectedDays <= 60) return 4;
    return 6;
  };

  const fetchOverview = async (options?: { days?: number; startDate?: string; endDate?: string }) => {
    setLoading(true);
    setError("");
    try {
      const fallbackStartDate = dateStart && dateEnd ? dateStart : undefined;
      const fallbackEndDate = dateStart && dateEnd ? dateEnd : undefined;
      const { days: selectedDays = days, startDate = fallbackStartDate, endDate = fallbackEndDate } = options || {};
      const monthWindow = resolveMonthWindow(selectedDays, startDate, endDate);
      const [overviewData, supplierInsights, learningLoopData] = await Promise.all([
        analyticsApi.getOverview(selectedDays, startDate, endDate),
        analyticsApi.getSupplierInsights(selectedDays, monthWindow, startDate, endDate),
        analyticsApi.getLearningLoop(selectedDays, startDate, endDate),
      ]);
      setOverview(overviewData);
      setSupplierRangeSummary(supplierInsights);
      setLearningLoop(learningLoopData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOverview();
  }, []);

  const revenueForecast = useMemo(
    () => (overview?.revenue_forecast || []).map((item) => ({ ...item, shortDate: item.date.slice(5) })),
    [overview]
  );
  const invoiceTrends = useMemo(
    () => (overview?.invoice_trends || []).map((item) => ({ ...item, shortDate: item.date.slice(5) })),
    [overview]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const exportSupplierAnalytics = () => {
    if (!supplierRangeSummary) return;

    downloadCsv(
      "analytics-supplier-insights.csv",
      [
        "Supplier ID",
        "Supplier Name",
        "Invoice Count",
        "Total Spend",
        "Average Invoice",
        "Last Invoice Date",
        "Recent 30 Day Spend",
        "Previous 30 Day Spend",
      ],
      supplierRangeSummary.supplier_breakdown.map((supplier) => [
        supplier.supplier_id,
        supplier.supplier_name,
        supplier.invoice_count,
        supplier.total_spend,
        supplier.average_invoice,
        supplier.last_invoice_date || "",
        supplier.recent_30_day_spend,
        supplier.previous_30_day_spend,
      ])
    );
  };

  const applyPresetRange = async (range: number) => {
    setDays(range);
    setDateStart("");
    setDateEnd("");
    await fetchOverview({ days: range, startDate: undefined, endDate: undefined });
  };

  const applyCustomRange = async () => {
    if (!dateStart || !dateEnd) return;
    await fetchOverview({ days, startDate: dateStart, endDate: dateEnd });
  };

  const resetDateRange = async () => {
    setDateStart("");
    setDateEnd("");
    await fetchOverview({ days, startDate: undefined, endDate: undefined });
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="analytics">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics & AI Automation</h1>
              <p className="text-white/70">Live invoice trends, forecast signals, extraction quality metrics, and supplier insights.</p>
            </div>
            <div className="flex gap-2">
              {ranges.map((range) => (
                <button
                  key={range}
                  onClick={() => void applyPresetRange(range)}
                  className={`rounded-md px-4 py-2 text-sm transition-colors ${
                    !dateStart && !dateEnd && days === range ? "bg-white text-black" : "border border-gray-700 text-white hover:border-gray-500"
                  }`}
                >
                  {range}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-900/40 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Analytics Date Range</h2>
              <p className="text-sm text-white/60">Use presets or compare a custom supplier analytics window.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="date"
                value={dateStart}
                onChange={(event) => setDateStart(event.target.value)}
                className="rounded-md border border-white/20 bg-transparent px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <span className="text-sm text-white/50">to</span>
              <input
                type="date"
                value={dateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
                className="rounded-md border border-white/20 bg-transparent px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button
                onClick={() => void applyCustomRange()}
                disabled={!dateStart || !dateEnd}
                className="rounded-md border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
              <button
                onClick={() => void resetDateRange()}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white"
              >
                Reset
              </button>
              <button
                onClick={exportSupplierAnalytics}
                disabled={!supplierRangeSummary}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading analytics...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-red-100">
              <p className="font-medium mb-2">Unable to load analytics</p>
              <p className="text-sm text-red-100/80">{error}</p>
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-white/60">Revenue</p>
                    <TrendingUp className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="text-2xl font-bold text-white">TRY {overview.revenue.total_revenue.toLocaleString()}</p>
                  <p className="text-sm text-white/60 mt-2">{(overview.revenue.revenue_change_percent ?? 0).toFixed(1)}% vs previous window</p>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-white/60">Invoices</p>
                    <Activity className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="text-2xl font-bold text-white">{overview.invoices.total_invoices}</p>
                  <p className="text-sm text-white/60 mt-2">{overview.invoices.overdue_invoices} overdue in selected range</p>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-white/60">AI Extractions</p>
                    <Bot className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="text-2xl font-bold text-white">{overview.ai_automation.total_extractions}</p>
                  <p className="text-sm text-white/60 mt-2">{(overview.ai_automation.avg_confidence * 100).toFixed(1)}% average confidence</p>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-white/60">High-Risk Forecasts</p>
                    <AlertTriangle className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="text-2xl font-bold text-white">{overview.ai_automation.high_risk_forecasts}</p>
                  <p className="text-sm text-white/60 mt-2">{overview.ai_automation.forecast_count} forecasts generated</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">Invoice Trends</h2>
                    <p className="text-sm text-white/60">Amounts and invoice counts by issue date</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={invoiceTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="shortDate" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">Revenue Forecast</h2>
                    <p className="text-sm text-white/60">Short-horizon baseline forecast from recent invoice flow</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueForecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="shortDate" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#FFFFFF" fill="#4B5563" fillOpacity={0.35} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5 xl:col-span-2">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">Supplier Spend</h2>
                    <p className="text-sm text-white/60">Spend trend and invoice flow for the selected analytics window.</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={supplierRangeSummary?.monthly_spend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="label" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          formatter={(value: number | string | undefined, name: string | undefined) => [
                            name === "amount" ? formatCurrency(Number(value || 0)) : Number(value || 0),
                            name === "amount" ? "Spend" : "Active Suppliers",
                          ]}
                        />
                        <Bar dataKey="amount" fill="#E5E7EB" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="active_suppliers" fill="#6B7280" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">Supplier Snapshot</h2>
                    <p className="text-sm text-white/60">Top concentration and activity in range.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-white">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Top Supplier</span>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {supplierRangeSummary?.largest_supplier?.supplier_name || "No supplier data"}
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        {formatCurrency(supplierRangeSummary?.largest_supplier?.total_spend || 0)} in selected range
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Largest Share</p>
                      <p className="text-xl font-bold text-white mt-2">
                        {((supplierRangeSummary?.largest_supplier_share || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Active Suppliers</p>
                      <p className="text-xl font-bold text-white mt-2">{supplierRangeSummary?.active_suppliers || 0}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Recent Supplier Activity</p>
                      <p className="text-xl font-bold text-white mt-2">{supplierRangeSummary?.suppliers_with_recent_activity || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5 xl:col-span-2">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">Learning Loop</h2>
                    <p className="text-sm text-white/60">What users correct most often, so OCR improvements can target the right fields.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Total Runs</p>
                      <p className="mt-2 text-2xl font-bold text-white">{learningLoop?.total_runs || 0}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Corrected Runs</p>
                      <p className="mt-2 text-2xl font-bold text-white">{learningLoop?.corrected_runs || 0}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Total Corrections</p>
                      <p className="mt-2 text-2xl font-bold text-white">{learningLoop?.total_corrections || 0}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(learningLoop?.top_corrected_fields || []).map((field) => (
                      <span key={field.field} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                        {field.field} ({field.count})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">Provider Drift</h2>
                    <p className="text-sm text-white/60">Correction pressure by extraction provider.</p>
                  </div>
                  <div className="space-y-3">
                    {(learningLoop?.provider_breakdown || []).length > 0 ? (
                      (learningLoop?.provider_breakdown || []).map((provider) => (
                        <div key={provider.provider_name} className="rounded-lg bg-white/5 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{provider.provider_name}</p>
                            <span className="text-sm text-white/60">{(provider.correction_rate * 100).toFixed(1)}%</span>
                          </div>
                          <p className="mt-2 text-xs text-white/50">
                            {provider.corrected_runs}/{provider.total_runs} runs corrected, avg {provider.avg_correction_count.toFixed(1)} fields
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-white/50">
                        No correction data yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5 xl:col-span-2">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">Automation Quality</h2>
                    <p className="text-sm text-white/60">How often AI needs review and how much users correct it</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Review Required</p>
                      <p className="text-2xl font-bold text-white mt-2">{overview.ai_automation.review_required_count}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Correction Rate</p>
                      <p className="text-2xl font-bold text-white mt-2">{(overview.ai_automation.correction_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Corrected Runs</p>
                      <p className="text-2xl font-bold text-white mt-2">{overview.ai_automation.corrected_runs}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Avg Corrections / Run</p>
                      <p className="text-2xl font-bold text-white mt-2">{overview.ai_automation.avg_correction_count.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-white">AI Snapshot</h2>
                    <p className="text-sm text-white/60">A compact summary for finance ops</p>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-center gap-2 mb-2 text-white">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">Forecast Confidence</span>
                      </div>
                      <p className="text-xl font-bold text-white">{(overview.ai_automation.avg_forecast_confidence * 100).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Pending Revenue</p>
                      <p className="text-xl font-bold text-white mt-2">TRY {overview.revenue.pending_revenue.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-4">
                      <p className="text-sm text-white/60">Overdue Revenue</p>
                      <p className="text-xl font-bold text-white mt-2">TRY {overview.revenue.overdue_revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
