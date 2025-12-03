"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminLayout from "../../../components/AdminLayout";
import { Plus, Search, Filter, Mail, Phone, MapPin, Users } from "lucide-react";
import { customerApi, Customer } from "../../../lib/api";

// Mock data removed - now using real API data

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await customerApi.getCustomers();
        setCustomers(data);
        setError("");
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleEditCustomer = (customerId: string) => {
    router.push(`/admin/customers/edit/${customerId}`);
  };

  const handleViewDetails = (customerId: string) => {
    router.push(`/admin/customers/view/${customerId}`);
  };

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
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 truncate">Total Customers</p>
                      <p className="text-2xl font-bold text-white truncate">{customers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-white flex-shrink-0 ml-3" />
                  </div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 truncate">Total Revenue</p>
                      <p className="text-2xl font-bold text-white truncate">₺0</p>
                    </div>
                    <Users className="h-8 w-8 text-white flex-shrink-0 ml-3" />
                  </div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 truncate">Active</p>
                      <p className="text-2xl font-bold text-white truncate">{customers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-white flex-shrink-0 ml-3" />
                  </div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-600/30 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 truncate">Avg. Invoice</p>
                      <p className="text-2xl font-bold text-white truncate">₺0</p>
                    </div>
                    <Users className="h-8 w-8 text-white flex-shrink-0 ml-3" />
                  </div>
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
                    placeholder="Search customers..."
                    className="pl-10 pr-4 py-2 border border-white/20 rounded-md bg-transparent text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center px-3 py-2 border border-white/20 rounded-md text-white/70 hover:text-white hover:bg-transparent transition-colors">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
              
              <button className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-transparent hover:bg-transparent text-white font-medium rounded-md border border-white/30 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </button>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {customers.map((customer) => (
                <div key={customer.id} className="bg-gray-800/30 rounded-lg border border-gray-600/30 shadow-lg p-6 hover:border-gray-500/50 hover:bg-gray-800/40 transition-all duration-300 w-full max-w-sm mx-auto min-h-[400px] flex flex-col">
                  <div className="w-full">
                    <div className="w-full">
                      <h3 className="text-lg font-medium text-white mb-4 break-words leading-tight" title={customer.name}>
                        {customer.name.length > 25 ? `${customer.name.substring(0, 25)}...` : customer.name}
                      </h3>
                      <div className="space-y-3 text-sm text-gray-300 w-full">
                        <div className="flex items-start w-full min-w-0">
                          <span className="font-medium mr-2 text-gray-400 flex-shrink-0">VKN:</span>
                          <span className="break-all text-ellipsis overflow-hidden" title={customer.tax_number}>{customer.tax_number}</span>
                        </div>
                        <div className="flex items-start w-full min-w-0">
                          <span className="font-medium mr-2 text-gray-400 flex-shrink-0">Tax Office:</span>
                          <span className="break-words text-ellipsis overflow-hidden" title={customer.tax_office}>
                            {customer.tax_office && customer.tax_office.length > 20 ? `${customer.tax_office.substring(0, 20)}...` : customer.tax_office}
                          </span>
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
                    <div className="flex justify-between text-sm w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-400 flex-shrink-0">ID:</span>
                        <span className="ml-2 text-white font-medium truncate" title={customer.id.toString()}>{customer.id}</span>
                      </div>
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
                      className="flex-1 bg-gray-700/50 hover:bg-gray-700/70 text-white text-sm font-medium py-2 px-3 rounded border border-gray-600/30 transition-colors min-w-0"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleEditCustomer(customer.id.toString())}
                      className="flex-1 bg-gray-700/30 hover:bg-gray-700/50 text-white text-sm font-medium py-2 px-3 rounded border border-gray-600/20 transition-colors min-w-0"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-12 text-center">
              <button className="px-6 py-2 border border-white/20 rounded-md text-white/70 hover:text-white hover:bg-transparent transition-colors">
                Load More Customers
              </button>
            </div>
          </div>
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
