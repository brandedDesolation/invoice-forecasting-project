"""
Pydantic schemas for API validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "admin"
    company: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    is_active: Optional[bool] = None


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class AuditEvent(BaseModel):
    id: int
    invoice_id: int
    event_type: str
    title: str
    message: Optional[str] = None
    actor: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerSummary(Customer):
    invoice_count: int = 0
    total_amount: float = 0.0


# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class Supplier(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PurchaseOrderItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    total: float = 0.0


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    purchase_order_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    po_number: str
    supplier_id: int
    request_date: date
    expected_delivery_date: Optional[date] = None
    status: str = "draft"
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate] = []


class PurchaseOrderUpdate(BaseModel):
    po_number: Optional[str] = None
    supplier_id: Optional[int] = None
    request_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    status: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None


class PurchaseOrder(PurchaseOrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    supplier: Optional[Supplier] = None
    items: List[PurchaseOrderItem] = []

    class Config:
        from_attributes = True


class ExpenseBase(BaseModel):
    expense_number: str
    vendor: str
    category: str
    expense_date: date
    amount: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    approval_status: str = "pending"
    reimbursable: bool = False
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    vendor: Optional[str] = None
    category: Optional[str] = None
    expense_date: Optional[date] = None
    amount: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    approval_status: Optional[str] = None
    reimbursable: Optional[bool] = None
    notes: Optional[str] = None


class Expense(ExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LedgerEntryBase(BaseModel):
    entry_date: date
    account: str
    description: str
    debit: float = 0.0
    credit: float = 0.0
    source_type: str
    reference: Optional[str] = None


class LedgerEntryCreate(LedgerEntryBase):
    pass


class LedgerEntry(LedgerEntryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LedgerSummary(BaseModel):
    receivables: float = 0.0
    payables: float = 0.0
    cash_collected: float = 0.0
    expenses: float = 0.0
    balance: float = 0.0


# Invoice Item Schemas
class InvoiceItemBase(BaseModel):
    description: str
    quantity: Optional[float] = 1.0
    unit_price: Optional[float] = None
    discount: Optional[float] = 0.0
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    total: float = 0.0


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    discount: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    total: Optional[float] = None


class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InvoicePaymentRead(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_date: date
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Invoice Schemas
class InvoiceBase(BaseModel):
    invoice_number: str
    issue_date: date
    due_date: Optional[date] = None
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    customer_id: int
    supplier_id: int
    purchase_order_id: Optional[int] = None


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = []


class InvoiceItemUpdateRequest(BaseModel):
    """Request model for updating invoice items - can include id for updates or no id for creates"""
    id: Optional[int] = None  # If provided, update existing item; if None, create new
    description: str
    quantity: Optional[float] = 1.0
    unit_price: Optional[float] = None
    discount: Optional[float] = 0.0
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    total: float = 0.0


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    status: Optional[str] = None  # pending, overdue, paid, cancelled, void
    approval_status: Optional[str] = None
    approval_note: Optional[str] = None
    items: Optional[List[InvoiceItemUpdateRequest]] = None  # If provided, replace all items


class Invoice(InvoiceBase):
    id: int
    image_path: Optional[str] = None
    raw_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    extraction_status: str = "pending"
    status: Optional[str] = None
    approval_status: str = "pending"
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    approval_note: Optional[str] = None
    last_reminder_sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItem] = []
    payments: List[InvoicePaymentRead] = []
    customer: Optional[Customer] = None
    supplier: Optional[Supplier] = None
    purchase_order: Optional[PurchaseOrder] = None

    class Config:
        from_attributes = True


# OCR Response Schemas
class ExtractedInvoiceData(BaseModel):
    invoice_number: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    amounts: Dict[str, float] = Field(default_factory=dict)
    supplier: Dict[str, Optional[str]] = Field(default_factory=dict)
    customer: Dict[str, Optional[str]] = Field(default_factory=dict)
    items: List[dict] = Field(default_factory=list)
    raw_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    overall_confidence: Optional[float] = None
    field_confidence: Dict[str, float] = Field(default_factory=dict)
    provider_name: Optional[str] = None
    model_version: Optional[str] = None
    review_required: bool = False


class InvoiceUploadResponse(BaseModel):
    success: bool
    message: str
    invoice_id: Optional[int] = None
    extracted_data: Optional[ExtractedInvoiceData] = None
    extraction_run_id: Optional[int] = None


# Forecast Schemas
class ForecastBase(BaseModel):
    invoice_id: int
    predicted_payment_date: date
    confidence_score: Optional[float] = None
    prediction_method: Optional[str] = None
    risk_score: Optional[float] = None
    notes: Optional[str] = None


class ForecastCreate(ForecastBase):
    pass


class ForecastUpdate(BaseModel):
    invoice_id: Optional[int] = None
    predicted_payment_date: Optional[date] = None
    confidence_score: Optional[float] = None
    prediction_method: Optional[str] = None
    risk_score: Optional[float] = None
    notes: Optional[str] = None


class Forecast(ForecastBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ForecastInsight(BaseModel):
    forecast_id: Optional[int] = None
    predicted_payment_date: date
    confidence_score: float
    risk_score: float
    risk_level: str
    prediction_method: str
    model_version: str
    explanation: str
    recommended_action: str
    historical_sample_size: int
    feature_summary: Dict[str, Any] = Field(default_factory=dict)


class ForecastPredictionResponse(BaseModel):
    message: str
    forecast: Forecast
    insight: ForecastInsight


class PaymentBase(BaseModel):
    invoice_id: int
    amount: float
    payment_date: date
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentCheckoutRequest(BaseModel):
    invoice_id: int
    amount: float
    provider: str = "mockpay"


class PaymentCheckoutResponse(BaseModel):
    provider: str
    checkout_session_id: str
    checkout_url: str
    status: str
    amount: float
    currency: str = "TRY"
    message: str


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class Payment(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExtractionRunReviewUpdate(BaseModel):
    status: str
    review_required: Optional[bool] = None
    corrected_data: Optional[Dict[str, Any]] = None
    corrected_fields: Optional[List[str]] = None


class ExtractionRun(BaseModel):
    id: int
    invoice_id: Optional[int] = None
    source_filename: Optional[str] = None
    provider_name: str
    model_version: Optional[str] = None
    raw_text: Optional[str] = None
    original_data: str
    corrected_data: Optional[str] = None
    corrected_fields: List[str] = Field(default_factory=list)
    field_confidence: Optional[str] = None
    ocr_confidence: Optional[float] = None
    overall_confidence: Optional[float] = None
    review_required: bool
    correction_count: int
    status: str
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExtractionRunListItem(BaseModel):
    id: int
    invoice_id: Optional[int] = None
    source_filename: Optional[str] = None
    provider_name: str
    model_version: Optional[str] = None
    ocr_confidence: Optional[float] = None
    overall_confidence: Optional[float] = None
    corrected_fields: List[str] = Field(default_factory=list)
    review_required: bool
    correction_count: int
    status: str
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None
    supplier_name: Optional[str] = None


class ReviewQueueResponse(BaseModel):
    items: List[ExtractionRunListItem]
    total: int


class SupplierInsight(BaseModel):
    supplier_id: int
    supplier_name: str
    invoice_count: int
    total_spend: float
    average_invoice: float
    last_invoice_date: Optional[date] = None
    recent_30_day_spend: float
    previous_30_day_spend: float


class SupplierMonthlySpendPoint(BaseModel):
    month: str
    label: str
    amount: float
    invoice_count: int
    active_suppliers: int


class SupplierAnalyticsSummary(BaseModel):
    total_suppliers: int
    active_suppliers: int
    total_spend: float
    total_invoices: int
    average_invoice: float
    average_spend_per_supplier: float
    suppliers_with_recent_activity: int
    largest_supplier_share: float
    largest_supplier: Optional[SupplierInsight] = None
    top_suppliers: List[SupplierInsight] = Field(default_factory=list)
    supplier_breakdown: List[SupplierInsight] = Field(default_factory=list)
    monthly_spend: List[SupplierMonthlySpendPoint] = Field(default_factory=list)


class InvoiceApprovalUpdate(BaseModel):
    status: str
    note: Optional[str] = None


class WorkflowNotification(BaseModel):
    id: int
    invoice_id: Optional[int] = None
    type: str
    title: str
    message: str
    status: str
    action_url: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkflowInvoiceSummary(BaseModel):
    id: int
    invoice_number: str
    issue_date: date
    due_date: Optional[date] = None
    total: float
    status: Optional[str] = None
    approval_status: str = "pending"
    customer_name: Optional[str] = None
    supplier_name: Optional[str] = None
    last_reminder_sent_at: Optional[datetime] = None


class WorkflowSummary(BaseModel):
    pending_approvals: int
    due_soon: int
    overdue_unpaid: int
    unread_notifications: int
    pending_approval_invoices: List[WorkflowInvoiceSummary] = Field(default_factory=list)
    due_soon_invoices: List[WorkflowInvoiceSummary] = Field(default_factory=list)
    notifications: List[WorkflowNotification] = Field(default_factory=list)


class FieldCorrectionMetric(BaseModel):
    field: str
    count: int


class ProviderLearningMetric(BaseModel):
    provider_name: str
    total_runs: int
    corrected_runs: int
    correction_rate: float
    avg_correction_count: float


class LearningLoopSummary(BaseModel):
    total_runs: int
    corrected_runs: int
    total_corrections: int
    top_corrected_fields: List[FieldCorrectionMetric] = Field(default_factory=list)
    provider_breakdown: List[ProviderLearningMetric] = Field(default_factory=list)
