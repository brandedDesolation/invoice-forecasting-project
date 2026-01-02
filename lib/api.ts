/**
 * API utility functions for frontend-backend communication
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // If JSON parsing fails, try to get text
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
      } catch (e2) {
        // Keep default error message
      }
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// Helper function to get error message
export function getErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// Customer interfaces
export interface Customer {
  id: number;
  name: string;
  tax_id?: string;
  address?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerCreate {
  name: string;
  tax_id?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface CustomerUpdate {
  name?: string;
  tax_id?: string;
  address?: string;
  email?: string;
  phone?: string;
}

// Invoice interfaces
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity?: number;
  unit_price?: number;
  discount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
  created_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax: number;
  total: number;
  customer_id: number;
  supplier_id: number;
  image_path?: string;
  raw_text?: string;
  ocr_confidence?: number;
  extraction_status?: string;
  status?: string; // pending, overdue, paid, cancelled, void
  created_at: string;
  updated_at?: string;
  customer?: Customer;
  supplier?: Customer; // Using Customer interface for supplier
  items?: InvoiceItem[];
}

export interface InvoiceItemUpdateRequest {
  id?: number; // If provided, update existing item; if undefined, create new
  description: string;
  quantity?: number;
  unit_price?: number;
  discount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
}

export interface InvoiceUpdate {
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  customer_id?: number;
  supplier_id?: number;
  status?: string; // pending, overdue, paid, cancelled, void
  items?: InvoiceItemUpdateRequest[]; // If provided, replace all items
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface ExtractedInvoiceData {
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  amounts: {
    subtotal?: number;
    tax?: number;
    total?: number;
  };
  supplier: {
    name?: string;
    tax_id?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  customer: {
    name?: string;
    tax_id?: string;
    address?: string;
  };
  items: any[];
  raw_text?: string;
  ocr_confidence?: number;
}

export interface InvoiceUploadResponse {
  success: boolean;
  message: string;
  invoice_id?: number;
  extracted_data?: ExtractedInvoiceData;
}

// Invoice API functions
export const invoiceApi = {
  // Get all invoices
  async getInvoices(skip: number = 0, limit: number = 100): Promise<Invoice[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/?skip=${skip}&limit=${limit}`);
    return handleResponse<Invoice[]>(response);
  },

  // Get invoice by ID
  async getInvoice(id: number): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}`);
    return handleResponse<Invoice>(response);
  },

  // Get invoices by customer
  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/customer/${customerId}`);
    return handleResponse<Invoice[]>(response);
  },

  // Get invoices by supplier
  async getInvoicesBySupplier(supplierId: number): Promise<Invoice[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/supplier/${supplierId}`);
    return handleResponse<Invoice[]>(response);
  },

  // Upload invoice image for OCR processing
  async uploadInvoiceForOCR(file: File): Promise<InvoiceUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/upload/invoice`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<InvoiceUploadResponse>(response);
  },

  // Upload invoice image
  async uploadInvoiceImage(invoiceId: number, file: File): Promise<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<MessageResponse>(response);
  },

  // Get invoice image info
  async getInvoiceImage(invoiceId: number): Promise<{ filename: string; path: string; has_image: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}`);
    return handleResponse<{ filename: string; path: string; has_image: boolean }>(response);
  },

  // Delete invoice image
  async deleteInvoiceImage(invoiceId: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}`, {
      method: 'DELETE',
    });
    return handleResponse<MessageResponse>(response);
  },

  // Update invoice
  async updateInvoice(id: number, invoice: InvoiceUpdate): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoice),
    });
    return handleResponse<Invoice>(response);
  },

  // Delete invoice
  async deleteInvoice(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/invoices/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },
};

// Customer API functions
export const customerApi = {
  // Get all customers
  async getCustomers(skip: number = 0, limit: number = 100): Promise<Customer[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers?skip=${skip}&limit=${limit}`);
    return handleResponse<Customer[]>(response);
  },

  // Get customer by ID
  async getCustomer(id: number): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers/${id}`);
    return handleResponse<Customer>(response);
  },

  // Create new customer
  async createCustomer(customer: CustomerCreate): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
  },

  // Update customer
  async updateCustomer(id: number, customer: CustomerUpdate): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
  },

  // Delete customer (cascade=true will also delete all their invoices)
  async deleteCustomer(id: number, cascade: boolean = false): Promise<MessageResponse> {
    const url = cascade 
      ? `${API_BASE_URL}/api/v1/customers/${id}?cascade=true`
      : `${API_BASE_URL}/api/v1/customers/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
    return handleResponse<MessageResponse>(response);
  },
};

// Analytics interfaces
export interface RevenueMetrics {
  total_revenue: number;
  paid_revenue: number;
  pending_revenue: number;
  overdue_revenue: number;
  revenue_change_percent?: number;
}

export interface InvoiceMetrics {
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  invoices_change_percent?: number;
}

export interface InvoiceTrendData {
  date: string;
  amount: number;
  count: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label: string;
}

export interface AnalyticsOverview {
  revenue: RevenueMetrics;
  invoices: InvoiceMetrics;
  invoice_trends: InvoiceTrendData[];
  revenue_forecast: TimeSeriesData[];
}

// Analytics API functions
export const analyticsApi = {
  // Get comprehensive analytics overview
  async getOverview(days: number = 30, startDate?: string, endDate?: string): Promise<AnalyticsOverview> {
    let url = `${API_BASE_URL}/api/v1/analytics/overview?days=${days}`;
    if (startDate && endDate) {
      url += `&start_date_str=${startDate}&end_date_str=${endDate}`;
    }
    const response = await fetch(url);
    return handleResponse<AnalyticsOverview>(response);
  },

  // Get revenue metrics
  async getRevenueMetrics(days: number = 30): Promise<RevenueMetrics> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/revenue?days=${days}`);
    return handleResponse<RevenueMetrics>(response);
  },

  // Get invoice metrics
  async getInvoiceMetrics(days: number = 30): Promise<InvoiceMetrics> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/invoices?days=${days}`);
    return handleResponse<InvoiceMetrics>(response);
  },

  // Get revenue forecast
  async getRevenueForecast(days: number = 30): Promise<TimeSeriesData[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/revenue-forecast?days=${days}`);
    return handleResponse<TimeSeriesData[]>(response);
  },

  // Get invoice trends
  async getInvoiceTrends(days: number = 30): Promise<InvoiceTrendData[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/invoice-trends?days=${days}`);
    return handleResponse<InvoiceTrendData[]>(response);
  },
};
