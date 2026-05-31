"use client";
/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import AdminLayout from "../../../../components/AdminLayout";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Edit,
  Save,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { API_BASE_URL, authFetch, customerApi, Customer, getErrorMessage } from "../../../../lib/api";

interface EditableInvoiceItem {
  description: string;
  quantity: number;
  unit_price?: number | null;
  discount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
}

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
  overall_confidence: number;
  field_confidence: Record<string, number>;
  provider_name: string;
  model_version: string;
  review_required: boolean;
  items: EditableInvoiceItem[];
}

export default function UploadInvoicePage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [extractedData, setExtractedData] = useState<EditableInvoiceData | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [createNewCustomer, setCreateNewCustomer] = useState(true);
  const [extractionRunId, setExtractionRunId] = useState<number | null>(null);
  const [originalExtractedJson, setOriginalExtractedJson] = useState<string>("");

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

  const isPdfFile = (selectedFile: File) =>
    selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");

  const isSupportedFile = (selectedFile: File) =>
    selectedFile.type.startsWith("image/") || isPdfFile(selectedFile);

  const recalculateTotals = (items: EditableInvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_price || 0);
      const discount = Number(item.discount || 0);
      return sum + (quantity * unitPrice - discount);
    }, 0);
    const tax = items.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const setItemsAndTotals = (items: EditableInvoiceItem[]) => {
    if (!extractedData) return;
    const nextTotals = recalculateTotals(items);
    setExtractedData({
      ...extractedData,
      items,
      subtotal: items.length > 0 ? nextTotals.subtotal : extractedData.subtotal,
      tax: items.length > 0 ? nextTotals.tax : extractedData.tax,
      total: items.length > 0 ? nextTotals.total : extractedData.total,
    });
  };

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
    if (droppedFile && isSupportedFile(droppedFile)) {
      handleFileSelect(droppedFile);
    } else {
      setError("Please drop an invoice file (PDF, PNG, JPG, JPEG)");
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!isSupportedFile(selectedFile)) {
      setError("Please select a PDF or image file (PDF, PNG, JPG, JPEG)");
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess("");
    setExtractedData(null);
    setExtractionRunId(null);
    setOriginalExtractedJson("");

    if (isPdfFile(selectedFile)) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
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
    setExtractionRunId(null);
    setOriginalExtractedJson("");
  };

  const handleProcessOCR = async () => {
    if (!file) return;

    setProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch(`${API_BASE_URL}/api/v1/upload/ocr-only`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "OCR processing failed");
      }

      const result = await response.json();
      const items: EditableInvoiceItem[] = Array.isArray(result.items)
        ? result.items.map((item: EditableInvoiceItem) => ({
            description: item.description || "",
            quantity: Number(item.quantity || 1),
            unit_price: item.unit_price ?? 0,
            discount: Number(item.discount || 0),
            tax_rate: Number(item.tax_rate || 0),
            tax_amount: Number(item.tax_amount || 0),
            total: Number(item.total || 0),
          }))
        : [];

      const initialData: EditableInvoiceData = {
        invoice_number: result.invoice_number || "",
        issue_date: result.issue_date || new Date().toISOString().split("T")[0],
        due_date: result.due_date || "",
        subtotal: Number(result.amounts?.subtotal || 0),
        tax: Number(result.amounts?.tax || 0),
        total: Number(result.amounts?.total || 0),
        customer_name: result.customer?.name || "",
        customer_tax_id: result.customer?.tax_id || "",
        supplier_name: result.supplier?.name || "",
        supplier_tax_id: result.supplier?.tax_id || "",
        raw_text: result.raw_text || "",
        ocr_confidence: Number(result.ocr_confidence || 0),
        overall_confidence: Number(result.overall_confidence || result.ocr_confidence || 0),
        field_confidence: result.field_confidence || {},
        provider_name: result.provider_name || "unknown",
        model_version: result.model_version || "",
        review_required: Boolean(result.review_required),
        items,
      };

      setExtractedData(initialData);
      setExtractionRunId(result.extraction_run_id || null);
      setOriginalExtractedJson(JSON.stringify({
        ...result,
        items,
      }));
    } catch (err) {
      console.error("OCR error:", err);
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleFieldChange = (field: keyof EditableInvoiceData, value: string | number | boolean) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value } as EditableInvoiceData);
  };

  const handleItemChange = (index: number, field: keyof EditableInvoiceItem, value: string | number) => {
    if (!extractedData) return;
    const nextItems = [...extractedData.items];
    const updatedItem = { ...nextItems[index], [field]: value };

    const quantity = Number(updatedItem.quantity || 1);
    const unitPrice = Number(updatedItem.unit_price || 0);
    const discount = Number(updatedItem.discount || 0);
    const taxRate = Number(updatedItem.tax_rate || 0);
    const subtotal = quantity * unitPrice - discount;
    const taxAmount = subtotal * (taxRate / 100);
    updatedItem.tax_amount = Number(taxAmount.toFixed(2));
    updatedItem.total = Number((subtotal + taxAmount).toFixed(2));
    nextItems[index] = updatedItem;
    setItemsAndTotals(nextItems);
  };

  const handleAddItem = () => {
    if (!extractedData) return;
    setItemsAndTotals([
      ...extractedData.items,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
        tax_rate: 0,
        tax_amount: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (!extractedData) return;
    const nextItems = extractedData.items.filter((_, itemIndex) => itemIndex !== index);
    setItemsAndTotals(nextItems);
  };

  const handleSaveInvoice = async () => {
    if (!extractedData || !file) return;

    if (!extractedData.invoice_number) {
      setError("Invoice number is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invoice_number", extractedData.invoice_number);
      formData.append("issue_date", extractedData.issue_date);
      formData.append("due_date", extractedData.due_date);
      formData.append("subtotal", extractedData.subtotal.toString());
      formData.append("tax", extractedData.tax.toString());
      formData.append("total", extractedData.total.toString());
      formData.append("customer_name", extractedData.customer_name);
      formData.append("customer_tax_id", extractedData.customer_tax_id);
      formData.append("supplier_name", extractedData.supplier_name);
      formData.append("supplier_tax_id", extractedData.supplier_tax_id);
      formData.append("items_json", JSON.stringify(extractedData.items));
      formData.append("raw_text", extractedData.raw_text);
      formData.append("ocr_confidence", extractedData.ocr_confidence.toString());
      formData.append("overall_confidence", extractedData.overall_confidence.toString());
      formData.append("field_confidence_json", JSON.stringify(extractedData.field_confidence));
      formData.append("provider_name", extractedData.provider_name);
      formData.append("model_version", extractedData.model_version);
      formData.append("original_extracted_data_json", originalExtractedJson);
      if (extractionRunId) {
        formData.append("extraction_run_id", extractionRunId.toString());
      }

      if (selectedCustomerId && !createNewCustomer) {
        formData.append("customer_id", selectedCustomerId.toString());
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/upload/invoice-with-data`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save invoice");
      }

      const result = await response.json();
      setSuccess("Invoice saved successfully!");
      setTimeout(() => {
        router.push(`/admin/invoices/view/${result.invoice_id}`);
      }, 1200);
    } catch (err) {
      console.error("Save error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confidencePercent = extractedData ? (extractedData.overall_confidence * 100).toFixed(1) : "0.0";
  const selectedFileIsPdf = file ? isPdfFile(file) : false;

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="invoices">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Invoice</h1>
            <p className="text-white/70">Extract invoice data, review AI output, and save the final record</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                  ${isDragging ? "border-white bg-white/10" : "border-white/30 hover:border-white/50"}
                  ${file ? "border-white/50" : ""}
                `}
              >
                {!file ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-white/50 mb-4" />
                    <div className="space-y-2">
                      <p className="text-white font-medium">Drag and drop your invoice PDF or image here</p>
                      <p className="text-white/60 text-sm">or</p>
                      <label className="inline-block">
                        <span className="px-4 py-2 bg-white text-black rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                          Browse Files
                        </span>
                        <input type="file" accept="image/*,.pdf,application/pdf" onChange={handleFileInputChange} className="hidden" />
                      </label>
                      <p className="text-white/40 text-xs mt-4">Supports PDF, PNG, JPG, JPEG formats</p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {preview && !selectedFileIsPdf && (
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
                    {!preview && selectedFileIsPdf && (
                      <div className="relative rounded-lg border border-white/20 bg-white/5 px-6 py-10">
                        <button
                          onClick={handleRemoveFile}
                          className="absolute top-2 right-2 p-2 bg-black/80 text-white rounded-full hover:bg-black transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <FileText className="mx-auto h-12 w-12 text-white mb-3" />
                        <p className="text-white font-medium">PDF ready for extraction</p>
                        <p className="text-sm text-white/60 mt-1">We will read embedded text or OCR rendered pages.</p>
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
                            <Sparkles className="h-5 w-5 mr-2" />
                            Extract With AI
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

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

              {extractedData && (
                <div className="bg-gray-900/60 rounded-lg border border-gray-700 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Extraction Summary</p>
                      <p className="text-sm text-white/60">
                        Provider: <span className="text-white">{extractedData.provider_name}</span>
                        {extractedData.model_version ? ` · ${extractedData.model_version}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">Confidence</p>
                      <p className="text-white font-semibold">{confidencePercent}%</p>
                    </div>
                  </div>

                  {extractedData.review_required && (
                    <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                      This extraction was flagged for review. Double-check key fields before saving.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(extractedData.field_confidence).slice(0, 6).map(([field, value]) => (
                      <div key={field} className="rounded-md bg-white/5 px-3 py-2 text-white/80">
                        <span className="capitalize">{field.replace(/_/g, " ")}</span>
                        <span className="float-right text-white">{(value * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setShowRawText(!showRawText)} className="text-sm text-blue-400 hover:text-blue-300">
                    {showRawText ? "Hide" : "Show"} Raw OCR Text
                  </button>

                  {showRawText && (
                    <div className="bg-gray-950 rounded-lg p-4 max-h-56 overflow-y-auto">
                      <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono">{extractedData.raw_text}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Invoice Data</h2>
                {extractedData && (
                  <span className="text-xs text-yellow-400 flex items-center">
                    <Edit className="h-3 w-3 mr-1" />
                    Review and correct before saving
                  </span>
                )}
              </div>

              {extractedData ? (
                <div className="bg-gray-800/50 rounded-lg border border-gray-600/30 p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Invoice Information</h3>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Invoice Number *</label>
                      <input
                        type="text"
                        value={extractedData.invoice_number}
                        onChange={(e) => handleFieldChange("invoice_number", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Issue Date</label>
                        <input
                          type="date"
                          value={extractedData.issue_date}
                          onChange={(e) => handleFieldChange("issue_date", e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={extractedData.due_date}
                          onChange={(e) => handleFieldChange("due_date", e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Amounts</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Subtotal</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.subtotal}
                          onChange={(e) => handleFieldChange("subtotal", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Tax</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.tax}
                          onChange={(e) => handleFieldChange("tax", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1">Total *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.total}
                          onChange={(e) => handleFieldChange("total", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                      <h3 className="text-sm font-medium text-white/70">Invoice Items</h3>
                      <button type="button" onClick={handleAddItem} className="text-sm text-blue-400 hover:text-blue-300">
                        <Plus className="h-4 w-4 inline mr-1" />
                        Add Item
                      </button>
                    </div>

                    {extractedData.items.length > 0 ? (
                      <div className="space-y-4">
                        {extractedData.items.map((item, index) => (
                          <div key={index} className="rounded-lg border border-gray-700 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/70">Item #{index + 1}</span>
                              <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              placeholder="Description"
                              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <input
                                type="number"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 1)}
                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price ?? 0}
                                onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={item.tax_rate ?? 0}
                                onChange={(e) => handleItemChange(index, "tax_rate", parseFloat(e.target.value) || 0)}
                                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={item.total}
                                readOnly
                                className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-white/50">
                        No line items extracted yet. Add them manually if needed.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Customer</h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <label className="flex items-center">
                        <input type="radio" checked={createNewCustomer} onChange={() => setCreateNewCustomer(true)} className="mr-2" />
                        <span className="text-sm text-white">Create new</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" checked={!createNewCustomer} onChange={() => setCreateNewCustomer(false)} className="mr-2" />
                        <span className="text-sm text-white">Select existing</span>
                      </label>
                    </div>

                    {createNewCustomer ? (
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={extractedData.customer_name}
                          onChange={(e) => handleFieldChange("customer_name", e.target.value)}
                          placeholder="Customer name"
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                        />
                        <input
                          type="text"
                          value={extractedData.customer_tax_id}
                          onChange={(e) => handleFieldChange("customer_tax_id", e.target.value)}
                          placeholder="Customer tax ID"
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                        />
                      </div>
                    ) : (
                      <select
                        value={selectedCustomerId || ""}
                        onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
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

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70 border-b border-gray-700 pb-2">Supplier</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={extractedData.supplier_name}
                        onChange={(e) => handleFieldChange("supplier_name", e.target.value)}
                        placeholder="Supplier name"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                      />
                      <input
                        type="text"
                        value={extractedData.supplier_tax_id}
                        onChange={(e) => handleFieldChange("supplier_tax_id", e.target.value)}
                        placeholder="Supplier tax ID"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white"
                      />
                    </div>
                  </div>

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
                  <p className="text-white/50">Upload an invoice and extract the data to review it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
