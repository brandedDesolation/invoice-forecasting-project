"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Building2, Download, Mail, MapPin, Phone, Plus, Search, TrendingUp, X } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { analyticsApi, supplierApi, Supplier, SupplierAnalyticsSummary, getErrorMessage } from "../../../lib/api";
import { downloadCsv } from "../../../lib/csv";

export default function SuppliersPage() {
  const router = useRouter();
  const presetRanges = [30, 60, 90];
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierAnalytics, setSupplierAnalytics] = useState<SupplierAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRangeDays, setSelectedRangeDays] = useState(90);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [filterWithInvoices, setFilterWithInvoices] = useState<boolean | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const resolveMonthWindow = (days: number, startDate?: string, endDate?: string) => {
    if (startDate && endDate) {
      const dayDiff = Math.max(
        Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        1
      );
      if (dayDiff <= 30) return 3;
      if (dayDiff <= 60) return 4;
      return 6;
    }

    if (days <= 30) return 3;
    if (days <= 60) return 4;
    return 6;
  };

  const fetchData = async (options?: { days?: number; startDate?: string; endDate?: string }) => {
    try {
      setLoading(true);
      const fallbackStartDate = dateStart && dateEnd ? dateStart : undefined;
      const fallbackEndDate = dateStart && dateEnd ? dateEnd : undefined;
      const { days = selectedRangeDays, startDate = fallbackStartDate, endDate = fallbackEndDate } = options || {};
      const monthWindow = resolveMonthWindow(days, startDate, endDate);
      const [suppliersData, analyticsData] = await Promise.all([
        supplierApi.getSuppliers(0, 1000),
        analyticsApi.getSupplierInsights(days, monthWindow, startDate, endDate),
      ]);
      setSuppliers(suppliersData);
      setSupplierAnalytics(analyticsData);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const supplierMetricsById = useMemo(
    () =>
      Object.fromEntries(
        (supplierAnalytics?.supplier_breakdown || []).map((supplier) => [supplier.supplier_id, supplier])
      ) as Record<number, SupplierAnalyticsSummary["supplier_breakdown"][number]>,
    [supplierAnalytics]
  );

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;

    setDeleting(true);
    try {
      await supplierApi.deleteSupplier(supplierToDelete.id);
      await fetchData();
      setToast({ message: "Supplier deleted successfully", type: "success" });
      setDeleteModalOpen(false);
      setSupplierToDelete(null);
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter((supplier) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          supplier.name.toLowerCase().includes(searchLower) ||
          supplier.email?.toLowerCase().includes(searchLower) ||
          supplier.phone?.toLowerCase().includes(searchLower) ||
          supplier.address?.toLowerCase().includes(searchLower) ||
          supplier.tax_id?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        if (filterWithInvoices === null) return true;
        const invoiceCount = supplierMetricsById[supplier.id]?.invoice_count || 0;
        return filterWithInvoices ? invoiceCount > 0 : invoiceCount === 0;
      }),
    [filterWithInvoices, searchTerm, supplierMetricsById, suppliers]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatCompactCurrency = (amount: number) =>
    amount >= 1000 ? `₺${(amount / 1000).toFixed(0)}k` : formatCurrency(amount);

  const exportSupplierAnalytics = () => {
    if (!supplierAnalytics) return;

    const rows = supplierAnalytics.supplier_breakdown.map((supplier) => [
      supplier.supplier_id,
      supplier.supplier_name,
      supplier.invoice_count,
      supplier.total_spend,
      supplier.average_invoice,
      supplier.last_invoice_date || "",
      supplier.recent_30_day_spend,
      supplier.previous_30_day_spend,
    ]);

    downloadCsv(
      "supplier-analytics.csv",
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
      rows
    );
  };

  const applyPresetRange = async (days: number) => {
    setSelectedRangeDays(days);
    setDateStart("");
    setDateEnd("");
    await fetchData({ days });
  };

  const applyCustomRange = async () => {
    if (!dateStart || !dateEnd) return;
    await fetchData({ days: selectedRangeDays, startDate: dateStart, endDate: dateEnd });
  };

  const resetDateRange = async () => {
    setDateStart("");
    setDateEnd("");
    await fetchData({ days: selectedRangeDays });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="suppliers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Loading suppliers...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="suppliers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading suppliers</div>
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

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="suppliers">
        <ConfirmDialog
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Supplier"
          message={`Are you sure you want to delete "${supplierToDelete?.name}"? Suppliers with linked invoices cannot be deleted.`}
          confirmText={deleting ? "Deleting..." : "Delete Supplier"}
          cancelText="Cancel"
          type="danger"
        />

        <section className="mb-32" aria-label="Suppliers">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Supplier Management</h1>
            <p className="text-white/70">Manage suppliers, review spending, and open linked invoices.</p>
          </div>

          <div className="mb-8 flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-900/40 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Supplier Analytics Range</h2>
                <p className="text-sm text-white/60">Switch between preset periods or apply a custom date range.</p>
              </div>
              <button
                onClick={exportSupplierAnalytics}
                disabled={!supplierAnalytics}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {presetRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => void applyPresetRange(range)}
                    className={`rounded-md px-4 py-2 text-sm transition-colors ${
                      !dateStart && !dateEnd && selectedRangeDays === range
                        ? "bg-white text-black"
                        : "border border-gray-700 text-white hover:border-gray-500"
                    }`}
                  >
                    {range}d
                  </button>
                ))}
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
              </div>
            </div>
          </div>

          {toast && (
            <div
              className={`mb-6 flex items-center justify-between rounded-lg border px-4 py-3 ${
                toast.type === "success"
                  ? "border-green-500/40 bg-green-500/10 text-green-100"
                  : "border-red-500/40 bg-red-500/10 text-red-100"
              }`}
            >
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 font-medium mb-4">Total Suppliers</p>
              <p className="text-3xl font-bold text-white">{suppliers.length}</p>
            </div>
            <div className="p-6 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 font-medium mb-4">Total Spend</p>
              <p className="text-3xl font-bold text-white truncate" title={formatCurrency(supplierAnalytics?.total_spend || 0)}>
                {formatCompactCurrency(supplierAnalytics?.total_spend || 0)}
              </p>
            </div>
            <div className="p-6 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 font-medium mb-4">Active Suppliers</p>
              <p className="text-3xl font-bold text-white">{supplierAnalytics?.active_suppliers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">with invoices</p>
            </div>
            <div className="p-6 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 font-medium mb-4">Avg. Invoice</p>
              <p className="text-3xl font-bold text-white truncate" title={formatCurrency(supplierAnalytics?.average_invoice || 0)}>
                {formatCompactCurrency(supplierAnalytics?.average_invoice || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{supplierAnalytics?.total_invoices || 0} total invoices</p>
            </div>
          </div>

          <div className="mb-16 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5 xl:col-span-2">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">Supplier Spend Trend</h2>
                <p className="text-sm text-white/60">Monthly supplier spend and invoice flow for the selected analytics range.</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={supplierAnalytics?.monthly_spend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="label" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value: number | string | undefined, name: string | undefined) => [
                        name === "amount" ? formatCurrency(Number(value || 0)) : Number(value || 0),
                        name === "amount" ? "Spend" : "Invoices",
                      ]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#FFFFFF" fill="#4B5563" fillOpacity={0.35} />
                    <Bar dataKey="invoice_count" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">Top Suppliers</h2>
                <p className="text-sm text-white/60">Ranked by invoice spend.</p>
              </div>
              <div className="space-y-3">
                {(supplierAnalytics?.top_suppliers || []).length > 0 ? (
                  (supplierAnalytics?.top_suppliers || []).map((supplier, index) => (
                    <button
                      key={supplier.supplier_id}
                      onClick={() => router.push(`/admin/suppliers/view/${supplier.supplier_id}`)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-white/20"
                    >
                      <div>
                        <p className="text-sm text-white">{index + 1}. {supplier.supplier_name}</p>
                        <p className="text-xs text-white/60">{supplier.invoice_count} invoices</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatCompactCurrency(supplier.total_spend)}</span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-white/50">
                    Supplier analytics will appear after invoices are linked.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Recent Activity</span>
              </div>
              <p className="text-2xl font-bold text-white">{supplierAnalytics?.suppliers_with_recent_activity || 0}</p>
              <p className="mt-2 text-sm text-white/60">suppliers billed in the last 30 days</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-white">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Avg Spend / Active Supplier</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCompactCurrency(supplierAnalytics?.average_spend_per_supplier || 0)}</p>
              <p className="mt-2 text-sm text-white/60">based on suppliers with at least one invoice</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Largest Supplier Share</span>
              </div>
              <p className="text-2xl font-bold text-white">{((supplierAnalytics?.largest_supplier_share || 0) * 100).toFixed(1)}%</p>
              <p className="mt-2 text-sm text-white/60">
                {supplierAnalytics?.largest_supplier ? supplierAnalytics.largest_supplier.supplier_name : "No supplier data yet"}
              </p>
            </div>
          </div>

          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search suppliers"
                  className="pl-10 pr-4 py-2 w-72 border border-white/20 rounded-md bg-transparent text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <select
                value={filterWithInvoices === null ? "all" : filterWithInvoices ? "with" : "without"}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilterWithInvoices(value === "all" ? null : value === "with");
                }}
                className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <option value="all">All Suppliers</option>
                <option value="with">With Invoices</option>
                <option value="without">Without Invoices</option>
              </select>
            </div>
            <button
              onClick={() => router.push("/admin/suppliers/create")}
              className="flex items-center px-4 py-2 text-white font-medium rounded-md border border-white/30 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => {
              const metrics = supplierMetricsById[supplier.id];
              const invoiceCount = metrics?.invoice_count || 0;
              const totalSpend = metrics?.total_spend || 0;
              return (
                <div
                  key={supplier.id}
                  className="border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-300 max-w-sm mx-auto min-h-[420px] flex flex-col"
                >
                  <div className="w-full">
                    <h3 className="text-lg font-medium text-white mb-4 break-words leading-tight" title={supplier.name}>
                      {supplier.name.length > 28 ? `${supplier.name.slice(0, 28)}...` : supplier.name}
                    </h3>
                    <div className="space-y-3 text-sm text-gray-300">
                      <div className="flex items-start min-w-0">
                        <span className="font-medium mr-2 text-gray-400 flex-shrink-0">Tax ID:</span>
                        <span className="break-all" title={supplier.tax_id}>{supplier.tax_id || "N/A"}</span>
                      </div>
                      {supplier.email && (
                        <div className="flex items-start min-w-0">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
                          <span className="break-all" title={supplier.email}>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-start min-w-0">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
                          <span className="break-all" title={supplier.phone}>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-start min-w-0">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
                          <span className="break-words" title={supplier.address}>
                            {supplier.address.length > 40 ? `${supplier.address.slice(0, 40)}...` : supplier.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
                    <div className="mb-2 flex justify-between text-gray-400">
                      <span>Invoices</span>
                      <span className={invoiceCount > 0 ? "text-white font-medium" : "text-gray-500"}>{invoiceCount}</span>
                    </div>
                    <div className="mb-2 flex justify-between text-gray-400">
                      <span>Total Spend</span>
                      <span className="text-white font-medium">{formatCompactCurrency(totalSpend)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Created</span>
                      <span className="text-white font-medium">{new Date(supplier.created_at).toLocaleDateString("tr-TR")}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => router.push(`/admin/suppliers/view/${supplier.id}`)}
                      className="flex-1 px-4 py-2 text-white rounded-md border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/admin/suppliers/edit/${supplier.id}`)}
                      className="flex-1 px-4 py-2 text-white rounded-md border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(supplier)}
                      className="flex-1 px-4 py-2 text-red-400 rounded-md border border-red-700/40 hover:border-red-500/60 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="mt-10 rounded-lg border border-dashed border-white/10 px-6 py-12 text-center">
              <p className="text-lg font-medium text-white">No suppliers match this filter</p>
              <p className="mt-2 text-sm text-white/60">Try adjusting your search or invoice filter.</p>
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
