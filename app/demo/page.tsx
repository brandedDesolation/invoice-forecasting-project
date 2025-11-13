"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Menu, X } from "lucide-react";
import { invoiceApi, InvoiceUploadResponse, ExtractedInvoiceData, getErrorMessage } from "../../lib/api";

export default function DemoPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<InvoiceUploadResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0a192f] text-white">
      {/* Simple Navigation Bar */}
      <nav className="bg-[#0a192f]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">Invoice Processor</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-white font-medium hover:text-gray-300 transition-colors">Invoices</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
            </div>

            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-4 py-2 space-y-2">
              <a href="#" className="block text-white font-medium">Invoices</a>
              <a href="#" className="block text-gray-400">About</a>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Invoice Data Extraction</h1>
          <p className="text-gray-400 text-lg">Upload an invoice image to extract structured data using OCR</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-[#112240]/50 rounded-lg border border-white/10 p-8 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Upload Invoice</h2>
              
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
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-white font-medium">
                        Drag and drop your invoice image here
                      </p>
                      <p className="text-gray-400 text-sm">or</p>
                      <label className="inline-block">
                        <span className="px-4 py-2 bg-white text-black rounded-md cursor-pointer hover:bg-gray-200 transition-colors font-medium">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-gray-500 text-xs mt-4">
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
                          className="absolute top-2 right-2 p-2 bg-black/80 text-white rounded-full shadow-md hover:bg-black transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="text-white">
                      <FileText className="mx-auto h-8 w-8 mb-2" />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-400">
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
                <div className="mt-4 p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-white text-sm">{error}</div>
                </div>
              )}

              {result && result.success && (
                <div className="mt-4 p-4 flex items-start">
                  <CheckCircle className="h-5 w-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-white text-sm">
                    <p className="font-medium">{result.message}</p>
                    {result.invoice_id && (
                      <p className="mt-1 text-xs text-gray-300">
                        Invoice ID: {result.invoice_id}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-lg border border-white/10 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Extracted Data</h2>
              
              {result && result.extracted_data ? (
                <ExtractedDataDisplay data={result.extracted_data} />
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">
                    Upload an invoice to see extracted data here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
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
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-widest">Invoice Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400">Invoice Number:</span>
            <span className="text-white font-medium">{data.invoice_number || "N/A"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400">Issue Date:</span>
            <span className="text-white">{formatDate(data.issue_date)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400">Due Date:</span>
            <span className="text-white">{formatDate(data.due_date)}</span>
          </div>
          {data.ocr_confidence && (
            <div className="flex justify-between py-2">
              <span className="text-gray-400">OCR Confidence:</span>
              <span className="text-white font-medium">{(data.ocr_confidence * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Amounts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-widest">Financial Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400">Subtotal:</span>
            <span className="text-white">{formatCurrency(data.amounts?.subtotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/10">
            <span className="text-gray-400">Tax (KDV):</span>
            <span className="text-white">{formatCurrency(data.amounts?.tax)}</span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-white/20 mt-2">
            <span className="text-white font-semibold">Total:</span>
            <span className="text-white font-bold text-lg">{formatCurrency(data.amounts?.total)}</span>
          </div>
        </div>
      </div>

      {/* Supplier */}
      {data.supplier && (data.supplier.name || data.supplier.tax_id) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-widest">Supplier</h3>
          <div className="space-y-2 text-sm">
            {data.supplier.name && (
              <div className="py-2 border-b border-white/10">
                <span className="text-gray-400">Name: </span>
                <span className="text-white">{data.supplier.name}</span>
              </div>
            )}
            {data.supplier.tax_id && (
              <div className="py-2 border-b border-white/10">
                <span className="text-gray-400">Tax ID: </span>
                <span className="text-white">{data.supplier.tax_id}</span>
              </div>
            )}
            {data.supplier.phone && (
              <div className="py-2">
                <span className="text-gray-400">Phone: </span>
                <span className="text-white">{data.supplier.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer */}
      {data.customer && (data.customer.name || data.customer.tax_id) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-widest">Customer</h3>
          <div className="space-y-2 text-sm">
            {data.customer.name && (
              <div className="py-2 border-b border-white/10">
                <span className="text-gray-400">Name: </span>
                <span className="text-white">{data.customer.name || "N/A"}</span>
              </div>
            )}
            {data.customer.tax_id && (
              <div className="py-2">
                <span className="text-gray-400">Tax ID: </span>
                <span className="text-white">{data.customer.tax_id}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

