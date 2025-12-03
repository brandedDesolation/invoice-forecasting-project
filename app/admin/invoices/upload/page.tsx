"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import AdminLayout from "../../../../components/AdminLayout";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { invoiceApi, InvoiceUploadResponse, ExtractedInvoiceData, getErrorMessage } from "../../../../lib/api";

export default function UploadInvoicePage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<InvoiceUploadResponse | null>(null);
  const [error, setError] = useState<string>("");

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    } else {
      setError("Please drop an image file (PNG, JPG, JPEG)");
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError("Please select an image file (PNG, JPG, JPEG)");
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const response = await invoiceApi.uploadInvoiceForOCR(file);
      setResult(response);
      
      if (response.success) {
        // Optionally redirect to invoice view after a delay
        setTimeout(() => {
          if (response.invoice_id) {
            router.push(`/admin/invoices/view/${response.invoice_id}`);
          }
        }, 3000);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="invoices">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Invoice</h1>
            <p className="text-white/70">Upload an invoice image to extract data using OCR</p>
          </div>

          {/* Upload Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Upload Zone */}
            <div className="space-y-6">
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-12 text-center transition-all
                  ${isDragging 
                    ? 'border-white bg-white/10' 
                    : 'border-white/30 hover:border-white/50'
                  }
                  ${file ? 'border-white/50' : ''}
                `}
              >
                {!file ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-white/50 mb-4" />
                    <div className="space-y-2">
                      <p className="text-white font-medium">
                        Drag and drop your invoice image here
                      </p>
                      <p className="text-white/60 text-sm">or</p>
                      <label className="inline-block">
                        <span className="px-4 py-2 bg-white text-black rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-white/40 text-xs mt-4">
                        Supports PNG, JPG, JPEG formats
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {preview && (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Invoice preview"
                          className="max-h-64 mx-auto rounded-lg border border-white/20"
                        />
                        <button
                          onClick={handleRemoveFile}
                          className="absolute top-2 right-2 p-2 bg-black/80 text-white rounded-full hover:bg-black transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="text-white">
                      <FileText className="mx-auto h-8 w-8 mb-2" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-white/60">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Process Invoice
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-red-200 text-sm">{error}</div>
                </div>
              )}

              {result && result.success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-green-200 text-sm">
                    <p className="font-medium">{result.message}</p>
                    {result.invoice_id && (
                      <p className="mt-1 text-xs">
                        Invoice ID: {result.invoice_id} - Redirecting to view page...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Extracted Data Preview */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Extracted Data</h2>
              
              {result && result.extracted_data ? (
                <div className="bg-gray-800/50 rounded-lg border border-gray-600/30 p-6 space-y-6">
                  <ExtractedDataDisplay data={result.extracted_data} />
                </div>
              ) : (
                <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-white/30 mb-4" />
                  <p className="text-white/50">
                    Upload an invoice to see extracted data here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function ExtractedDataDisplay({ data }: { data: ExtractedInvoiceData }) {
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  return (
    <div className="space-y-6">
      {/* Invoice Info */}
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Invoice Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Invoice Number:</span>
            <span className="text-white font-medium">{data.invoice_number || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Issue Date:</span>
            <span className="text-white">{formatDate(data.issue_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Due Date:</span>
            <span className="text-white">{formatDate(data.due_date)}</span>
          </div>
          {data.ocr_confidence && (
            <div className="flex justify-between">
              <span className="text-white/60">OCR Confidence:</span>
              <span className="text-white">{data.ocr_confidence.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Amounts */}
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Amounts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Subtotal:</span>
            <span className="text-white">{formatCurrency(data.amounts?.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Tax:</span>
            <span className="text-white">{formatCurrency(data.amounts?.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <span className="text-white font-medium">Total:</span>
            <span className="text-white font-bold text-lg">{formatCurrency(data.amounts?.total)}</span>
          </div>
        </div>
      </div>

      {/* Supplier */}
      {data.supplier && (data.supplier.name || data.supplier.tax_id) && (
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3">Supplier</h3>
          <div className="space-y-2 text-sm">
            {data.supplier.name && (
              <div>
                <span className="text-white/60">Name: </span>
                <span className="text-white">{data.supplier.name}</span>
              </div>
            )}
            {data.supplier.tax_id && (
              <div>
                <span className="text-white/60">Tax ID: </span>
                <span className="text-white">{data.supplier.tax_id}</span>
              </div>
            )}
            {data.supplier.phone && (
              <div>
                <span className="text-white/60">Phone: </span>
                <span className="text-white">{data.supplier.phone}</span>
              </div>
            )}
            {data.supplier.email && (
              <div>
                <span className="text-white/60">Email: </span>
                <span className="text-white">{data.supplier.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer */}
      {data.customer && (data.customer.name || data.customer.tax_id) && (
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3">Customer</h3>
          <div className="space-y-2 text-sm">
            {data.customer.name && (
              <div>
                <span className="text-white/60">Name: </span>
                <span className="text-white">{data.customer.name || "N/A"}</span>
              </div>
            )}
            {data.customer.tax_id && (
              <div>
                <span className="text-white/60">Tax ID: </span>
                <span className="text-white">{data.customer.tax_id}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}




