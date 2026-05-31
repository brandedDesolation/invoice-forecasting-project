"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ClipboardList, FileSearch } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { AdminPageSkeleton } from "../../../components/Skeleton";
import { ToastContainer, useToast } from "../../../components/Toast";
import { ReviewQueueItem, WorkflowSummary, getErrorMessage, reviewApi, workflowApi } from "../../../lib/api";

type TaskPriority = "high" | "medium" | "low";

interface OpsTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  source: "approval" | "review" | "payment" | "notification";
  actionLabel: string;
  actionUrl: string;
}

export default function TasksPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [workflow, setWorkflow] = useState<WorkflowSummary | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const loadTasks = async () => {
    try {
      setLoading(true);
      setApiError("");
      const [workflowData, reviewData] = await Promise.all([
        workflowApi.getSummary(),
        reviewApi.getQueue(undefined, true),
      ]);
      setWorkflow(workflowData);
      setReviewItems(reviewData.items);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const tasks = useMemo<OpsTask[]>(() => {
    if (!workflow) return [];

    const approvalTasks: OpsTask[] = workflow.pending_approval_invoices.map((invoice) => ({
      id: `approval-${invoice.id}`,
      title: `Approve ${invoice.invoice_number}`,
      description: `${invoice.supplier_name || invoice.customer_name || "Invoice"} is waiting for approval.`,
      priority: "high" as TaskPriority,
      source: "approval" as const,
      actionLabel: "Open Invoice",
      actionUrl: `/admin/invoices/view/${invoice.id}`,
    }));

    const dueSoonTasks: OpsTask[] = workflow.due_soon_invoices.map((invoice) => ({
      id: `due-${invoice.id}`,
      title: `Follow up ${invoice.invoice_number}`,
      description: `Due ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("tr-TR") : "soon"} for ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(invoice.total)}.`,
      priority: "medium" as TaskPriority,
      source: "payment" as const,
      actionLabel: "Open Invoice",
      actionUrl: `/admin/invoices/view/${invoice.id}`,
    }));

    const reviewTasks: OpsTask[] = reviewItems.map((item) => ({
      id: `review-${item.id}`,
      title: `Review ${item.invoice_number || item.source_filename || `extraction #${item.id}`}`,
      description: `Confidence ${item.overall_confidence ? `${(item.overall_confidence * 100).toFixed(1)}%` : "unknown"} with ${item.correction_count} correction(s).`,
      priority: ((item.overall_confidence || 1) < 0.7 ? "high" : "medium") as TaskPriority,
      source: "review" as const,
      actionLabel: item.invoice_id ? "Edit Invoice" : "Open Upload",
      actionUrl: item.invoice_id ? `/admin/invoices/edit/${item.invoice_id}` : "/admin/invoices/upload",
    }));

    const notificationTasks: OpsTask[] = workflow.notifications
      .filter((notification) => notification.status !== "read")
      .map((notification) => ({
        id: `notification-${notification.id}`,
        title: notification.title,
        description: notification.message,
        priority: notification.type.includes("overdue") ? "high" as TaskPriority : "low" as TaskPriority,
        source: "notification" as const,
        actionLabel: "Open",
        actionUrl: notification.action_url || "/admin/workflow",
      }));

    return [...approvalTasks, ...reviewTasks, ...dueSoonTasks, ...notificationTasks];
  }, [reviewItems, workflow]);

  const priorityClass = (priority: TaskPriority) => {
    if (priority === "high") return "border-red-400/40 text-red-200";
    if (priority === "medium") return "border-yellow-400/40 text-yellow-200";
    return "border-white/20 text-white/70";
  };

  const completeReview = async (task: OpsTask) => {
    if (!task.id.startsWith("review-")) {
      router.push(task.actionUrl);
      return;
    }

    const runId = Number(task.id.replace("review-", ""));
    try {
      await reviewApi.updateRun(runId, { status: "reviewed", review_required: false });
      success("Task Completed", "Review item marked as reviewed.");
      await loadTasks();
    } catch (err) {
      error("Task Failed", getErrorMessage(err));
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="tasks">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Operations Tasks</h1>
            <p className="mt-2 text-white/60">A single queue for approvals, OCR reviews, payment follow-ups, and unread workflow notices.</p>
          </div>

          {loading ? (
            <AdminPageSkeleton title="Loading operations queue..." />
          ) : apiError ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-red-200">{apiError}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <TaskStat label="Total Tasks" value={tasks.length} icon={<ClipboardList className="h-5 w-5" />} />
                <TaskStat label="Approvals" value={workflow?.pending_approvals || 0} icon={<CheckCircle2 className="h-5 w-5" />} />
                <TaskStat label="Review Items" value={reviewItems.length} icon={<FileSearch className="h-5 w-5" />} />
                <TaskStat label="Unread Notices" value={workflow?.unread_notifications || 0} icon={<Bell className="h-5 w-5" />} />
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-700 p-10 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-300" />
                  <p className="text-lg font-medium text-white">All clear</p>
                  <p className="mt-2 text-sm text-white/60">No approvals, reviews, or payment follow-ups are waiting.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${priorityClass(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{task.source}</span>
                          </div>
                          <h2 className="text-lg font-semibold text-white">{task.title}</h2>
                          <p className="mt-1 text-sm text-white/60">{task.description}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => router.push(task.actionUrl)}
                            className="rounded-md border border-white/20 px-4 py-2 text-sm text-white hover:border-white/40"
                          >
                            {task.actionLabel}
                          </button>
                          {task.source === "review" && (
                            <button
                              type="button"
                              onClick={() => void completeReview(task)}
                              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function TaskStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
      <div className="mb-3 flex items-center gap-2 text-white/70">{icon}</div>
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
