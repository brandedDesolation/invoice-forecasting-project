"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import AdminLayout from "../../../../components/AdminLayout";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, ArrowLeft, Edit, Save } from "lucide-react";
import { invoiceApi, customerApi, Customer, ExtractedInvoiceData, getErrorMessage, API_BASE_URL } from "../../../../lib/api";

interface EditableInvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  customer_name: string;
  customer_tax_id: string;
  supplier_name: string;
  supplier_tax_id: string;
  raw_text: string;
  ocr_confidence: number;
}

export default function UploadInvoicePage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Extracted data (editable)
  const [extractedData, setExtractedData] = useState<EditableInvoiceData | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  
  // Existing customers for selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [createNewCustomer, setCreateNewCustomer] = useState(true);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customerApi.getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error("Failed to load customers:", err);
      }
    };
    loadCustomers();
  }, []);

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
    setSuccess("");
    setExtractedData(null);

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
    setExtractedData(null);
    setError("");
    setSuccess("");
  };

  const handleProcessOCR = async () => {
    if (!file) return;

    setProcessing(true);
    setError("");

    try {
      // Use fetch directly for OCR-only processing
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/upload/ocr-only`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "OCR processing failed");
      }
      
      const result = await response.json();
      
      // Set editable data
      setExtractedData({
        invoice_number: result.invoice_number || "",
        issue_date: result.issue_date || new Date().toISOString().split('T')[0],
        due_date: result.due_date || "",
        subtotal: result.amounts?.subtotal || 0,
        tax: result.amounts?.tax || 0,
        total: result.amounts?.total || 0,
        customer_name: result.customer?.name || "",
        customer_tax_id: result.customer?.tax_id || "",
        supplier_name: result.supplier?.name || "",
        supplier_tax_id: result.supplier?.tax_id || "",
        raw_text: result.raw_text || "",
        ocr_confidence: result.ocr_confidence || 0,
      });
      
    } catch (err) {
      console.error("OCR error:", err);
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleFieldChange = (field: keyof EditableInvoiceData, value: string | number) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  };

  const handleSaveInvoice = async () => {
    if (!extractedData || !file) return;
    
    // Validate required fields
    if (!extractedData.invoice_number) {
      setError("Invoice number is required");
      return;
    }
    
    setSaving(true);
    setError("");

    try {
      // Upload with the corrected data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('invoice_number', extractedData.invoice_number);
      formData.append('issue_date', extractedData.issue_date);
      formData.append('due_date', extractedData.due_date);
      formData.append('subtotal', extractedData.subtotal.toString());
      formData.append('tax', extractedData.tax.toString());
      formData.append('total', extractedData.total.toString());
      formData.append('customer_name', extractedData.customer_name);
      formData.append('customer_tax_id', extractedData.customer_tax_id);
      formData.append('supplier_name', extractedData.supplier_name);
      formData.append('supplier_tax_id', extractedData.supplier_tax_id);
      
      if (selectedCustomerId && !createNewCustomer) {
        formData.append('customer_id', selectedCustomerId.toString());
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/upload/invoice-with-data`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save invoice");
      }
      
      const result = await response.json();
      setSuccess("Invoice saved successfully!");
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/admin/invoices/view/${result.invoice_id}`);
      }, 1500);
      
    } catch (err) {
      console.error("Save error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
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
            <p className="text-white/70">Upload an invoice image, review extracted data, and save</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Upload Zone */}
            <div className="space-y-6">
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                  ${isDragging ? 'border-white bg-white/10' : 'border-white/30 hover:border-white/50'}
                  ${file ? 'border-white/50' : ''}
                `}
              >
                {!file ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-white/50 mb-4" />
                    <div className="space-y-2">
                      <p className="text-white font-medium">Drag and drop your invoice image here</p>
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
                      <p className="text-white/40 text-xs mt-4">Supports PNG, JPG, JPEG formats</p>
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
                      <p className="text-sm text-white/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    
                    {!extractedData && (
                      <button
                        onClick={handleProcessOCR}
                        disabled={processing}
                        className="w-full px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Processing OCR...
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 mr-2" />
                            Extract Data
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-red-200 text-sm">{error}</div>
                </div>
              )}
              
              {success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-green-200 text-sm">{success}</div>
                </div>
              )}

              {/* OCR Confidence & Raw Text */}
              {extractedData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">
                      OCR Confidence: <span className="text-white font-medium">{(extractedData.ocr_confidence * 100).toFixed(1)}%</span>
                    </span>
                    <button
                      onClick={() => setShowRawText(!showRawText)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showRawText ? "Hide" : "Show"} Raw OCR Text
                    </button>
                  </div>
                  
                  {showRawText && (
                    <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono">
                        {extractedData.raw_text}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Editable Form */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Invoice Data</h2>
                {extractedData && (
                  <span className="text-xs text-yellow-400 flex items-center">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit fields below before saving
                  </span>
                )}
              </div>
              
              {extractedData ? (
                <div className="bg-gray-800/50 rounded-lg border border-gray-600/30 p-6 space-y-6">
                  {/* Invoice Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Invoice Information</h3>
                    
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Invoice Number *</label>
                      <input
                        type="text"
                        value={extractedData.invoice_number}
                        onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        placeholder="Enter invoice number"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Issue Date</label>
                        <input
                          type="date"
                          value={extractedData.issue_date}
                          onChange={(e) => handleFieldChange('issue_date', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={extractedData.due_date}
                          onChange={(e) => handleFieldChange('due_date', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Amounts</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Subtotal</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.subtotal}
                          onChange={(e) => handleFieldChange('subtotal', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Tax</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.tax}
                          onChange={(e) => handleFieldChange('tax', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Total *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.total}
                          onChange={(e) => handleFieldChange('total', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Customer</h3>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={createNewCustomer}
                          onChange={() => setCreateNewCustomer(true)}
                          className="mr-2"
                        />
                        <span className="text-sm text-white">Create new</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!createNewCustomer}
                          onChange={() => setCreateNewCustomer(false)}
                          className="mr-2"
                        />
                        <span className="text-sm text-white">Select existing</span>
                      </label>
                    </div>
                    
                    {createNewCustomer ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/60 mb-1">Customer Name</label>
                          <input
                            type="text"
                            value={extractedData.customer_name}
                            onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                            placeholder="Customer name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/60 mb-1">Customer Tax ID</label>
                          <input
                            type="text"
                            value={extractedData.customer_tax_id}
                            onChange={(e) => handleFieldChange('customer_tax_id', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                            placeholder="Tax ID"
                          />
                        </div>
                      </div>
                    ) : (
                      <select
                        value={selectedCustomerId || ""}
                        onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                      >
                        <option value="">Select a customer...</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.tax_id ? `(${customer.tax_id})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Supplier */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Supplier</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Supplier Name</label>
                        <input
                          type="text"
                          value={extractedData.supplier_name}
                          onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                          placeholder="Supplier name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Supplier Tax ID</label>
                        <input
                          type="text"
                          value={extractedData.supplier_tax_id}
                          onChange={(e) => handleFieldChange('supplier_tax_id', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                          placeholder="Tax ID"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveInvoice}
                    disabled={saving || !extractedData.invoice_number}
                    className="w-full px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Invoice
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-white/30 mb-4" />
                  <p className="text-white/50">
                    Upload an invoice and click "Extract Data" to see editable fields
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
