"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import AdminLayout from "../../../../../components/AdminLayout";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { 
  invoiceApi, 
  customerApi,
  Invoice, 
  Customer,
  InvoiceUpdate,
  InvoiceItem,
  InvoiceItemUpdateRequest,
  getErrorMessage 
} from "../../../../../lib/api";
import { useToast, ToastContainer } from "../../../../../components/Toast";

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { toasts, removeToast, success, error } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [formData, setFormData] = useState({
    invoice_number: "",
    issue_date: "",
    due_date: "",
    subtotal: "",
    tax: "",
    total: "",
    customer_id: "",
    supplier_id: "",
    status: "",
  });
  const [items, setItems] = useState<InvoiceItemUpdateRequest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiError("");
      try {
        const [invoiceData, customersData] = await Promise.all([
          invoiceApi.getInvoice(parseInt(invoiceId)),
          customerApi.getCustomers(0, 1000),
        ]);
        
        setInvoice(invoiceData);
        setCustomers(customersData);
        
        // Calculate default status if not set
        let defaultStatus = invoiceData.status || "";
        if (!defaultStatus) {
          const today = new Date();
          const dueDate = invoiceData.due_date ? new Date(invoiceData.due_date) : null;
          if (dueDate && dueDate < today) {
            defaultStatus = "overdue";
          } else {
            defaultStatus = "pending";
          }
        }

        // Set form data
        setFormData({
          invoice_number: invoiceData.invoice_number || "",
          issue_date: invoiceData.issue_date ? invoiceData.issue_date.split('T')[0] : "",
          due_date: invoiceData.due_date ? invoiceData.due_date.split('T')[0] : "",
          subtotal: invoiceData.subtotal?.toString() || "0",
          tax: invoiceData.tax?.toString() || "0",
          total: invoiceData.total?.toString() || "0",
          customer_id: invoiceData.customer_id?.toString() || "",
          supplier_id: invoiceData.supplier_id?.toString() || "",
          status: defaultStatus,
        });

        // Set invoice items
        if (invoiceData.items && invoiceData.items.length > 0) {
          setItems(invoiceData.items.map(item => ({
            id: item.id,
            description: item.description || "",
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            discount: item.discount || 0,
            tax_rate: item.tax_rate || 0,
            tax_amount: item.tax_amount || 0,
            total: item.total || 0,
          })));
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchData();
    }
  }, [invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setSaving(true);
    try {
      const updateData: InvoiceUpdate = {
        invoice_number: formData.invoice_number || undefined,
        issue_date: formData.issue_date || undefined,
        due_date: formData.due_date || undefined,
        subtotal: formData.subtotal ? parseFloat(formData.subtotal) : undefined,
        tax: formData.tax ? parseFloat(formData.tax) : undefined,
        total: formData.total ? parseFloat(formData.total) : undefined,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : undefined,
        status: formData.status || undefined,
        items: items.length > 0 ? items : undefined,
      };

      await invoiceApi.updateInvoice(parseInt(invoiceId), updateData);
      success("Invoice Updated", "Invoice has been updated successfully.");
      
      // Redirect to invoice view page after a short delay
      setTimeout(() => {
        router.push(`/admin/invoices/view/${invoiceId}`);
      }, 1500);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      error("Update Failed", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateTotal = () => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const total = subtotal + tax;
    setFormData({ ...formData, total: total.toFixed(2) });
  };

  const handleAddItem = () => {
    setItems([...items, {
      description: "",
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total: 0,
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemUpdateRequest, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate item total
    const item = updatedItems[index];
    const quantity = parseFloat(String(item.quantity || 1));
    const unitPrice = parseFloat(String(item.unit_price || 0));
    const discount = parseFloat(String(item.discount || 0));
    const taxRate = parseFloat(String(item.tax_rate || 0));
    
    const subtotal = (quantity * unitPrice) - discount;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    updatedItems[index] = {
      ...updatedItems[index],
      tax_amount: taxAmount,
      total: total,
    };
    
    setItems(updatedItems);
    
    // Recalculate invoice totals from items
    const invoiceSubtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || 0)) - parseFloat(String(item.discount || 0))), 0);
    const invoiceTax = updatedItems.reduce((sum, item) => sum + parseFloat(String(item.tax_amount || 0)), 0);
    const invoiceTotal = invoiceSubtotal + invoiceTax;
    
    setFormData({
      ...formData,
      subtotal: invoiceSubtotal.toFixed(2),
      tax: invoiceTax.toFixed(2),
      total: invoiceTotal.toFixed(2),
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="invoices">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (apiError || !invoice) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="invoices">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading invoice</div>
              <div className="text-white/70 mb-4">{apiError || "Invoice not found"}</div>
              <button
                onClick={() => router.push("/admin/invoices")}
                className="px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
              >
                Back to Invoices
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
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/admin/invoices/view/${invoiceId}`)}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoice
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Edit Invoice</h1>
                <p className="text-white/70">Invoice #{invoice.invoice_number}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-gray-700 rounded-lg p-6 space-y-6">
              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                  placeholder="INV-001"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-transparent text-white focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="void">Void</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Manually set the invoice status. If not set, status will be calculated from due date.
                </p>
              </div>

              {/* Customer and Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Supplier *
                  </label>
                  <select
                    required
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                  >
                    <option value="">Select a supplier</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Currently using customers as suppliers. Supplier management coming soon.
                  </p>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="border-t border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center px-3 py-1.5 text-sm text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {items.map((item, index) => (
                      <div key={index} className="border border-gray-700 rounded-md p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-gray-400">Item #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Description *</label>
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full px-3 py-1.5 text-sm bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                              placeholder="Item description"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Quantity</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity || 1}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-full px-3 py-1.5 text-sm bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price || 0}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 text-sm bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Discount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.discount || 0}
                              onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 text-sm bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tax Rate (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.tax_rate || 0}
                              onChange={(e) => handleItemChange(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 text-sm bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tax Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.tax_amount?.toFixed(2) || 0}
                              readOnly
                              className="w-full px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 rounded-md text-white/70"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Total</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.total?.toFixed(2) || 0}
                              readOnly
                              className="w-full px-3 py-1.5 text-sm bg-gray-800/50 border border-gray-700 rounded-md text-white font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-gray-700 rounded-md mb-6">
                    <p className="text-gray-400 mb-3">No items added yet</p>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 text-sm text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Add First Item
                    </button>
                  </div>
                )}
              </div>

              {/* Amounts */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Amounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Subtotal
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.subtotal}
                      onChange={(e) => {
                        setFormData({ ...formData, subtotal: e.target.value });
                        // Auto-calculate total when subtotal or tax changes
                        setTimeout(() => handleCalculateTotal(), 100);
                      }}
                      className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Tax
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax}
                      onChange={(e) => {
                        setFormData({ ...formData, tax: e.target.value });
                        // Auto-calculate total when subtotal or tax changes
                        setTimeout(() => handleCalculateTotal(), 100);
                      }}
                      className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Total
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                      className="w-full px-4 py-2 bg-transparent border border-gray-700 rounded-md text-white focus:outline-none focus:border-gray-600 font-semibold"
                      placeholder="0.00"
                    />
                    <button
                      type="button"
                      onClick={handleCalculateTotal}
                      className="text-xs text-gray-400 hover:text-white mt-1"
                    >
                      Auto-calculate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/admin/invoices/view/${invoiceId}`)}
                className="px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-4 py-2 text-white hover:text-gray-300 font-medium rounded-md transition-colors border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

