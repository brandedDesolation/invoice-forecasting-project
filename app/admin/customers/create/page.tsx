"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Plus, UserPlus, X } from "lucide-react";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import AdminLayout from "../../../../components/AdminLayout";
import { ToastContainer, useToast } from "../../../../components/Toast";
import { customerApi, CustomerCreate, getErrorMessage } from "../../../../lib/api";

interface CustomerFormData {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
}

export default function CreateCustomerPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    taxId: "",
    email: "",
    phone: "",
    address: "",
  });

  const validateForm = () => {
    const nextErrors: Partial<CustomerFormData> = {};
    if (!formData.name.trim()) nextErrors.name = "Customer name is required";
    if (formData.taxId && !/^\d+$/.test(formData.taxId)) nextErrors.taxId = "Tax ID should contain only numbers";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Please enter a valid email address";
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) nextErrors.phone = "Please enter a valid phone number";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setApiError("");
    try {
      const payload: CustomerCreate = {
        name: formData.name,
        tax_id: formData.taxId || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      };

      const createdCustomer = await customerApi.createCustomer(payload);
      success("Customer Created", "Customer has been added to the finance workflow.");
      setTimeout(() => router.push(`/admin/customers/view/${createdCustomer.id}`), 1200);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setApiError(errorMessage);
      error("Create Failed", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="customers">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push("/admin/customers")}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Create Customer</h1>
            <p className="text-white/70">Add a customer for invoice tracking, payments, and forecasting</p>
          </div>

          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <UserPlus className="h-5 w-5 text-white mr-2" />
              <h2 className="text-lg font-semibold text-white">New Customer</h2>
            </div>
            <p className="text-sm text-white/70">
              Customer records power the dashboard, invoice history, payment behavior, and AI payment-risk insights.
            </p>
          </div>

          {apiError && (
            <div className="bg-black border border-gray-600 rounded-lg p-4 mb-6">
              <div className="text-white font-medium">Error</div>
              <div className="text-white text-sm mt-1">{apiError}</div>
            </div>
          )}

          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6">
            <form onSubmit={(event) => { event.preventDefault(); void handleSave(); }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleInputChange("name", event.target.value)}
                    className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                      errors.name ? "border-red-500" : "border-gray-600/30"
                    }`}
                    placeholder="Enter customer name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-white">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tax ID</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(event) => handleInputChange("taxId", event.target.value)}
                    className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                      errors.taxId ? "border-red-500" : "border-gray-600/30"
                    }`}
                    placeholder="Enter tax ID number"
                  />
                  {errors.taxId && <p className="mt-1 text-sm text-white">{errors.taxId}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(event) => handleInputChange("email", event.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                        errors.email ? "border-red-500" : "border-gray-600/30"
                      }`}
                      placeholder="finance@customer.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-white">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(event) => handleInputChange("phone", event.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                        errors.phone ? "border-red-500" : "border-gray-600/30"
                      }`}
                      placeholder="+90 212 555 0123"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-white">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(event) => handleInputChange("address", event.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-600/30 rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40"
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-600/30">
                <button
                  type="button"
                  onClick={() => router.push("/admin/customers")}
                  className="flex items-center px-4 py-2 border border-gray-600/30 rounded-md text-white/70 hover:text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
