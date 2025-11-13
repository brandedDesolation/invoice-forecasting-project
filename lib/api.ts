/**
 * API utility functions for frontend-backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
  tax_office?: string;
  tax_number?: string;
  address?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface CustomerCreate {
  name: string;
  tax_office?: string;
  tax_number?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface CustomerUpdate {
  name?: string;
  tax_office?: string;
  tax_number?: string;
  address?: string;
  email?: string;
  phone?: string;
}

// Invoice interfaces
export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_rate: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  line_total: number;
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
  created_at: string;
  updated_at?: string;
  customer?: Customer;
  supplier?: Customer; // Using Customer interface for supplier
  items?: InvoiceItem[];
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

  // Delete customer
  async deleteCustomer(id: number): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/customers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<MessageResponse>(response);
  },
};