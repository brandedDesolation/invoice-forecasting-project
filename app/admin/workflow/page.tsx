"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, CheckCircle2, Clock3, Loader2 } from "lucide-react";

import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { WorkflowSummary, getErrorMessage, workflowApi } from "../../../lib/api";

export default function WorkflowPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await workflowApi.getSummary();
        setSummary(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void fetchSummary();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString("tr-TR") : "N/A");

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="workflow">
          <div className="flex items-center justify-center min-h-[400px] text-white">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading workflow...
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error || !summary) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="workflow">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-white mb-3">Unable to load workflow</p>
              <p className="text-white/60 mb-4">{error || "Unknown workflow error"}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-md border border-white/20 px-4 py-2 text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="workflow">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Finance Workflow</h1>
            <p className="text-white/70">Track approvals, reminder activity, and operational notifications.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <p className="text-sm text-white/60">Pending Approvals</p>
              <p className="mt-3 text-3xl font-bold text-white">{summary.pending_approvals}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <p className="text-sm text-white/60">Due Soon</p>
              <p className="mt-3 text-3xl font-bold text-white">{summary.due_soon}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <p className="text-sm text-white/60">Overdue Unpaid</p>
              <p className="mt-3 text-3xl font-bold text-white">{summary.overdue_unpaid}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <p className="text-sm text-white/60">Unread Notifications</p>
              <p className="mt-3 text-3xl font-bold text-white">{summary.unread_notifications}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <div className="mb-5 flex items-center gap-2 text-white">
                <Clock3 className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Pending Approval Queue</h2>
              </div>
              <div className="space-y-3">
                {summary.pending_approval_invoices.length > 0 ? (
                  summary.pending_approval_invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      onClick={() => router.push(`/admin/invoices/view/${invoice.id}`)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-white/20"
                    >
                      <div>
                        <p className="text-sm text-white">{invoice.invoice_number}</p>
                        <p className="text-xs text-white/60">{invoice.supplier_name || invoice.customer_name || "No party linked"}</p>
                      </div>
                      <span className="text-sm text-white">{formatCurrency(invoice.total)}</span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-sm text-white/50">
                    No invoices are waiting for approval.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <div className="mb-5 flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Due Soon</h2>
              </div>
              <div className="space-y-3">
                {summary.due_soon_invoices.length > 0 ? (
                  summary.due_soon_invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      onClick={() => router.push(`/admin/invoices/view/${invoice.id}`)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-white/20"
                    >
                      <div>
                        <p className="text-sm text-white">{invoice.invoice_number}</p>
                        <p className="text-xs text-white/60">Due {formatDate(invoice.due_date)}</p>
                      </div>
                      <span className="text-sm text-white">{formatCurrency(invoice.total)}</span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-sm text-white/50">
                    No due-soon invoices in the next 7 days.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
            <div className="mb-5 flex items-center gap-2 text-white">
              <Bell className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Recent Notifications</h2>
            </div>
            <div className="space-y-3">
              {summary.notifications.length > 0 ? (
                summary.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        {notification.status === "read" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                          <Bell className="h-4 w-4 text-yellow-300" />
                        )}
                        <p className="text-sm font-medium text-white">{notification.title}</p>
                      </div>
                      <p className="text-sm text-white/70">{notification.message}</p>
                      <p className="mt-1 text-xs text-white/40">{new Date(notification.created_at).toLocaleString("tr-TR")}</p>
                    </div>
                    <div className="flex gap-3">
                      {notification.invoice_id && (
                        <button
                          onClick={() => router.push(`/admin/invoices/view/${notification.invoice_id}`)}
                          className="rounded-md border border-white/20 px-3 py-2 text-sm text-white"
                        >
                          Open Invoice
                        </button>
                      )}
                      {notification.status !== "read" && (
                        <button
                          onClick={async () => {
                            await workflowApi.markNotificationRead(notification.id);
                            const refreshed = await workflowApi.getSummary();
                            setSummary(refreshed);
                          }}
                          className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-sm text-white/50">
                  No workflow notifications yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
