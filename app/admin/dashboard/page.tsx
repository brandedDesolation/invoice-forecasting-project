"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { 
  FileText, 
  Users, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { 
  analyticsApi, 
  invoiceApi, 
  customerApi,
  AnalyticsOverview,
  Invoice,
  Customer,
  getErrorMessage 
} from "../../../lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch analytics overview
        const analyticsData = await analyticsApi.getOverview(30);
        setOverview(analyticsData);
        
        // Fetch recent invoices
        const invoices = await invoiceApi.getInvoices(0, 5);
        setRecentInvoices(invoices);
        
        // Fetch total customers
        const customers = await customerApi.getCustomers(0, 1);
        // We need to get total count, but API doesn't return it, so we'll use a workaround
        const allCustomers = await customerApi.getCustomers(0, 1000);
        setTotalCustomers(allCustomers.length);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  };

  const formatCurrencyShort = (amount: number): string => {
    if (amount >= 1000000) {
      return `₺${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₺${(amount / 1000).toFixed(0)}k`;
    }
    return formatCurrency(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const getStatusBadge = (invoice: Invoice) => {
    // Use manual status if set, otherwise calculate from due date
    if (invoice.status) {
      const statusColors: Record<string, string> = {
        pending: "text-yellow-400",
        overdue: "text-red-400",
        paid: "text-green-400",
        cancelled: "text-gray-400",
        void: "text-red-500",
      };
      const colorClass = statusColors[invoice.status.toLowerCase()] || "text-gray-400";
      return (
        <span className={`text-xs font-medium ${colorClass}`}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </span>
      );
    }

    // Auto-calculate if no manual status
    const today = new Date();
    const dueDate = new Date(invoice.due_date || "");
    const isOverdue = invoice.due_date && dueDate < today;

    if (isOverdue) {
      return <span className="text-xs font-medium text-red-400">Overdue</span>;
    }
    return <span className="text-xs font-medium text-yellow-400">Pending</span>;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="dashboard">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="text-white">Loading dashboard...</span>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="dashboard">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading dashboard</div>
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

  // Calculate stats from real data
  const stats = overview ? [
    {
      name: "Total Invoices",
      value: overview.invoices.total_invoices.toString(),
      change: overview.invoices.invoices_change_percent !== undefined 
        ? `${overview.invoices.invoices_change_percent >= 0 ? '+' : ''}${overview.invoices.invoices_change_percent.toFixed(1)}%`
        : "N/A",
      changeType: overview.invoices.invoices_change_percent !== undefined && overview.invoices.invoices_change_percent >= 0 ? "positive" : "negative",
      icon: FileText,
    },
    {
      name: "Active Customers",
      value: totalCustomers.toString(),
      change: "N/A",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      name: "Total Revenue",
      value: formatCurrencyShort(overview.revenue.total_revenue),
      change: overview.revenue.revenue_change_percent !== undefined
        ? `${overview.revenue.revenue_change_percent >= 0 ? '+' : ''}${overview.revenue.revenue_change_percent.toFixed(1)}%`
        : "N/A",
      changeType: overview.revenue.revenue_change_percent !== undefined && overview.revenue.revenue_change_percent >= 0 ? "positive" : "negative",
      icon: DollarSign,
    },
    {
      name: "Overdue Invoices",
      value: overview.invoices.overdue_invoices.toString(),
      change: `${overview.invoices.overdue_invoices > 0 ? '-' : '+'}${overview.invoices.overdue_invoices}`,
      changeType: overview.invoices.overdue_invoices > 0 ? "negative" : "positive",
      icon: AlertTriangle,
    },
  ] : [];

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="dashboard">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-400">Monitor your business performance and key metrics</p>
        </div>

            {/* Key Metrics */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Key Metrics</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.name}
                    className="p-6 border border-gray-700 rounded-lg w-full"
                  >
                    <p className="text-sm text-gray-400 font-medium mb-4">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mb-4 truncate">{stat.value}</p>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">from last period</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="mb-32">
              <h3 className="text-xl font-semibold text-white mb-10">Recent Invoices</h3>
              {recentInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {recentInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium">
                            <button
                              onClick={() => router.push(`/admin/invoices/view/${invoice.id}`)}
                              className="text-white hover:text-blue-400 hover:underline transition-colors"
                            >
                              {invoice.invoice_number}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {invoice.customer ? (
                              <button
                                onClick={() => router.push(`/admin/customers/view/${invoice.customer_id}`)}
                                className="text-gray-400 hover:text-blue-400 hover:underline transition-colors"
                              >
                                {invoice.customer.name}
                              </button>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{formatCurrency(invoice.total)}</td>
                          <td className="px-6 py-4">
                            {getStatusBadge(invoice)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {invoice.due_date ? formatDate(invoice.due_date) : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white/70">No invoices found</p>
                  <p className="text-white/50 text-sm mt-2">Upload invoices to see them here</p>
                </div>
              )}
            </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
