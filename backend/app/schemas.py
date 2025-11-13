"""
Pydantic schemas for API validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime


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


class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int
    created_at: datetime

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


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = []


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None


class Invoice(InvoiceBase):
    id: int
    image_path: Optional[str] = None
    raw_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    extraction_status: str = "pending"
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItem] = []
    customer: Optional[Customer] = None
    supplier: Optional[Supplier] = None

    class Config:
        from_attributes = True


# OCR Response Schemas
class ExtractedInvoiceData(BaseModel):
    invoice_number: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    amounts: dict = {}
    supplier: dict = {}
    customer: dict = {}
    items: List[dict] = []
    raw_text: Optional[str] = None
    ocr_confidence: Optional[float] = None


class InvoiceUploadResponse(BaseModel):
    success: bool
    message: str
    invoice_id: Optional[int] = None
    extracted_data: Optional[ExtractedInvoiceData] = None


# Payment Schemas
class PaymentBase(BaseModel):
    invoice_id: int
    amount: float
    payment_date: date
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    invoice_id: Optional[int] = None
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class Payment(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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
