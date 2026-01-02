"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { Plus, Search, Mail, Phone, MapPin, Users, X } from "lucide-react";
import { customerApi, invoiceApi, Customer, Invoice, getErrorMessage } from "../../../lib/api";

// Mock data removed - now using real API data

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInvoiceCounts, setCustomerInvoiceCounts] = useState<Record<number, number>>({});
  const [customerInvoices, setCustomerInvoices] = useState<Record<number, Invoice[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filterWithInvoices, setFilterWithInvoices] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const customersData = await customerApi.getCustomers();
        
        // Fetch invoice counts and invoices for each customer
        const counts: Record<number, number> = {};
        const invoicesMap: Record<number, Invoice[]> = {};
        await Promise.all(
          customersData.map(async (customer) => {
            try {
              const invoices = await invoiceApi.getInvoicesByCustomer(customer.id);
              counts[customer.id] = invoices.length;
              invoicesMap[customer.id] = invoices;
            } catch (err) {
              counts[customer.id] = 0;
              invoicesMap[customer.id] = [];
            }
          })
        );
        
        setCustomerInvoiceCounts(counts);
        setCustomerInvoices(invoicesMap);
        setCustomers(customersData);
        setError("");
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditCustomer = (customerId: string) => {
    router.push(`/admin/customers/edit/${customerId}`);
  };

  const handleViewDetails = (customerId: string) => {
    router.push(`/admin/customers/view/${customerId}`);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    
    setDeleting(true);
    try {
      const invoiceCount = customerInvoiceCounts[customerToDelete.id] || 0;
      // Use cascade if customer has invoices
      await customerApi.deleteCustomer(customerToDelete.id, invoiceCount > 0);
      
      // Remove from state
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      setCustomerInvoiceCounts(prev => {
        const updated = { ...prev };
        delete updated[customerToDelete.id];
        return updated;
      });
      setCustomerInvoices(prev => {
        const updated = { ...prev };
        delete updated[customerToDelete.id];
        return updated;
      });
      
      setToast({ 
        message: invoiceCount > 0 
          ? `Customer and ${invoiceCount} invoice(s) deleted successfully`
          : 'Customer deleted successfully', 
        type: 'success' 
      });
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      setToast({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.email?.toLowerCase().includes(searchLower)) ||
      (customer.phone?.toLowerCase().includes(searchLower)) ||
      (customer.address?.toLowerCase().includes(searchLower)) ||
      (customer.tax_id?.toLowerCase().includes(searchLower));
    
    if (!matchesSearch) return false;
    
    // Invoice filter
    if (filterWithInvoices === null) return true;
    const invoiceCount = customerInvoiceCounts[customer.id] || 0;
    return filterWithInvoices ? invoiceCount > 0 : invoiceCount === 0;
  });

  // Calculate summary statistics
  const totalRevenue = Object.values(customerInvoices).reduce((sum, invoices) => {
    return sum + invoices.reduce((invoiceSum, invoice) => invoiceSum + invoice.total, 0);
  }, 0);

  const totalInvoices = Object.values(customerInvoiceCounts).reduce((sum, count) => sum + count, 0);
  const averageInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
  const activeCustomers = Object.values(customerInvoiceCounts).filter(count => count > 0).length;

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="customers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white">Loading customers...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AdminLayout currentPage="customers">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-white mb-4">Error loading customer</div>
              <div className="text-white/70 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout currentPage="customers">
        {/* Customers Section */}
        <section className="mb-32 scroll-mt-16 md:mb-40 lg:mb-48 lg:scroll-mt-24" aria-label="Customers">
          <div className="sticky top-0 z-20 -mx-6 mb-8 w-screen bg-black/75 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-100 lg:sr-only">Customers</h2>
          </div>
          
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Customer Management</h1>
            <p className="text-white/70">Manage your customer relationships and track their activity</p>
          </div>
          
          <div>
            <p className="mb-16 text-white/60 text-lg leading-relaxed">
              Manage your customer information and relationships. View detailed customer profiles,
              track invoice history, and maintain comprehensive customer databases for better business insights.
            </p>

            {/* Customer Summary */}
            <div className="mb-16">
              <h3 className="text-xl font-semibold text-white mb-6">Customer Summary</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Total Customers</p>
                  <p className="text-3xl font-bold text-white">{customers.length}</p>
                </div>
                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Total Revenue</p>
                  <p className="text-3xl font-bold text-white truncate" title={new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(totalRevenue)}>
                    {totalRevenue >= 1000000
                      ? `₺${(totalRevenue / 1000000).toFixed(1)}M`
                      : totalRevenue >= 1000
                      ? `₺${(totalRevenue / 1000).toFixed(0)}k`
                      : new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(totalRevenue)}
                  </p>
                </div>
                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Active Customers</p>
                  <p className="text-3xl font-bold text-white">{activeCustomers}</p>
                  <p className="text-xs text-gray-500 mt-1">with invoices</p>
                </div>
                <div className="p-6 border border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-400 font-medium mb-4">Avg. Invoice</p>
                  <p className="text-3xl font-bold text-white truncate" title={new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(averageInvoice)}>
                    {averageInvoice >= 1000000
                      ? `₺${(averageInvoice / 1000000).toFixed(1)}M`
                      : averageInvoice >= 1000
                      ? `₺${(averageInvoice / 1000).toFixed(0)}k`
                      : new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(averageInvoice)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{totalInvoices} total invoices</p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="mb-16 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-72 border border-white/20 rounded-md bg-transparent text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterWithInvoices === null ? "all" : filterWithInvoices ? "with" : "without"}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterWithInvoices(value === "all" ? null : value === "with");
                  }}
                  className="px-3 py-2 border border-white/20 rounded-md bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                >
                  <option value="all">All Customers</option>
                  <option value="with">With Invoices</option>
                  <option value="without">Without Invoices</option>
                </select>
              </div>
              
              <button className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-transparent hover:bg-transparent text-white font-medium rounded-md border border-white/30 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </button>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => {
                const invoiceCount = customerInvoiceCounts[customer.id] || 0;
                return (
                <div key={customer.id} className="border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-300 w-full max-w-sm mx-auto min-h-[400px] flex flex-col">
                  <div className="w-full">
                    <div className="w-full">
                      <h3 className="text-lg font-medium text-white mb-4 break-words leading-tight" title={customer.name}>
                        {customer.name.length > 25 ? `${customer.name.substring(0, 25)}...` : customer.name}
                      </h3>
                      <div className="space-y-3 text-sm text-gray-300 w-full">
                        <div className="flex items-start w-full min-w-0">
                          <span className="font-medium mr-2 text-gray-400 flex-shrink-0">Tax ID:</span>
                          <span className="break-all text-ellipsis overflow-hidden" title={customer.tax_id}>{customer.tax_id || "N/A"}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-start w-full min-w-0">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
                            <span className="break-all text-ellipsis overflow-hidden" title={customer.email}>
                              {customer.email.length > 25 ? `${customer.email.substring(0, 25)}...` : customer.email}
                            </span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-start w-full min-w-0">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
                            <span className="break-all text-ellipsis overflow-hidden" title={customer.phone}>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-start w-full min-w-0">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-gray-400" />
                            <span className="break-words text-ellipsis overflow-hidden" title={customer.address}>
                              {customer.address.length > 20 ? `${customer.address.substring(0, 20)}...` : customer.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-600/30 w-full">
                    <div className="flex justify-between text-sm w-full mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-400 flex-shrink-0">ID:</span>
                        <span className="ml-2 text-white font-medium truncate" title={customer.id.toString()}>{customer.id}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-400 flex-shrink-0">Invoices:</span>
                        <span className={`ml-2 font-medium truncate ${invoiceCount > 0 ? 'text-white' : 'text-gray-500'}`}>
                          {invoiceCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-400 flex-shrink-0">Created:</span>
                        <span className="ml-2 text-white font-medium truncate" title={new Date(customer.created_at).toLocaleDateString()}>
                          {new Date(customer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                    <button 
                      onClick={() => handleViewDetails(customer.id.toString())}
                      className="flex-1 text-white text-sm font-medium py-2 px-3 rounded border border-gray-700 hover:border-gray-600 transition-colors min-w-0"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditCustomer(customer.id.toString())}
                      className="flex-1 text-white text-sm font-medium py-2 px-3 rounded border border-gray-700 hover:border-gray-600 transition-colors min-w-0"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(customer)}
                      className="flex-1 text-red-400 text-sm font-medium py-2 px-3 rounded border border-red-400/30 hover:border-red-400/60 hover:bg-red-400/10 transition-colors min-w-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-white">No customers found</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {filterWithInvoices === null 
                    ? "No customers have been added yet."
                    : filterWithInvoices
                    ? "No customers with invoices found."
                    : "No customers without invoices found."
                  }
                </p>
              </div>
            )}

            {/* Load More */}
            <div className="mt-12 text-center">
              <button className="px-6 py-2 border border-white/20 rounded-md text-white/70 hover:text-white hover:bg-transparent transition-colors">
                Load More Customers
              </button>
            </div>
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && customerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Delete Customer</h3>
                  <p className="text-gray-400 text-sm">
                    Are you sure you want to delete <span className="text-white font-medium">{customerToDelete.name}</span>?
                  </p>
                  {(customerInvoiceCounts[customerToDelete.id] || 0) > 0 && (
                    <div className="mt-3 p-3 border border-gray-600 rounded-md">
                      <p className="text-white text-sm font-medium">
                        This will also delete {customerInvoiceCounts[customerToDelete.id]} invoice(s).
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        This action cannot be undone.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setCustomerToDelete(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <span className="text-white text-sm">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-4 text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}

