"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Activity, Database, Zap } from "lucide-react";

const analytics = [
  {
    title: "Payment Trends",
    value: "+12%",
    change: "vs last month",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Overdue Invoices",
    value: "-8%",
    change: "vs last month",
    trend: "down",
    icon: TrendingDown,
  },
  {
    title: "Average Payment Time",
    value: "23 days",
    change: "vs 28 days last month",
    trend: "up",
    icon: Calendar,
  },
  {
    title: "Total Revenue",
    value: "₺2.4M",
    change: "+15% vs last quarter",
    trend: "up",
    icon: DollarSign,
  },
];

const insights = [
  {
    title: "Payment Efficiency",
    description: "Average payment time decreased by 5 days compared to last month, indicating improved cash flow management.",
    trend: "positive",
    icon: Activity,
  },
  {
    title: "Overdue Management",
    description: "12 invoices are currently overdue. Consider implementing automated follow-up systems for better collection rates.",
    trend: "warning",
    icon: BarChart3,
  },
  {
    title: "Revenue Growth",
    description: "Q1 revenue is 15% higher than Q4, indicating strong business growth and market expansion opportunities.",
    trend: "positive",
    icon: TrendingUp,
  },
  {
    title: "Data Processing",
    description: "Analytics engine processed 1,247 invoices this month with 99.2% accuracy in payment predictions.",
    trend: "neutral",
    icon: Database,
  },
];

export default function AnalyticsPage() {
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
            <h1 className="text-3xl font-bold text-white mb-2">Analytics & Insights</h1>
            <p className="text-white/70">Analyze your business data and gain valuable insights</p>
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
                {analytics.map((item) => (
                  <div
                    key={item.title}
                    className="bg-white/10 p-6 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-300 w-full overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4 w-full">
                      <div className="flex items-center min-w-0 flex-1">
                        <item.icon className="h-6 w-6 mr-4 text-white flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white/70 mb-1 truncate" title={item.title}>{item.title}</p>
                          <p className="text-2xl font-bold text-white" title={item.value}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/20 w-full">
                      <span className="text-sm text-white" title={item.change}>
                        {item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts Section */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Data Visualizations</h3>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="bg-white/10 rounded-lg border border-white/20 p-8">
                  <div className="flex items-center mb-6">
                    <BarChart3 className="h-6 w-6 text-white mr-3" />
                    <h4 className="text-lg font-medium text-white">Payment Trends</h4>
                  </div>
                  <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg border-2 border-dashed border-white/20">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-white/40 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">Interactive chart will be implemented</p>
                      <p className="text-white/40 text-xs mt-1">Payment trends over time</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg border border-white/20 p-8">
                  <div className="flex items-center mb-6">
                    <TrendingUp className="h-6 w-6 text-white mr-3" />
                    <h4 className="text-lg font-medium text-white">Revenue Forecast</h4>
                  </div>
                  <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg border-2 border-dashed border-white/20">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-white/40 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">Interactive chart will be implemented</p>
                      <p className="text-white/40 text-xs mt-1">Revenue predictions and trends</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights Section */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Business Insights</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="bg-white/10 p-6 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-300"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-3 h-3 rounded-full bg-white/60"></div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center mb-2">
                          <insight.icon className="h-5 w-5 text-white mr-2" />
                          <h4 className="text-base font-medium text-white">{insight.title}</h4>
                        </div>
                        <p className="text-white/70 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">System Performance</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white/10 p-6 rounded-lg border border-white/20 w-full overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/70" title="Prediction Accuracy">Prediction Accuracy</p>
                      <p className="text-2xl font-bold text-white">99.2%</p>
                    </div>
                    <Zap className="h-8 w-8 text-white flex-shrink-0 ml-4" />
                  </div>
                  <div className="mt-auto w-full">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: "99.2%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 p-6 rounded-lg border border-white/20 w-full overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/70" title="Data Processing Speed">Data Processing Speed</p>
                      <p className="text-2xl font-bold text-white">1,247/min</p>
                    </div>
                    <Database className="h-8 w-8 text-white flex-shrink-0 ml-4" />
                  </div>
                  <div className="mt-auto w-full">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 p-6 rounded-lg border border-white/20 w-full overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/70" title="System Uptime">System Uptime</p>
                      <p className="text-2xl font-bold text-white">99.9%</p>
                    </div>
                    <Activity className="h-8 w-8 text-white flex-shrink-0 ml-4" />
                  </div>
                  <div className="mt-auto w-full">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: "99.9%" }}></div>
                    </div>
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
