"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, FileSearch, Loader2, PencilLine, RefreshCw } from "lucide-react";

import AdminLayout from "../../../components/AdminLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { ReviewQueueItem, getErrorMessage, reviewApi } from "../../../lib/api";

export default function ReviewQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await reviewApi.getQueue(statusFilter || undefined, true);
      setItems(response.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, [statusFilter]);

  const markReviewed = async (runId: number) => {
    try {
      setUpdatingId(runId);
      await reviewApi.updateRun(runId, { status: "reviewed", review_required: false });
      await loadQueue();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.status === "saved_pending_review").length;
    const corrected = items.filter((item) => item.correction_count > 0).length;
    const lowConfidence = items.filter((item) => (item.overall_confidence ?? 1) < 0.75).length;
    return { pending, corrected, lowConfidence };
  }, [items]);

  const formatDateTime = (value: string) => new Date(value).toLocaleString("tr-TR");
  const formatConfidence = (value?: number) => (value === undefined ? "-" : `${(value * 100).toFixed(1)}%`);

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="review">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Review Queue</h1>
              <p className="text-white/60 mt-2">Low-confidence and corrected extraction runs that still need human approval.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadQueue()}
              className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-white hover:border-gray-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-5">
              <p className="text-sm text-gray-400">Pending review</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.pending}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-5">
              <p className="text-sm text-gray-400">Corrected runs</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.corrected}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-5">
              <p className="text-sm text-gray-400">Low confidence</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.lowConfidence}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 mb-6">
            <label className="block text-sm text-gray-400 mb-2">Status filter</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full md:w-80 rounded-md border border-gray-700 bg-black/40 px-3 py-2 text-white focus:border-gray-500 focus:outline-none"
            >
              <option value="">All review-required items</option>
              <option value="saved_pending_review">Saved pending review</option>
              <option value="reviewed_saved">Reviewed and saved</option>
              <option value="reviewed">Reviewed</option>
              <option value="extracted">Extracted only</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[280px] text-white/70">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading review queue...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-red-200">{error}</div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 p-10 text-center text-white/60">
              No review items match this filter.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-white">
                          {item.invoice_number || item.source_filename || `Review Item #${item.id}`}
                        </h2>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">{item.status}</span>
                        <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-200">
                          Confidence {formatConfidence(item.overall_confidence)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Customer</p>
                          <p className="text-white">{item.customer_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Supplier</p>
                          <p className="text-white">{item.supplier_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Provider</p>
                          <p className="text-white">{item.provider_name}{item.model_version ? ` / ${item.model_version}` : ""}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Created</p>
                          <p className="text-white">{formatDateTime(item.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Corrections</p>
                          <p className="text-white">{item.correction_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Invoice link</p>
                          <p className="text-white">{item.invoice_id ? `Invoice #${item.invoice_id}` : "Not linked yet"}</p>
                        </div>
                      </div>

                      {item.corrected_fields.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-sm mb-2">Corrected fields</p>
                          <div className="flex flex-wrap gap-2">
                            {item.corrected_fields.map((field) => (
                              <span
                                key={field}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {item.invoice_id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/invoices/view/${item.invoice_id}`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-white hover:border-gray-500"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/invoices/edit/${item.invoice_id}`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-white hover:border-gray-500"
                          >
                            <PencilLine className="h-4 w-4 mr-2" />
                            Edit Invoice
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push("/admin/invoices/upload")}
                          className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md text-white hover:border-gray-500"
                        >
                          <FileSearch className="h-4 w-4 mr-2" />
                          Open Upload Flow
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void markReviewed(item.id)}
                        disabled={updatingId === item.id}
                        className="inline-flex items-center px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 disabled:opacity-60"
                      >
                        {updatingId === item.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Mark Reviewed
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
