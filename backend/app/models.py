"""
Database models for Invoice Forecasting System
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


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
    
    # OCR metadata
    image_path = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    extraction_status = Column(String(50), default="pending")  # pending, completed, failed
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    supplier = relationship("Supplier", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


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


class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)  # e.g., "BANK_TRANSFER", "CHECK", "CASH"
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice")


class Forecast(Base):
    """Forecast model for payment predictions"""
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    predicted_payment_date = Column(Date, nullable=False, index=True)
    confidence_score = Column(Float, nullable=True)  # 0.0 to 1.0
    prediction_method = Column(String(100), nullable=True)  # e.g., "ML_MODEL", "STATISTICAL"
    risk_score = Column(Float, nullable=True)  # 0.0 to 1.0
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    invoice = relationship("Invoice")
