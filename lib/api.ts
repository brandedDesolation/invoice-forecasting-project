/**
 * API utility functions for frontend-backend communication
 */

import { AUTH_TOKEN_KEY } from "./auth";
import type { User } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(input, { ...init, headers });
}

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
  invoiceCount?: number;
  totalAmount?: number;
  created_at: string;
  updated_at?: string;
}

export interface CustomerSummary extends Customer {
  invoice_count: number;
  total_amount: number;
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

export interface Supplier extends Customer {}
export interface SupplierCreate extends CustomerCreate {}
export interface SupplierUpdate extends CustomerUpdate {}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentCreate {
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface PaymentUpdate {
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface PaymentCheckoutResponse {
  provider: string;
  checkout_session_id: string;
  checkout_url: string;
  status: string;
  amount: number;
  currency: string;
  message: string;
}

export interface UserUpdate {
  name?: string;
  role?: string;
  company?: string;
  is_active?: boolean;
}

export interface PurchaseOrderItem {
  id?: number;
  purchase_order_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  request_date: string;
  expected_delivery_date?: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
}

export interface Expense {
  id: number;
  expense_number: string;
  vendor: string;
  category: string;
  expense_date: string;
  amount: number;
  tax: number;
  total: number;
  approval_status: string;
  reimbursable: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: number;
  entry_date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  source_type: string;
  reference?: string | null;
  created_at: string;
}

export interface LedgerSummary {
  receivables: number;
  payables: number;
  cash_collected: number;
  expenses: number;
  balance: number;
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
  approval_status?: string;
  approved_by_id?: number;
  approved_at?: string;
  approval_note?: string;
  last_reminder_sent_at?: string;
  image_filename?: string;
  created_at: string;
  updated_at?: string;
  customer?: Customer;
  supplier?: Customer; // Using Customer interface for supplier
  items?: InvoiceItem[];
  payments?: Payment[];
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
  approval_status?: string;
  approval_note?: string;
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
  overall_confidence?: number;
  field_confidence?: Record<string, number>;
  provider_name?: string;
  model_version?: string;
  review_required?: boolean;
}

export interface InvoiceUploadResponse {
  success: boolean;
  message: string;
  invoice_id?: number;
  extracted_data?: ExtractedInvoiceData;
  extraction_run_id?: number;
}

export interface ExtractionRun {
  id: number;
  invoice_id?: number;
  source_filename?: string;
  provider_name: string;
  model_version?: string;
  raw_text?: string;
  original_data: string;
  corrected_data?: string;
  corrected_fields: string[];
  field_confidence?: string;
  ocr_confidence?: number;
  overall_confidence?: number;
  review_required: boolean;
  correction_count: number;
  status: string;
  reviewed_by_id?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: number;
  invoice_id: number;
  event_type: string;
  title: string;
  message?: string;
  actor?: string;
  metadata_json?: string;
  created_at: string;
}

// Invoice API functions
export const invoiceApi = {
  // Get all invoices
  async getInvoices(skip: number = 0, limit: number = 100): Promise<Invoice[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/invoices/?skip=${skip}&limit=${limit}`);
    return handleResponse<Invoice[]>(response);
  },

  // Get invoice by ID
  async getInvoice(id: number): Promise<Invoice> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/invoices/${id}`);
    return handleResponse<Invoice>(response);
  },

  async getInvoiceAuditEvents(id: number): Promise<AuditEvent[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/invoices/${id}/audit-events`);
    return handleResponse<AuditEvent[]>(response);
  },

  // Get invoices by customer
  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/invoices/customer/${customerId}`);
    return handleResponse<Invoice[]>(response);
  },

  // Get invoices by supplier
  async getInvoicesBySupplier(supplierId: number): Promise<Invoice[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/invoices/supplier/${supplierId}`);
    return handleResponse<Invoice[]>(response);
  },

  // Upload invoice image for OCR processing
  async uploadInvoiceForOCR(file: File): Promise<InvoiceUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await authFetch(`${API_BASE_URL}/api/v1/upload/invoice`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<InvoiceUploadResponse>(response);
  },

  // Upload invoice image
  async uploadInvoiceImage(invoiceId: number, file: File): Promise<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await authFetch(`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<MessageResponse>(response);
  },

  // Get invoice image info
  async getInvoiceImage(invoiceId: number): Promise<{ filename: string; path: string; has_image: boolean }> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}`);
    return handleResponse<{ filename: string; path: string; has_image: boolean }>(response);
  },

  // Delete invoice image
  async deleteInvoiceImage(invoiceId: number): Promise<MessageResponse> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/upload/invoice-image/${invoiceId}`, {
      method: 'DELETE',
    });
    return handleResponse<MessageResponse>(response);
  },

  // Update invoice
  async updateInvoice(id: number, invoice: InvoiceUpdate): Promise<Invoice> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(invoice),
    });
    return handleResponse<Invoice>(response);
  },

  // Delete invoice
  async deleteInvoice(id: number): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/invoices/${id}`, {
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
    const response = await authFetch(`${API_BASE_URL}/api/v1/customers/?skip=${skip}&limit=${limit}`);
    return handleResponse<Customer[]>(response);
  },

  async getCustomerSummaries(skip: number = 0, limit: number = 100): Promise<CustomerSummary[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/customers/summary?skip=${skip}&limit=${limit}`);
    return handleResponse<CustomerSummary[]>(response);
  },

  // Get customer by ID
  async getCustomer(id: number): Promise<Customer> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/customers/${id}`);
    return handleResponse<Customer>(response);
  },

  // Create new customer
  async createCustomer(customer: CustomerCreate): Promise<Customer> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/customers/`, {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
  },

  // Update customer
  async updateCustomer(id: number, customer: CustomerUpdate): Promise<Customer> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
    return handleResponse<Customer>(response);
  },

  // Delete customer (cascade=true will also delete all their invoices)
  async deleteCustomer(id: number, cascade: boolean = false): Promise<MessageResponse> {
    const url = cascade 
      ? `${API_BASE_URL}/api/v1/customers/${id}?cascade=true`
      : `${API_BASE_URL}/api/v1/customers/${id}`;
    const response = await authFetch(url, {
      method: 'DELETE',
    });
    return handleResponse<MessageResponse>(response);
  },
};

export const supplierApi = {
  async getSuppliers(skip: number = 0, limit: number = 100): Promise<Supplier[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/suppliers/?skip=${skip}&limit=${limit}`);
    return handleResponse<Supplier[]>(response);
  },

  async getSupplier(id: number): Promise<Supplier> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/suppliers/${id}`);
    return handleResponse<Supplier>(response);
  },

  async createSupplier(supplier: SupplierCreate): Promise<Supplier> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/suppliers/`, {
      method: "POST",
      body: JSON.stringify(supplier),
    });
    return handleResponse<Supplier>(response);
  },

  async updateSupplier(id: number, supplier: SupplierUpdate): Promise<Supplier> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(supplier),
    });
    return handleResponse<Supplier>(response);
  },

  async deleteSupplier(id: number): Promise<MessageResponse> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/suppliers/${id}`, {
      method: "DELETE",
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
  ai_automation: AIAutomationMetrics;
}

export interface AIAutomationMetrics {
  total_extractions: number;
  avg_confidence: number;
  review_required_count: number;
  corrected_runs: number;
  correction_rate: number;
  avg_correction_count: number;
  forecast_count: number;
  high_risk_forecasts: number;
  avg_forecast_confidence: number;
}

export interface SupplierInsight {
  supplier_id: number;
  supplier_name: string;
  invoice_count: number;
  total_spend: number;
  average_invoice: number;
  last_invoice_date?: string;
  recent_30_day_spend: number;
  previous_30_day_spend: number;
}

export interface SupplierMonthlySpendPoint {
  month: string;
  label: string;
  amount: number;
  invoice_count: number;
  active_suppliers: number;
}

export interface SupplierAnalyticsSummary {
  total_suppliers: number;
  active_suppliers: number;
  total_spend: number;
  total_invoices: number;
  average_invoice: number;
  average_spend_per_supplier: number;
  suppliers_with_recent_activity: number;
  largest_supplier_share: number;
  largest_supplier?: SupplierInsight | null;
  top_suppliers: SupplierInsight[];
  supplier_breakdown: SupplierInsight[];
  monthly_spend: SupplierMonthlySpendPoint[];
}

export interface WorkflowNotification {
  id: number;
  invoice_id?: number;
  type: string;
  title: string;
  message: string;
  status: string;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

export interface WorkflowInvoiceSummary {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  total: number;
  status?: string;
  approval_status: string;
  customer_name?: string;
  supplier_name?: string;
  last_reminder_sent_at?: string;
}

export interface WorkflowSummary {
  pending_approvals: number;
  due_soon: number;
  overdue_unpaid: number;
  unread_notifications: number;
  pending_approval_invoices: WorkflowInvoiceSummary[];
  due_soon_invoices: WorkflowInvoiceSummary[];
  notifications: WorkflowNotification[];
}

export interface InvoiceApprovalUpdate {
  status: string;
  note?: string;
}

export interface ForecastInsight {
  forecast_id?: number;
  predicted_payment_date: string;
  confidence_score: number;
  risk_score: number;
  risk_level: string;
  prediction_method: string;
  model_version: string;
  explanation: string;
  recommended_action: string;
  historical_sample_size: number;
  feature_summary: Record<string, string | number | null>;
}

export interface ForecastPredictionResponse {
  message: string;
  forecast: {
    id: number;
    invoice_id: number;
    predicted_payment_date: string;
    confidence_score?: number;
    prediction_method?: string;
    risk_score?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
  };
  insight: ForecastInsight;
}

export interface ReviewQueueItem {
  id: number;
  invoice_id?: number;
  source_filename?: string;
  provider_name: string;
  model_version?: string;
  ocr_confidence?: number;
  overall_confidence?: number;
  corrected_fields: string[];
  review_required: boolean;
  correction_count: number;
  status: string;
  reviewed_by_id?: number;
  reviewed_at?: string;
  created_at: string;
  invoice_number?: string;
  customer_name?: string;
  supplier_name?: string;
}

export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  total: number;
}

export interface FieldCorrectionMetric {
  field: string;
  count: number;
}

export interface ProviderLearningMetric {
  provider_name: string;
  total_runs: number;
  corrected_runs: number;
  correction_rate: number;
  avg_correction_count: number;
}

export interface LearningLoopSummary {
  total_runs: number;
  corrected_runs: number;
  total_corrections: number;
  top_corrected_fields: FieldCorrectionMetric[];
  provider_breakdown: ProviderLearningMetric[];
}

// Analytics API functions
export const analyticsApi = {
  // Get comprehensive analytics overview
  async getOverview(days: number = 30, startDate?: string, endDate?: string): Promise<AnalyticsOverview> {
    let url = `${API_BASE_URL}/api/v1/analytics/overview?days=${days}`;
    if (startDate && endDate) {
      url += `&start_date_str=${startDate}&end_date_str=${endDate}`;
    }
    const response = await authFetch(url);
    return handleResponse<AnalyticsOverview>(response);
  },

  // Get revenue metrics
  async getRevenueMetrics(days: number = 30): Promise<RevenueMetrics> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/analytics/revenue?days=${days}`);
    return handleResponse<RevenueMetrics>(response);
  },

  // Get invoice metrics
  async getInvoiceMetrics(days: number = 30): Promise<InvoiceMetrics> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/analytics/invoices?days=${days}`);
    return handleResponse<InvoiceMetrics>(response);
  },

  // Get revenue forecast
  async getRevenueForecast(days: number = 30): Promise<TimeSeriesData[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/analytics/revenue-forecast?days=${days}`);
    return handleResponse<TimeSeriesData[]>(response);
  },

  // Get invoice trends
  async getInvoiceTrends(days: number = 30): Promise<InvoiceTrendData[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/analytics/invoice-trends?days=${days}`);
    return handleResponse<InvoiceTrendData[]>(response);
  },

  async getAIAutomation(days: number = 30): Promise<AIAutomationMetrics> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/analytics/ai-automation?days=${days}`);
    return handleResponse<AIAutomationMetrics>(response);
  },

  async getLearningLoop(days: number = 30, startDate?: string, endDate?: string): Promise<LearningLoopSummary> {
    let url = `${API_BASE_URL}/api/v1/analytics/learning-loop?days=${days}`;
    if (startDate && endDate) {
      url += `&start_date_str=${startDate}&end_date_str=${endDate}`;
    }
    const response = await authFetch(url);
    return handleResponse<LearningLoopSummary>(response);
  },

  async getSupplierInsights(
    days?: number,
    monthWindow: number = 6,
    startDate?: string,
    endDate?: string
  ): Promise<SupplierAnalyticsSummary> {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.set("start_date_str", startDate);
      params.set("end_date_str", endDate);
    }
    if (typeof days === "number") {
      params.set("days", days.toString());
    }
    params.set("month_window", monthWindow.toString());

    const response = await authFetch(`${API_BASE_URL}/api/v1/analytics/suppliers?${params.toString()}`);
    return handleResponse<SupplierAnalyticsSummary>(response);
  },
};

export const forecastApi = {
  async predictInvoice(invoiceId: number): Promise<ForecastPredictionResponse> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/forecasts/predict/${invoiceId}`, {
      method: "POST",
    });
    return handleResponse<ForecastPredictionResponse>(response);
  },

  async getLatestInvoiceForecast(invoiceId: number): Promise<ForecastInsight | null> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/forecasts/invoice/${invoiceId}/latest`);
    return handleResponse<ForecastInsight | null>(response);
  },
};

export const workflowApi = {
  async getSummary(): Promise<WorkflowSummary> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/workflow/summary`);
    return handleResponse<WorkflowSummary>(response);
  },

  async updateInvoiceApproval(invoiceId: number, payload: InvoiceApprovalUpdate): Promise<Invoice> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/workflow/invoice/${invoiceId}/approval`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<Invoice>(response);
  },

  async sendInvoiceReminder(invoiceId: number): Promise<MessageResponse> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/workflow/invoice/${invoiceId}/send-reminder`, {
      method: "POST",
    });
    return handleResponse<MessageResponse>(response);
  },

  async markNotificationRead(notificationId: number): Promise<WorkflowNotification> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/workflow/notifications/${notificationId}/read`, {
      method: "POST",
    });
    return handleResponse<WorkflowNotification>(response);
  },
};

export const paymentApi = {
  async getPayments(skip: number = 0, limit: number = 100): Promise<Payment[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/payments/?skip=${skip}&limit=${limit}`);
    return handleResponse<Payment[]>(response);
  },

  async getInvoicePayments(invoiceId: number): Promise<Payment[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/payments/invoice/${invoiceId}`);
    return handleResponse<Payment[]>(response);
  },

  async createPayment(payment: PaymentCreate): Promise<Payment> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/payments/`, {
      method: "POST",
      body: JSON.stringify(payment),
    });
    return handleResponse<Payment>(response);
  },

  async createProviderCheckout(invoiceId: number, amount: number): Promise<PaymentCheckoutResponse> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/payments/provider/checkout`, {
      method: "POST",
      body: JSON.stringify({ invoice_id: invoiceId, amount, provider: "mockpay" }),
    });
    return handleResponse<PaymentCheckoutResponse>(response);
  },

  async completeProviderCheckout(checkoutSessionId: string): Promise<Payment> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/payments/provider/checkout/${encodeURIComponent(checkoutSessionId)}/complete`, {
      method: "POST",
    });
    return handleResponse<Payment>(response);
  },

  async updatePayment(id: number, payment: PaymentUpdate): Promise<Payment> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payment),
    });
    return handleResponse<Payment>(response);
  },

  async deletePayment(id: number): Promise<MessageResponse> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/payments/${id}`, {
      method: "DELETE",
    });
    return handleResponse<MessageResponse>(response);
  },
};

export const userApi = {
  async getUsers(): Promise<User[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/users/`);
    return handleResponse<User[]>(response);
  },

  async updateUser(id: number, payload: UserUpdate): Promise<User> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return handleResponse<User>(response);
  },
};

export const purchaseOrderApi = {
  async getPurchaseOrders(status?: string): Promise<PurchaseOrder[]> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const response = await authFetch(`${API_BASE_URL}/api/v1/purchase-orders/?${params.toString()}`);
    return handleResponse<PurchaseOrder[]>(response);
  },

  async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/purchase-orders/${id}`);
    return handleResponse<PurchaseOrder>(response);
  },

  async createPurchaseOrder(payload: Omit<PurchaseOrder, "id" | "created_at" | "updated_at" | "supplier">): Promise<PurchaseOrder> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/purchase-orders/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<PurchaseOrder>(response);
  },
};

export const expenseApi = {
  async getExpenses(category?: string, approvalStatus?: string): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (approvalStatus) params.set("approval_status", approvalStatus);
    const response = await authFetch(`${API_BASE_URL}/api/v1/expenses/?${params.toString()}`);
    return handleResponse<Expense[]>(response);
  },
};

export const ledgerApi = {
  async getEntries(): Promise<LedgerEntry[]> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/ledger/`);
    return handleResponse<LedgerEntry[]>(response);
  },

  async getSummary(): Promise<LedgerSummary> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/ledger/summary`);
    return handleResponse<LedgerSummary>(response);
  },
};

export const reviewApi = {
  async getQueue(status?: string, reviewRequired: boolean = true): Promise<ReviewQueueResponse> {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    params.set("review_required", String(reviewRequired));

    const response = await authFetch(`${API_BASE_URL}/api/v1/review/queue?${params.toString()}`);
    return handleResponse<ReviewQueueResponse>(response);
  },

  async getRun(runId: number): Promise<ExtractionRun> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/review/queue/${runId}`);
    return handleResponse<ExtractionRun>(response);
  },

  async updateRun(
    runId: number,
    payload: { status: string; review_required?: boolean }
  ): Promise<ExtractionRun> {
    const response = await authFetch(`${API_BASE_URL}/api/v1/review/queue/${runId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return handleResponse<ExtractionRun>(response);
  },
};
