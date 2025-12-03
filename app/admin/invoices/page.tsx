"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { Search, Filter, FileText, Calendar, DollarSign, Eye, Download, Upload } from "lucide-react";
import { invoiceApi, Invoice, getErrorMessage } from "../../../lib/api";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const data = await invoiceApi.getInvoices();
        setInvoices(data);
        setError("");
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleViewInvoice = (invoiceId: number) => {
    router.push(`/admin/invoices/view/${invoiceId}`);
  };

  const filteredAndSortedInvoices = invoices
    .filter(invoice => {
      const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (invoice.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Status filter
      if (statusFilter === "paid") return invoice.total === 0;
      if (statusFilter === "unpaid") return invoice.total > 0;
      if (statusFilter === "overdue") {
        const today = new Date();
        const dueDate = new Date(invoice.due_date || "");
        return dueDate < today && invoice.total > 0;
      }
      
      // Date filter
      if (dateFilter !== "all") {
        const today = new Date();
        const invoiceDate = new Date(invoice.issue_date);
        const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === "today") return daysDiff === 0;
        if (dateFilter === "week") return daysDiff <= 7;
        if (dateFilter === "month") return daysDiff <= 30;
        if (dateFilter === "quarter") return daysDiff <= 90;
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
    const today = new Date();
    const dueDate = new Date(invoice.due_date || "");
    const isOverdue = dueDate < today && invoice.total > 0;
    const isPaid = invoice.total === 0;

    if (isPaid) {
      return <span className="px-2 py-1 text-xs font-medium bg-white text-black rounded-full">Paid</span>;
    }
    if (isOverdue) {
      return <span className="px-2 py-1 text-xs font-medium bg-black text-white rounded-full">Overdue</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-500 text-white rounded-full">Pending</span>;
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

  if (error) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="invoices">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading invoices</div>
              <div className="text-white/70 mb-4">{error}</div>
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Invoice Management</h1>
          <p className="text-white/70">View and manage processed invoices</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-300 truncate">Total Invoices</p>
                <p className="text-2xl font-bold text-white truncate">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-white flex-shrink-0 ml-3" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-300 truncate">Total Revenue</p>
                <p className="text-2xl font-bold text-white truncate">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-white flex-shrink-0 ml-3" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-300 truncate">Paid Invoices</p>
                <p className="text-2xl font-bold text-white truncate">
                  {invoices.filter(inv => inv.total === 0).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-white flex-shrink-0 ml-3" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-300 truncate">Overdue</p>
                <p className="text-2xl font-bold text-white truncate">
                  {invoices.filter(inv => {
                    const today = new Date();
                    const dueDate = new Date(inv.due_date || "");
                    return dueDate < today && inv.total > 0;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-white flex-shrink-0 ml-3" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-white/20 rounded-md bg-transparent text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>

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

        {/* Invoices Table */}
        <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600/30">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-600/30">
                {filteredAndSortedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {invoice.invoice_number}
                      </div>
                      <div className="text-sm text-gray-400">
                        {invoice.extraction_status || "Standard"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {invoice.customer?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-400">
                        {invoice.customer?.tax_id || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {invoice.due_date ? formatDate(invoice.due_date) : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="flex items-center text-white hover:text-gray-300 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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