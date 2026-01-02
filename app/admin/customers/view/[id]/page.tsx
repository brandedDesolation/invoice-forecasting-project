"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import AdminLayout from "../../../../../components/AdminLayout";
import { ArrowLeft, Mail, MapPin, Building, FileText, CalendarDays, Edit, Trash2, Eye } from "lucide-react";
import { customerApi, invoiceApi, Customer, Invoice, getErrorMessage } from "../../../../../lib/api";
import { useToast, ToastContainer } from "../../../../../components/Toast";
import { ConfirmDialog } from "../../../../../components/ConfirmDialog";

export default function ViewCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { toasts, removeToast, success, error } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiError("");
      try {
        const [customerData, invoicesData] = await Promise.all([
          customerApi.getCustomer(parseInt(customerId)),
          invoiceApi.getInvoicesByCustomer(parseInt(customerId))
        ]);
        setCustomer(customerData);
        setInvoices(invoicesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchData();
    }
  }, [customerId]);

  const handleEdit = () => {
    router.push(`/admin/customers/edit/${customerId}`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!customer) return;

    try {
      // Use cascade delete if customer has invoices
      await customerApi.deleteCustomer(parseInt(customerId), invoices.length > 0);
      success("Customer Deleted", 
        invoices.length > 0 
          ? `${customer.name} and ${invoices.length} invoice(s) have been deleted.`
          : `${customer.name} has been deleted successfully.`
      );
      setShowDeleteDialog(false);
      
      // Navigate back to customers list after a short delay
      setTimeout(() => {
        router.push("/admin/customers");
      }, 1500);
    } catch (err) {
      console.error("Error deleting customer:", err);
      const errorMessage = getErrorMessage(err);
      error("Delete Failed", errorMessage);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="customers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Loading customer data...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (apiError) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="customers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading customer</div>
              <div className="text-white/70 mb-4">{apiError}</div>
              <button
                onClick={() => router.push("/admin/customers")}
                className="px-4 py-2 text-white hover:text-gray-300 rounded-md transition-colors border border-gray-700 hover:border-gray-600"
              >
                Back to Customers
              </button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!customer) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="customers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Customer not found</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="customers">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Customer"
          message={
            invoices.length > 0
              ? `Are you sure you want to delete "${customer?.name}"? This will also delete ${invoices.length} invoice(s) associated with this customer. This action cannot be undone.`
              : `Are you sure you want to delete "${customer?.name}"? This action cannot be undone and will permanently remove all customer data.`
          }
          confirmText={invoices.length > 0 ? `Delete Customer & ${invoices.length} Invoices` : "Delete Customer"}
          cancelText="Cancel"
          type="danger"
        />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/admin/customers")}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Customer Details</h1>
                <p className="text-white/70">View and manage customer information</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center px-4 py-2 text-red-400 hover:text-red-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-red-500/50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="border border-gray-700 rounded-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <Building className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl font-semibold text-white">{customer.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                    <p className="text-white text-lg">{customer.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Customer ID</label>
                    <p className="text-white">#{customer.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created Date</label>
                    <p className="text-white flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(customer.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Tax Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tax ID</label>
                    <p className="text-white flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      {customer.tax_id || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Contact Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <p className="text-white flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {customer.email || "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                    <p className="text-white">
                      {customer.phone || "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                    <p className="text-white flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{customer.address || "Not provided"}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Business Statistics */}
            <div className="border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Business Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Invoices</span>
                  <span className="text-white font-semibold">{invoices.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Revenue</span>
                  <span className="text-white font-semibold">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(invoices.reduce((sum, inv) => sum + inv.total, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Invoice</span>
                  <span className="text-white font-semibold">
                    {invoices.length > 0
                      ? new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length)
                      : '₺0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Invoice Date</span>
                  <span className="text-white font-semibold">
                    {invoices.length > 0
                      ? new Date(Math.max(...invoices.map(inv => new Date(inv.issue_date).getTime()))).toLocaleDateString('tr-TR')
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Recent Invoices</h3>
              <div className="space-y-3">
                {invoices.length > 0 ? (
                  invoices
                    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
                    .slice(0, 5)
                    .map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors"
                        onClick={() => router.push(`/admin/invoices/view/${invoice.id}`)}
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-white">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-400">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                              minimumFractionDigits: 0,
                            }).format(invoice.total)}
                          </span>
                          <span className="text-gray-500">
                            {new Date(invoice.issue_date).toLocaleDateString('tr-TR')}
                          </span>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No invoices found
                  </div>
                )}
                {invoices.length > 5 && (
                  <button
                    onClick={() => router.push(`/admin/invoices?customer=${customerId}`)}
                    className="w-full text-sm text-gray-400 hover:text-white text-center py-2 border-t border-gray-700 pt-3 mt-2"
                  >
                    View All Invoices ({invoices.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </button>
              <button
                onClick={() => router.push(`/admin/invoices?customer=${customer.id}`)}
                className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Invoices
              </button>
              <button
                onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!customer.email}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
