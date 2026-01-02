"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { useToast, ToastContainer } from "../../../components/Toast";
import { Search, Filter, FileText, Calendar, DollarSign, Eye, Download, Upload, Trash2 } from "lucide-react";
import { invoiceApi, Invoice, getErrorMessage } from "../../../lib/api";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("pending");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const data = await invoiceApi.getInvoices();
        setInvoices(data);
        setApiError("");
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setApiError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleViewInvoice = (invoiceId: number) => {
    router.push(`/admin/invoices/view/${invoiceId}`);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteDialog(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    setDeleting(true);
    try {
      await invoiceApi.deleteInvoice(invoiceToDelete.id);
      success("Invoice Deleted", `Invoice #${invoiceToDelete.invoice_number} has been deleted successfully.`);
      // Refresh invoices list
      const data = await invoiceApi.getInvoices();
      setInvoices(data);
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
    } catch (err) {
      console.error("Error deleting invoice:", err);
      error("Delete Failed", getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoices(new Set(filteredAndSortedInvoices.map(inv => inv.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: number) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return;
    
    setBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedInvoices).map(id => invoiceApi.deleteInvoice(id));
      await Promise.all(deletePromises);
      success("Bulk Delete", `${selectedInvoices.size} invoice(s) deleted successfully.`);
      // Refresh invoices list
      const data = await invoiceApi.getInvoices();
      setInvoices(data);
      setSelectedInvoices(new Set());
      setShowBulkDeleteDialog(false);
    } catch (err) {
      console.error("Error bulk deleting invoices:", err);
      error("Bulk Delete Failed", getErrorMessage(err));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedInvoices.size === 0) return;
    
    setBulkUpdating(true);
    try {
      const updatePromises = Array.from(selectedInvoices).map(id => 
        invoiceApi.updateInvoice(id, { status: bulkStatus })
      );
      await Promise.all(updatePromises);
      success("Bulk Update", `${selectedInvoices.size} invoice(s) status updated to ${bulkStatus}.`);
      // Refresh invoices list
      const data = await invoiceApi.getInvoices();
      setInvoices(data);
      setSelectedInvoices(new Set());
      setShowBulkStatusDialog(false);
    } catch (err) {
      console.error("Error bulk updating invoices:", err);
      error("Bulk Update Failed", getErrorMessage(err));
    } finally {
      setBulkUpdating(false);
    }
  };

  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        (invoice.customer?.name || "").toLowerCase().includes(searchLower) ||
        (invoice.supplier?.name || "").toLowerCase().includes(searchLower) ||
        invoice.total.toString().includes(searchTerm);
      
      if (!matchesSearch) return false;
      
      // Status filter
      if (statusFilter === "pending") {
        if (invoice.status) {
          return invoice.status.toLowerCase() === "pending";
        }
        const today = new Date();
        const dueDate = new Date(invoice.due_date || "");
        return !invoice.due_date || dueDate >= today;
      }
      if (statusFilter === "overdue") {
        if (invoice.status) {
          return invoice.status.toLowerCase() === "overdue";
        }
        const today = new Date();
        const dueDate = new Date(invoice.due_date || "");
        return invoice.due_date && dueDate < today;
      }
      if (statusFilter === "paid") {
        return invoice.status?.toLowerCase() === "paid";
      }
      if (statusFilter === "cancelled") {
        return invoice.status?.toLowerCase() === "cancelled";
      }
      if (statusFilter === "void") {
        return invoice.status?.toLowerCase() === "void";
      }
      
      // Date filter
      if (dateFilter !== "all") {
        const invoiceDate = new Date(invoice.issue_date);
        
        if (dateFilter === "custom") {
          // Custom date range
          if (customStartDate) {
            const startDate = new Date(customStartDate);
            if (invoiceDate < startDate) return false;
          }
          if (customEndDate) {
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            if (invoiceDate > endDate) return false;
          }
        } else {
          const today = new Date();
          const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dateFilter === "today") return daysDiff === 0;
          if (dateFilter === "week") return daysDiff <= 7;
          if (dateFilter === "month") return daysDiff <= 30;
          if (dateFilter === "quarter") return daysDiff <= 90;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
          break;
        case "amount":
          comparison = a.total - b.total;
          break;
        case "customer":
          comparison = (a.customer?.name || "").localeCompare(b.customer?.name || "");
          break;
        case "number":
          comparison = a.invoice_number.localeCompare(b.invoice_number);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
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
        <AdminLayout currentPage="invoices">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Loading invoices...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (apiError) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="invoices">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading invoices</div>
              <div className="text-white/70 mb-4">{apiError}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
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
      <AdminLayout currentPage="invoices">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setInvoiceToDelete(null);
          }}
          onConfirm={handleDeleteInvoice}
          title="Delete Invoice"
          message={invoiceToDelete ? `Are you sure you want to delete invoice #${invoiceToDelete.invoice_number}? This action cannot be undone.` : ""}
          confirmText={deleting ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          type="danger"
        />
        <ConfirmDialog
          isOpen={showBulkDeleteDialog}
          onClose={() => setShowBulkDeleteDialog(false)}
          onConfirm={handleBulkDelete}
          title="Delete Selected Invoices"
          message={`Are you sure you want to delete ${selectedInvoices.size} invoice(s)? This action cannot be undone.`}
          confirmText={bulkDeleting ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          type="danger"
        />
        {/* Bulk Status Update Dialog */}
        {showBulkStatusDialog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={() => setShowBulkStatusDialog(false)}
              ></div>
              <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-white mb-4">
                        Update Status
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-300 mb-4">
                          Update status for {selectedInvoices.size} invoice(s) to:
                        </p>
                        <select
                          value={bulkStatus}
                          onChange={(e) => setBulkStatus(e.target.value)}
                          className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                        >
                          <option value="pending">Pending</option>
                          <option value="overdue">Overdue</option>
                          <option value="paid">Paid</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="void">Void</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleBulkStatusUpdate}
                    disabled={bulkUpdating}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium bg-white hover:bg-gray-200 text-black sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {bulkUpdating ? "Updating..." : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkStatusDialog(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-transparent text-base font-medium text-gray-300 hover:text-white hover:bg-gray-600 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Invoice Management</h1>
          <p className="text-white/70">View and manage processed invoices</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="p-6 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 font-medium mb-4">Total Invoices</p>
            <p className="text-3xl font-bold text-white">{invoices.length}</p>
          </div>
          
          <div className="p-6 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 font-medium mb-4">Total Revenue</p>
            <p className="text-3xl font-bold text-white truncate">
              {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
            </p>
          </div>
          
          <div className="p-6 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 font-medium mb-4">Pending</p>
            <p className="text-3xl font-bold text-white">
              {invoices.filter(inv => {
                const today = new Date();
                const dueDate = new Date(inv.due_date || "");
                return !inv.due_date || dueDate >= today;
              }).length}
            </p>
          </div>
          
          <div className="p-6 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400 font-medium mb-4">Overdue</p>
            <p className="text-3xl font-bold text-white">
              {invoices.filter(inv => {
                const today = new Date();
                const dueDate = new Date(inv.due_date || "");
                return inv.due_date && dueDate < today;
              }).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice #, customer, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 border border-white/20 rounded-md bg-transparent text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
              <option value="void">Void</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== "custom") {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }
              }}
              className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === "custom" && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                  placeholder="Start Date"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                  placeholder="End Date"
                />
              </>
            )}

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (Highest)</option>
              <option value="amount-asc">Amount (Lowest)</option>
              <option value="customer-asc">Customer (A-Z)</option>
              <option value="customer-desc">Customer (Z-A)</option>
              <option value="number-asc">Number (A-Z)</option>
              <option value="number-desc">Number (Z-A)</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/admin/invoices/upload')}
              className="flex items-center px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Invoice
            </button>
            <button className="flex items-center px-3 py-2 border border-white/20 rounded-md text-white/70 hover:text-white hover:bg-transparent transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedInvoices.size > 0 && (
          <div className="mb-4 p-4 border border-gray-700 rounded-lg flex items-center justify-between">
            <div className="text-white">
              <span className="font-medium">{selectedInvoices.size}</span> invoice(s) selected
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBulkStatusDialog(true)}
                className="px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
              >
                Update Status
              </button>
              <button
                onClick={() => setShowBulkDeleteDialog(true)}
                className="px-4 py-2 text-red-400 hover:text-red-300 font-medium rounded-md transition-colors border border-red-700/50 hover:border-red-600"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedInvoices(new Set())}
                className="px-4 py-2 text-gray-400 hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.size > 0 && selectedInvoices.size === filteredAndSortedInvoices.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 text-gray-600 focus:ring-gray-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredAndSortedInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.has(invoice.id)}
                      onChange={() => handleSelectInvoice(invoice.id)}
                      className="rounded border-gray-600 text-gray-600 focus:ring-gray-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewInvoice(invoice.id)}
                      className="text-left group"
                    >
                      <div className="text-sm font-medium text-white group-hover:text-blue-400 group-hover:underline transition-colors">
                        {invoice.invoice_number}
                      </div>
                      <div className="text-sm text-gray-400">
                        {invoice.extraction_status || "Standard"}
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.customer ? (
                      <button
                        onClick={() => router.push(`/admin/customers/view/${invoice.customer_id}`)}
                        className="text-left group"
                      >
                        <div className="text-sm text-white group-hover:text-blue-400 group-hover:underline transition-colors">
                          {invoice.customer.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {invoice.customer.tax_id || ""}
                        </div>
                      </button>
                    ) : (
                      <div className="text-sm text-gray-400">N/A</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {invoice.due_date ? formatDate(invoice.due_date) : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="flex items-center text-gray-400 hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteClick(invoice)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        disabled={deleting}
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "No invoices have been processed yet."
              }
            </p>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}