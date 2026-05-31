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
  Loader2,
  Bell,
  Clock3,
  ShieldAlert,
  ShoppingCart,
  ReceiptText,
  BookOpen
} from "lucide-react";
import { 
  analyticsApi, 
  invoiceApi, 
  customerApi,
  AnalyticsOverview,
  Invoice,
  SupplierAnalyticsSummary,
  WorkflowSummary,
  getErrorMessage,
  purchaseOrderApi,
  expenseApi,
  ledgerApi,
  PurchaseOrder,
  Expense,
  LedgerSummary
} from "../../../lib/api";
import { workflowApi } from "../../../lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [workflowSummary, setWorkflowSummary] = useState<WorkflowSummary | null>(null);
  const [supplierInsights, setSupplierInsights] = useState<SupplierAnalyticsSummary | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch analytics overview and workflow context
        const [analyticsData, workflowData, supplierData, poData, expenseData, ledgerData] = await Promise.all([
          analyticsApi.getOverview(30),
          workflowApi.getSummary(),
          analyticsApi.getSupplierInsights(30, 3),
          purchaseOrderApi.getPurchaseOrders(),
          expenseApi.getExpenses(),
          ledgerApi.getSummary(),
        ]);
        setOverview(analyticsData);
        setWorkflowSummary(workflowData);
        setSupplierInsights(supplierData);
        setPurchaseOrders(poData);
        setExpenses(expenseData);
        setLedgerSummary(ledgerData);
        
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
    {
      name: "Purchase Orders",
      value: purchaseOrders.length.toString(),
      change: `${purchaseOrders.filter((order) => order.status === "approved").length} approved`,
      changeType: "positive" as const,
      icon: ShoppingCart,
    },
    {
      name: "Expenses",
      value: formatCurrencyShort(expenses.reduce((sum, expense) => sum + expense.total, 0)),
      change: `${expenses.filter((expense) => expense.approval_status === "pending").length} pending`,
      changeType: expenses.some((expense) => expense.approval_status === "pending") ? "negative" : "positive",
      icon: ReceiptText,
    },
    {
      name: "Ledger Balance",
      value: formatCurrencyShort(ledgerSummary?.balance || 0),
      change: "posted",
      changeType: "positive" as const,
      icon: BookOpen,
    },
  ] : [];

  const actionCenterItems = overview ? [
    {
      name: "Due Soon",
      value: workflowSummary?.due_soon || 0,
      description: "Invoices due in the next 7 days",
      detail: workflowSummary?.due_soon_invoices[0]
        ? `${workflowSummary.due_soon_invoices[0].invoice_number} due ${
            workflowSummary.due_soon_invoices[0].due_date ? formatDate(workflowSummary.due_soon_invoices[0].due_date) : "N/A"
          }`
        : "No immediate due invoices",
      icon: Clock3,
      actionLabel: "Open Workflow",
      onClick: () => router.push("/admin/workflow"),
    },
    {
      name: "Overdue Risk",
      value: overview.invoices.overdue_invoices,
      description: "Invoices already past due",
      detail: `${formatCurrencyShort(overview.revenue.overdue_revenue)} overdue revenue`,
      icon: ShieldAlert,
      actionLabel: "Open Analytics",
      onClick: () => router.push("/admin/analytics"),
    },
    {
      name: "Review Required",
      value: overview.ai_automation.review_required_count,
      description: "Documents waiting for human review",
      detail: `${overview.ai_automation.corrected_runs} corrected extractions so far`,
      icon: Bell,
      actionLabel: "Open Review Queue",
      onClick: () => router.push("/admin/review"),
    },
    {
      name: "Supplier Concentration",
      value: `${((supplierInsights?.largest_supplier_share || 0) * 100).toFixed(1)}%`,
      description: "Largest supplier share in the last 30 days",
      detail: supplierInsights?.largest_supplier
        ? `${supplierInsights.largest_supplier.supplier_name} leads supplier spend`
        : "No supplier concentration data yet",
      icon: TrendingUp,
      actionLabel: "Open Suppliers",
      onClick: () => router.push("/admin/suppliers"),
    },
  ] : [];

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="dashboard">
        {/* Page Header */}
        <div className="mb-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-black p-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40">Finance cockpit</p>
          <h1 className="mt-3 text-3xl font-bold text-white">FATURASM Dashboard</h1>
          <p className="mt-2 max-w-3xl text-gray-400">
            Monitor invoices, approvals, payments, purchase orders, expenses, and ledger health from one workspace.
          </p>
        </div>

        <div className="space-y-10">
          {/* Key Metrics */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Key Metrics</h3>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.name}
                  className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 shadow-lg shadow-black/20"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                    <stat.icon className="h-5 w-5 text-white/40" />
                  </div>
                  <p className="truncate text-2xl font-bold text-white">{stat.value}</p>
                  <div className="mt-3 flex items-center text-sm">
                    <span className={`font-medium ${
                      stat.changeType === "positive" ? "text-green-400" : "text-red-400"
                    }`}>
                      {stat.change}
                    </span>
                    <span className="ml-2 text-gray-500">from last period</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">Action Center</h3>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {actionCenterItems.map((item) => (
                <div key={item.name} className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 shadow-lg shadow-black/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">{item.name}</p>
                      <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                      <p className="mt-2 text-sm text-white/70">{item.description}</p>
                      <p className="mt-1 text-sm text-white/50">{item.detail}</p>
                    </div>
                    <item.icon className="h-6 w-6 shrink-0 text-white/50" />
                  </div>
                  <button
                    onClick={item.onClick}
                    className="mt-5 rounded-md border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 hover:bg-white/5"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Invoices */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-white">Recent Invoices</h3>
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/30 shadow-lg shadow-black/20">
              {recentInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Invoice</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Customer</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Amount</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {recentInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-5 py-4 text-sm font-medium">
                            <button
                              onClick={() => router.push(`/admin/invoices/view/${invoice.id}`)}
                              className="text-white transition-colors hover:text-blue-400 hover:underline"
                            >
                              {invoice.invoice_number}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {invoice.customer ? (
                              <button
                                onClick={() => router.push(`/admin/customers/view/${invoice.customer_id}`)}
                                className="text-gray-400 transition-colors hover:text-blue-400 hover:underline"
                              >
                                {invoice.customer.name}
                              </button>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-400">{formatCurrency(invoice.total)}</td>
                          <td className="px-5 py-4">
                            {getStatusBadge(invoice)}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-400">
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
          </section>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
