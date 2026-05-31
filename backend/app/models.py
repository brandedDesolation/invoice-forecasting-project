"""
Database models for Invoice Forecasting System
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """Application user for admin authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="admin")
    company = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviewed_extractions = relationship("ExtractionRun", back_populates="reviewed_by")


class Customer(Base):
    """Customer model"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    tax_id = Column(String(50), nullable=True, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoices = relationship("Invoice", back_populates="customer")


class Supplier(Base):
    """Supplier model"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    tax_id = Column(String(50), nullable=True, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoices = relationship("Invoice", back_populates="supplier")


class Invoice(Base):
    """Invoice model"""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), nullable=False, index=True)
    issue_date = Column(Date, nullable=False, index=True)
    due_date = Column(Date, nullable=True)
    
    # Amounts
    subtotal = Column(Float, nullable=False, default=0.0)
    tax = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    
    # Foreign keys
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True, index=True)
    
    # OCR metadata
    image_path = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    extraction_status = Column(String(50), default="pending")  # pending, completed, failed
    
    # Invoice status
    status = Column(String(50), nullable=True)  # pending, overdue, paid, cancelled, void
    approval_status = Column(String(50), nullable=False, default="pending")
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_at = Column(DateTime, nullable=True)
    approval_note = Column(Text, nullable=True)
    last_reminder_sent_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    supplier = relationship("Supplier", back_populates="invoices")
    purchase_order = relationship("PurchaseOrder", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    extraction_runs = relationship("ExtractionRun", back_populates="invoice")
    notifications = relationship("WorkflowNotification", back_populates="invoice", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="invoice", cascade="all, delete-orphan")
    approved_by = relationship("User", foreign_keys=[approved_by_id])


class InvoiceItem(Base):
    """Invoice line item model"""
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    description = Column(String(500), nullable=False)
    quantity = Column(Float, nullable=True, default=1.0)
    unit_price = Column(Float, nullable=True)
    discount = Column(Float, nullable=True, default=0.0)
    tax_rate = Column(Float, nullable=True, default=0.0)
    tax_amount = Column(Float, nullable=True, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")


class Forecast(Base):
    """Forecast model for payment predictions"""
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    
    predicted_payment_date = Column(Date, nullable=False, index=True)
    confidence_score = Column(Float, nullable=True)  # 0.0 to 1.0
    prediction_method = Column(String(100), nullable=True)  # e.g., "ML_MODEL", "STATISTICAL"
    risk_score = Column(Float, nullable=True)  # 0.0 to 1.0
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships - cascade delete when invoice is deleted
    invoice = relationship("Invoice", backref="forecasts")


class Payment(Base):
    """Payment records linked to invoices"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    payment_date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(100), nullable=True)
    reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")


class ExtractionRun(Base):
    """Stores raw extraction output and user-reviewed corrections"""
    __tablename__ = "extraction_runs"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    source_filename = Column(String(255), nullable=True)
    provider_name = Column(String(100), nullable=False, default="local_ocr")
    model_version = Column(String(100), nullable=True)
    raw_text = Column(Text, nullable=True)
    original_data = Column(Text, nullable=False)
    corrected_data = Column(Text, nullable=True)
    corrected_fields = Column(Text, nullable=True)
    field_confidence = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    overall_confidence = Column(Float, nullable=True)
    review_required = Column(Boolean, nullable=False, default=False)
    correction_count = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="extracted")
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="extraction_runs")
    reviewed_by = relationship("User", back_populates="reviewed_extractions")


class WorkflowNotification(Base):
    """Operational workflow notifications for approvals and reminders"""
    __tablename__ = "workflow_notifications"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="unread", index=True)
    action_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_at = Column(DateTime, nullable=True)

    invoice = relationship("Invoice", back_populates="notifications")


class AuditEvent(Base):
    """Persistent invoice lifecycle event for demo traceability"""
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    actor = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    invoice = relationship("Invoice", back_populates="audit_events")


class PurchaseOrder(Base):
    """Supplier purchase order for ERP-style procurement"""
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(100), nullable=False, unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    request_date = Column(Date, nullable=False, index=True)
    expected_delivery_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, default="draft", index=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    tax = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    """Purchase order line item"""
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(500), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    purchase_order = relationship("PurchaseOrder", back_populates="items")


class Expense(Base):
    """Company expense record for ERP finance visibility"""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_number = Column(String(100), nullable=False, unique=True, index=True)
    vendor = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    expense_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    tax = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    approval_status = Column(String(50), nullable=False, default="pending", index=True)
    reimbursable = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LedgerEntry(Base):
    """Lightweight general ledger entry for demo accounting traceability"""
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    account = Column(String(100), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    debit = Column(Float, nullable=False, default=0.0)
    credit = Column(Float, nullable=False, default=0.0)
    source_type = Column(String(100), nullable=False, index=True)
    reference = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
