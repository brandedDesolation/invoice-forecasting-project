"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import AdminLayout from "../../../../../components/AdminLayout";
import { ConfirmDialog } from "../../../../../components/ConfirmDialog";
import { useToast, ToastContainer } from "../../../../../components/Toast";
import { ArrowLeft, FileText, Calendar, DollarSign, Building, Mail, Phone, MapPin, Download, Printer, Upload, Eye, X, Image as ImageIcon, Edit, Trash2 } from "lucide-react";
import { invoiceApi, Invoice, getErrorMessage, API_BASE_URL } from "../../../../../lib/api";

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ filename: string; path: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setApiError("");
      try {
        const data = await invoiceApi.getInvoice(parseInt(invoiceId));
        setInvoice(data);
        
        // Check if invoice has image
        if (data.image_path) {
          setHasImage(true);
          setImageInfo({ filename: data.image_filename || "Invoice Image", path: data.image_path });
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setApiError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await invoiceApi.uploadInvoiceImage(parseInt(invoiceId), file);
      setHasImage(true);
      setImageInfo({ filename: file.name, path: "" });
      // Refresh invoice data
      const updatedInvoice = await invoiceApi.getInvoice(parseInt(invoiceId));
      setInvoice(updatedInvoice);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await invoiceApi.deleteInvoiceImage(parseInt(invoiceId));
      setHasImage(false);
      setImageInfo(null);
      // Refresh invoice data
      const updatedInvoice = await invoiceApi.getInvoice(parseInt(invoiceId));
      setInvoice(updatedInvoice);
    } catch (err) {
      console.error("Error deleting image:", err);
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteInvoice = async () => {
    setDeleting(true);
    try {
      await invoiceApi.deleteInvoice(parseInt(invoiceId));
      success("Invoice Deleted", "Invoice has been deleted successfully.");
      // Redirect to invoices list after a short delay
      setTimeout(() => {
        router.push("/admin/invoices");
      }, 1500);
    } catch (err) {
      console.error("Error deleting invoice:", err);
      error("Delete Failed", getErrorMessage(err));
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const formatDateTime = (date: string, time?: string) => {
    const dateObj = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      dateObj.setHours(parseInt(hours), parseInt(minutes));
    }
    return dateObj.toLocaleString('tr-TR');
  };

  const getStatusBadge = (invoice: Invoice) => {
    // Use manual status if set, otherwise calculate from due date
    if (invoice.status) {
      const statusColors: Record<string, string> = {
        pending: "bg-gray-500 text-white",
        overdue: "bg-black text-white",
        paid: "bg-green-500 text-white",
        cancelled: "bg-gray-600 text-white",
        void: "bg-red-600 text-white",
      };
      const colorClass = statusColors[invoice.status.toLowerCase()] || "bg-gray-500 text-white";
      return (
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${colorClass}`}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </span>
      );
    }

    // Auto-calculate if no manual status
    const today = new Date();
    const dueDate = new Date(invoice.due_date || "");
    const isOverdue = invoice.due_date && dueDate < today;

    if (isOverdue) {
      return <span className="px-3 py-1 text-sm font-medium bg-black text-white rounded-full">Overdue</span>;
    }
    return <span className="px-3 py-1 text-sm font-medium bg-gray-500 text-white rounded-full">Pending</span>;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="invoices">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Loading invoice...</div>
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
              <div className="text-white mb-4">Error loading invoice</div>
              <div className="text-white/70 mb-4">{apiError}</div>
              <button
                onClick={() => router.push("/admin/invoices")}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Back to Invoices
              </button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!invoice) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="invoices">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Invoice not found</div>
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
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteInvoice}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice #${invoice.invoice_number}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/admin/invoices")}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Invoice Details</h1>
                <p className="text-white/70">Invoice #{invoice.invoice_number}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push(`/admin/invoices/edit/${invoiceId}`)}
                  className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Invoice
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="px-4 py-2 text-red-400 hover:text-red-300 font-medium rounded-md transition-colors border border-red-700/50 hover:border-red-600"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Invoice Image Section */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Invoice Image</h3>
              <div className="flex space-x-2">
                {hasImage ? (
                  <>
                    <button
                      onClick={() => setImageModalOpen(true)}
                      className="flex items-center px-3 py-2 bg-white text-black hover:bg-gray-200 font-medium rounded-md transition-colors border border-gray-300"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Image
                    </button>
                    <button
                      onClick={handleDeleteImage}
                      className="flex items-center px-3 py-2 bg-black text-white hover:bg-gray-800 font-medium rounded-md transition-colors border border-gray-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </>
                ) : (
                  <label className="flex items-center px-3 py-2 bg-white text-black hover:bg-gray-200 font-medium rounded-md transition-colors border border-gray-300 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>
            
            {hasImage && invoice ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <ImageIcon className="h-8 w-8 text-white" />
                  <div>
                    <p className="text-white font-medium">{imageInfo?.filename}</p>
                    <p className="text-gray-400 text-sm">Image uploaded successfully</p>
                  </div>
                </div>
                <div className="relative w-full max-w-md mx-auto">
                  <img
                    src={`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}/file`}
                    alt="Invoice preview"
                    className="w-full h-auto rounded-lg border border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setImageModalOpen(true)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={() => setImageModalOpen(true)}>
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No invoice image uploaded</p>
                <p className="text-gray-500 text-sm">Upload an image of the physical invoice</p>
              </div>
            )}
          </div>

          {/* Invoice Header */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Invoice Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600/30 pb-2">Invoice Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Invoice Number</label>
                    <p className="text-white font-medium">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(invoice)}
                      <select
                        value={invoice.status || ""}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            await invoiceApi.updateInvoice(parseInt(invoiceId), { status: newStatus || undefined });
                            // Refresh invoice data
                            const updatedInvoice = await invoiceApi.getInvoice(parseInt(invoiceId));
                            setInvoice(updatedInvoice);
                          } catch (err) {
                            console.error("Error updating status:", err);
                            alert(getErrorMessage(err));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-transparent border border-gray-700 rounded text-white focus:outline-none focus:border-gray-600"
                      >
                        <option value="">Auto (from due date)</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="void">Void</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">OCR Status</label>
                    <p className="text-white">{invoice.extraction_status || "Standard"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Issue Date</label>
                    <p className="text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(invoice.issue_date)}
                    </p>
                  </div>
                  {invoice.ocr_confidence && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">OCR Confidence</label>
                      <p className="text-white">{(invoice.ocr_confidence * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  {invoice.due_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                      <p className="text-white flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-gray-600/30 pb-2">
                  <h3 className="text-lg font-semibold text-white">Customer Information</h3>
                  {invoice.customer && (
                    <button
                      onClick={() => router.push(`/admin/customers/view/${invoice.customer_id}`)}
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      View Details →
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                    <p className="text-white flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      {invoice.customer?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tax Number</label>
                    <p className="text-white">{invoice.customer?.tax_id || "N/A"}</p>
                  </div>
                  {invoice.customer?.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <p className="text-white flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {invoice.customer.email}
                      </p>
                    </div>
                  )}
                  {invoice.customer?.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                      <p className="text-white flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {invoice.customer.phone}
                      </p>
                    </div>
                  )}
                  {invoice.customer?.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
                      <p className="text-white flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{invoice.customer.address}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600/30 pb-2">Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sub Total:</span>
                    <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax:</span>
                    <span className="text-white">{formatCurrency(invoice.tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600/30 pt-3">
                    <span className="text-white font-semibold">Total Amount:</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-600/30">
                    {getStatusBadge(invoice)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          {invoice.items && invoice.items.length > 0 ? (
            <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600/30 pb-2">Invoice Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-600/30">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/30 divide-y divide-gray-600/30">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {item.quantity || 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(item.unit_price || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {formatCurrency(item.total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600/30 pb-2">Invoice Items</h3>
              <p className="text-white/60">No line items extracted from this invoice.</p>
            </div>
          )}

          {/* OCR Results - Raw Text */}
          {invoice.raw_text && (
            <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600/30 pb-2 flex items-center justify-between">
                <span>OCR Extraction Results</span>
                {invoice.ocr_confidence && (
                  <span className="text-sm font-normal text-gray-400">
                    Confidence: {(invoice.ocr_confidence * 100).toFixed(1)}%
                  </span>
                )}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Raw Extracted Text</label>
                  <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">
                      {invoice.raw_text}
                    </pre>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <p>This is the raw text extracted by the OCR system. The structured data above was parsed from this text.</p>
                </div>
              </div>
            </div>
          )}

          {/* Image Modal */}
          {imageModalOpen && invoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="bg-black border border-gray-700 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Invoice Image</h3>
                  <button
                    onClick={() => setImageModalOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-white mb-4">{imageInfo?.filename || "Invoice Image"}</p>
                  {invoice.image_path ? (
                    <div className="relative">
                      <img
                        src={`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}/file`}
                        alt="Invoice"
                        className="max-w-full h-auto rounded-lg border border-gray-700 mx-auto"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <div className="hidden bg-gray-800 rounded-lg p-8 border border-gray-700">
                        <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Unable to load image</p>
                        <p className="text-gray-500 text-sm mt-2">The image file may have been moved or deleted</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                      <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No image available</p>
                      <p className="text-gray-500 text-sm mt-2">This invoice does not have an associated image</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
