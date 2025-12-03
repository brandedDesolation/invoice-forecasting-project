"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import AdminLayout from "../../../../../components/AdminLayout";
import { ArrowLeft, Save, X, Mail, Phone, MapPin, Building, FileText } from "lucide-react";
import { customerApi, Customer, CustomerUpdate, getErrorMessage } from "../../../../../lib/api";
import { useToast, ToastContainer } from "../../../../../components/Toast";

// Remove the duplicate Customer interface since we're importing it from api.ts

interface CustomerFormData {
  name: string;
  taxNumber: string;
  taxOffice: string;
  email: string;
  phone: string;
  address: string;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    taxNumber: "",
    taxOffice: "",
    email: "",
    phone: "",
    address: ""
  });
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [apiError, setApiError] = useState<string>("");
  const { toasts, removeToast, success, error } = useToast();

  // Fetch customer data from API
  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      setApiError("");
      try {
        const customerData = await customerApi.getCustomer(parseInt(customerId));
        
        setCustomer(customerData);
        setFormData({
          name: customerData.name,
          taxNumber: customerData.tax_number || "",
          taxOffice: customerData.tax_office || "",
          email: customerData.email || "",
          phone: customerData.phone || "",
          address: customerData.address || ""
        });
      } catch (error) {
        console.error("Error fetching customer:", error);
        setApiError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }

    if (!formData.taxNumber.trim()) {
      newErrors.taxNumber = "Tax number (VKN) is required";
    } else if (!/^\d{10}$/.test(formData.taxNumber)) {
      newErrors.taxNumber = "Tax number must be 10 digits";
    }

    if (!formData.taxOffice.trim()) {
      newErrors.taxOffice = "Tax office is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setApiError("");
    try {
      const updateData: CustomerUpdate = {
        name: formData.name,
        tax_number: formData.taxNumber,
        tax_office: formData.taxOffice,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      };

      await customerApi.updateCustomer(parseInt(customerId), updateData);
      
      // Show success toast
      success("Customer Updated", "Customer information has been updated successfully!");
      
      // Navigate back to customers list after a short delay
      setTimeout(() => {
        router.push("/admin/customers");
      }, 1500);
    } catch (err) {
      console.error("Error updating customer:", err);
      const errorMessage = getErrorMessage(err);
      setApiError(errorMessage);
      error("Update Failed", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/customers");
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
              <div className="text-red-400 mb-4">Error loading customer</div>
              <div className="text-white/70 mb-4">{apiError}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                Try Again
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleCancel}
              className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Edit Customer</h1>
            <p className="text-white/70">Update customer information and details</p>
          </div>

          {/* Customer Info Card */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <Building className="h-5 w-5 text-white mr-2" />
              <h2 className="text-lg font-semibold text-white">Customer Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Customer ID:</span>
                <span className="text-white ml-2">{customer.id}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Invoices:</span>
                <span className="text-white ml-2">{customer.invoiceCount}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-white ml-2">{customer.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="bg-black border border-gray-600 rounded-lg p-4 mb-6">
              <div className="text-white font-medium">Error</div>
              <div className="text-white text-sm mt-1">{apiError}</div>
            </div>
          )}

          {/* Edit Form */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-600/30"
                    }`}
                    placeholder="Enter company name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-white">{errors.name}</p>
                  )}
                </div>

                {/* Tax Number and Tax Office */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Tax Number (VKN) *
                    </label>
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange("taxNumber", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent ${
                        errors.taxNumber ? "border-red-500" : "border-gray-600/30"
                      }`}
                      placeholder="1234567890"
                      maxLength={10}
                    />
                    {errors.taxNumber && (
                      <p className="mt-1 text-sm text-white">{errors.taxNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Tax Office *
                    </label>
                    <input
                      type="text"
                      value={formData.taxOffice}
                      onChange={(e) => handleInputChange("taxOffice", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent ${
                        errors.taxOffice ? "border-red-500" : "border-gray-600/30"
                      }`}
                      placeholder="Enter tax office name"
                    />
                    {errors.taxOffice && (
                      <p className="mt-1 text-sm text-white">{errors.taxOffice}</p>
                    )}
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent ${
                        errors.email ? "border-red-500" : "border-gray-600/30"
                      }`}
                      placeholder="info@company.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-white">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent ${
                        errors.phone ? "border-red-500" : "border-gray-600/30"
                      }`}
                      placeholder="+90 212 555 0123"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-white">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-600/30 rounded-md bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-600/30">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 border border-gray-600/30 rounded-md text-white/70 hover:text-white hover:bg-gray-700/50 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
