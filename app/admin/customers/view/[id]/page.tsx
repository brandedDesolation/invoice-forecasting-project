"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import AdminLayout from "../../../../../components/AdminLayout";
import { ArrowLeft, Mail, MapPin, Building, FileText, CalendarDays, Edit, Trash2 } from "lucide-react";
import { customerApi, Customer, getErrorMessage } from "../../../../../lib/api";
import { useToast, ToastContainer } from "../../../../../components/Toast";
import { ConfirmDialog } from "../../../../../components/ConfirmDialog";

export default function ViewCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { toasts, removeToast, success, error } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      setApiError("");
      try {
        const data = await customerApi.getCustomer(parseInt(customerId));
        setCustomer(data);
      } catch (err) {
        console.error("Error fetching customer:", err);
        setApiError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
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
      await customerApi.deleteCustomer(parseInt(customerId));
      success("Customer Deleted", `${customer.name} has been deleted successfully.`);
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
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
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
          message={`Are you sure you want to delete "${customer?.name}"? This action cannot be undone and will permanently remove all customer data.`}
          confirmText="Delete Customer"
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
                  className="flex items-center px-4 py-2 bg-white text-black hover:bg-gray-200 font-medium rounded-md transition-colors border border-gray-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center px-4 py-2 bg-black text-white hover:bg-gray-800 font-medium rounded-md transition-colors border border-gray-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <Building className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl font-semibold text-white">{customer.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-600/30 pb-2">Basic Information</h3>
                
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
                <h3 className="text-lg font-semibold text-white border-b border-gray-600/30 pb-2">Tax Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tax Number (VKN)</label>
                    <p className="text-white flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      {customer.tax_number || "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tax Office</label>
                    <p className="text-white">{customer.tax_office || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-600/30 pb-2">Contact Information</h3>
                
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
            <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600/30 pb-2">Business Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Invoices</span>
                  <span className="text-white font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Revenue</span>
                  <span className="text-white font-semibold">₺0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Invoice</span>
                  <span className="text-white font-semibold">₺0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Invoice Date</span>
                  <span className="text-white font-semibold">Never</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600/30 pb-2">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Customer created</span>
                  <span className="text-gray-500 ml-auto">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-500 text-center py-4">
                  No recent activity
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-white text-black hover:bg-gray-200 font-medium rounded-md transition-colors border border-gray-300"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </button>
              <button
                onClick={() => router.push(`/admin/invoices?customer=${customer.id}`)}
                className="flex items-center px-4 py-2 bg-white text-black hover:bg-gray-200 font-medium rounded-md transition-colors border border-gray-300"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Invoices
              </button>
              <button
                onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                className="flex items-center px-4 py-2 bg-white text-black hover:bg-gray-200 font-medium rounded-md transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
