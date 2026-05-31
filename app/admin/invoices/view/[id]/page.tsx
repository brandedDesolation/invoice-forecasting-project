"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import AdminLayout from "../../../../../components/AdminLayout";
import { ConfirmDialog } from "../../../../../components/ConfirmDialog";
import InvoicePaymentsPanel from "../../../../../components/InvoicePaymentsPanel";
import { useToast, ToastContainer } from "../../../../../components/Toast";
import { ArrowLeft, FileText, Calendar, DollarSign, Building, Mail, Phone, MapPin, Download, Printer, Upload, Eye, X, Image as ImageIcon, Edit, Trash2, Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { authFetch, AuditEvent, forecastApi, ForecastInsight, invoiceApi, Invoice, workflowApi, getErrorMessage, API_BASE_URL } from "../../../../../lib/api";

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forecast, setForecast] = useState<ForecastInsight | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setApiError("");
      try {
        const data = await invoiceApi.getInvoice(parseInt(invoiceId));
        setInvoice(data);
        const [latestForecast, events] = await Promise.all([
          forecastApi.getLatestInvoiceForecast(parseInt(invoiceId)),
          invoiceApi.getInvoiceAuditEvents(parseInt(invoiceId)).catch(() => []),
        ]);
        setForecast(latestForecast);
        setAuditEvents(events);
        
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

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (!invoice?.image_path) {
        setImageUrl(null);
        return;
      }

      try {
        const response = await authFetch(`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}/file`);
        if (!response.ok) {
          setImageUrl(null);
          return;
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (_err) {
        setImageUrl(null);
      }
    };

    void loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoice?.image_path, invoiceId]);

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

  const handleGenerateForecast = async () => {
    setForecastLoading(true);
    try {
      const prediction = await forecastApi.predictInvoice(parseInt(invoiceId));
      setForecast(prediction.insight);
      const events = await invoiceApi.getInvoiceAuditEvents(parseInt(invoiceId)).catch(() => []);
      setAuditEvents(events);
      success("Prediction Ready", "Payment-risk forecast generated successfully.");
    } catch (err) {
      error("Prediction Failed", getErrorMessage(err));
    } finally {
      setForecastLoading(false);
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

  const handleApprovalUpdate = async (status: "approved" | "rejected" | "pending") => {
    if (!invoice) return;

    const note = window.prompt("Optional workflow note", invoice.approval_note || "");
    if (note === null) return;

    try {
      const updatedInvoice = await workflowApi.updateInvoiceApproval(invoice.id, {
        status,
        note: note || undefined,
      });
      setInvoice(updatedInvoice);
      const events = await invoiceApi.getInvoiceAuditEvents(invoice.id).catch(() => []);
      setAuditEvents(events);
      success("Workflow Updated", `Invoice marked as ${status}.`);
    } catch (err) {
      error("Workflow Update Failed", getErrorMessage(err));
    }
  };

  const handleSendReminder = async () => {
    if (!invoice) return;

    try {
      await workflowApi.sendInvoiceReminder(invoice.id);
      const refreshedInvoice = await invoiceApi.getInvoice(invoice.id);
      setInvoice(refreshedInvoice);
      const events = await invoiceApi.getInvoiceAuditEvents(invoice.id).catch(() => []);
      setAuditEvents(events);
      success("Reminder Queued", "Payment reminder has been queued for this invoice.");
    } catch (err) {
      error("Reminder Failed", getErrorMessage(err));
    }
  };

  const buildPrintHtml = () => {
    if (!invoice) return "";

    const itemsRows = (invoice.items || [])
      .map(
        (item) => `
          <tr>
            <td>${item.description || ""}</td>
            <td>${item.quantity || 1}</td>
            <td>${formatCurrency(item.unit_price || 0)}</td>
            <td>${formatCurrency(item.tax_amount || 0)}</td>
            <td>${formatCurrency(item.total || 0)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 32px; }
            h1, h2, h3 { margin: 0 0 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; }
            .summary { margin-top: 24px; width: 320px; margin-left: auto; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
            .muted { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Invoice ${invoice.invoice_number}</h1>
          <p class="muted">Generated from VICAI invoice detail page</p>
          <div class="grid">
            <div class="card">
              <h3>Invoice Information</h3>
              <p><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
              <p><strong>Due Date:</strong> ${invoice.due_date ? formatDate(invoice.due_date) : "N/A"}</p>
              <p><strong>Status:</strong> ${invoice.status || "Pending"}</p>
            </div>
            <div class="card">
              <h3>Customer</h3>
              <p><strong>Name:</strong> ${invoice.customer?.name || "N/A"}</p>
              <p><strong>Tax ID:</strong> ${invoice.customer?.tax_id || "N/A"}</p>
              <p><strong>Address:</strong> ${invoice.customer?.address || "N/A"}</p>
            </div>
          </div>
          <h3>Invoice Items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>KDV</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || `<tr><td colspan="5">No line items available</td></tr>`}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(invoice.subtotal)}</strong></div>
            <div class="summary-row"><span>KDV / Tax</span><strong>${formatCurrency(invoice.tax)}</strong></div>
            <div class="summary-row"><span>Total Amount</span><strong>${formatCurrency(invoice.total)}</strong></div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintInvoice = () => {
    if (!invoice) return;

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) {
      error("Print Failed", "Pop-up blocked. Please allow pop-ups and try again.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();
      const autoTable = autoTableModule.default;

      doc.setFontSize(18);
      doc.text(`Invoice ${invoice.invoice_number}`, 14, 18);
      doc.setFontSize(11);
      doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, 14, 28);
      doc.text(`Due Date: ${invoice.due_date ? formatDate(invoice.due_date) : "N/A"}`, 14, 35);
      doc.text(`Customer: ${invoice.customer?.name || "N/A"}`, 14, 42);
      doc.text(`Tax ID: ${invoice.customer?.tax_id || "N/A"}`, 14, 49);

      autoTable(doc, {
        startY: 58,
        head: [["Description", "Qty", "Unit Price", "KDV", "Total"]],
        body: (invoice.items || []).map((item) => [
          item.description || "",
          String(item.quantity || 1),
          formatCurrency(item.unit_price || 0),
          formatCurrency(item.tax_amount || 0),
          formatCurrency(item.total || 0),
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [40, 40, 40] },
      });

      const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 70;
      doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, 14, finalY + 14);
      doc.text(`KDV / Tax: ${formatCurrency(invoice.tax)}`, 14, finalY + 21);
      doc.text(`Total Amount: ${formatCurrency(invoice.total)}`, 14, finalY + 28);

      doc.save(`invoice-${invoice.invoice_number}.pdf`);
      success("PDF Downloaded", "Invoice PDF has been generated.");
    } catch (err) {
      console.error("Error generating PDF:", err);
      error("PDF Failed", getErrorMessage(err));
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
        partially_paid: "bg-blue-500 text-white",
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

  const getApprovalBadge = (approvalStatus?: string) => {
    const status = (approvalStatus || "pending").toLowerCase();
    const styles: Record<string, string> = {
      approved: "bg-green-500/20 text-green-200 border border-green-500/30",
      rejected: "bg-red-500/20 text-red-200 border border-red-500/30",
      pending: "bg-yellow-500/20 text-yellow-100 border border-yellow-500/30",
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
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

  const totalPaid = (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const outstandingBalance = Math.max(invoice.total - totalPaid, 0);
  const paymentProgress = invoice.total > 0 ? Math.min((totalPaid / invoice.total) * 100, 100) : 0;
  const fallbackAuditEvents = [
    { label: "Invoice created", value: formatDateTime(invoice.created_at), detail: "Invoice entered the VICAI workflow" },
    { label: "OCR extraction", value: invoice.extraction_status || "standard", detail: `${invoice.ocr_confidence ? `${(invoice.ocr_confidence * 100).toFixed(1)}% confidence` : "No OCR confidence recorded"}` },
    { label: "Approval", value: invoice.approval_status || "pending", detail: invoice.approved_at ? `Approved ${formatDateTime(invoice.approved_at)}` : "Waiting for approval" },
    { label: "Payments", value: `${formatCurrency(totalPaid)} collected`, detail: `${formatCurrency(outstandingBalance)} outstanding` },
    { label: "Forecast", value: forecast ? forecast.risk_level : "not generated", detail: forecast ? forecast.recommended_action : "Generate a forecast to complete the AI story" },
  ];
  const timelineEvents = auditEvents.length > 0
    ? auditEvents.map((event) => ({
        label: event.title,
        value: formatDateTime(event.created_at),
        detail: [event.message, event.actor ? `Actor: ${event.actor}` : ""].filter(Boolean).join(" "),
      }))
    : fallbackAuditEvents;
  const aiInsightCards = [
    {
      label: "Payment Risk",
      value: forecast ? `${(forecast.risk_score * 100).toFixed(0)}%` : "N/A",
      detail: forecast?.risk_level ? `${forecast.risk_level} risk` : "Generate forecast",
    },
    {
      label: "OCR Confidence",
      value: invoice.ocr_confidence ? `${(invoice.ocr_confidence * 100).toFixed(1)}%` : "N/A",
      detail: (invoice.ocr_confidence || 0) < 0.75 ? "Review recommended" : "Extraction looks stable",
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstandingBalance),
      detail: outstandingBalance > 0 ? "Payment follow-up needed" : "Fully paid",
    },
  ];

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
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
                >
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
                    src={imageUrl || ""}
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
                        <option value="partially_paid">Partially Paid</option>
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

          <InvoicePaymentsPanel
            invoiceId={Number(invoiceId)}
            invoiceTotal={invoice.total}
            onChanged={async () => {
              const updatedInvoice = await invoiceApi.getInvoice(parseInt(invoiceId));
              setInvoice(updatedInvoice);
              const events = await invoiceApi.getInvoiceAuditEvents(parseInt(invoiceId)).catch(() => []);
              setAuditEvents(events);
            }}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
            <div className="lg:col-span-2 rounded-lg border border-gray-600/30 bg-gray-800/30 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white">Payment Plan</h3>
              <p className="mt-1 text-sm text-white/60">Track partial payments and outstanding balance for this invoice.</p>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Invoice Total</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(invoice.total)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Paid</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Outstanding</p>
                  <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(outstandingBalance)}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm text-white/60">
                  <span>Collection progress</span>
                  <span>{paymentProgress.toFixed(0)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white" style={{ width: `${paymentProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-600/30 bg-gray-800/30 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              <div className="mt-5 space-y-3">
                {aiInsightCards.map((card) => (
                  <div key={card.label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">{card.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{card.value}</p>
                    <p className="mt-1 text-xs text-white/50">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Finance Workflow</h3>
                <p className="text-sm text-white/60 mt-1">Approve this invoice, track reminders, and keep the workflow moving.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void handleApprovalUpdate("approved")}
                  className="rounded-md border border-green-500/30 px-4 py-2 text-sm text-green-200 transition-colors hover:border-green-400/50"
                >
                  Approve
                </button>
                <button
                  onClick={() => void handleApprovalUpdate("rejected")}
                  className="rounded-md border border-red-500/30 px-4 py-2 text-sm text-red-200 transition-colors hover:border-red-400/50"
                >
                  Reject
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={!invoice.due_date}
                  className="rounded-md border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send Reminder
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Approval Status</p>
                <div className="mt-3">{getApprovalBadge(invoice.approval_status)}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Approved At</p>
                <p className="mt-3 text-white">{invoice.approved_at ? formatDateTime(invoice.approved_at) : "Not approved yet"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Last Reminder</p>
                <p className="mt-3 text-white">
                  {invoice.last_reminder_sent_at ? formatDateTime(invoice.last_reminder_sent_at) : "No reminder sent"}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Workflow Note</p>
                <p className="mt-3 text-white">{invoice.approval_note || "No workflow note added"}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white">Audit Trail</h3>
            <p className="mt-1 text-sm text-white/60">A presentation-friendly timeline of the invoice lifecycle.</p>
            <div className="mt-6 space-y-4">
              {timelineEvents.map((event, index) => (
                <div key={event.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-sm text-white">{index + 1}</div>
                    {index < auditEvents.length - 1 && <div className="h-full w-px bg-white/10" />}
                  </div>
                  <div className="pb-5">
                    <p className="font-medium text-white">{event.label}</p>
                    <p className="text-sm text-white/70">{event.value}</p>
                    <p className="mt-1 text-xs text-white/40">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4 border-b border-gray-600/30 pb-2">
              <div>
                <h3 className="text-lg font-semibold text-white">AI Payment Forecast</h3>
                <p className="text-sm text-white/60">Predicted payment timing, risk, and recommended follow-up</p>
              </div>
              <button
                onClick={handleGenerateForecast}
                disabled={forecastLoading}
                className="flex items-center px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {forecastLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {forecast ? "Refresh Forecast" : "Generate Forecast"}
              </button>
            </div>

            {forecast ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Predicted Payment Date</label>
                    <p className="text-white font-medium">{formatDate(forecast.predicted_payment_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Risk Level</label>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-sm rounded-full bg-white/10 text-white capitalize">{forecast.risk_level}</span>
                      <span className="text-sm text-white/70">{(forecast.risk_score * 100).toFixed(0)}% risk</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Confidence</label>
                    <p className="text-white">{(forecast.confidence_score * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Model</label>
                    <p className="text-white/80">{forecast.model_version}</p>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                    <p className="text-sm font-medium text-white mb-2">Why this prediction</p>
                    <p className="text-white/70 leading-relaxed">{forecast.explanation}</p>
                  </div>
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-300 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-100 mb-1">Recommended action</p>
                        <p className="text-sm text-yellow-50/90">{forecast.recommended_action}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(forecast.feature_summary || {}).slice(0, 8).map(([key, value]) => (
                      <div key={key} className="rounded-md bg-gray-900/60 px-3 py-2">
                        <p className="text-xs text-gray-400 capitalize">{key.replace(/_/g, " ")}</p>
                        <p className="text-sm text-white">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                No forecast has been generated for this invoice yet.
              </div>
            )}
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
                  {invoice.image_path && imageUrl ? (
                    <div className="relative">
                      <img
                        src={imageUrl}
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
