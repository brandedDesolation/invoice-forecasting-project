"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Edit, Eye, FileText, Mail, MapPin, Phone, Trash2 } from "lucide-react";

import ProtectedRoute from "../../../../../components/ProtectedRoute";
import AdminLayout from "../../../../../components/AdminLayout";
import { ConfirmDialog } from "../../../../../components/ConfirmDialog";
import { ToastContainer, useToast } from "../../../../../components/Toast";
import { supplierApi, invoiceApi, Supplier, Invoice, getErrorMessage } from "../../../../../lib/api";

export default function ViewSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const { toasts, removeToast, success, error } = useToast();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [supplierData, invoicesData] = await Promise.all([
          supplierApi.getSupplier(parseInt(supplierId)),
          invoiceApi.getInvoicesBySupplier(parseInt(supplierId)),
        ]);
        setSupplier(supplierData);
        setInvoices(invoicesData);
        setApiError("");
      } catch (err) {
        setApiError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      void fetchData();
    }
  }, [supplierId]);

  const confirmDelete = async () => {
    if (!supplier) return;

    try {
      await supplierApi.deleteSupplier(parseInt(supplierId));
      success("Supplier Deleted", `${supplier.name} has been deleted successfully.`);
      setShowDeleteDialog(false);
      setTimeout(() => router.push("/admin/suppliers"), 1500);
    } catch (err) {
      error("Delete Failed", getErrorMessage(err));
      setShowDeleteDialog(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="suppliers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Loading supplier data...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (apiError) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="suppliers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading supplier</div>
              <div className="text-white/70 mb-4">{apiError}</div>
              <button
                onClick={() => router.push("/admin/suppliers")}
                className="px-4 py-2 text-white rounded-md border border-gray-700 hover:border-gray-600"
              >
                Back to Suppliers
              </button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!supplier) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="suppliers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Supplier not found</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const totalSpend = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const averageInvoice = invoices.length > 0 ? totalSpend / invoices.length : 0;
  const lastInvoiceDate =
    invoices.length > 0
      ? new Date(Math.max(...invoices.map((invoice) => new Date(invoice.issue_date).getTime()))).toLocaleDateString("tr-TR")
      : "Never";

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="suppliers">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Supplier"
          message={
            invoices.length > 0
              ? `Cannot delete "${supplier.name}" because it has ${invoices.length} linked invoice(s).`
              : `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`
          }
          confirmText={invoices.length > 0 ? "Supplier Has Invoices" : "Delete Supplier"}
          cancelText="Cancel"
          type="danger"
        />

        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push("/admin/suppliers")}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Suppliers
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Supplier Details</h1>
                <p className="text-white/70">View and manage supplier information</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push(`/admin/suppliers/edit/${supplierId}`)}
                  className="flex items-center px-4 py-2 text-white rounded-md border border-gray-700 hover:border-gray-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Supplier
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={invoices.length > 0}
                  className="flex items-center px-4 py-2 text-red-400 rounded-md border border-gray-700 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-700 rounded-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <Building2 className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl font-semibold text-white">{supplier.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Supplier ID</label>
                    <p className="text-white">#{supplier.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Created Date</label>
                    <p className="text-white flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(supplier.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Tax Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tax ID</label>
                    <p className="text-white flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      {supplier.tax_id || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <p className="text-white flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {supplier.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                    <p className="text-white flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {supplier.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                    <p className="text-white flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{supplier.address || "Not provided"}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Business Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Invoices</span>
                  <span className="text-white font-semibold">{invoices.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Spend</span>
                  <span className="text-white font-semibold">{formatCurrency(totalSpend)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Invoice</span>
                  <span className="text-white font-semibold">{formatCurrency(averageInvoice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Invoice Date</span>
                  <span className="text-white font-semibold">{lastInvoiceDate}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Linked Invoices</h3>
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
                          <span className="text-gray-400">{formatCurrency(invoice.total)}</span>
                          <span className="text-gray-500">{new Date(invoice.issue_date).toLocaleDateString("tr-TR")}</span>
                          <Eye className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No invoices found</div>
                )}
                {invoices.length > 5 && (
                  <button
                    onClick={() => router.push(`/admin/invoices?supplier=${supplierId}`)}
                    className="w-full text-sm text-gray-400 hover:text-white text-center py-2 border-t border-gray-700 pt-3 mt-2"
                  >
                    View All Invoices ({invoices.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
