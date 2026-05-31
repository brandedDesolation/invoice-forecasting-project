"""
Document extraction providers for invoice processing.

Supports a local OCR provider and an optional Azure Document Intelligence
provider with automatic fallback.
"""

import json
import os
import time
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Any, Dict, List, Optional


def _safe_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_date(value: Any) -> Optional[date]:
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        except ValueError:
            for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
    return None


def _normalize_items(items: Any) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    if not isinstance(items, list):
        return normalized

    for item in items:
        if not isinstance(item, dict):
            continue

        quantity = _safe_float(item.get("quantity")) or 1.0
        unit_price = _safe_float(item.get("unit_price"))
        tax_rate = _safe_float(item.get("tax_rate")) or 0.0
        tax_amount = _safe_float(item.get("tax_amount")) or 0.0
        discount = _safe_float(item.get("discount")) or 0.0
        total = _safe_float(item.get("total"))

        if total is None:
            subtotal = quantity * (unit_price or 0.0) - discount
            total = subtotal + tax_amount

        normalized.append({
            "description": (item.get("description") or "").strip() or "Invoice item",
            "quantity": quantity,
            "unit_price": unit_price,
            "discount": discount,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "total": total,
        })

    return normalized


def _presence_confidence(value: Any, fallback: float) -> float:
    if value in (None, "", [], {}):
        return max(0.15, fallback * 0.4)
    return max(0.25, min(0.99, fallback))


def _default_field_confidence(result: Dict[str, Any]) -> Dict[str, float]:
    baseline = result.get("ocr_confidence") or result.get("overall_confidence") or 0.6
    amounts = result.get("amounts", {})
    supplier = result.get("supplier", {})
    customer = result.get("customer", {})
    return {
        "invoice_number": _presence_confidence(result.get("invoice_number"), baseline),
        "issue_date": _presence_confidence(result.get("issue_date"), baseline),
        "due_date": _presence_confidence(result.get("due_date"), baseline * 0.95),
        "subtotal": _presence_confidence(amounts.get("subtotal"), baseline),
        "tax": _presence_confidence(amounts.get("tax"), baseline * 0.95),
        "total": _presence_confidence(amounts.get("total"), baseline),
        "supplier_name": _presence_confidence(supplier.get("name"), baseline),
        "customer_name": _presence_confidence(customer.get("name"), baseline),
        "items": _presence_confidence(result.get("items"), baseline * 0.9),
    }


def _review_required(result: Dict[str, Any]) -> bool:
    confidence = result.get("overall_confidence") or result.get("ocr_confidence") or 0.0
    fields = result.get("field_confidence") or {}
    if confidence < 0.7:
        return True
    return any(value < 0.6 for value in fields.values())


def _normalize_result(result: Dict[str, Any], provider_name: str, model_version: Optional[str]) -> Dict[str, Any]:
    normalized = {
        "invoice_number": result.get("invoice_number"),
        "issue_date": _normalize_date(result.get("issue_date")),
        "due_date": _normalize_date(result.get("due_date")),
        "amounts": {
            "subtotal": _safe_float((result.get("amounts") or {}).get("subtotal")) or 0.0,
            "tax": _safe_float((result.get("amounts") or {}).get("tax")) or 0.0,
            "total": _safe_float((result.get("amounts") or {}).get("total")) or 0.0,
        },
        "supplier": {
            "name": (result.get("supplier") or {}).get("name"),
            "tax_id": (result.get("supplier") or {}).get("tax_id"),
            "address": (result.get("supplier") or {}).get("address"),
            "phone": (result.get("supplier") or {}).get("phone"),
            "email": (result.get("supplier") or {}).get("email"),
        },
        "customer": {
            "name": (result.get("customer") or {}).get("name"),
            "tax_id": (result.get("customer") or {}).get("tax_id"),
            "address": (result.get("customer") or {}).get("address"),
        },
        "items": _normalize_items(result.get("items")),
        "raw_text": result.get("raw_text"),
        "ocr_confidence": _safe_float(result.get("ocr_confidence")) or 0.0,
        "overall_confidence": _safe_float(result.get("overall_confidence")),
        "field_confidence": result.get("field_confidence") or {},
        "provider_name": provider_name,
        "model_version": model_version,
    }

    if normalized["overall_confidence"] is None:
        normalized["overall_confidence"] = normalized["ocr_confidence"] or 0.0

    if not normalized["field_confidence"]:
        normalized["field_confidence"] = _default_field_confidence(normalized)

    normalized["review_required"] = result.get("review_required", _review_required(normalized))
    return normalized


class DocumentExtractionProvider(ABC):
    provider_name = "unknown"
    model_version: Optional[str] = None

    @abstractmethod
    def extract(self, file_path: str) -> Dict[str, Any]:
        raise NotImplementedError


class LocalOCRProvider(DocumentExtractionProvider):
    provider_name = "local_ocr"
    model_version = "ocr-service-v1"

    def extract(self, file_path: str) -> Dict[str, Any]:
        from .ocr_service import get_ocr_service

        service = get_ocr_service()
        result = service.process_invoice(file_path)
        return _normalize_result(result, self.provider_name, self.model_version)


class AzureDocumentIntelligenceProvider(DocumentExtractionProvider):
    provider_name = "azure_document_intelligence"

    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "").rstrip("/")
        self.api_key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY", "")
        self.model_id = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_MODEL", "prebuilt-invoice")
        self.api_version = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_API_VERSION", "2024-02-29-preview")
        self.model_version = f"{self.model_id}:{self.api_version}"

        if not self.endpoint or not self.api_key:
            raise RuntimeError("Azure Document Intelligence is not configured")

    def _request_json(self, url: str, method: str = "GET", body: Optional[bytes] = None, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        headers = {"Ocp-Apim-Subscription-Key": self.api_key}
        if extra_headers:
            headers.update(extra_headers)

        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else {}

    def _start_analysis(self, file_path: str) -> str:
        url = (
            f"{self.endpoint}/documentintelligence/documentModels/"
            f"{self.model_id}:analyze?api-version={self.api_version}"
        )
        with open(file_path, "rb") as source_file:
            body = source_file.read()

        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "Ocp-Apim-Subscription-Key": self.api_key,
                "Content-Type": "application/octet-stream",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            operation_location = response.headers.get("operation-location")
            if not operation_location:
                raise RuntimeError("Azure analysis did not return an operation-location")
            return operation_location

    def _poll_analysis(self, operation_location: str) -> Dict[str, Any]:
        deadline = time.time() + 60
        while time.time() < deadline:
            result = self._request_json(operation_location)
            status = (result.get("status") or "").lower()
            if status == "succeeded":
                return result.get("analyzeResult", {})
            if status == "failed":
                raise RuntimeError("Azure analysis failed")
            time.sleep(2)
        raise RuntimeError("Azure analysis timed out")

    def _field_content(self, field: Dict[str, Any]) -> Any:
        if not isinstance(field, dict):
            return None
        for key in ("valueString", "valueDate", "valueNumber", "valueInteger", "valuePhoneNumber", "valueCurrency", "content"):
            value = field.get(key)
            if value is None:
                continue
            if key == "valueCurrency" and isinstance(value, dict):
                return value.get("amount")
            return value
        return None

    def _field_confidence(self, field: Dict[str, Any], default: float = 0.0) -> float:
        if not isinstance(field, dict):
            return default
        confidence = _safe_float(field.get("confidence"))
        return confidence if confidence is not None else default

    def extract(self, file_path: str) -> Dict[str, Any]:
        operation_location = self._start_analysis(file_path)
        analyze_result = self._poll_analysis(operation_location)
        documents = analyze_result.get("documents") or []
        if not documents:
            raise RuntimeError("Azure did not return any invoice documents")

        document = documents[0]
        fields = document.get("fields") or {}
        line_items: List[Dict[str, Any]] = []
        items_field = fields.get("Items") or {}
        for array_item in items_field.get("valueArray", []):
            item_fields = (array_item.get("valueObject") or {})
            quantity = self._field_content(item_fields.get("Quantity"))
            unit_price = self._field_content(item_fields.get("UnitPrice"))
            amount = self._field_content(item_fields.get("Amount"))
            tax = self._field_content(item_fields.get("Tax"))
            description = self._field_content(item_fields.get("Description")) or "Invoice item"
            line_items.append({
                "description": description,
                "quantity": _safe_float(quantity) or 1.0,
                "unit_price": _safe_float(unit_price),
                "tax_amount": _safe_float(tax) or 0.0,
                "total": _safe_float(amount) or 0.0,
            })

        content = analyze_result.get("content") or ""
        field_confidence = {
            "invoice_number": self._field_confidence(fields.get("InvoiceId"), 0.0),
            "issue_date": self._field_confidence(fields.get("InvoiceDate"), 0.0),
            "due_date": self._field_confidence(fields.get("DueDate"), 0.0),
            "subtotal": self._field_confidence(fields.get("SubTotal"), 0.0),
            "tax": self._field_confidence(fields.get("TotalTax"), 0.0),
            "total": self._field_confidence(fields.get("InvoiceTotal"), 0.0),
            "supplier_name": self._field_confidence(fields.get("VendorName"), 0.0),
            "customer_name": self._field_confidence(fields.get("CustomerName"), 0.0),
            "items": self._field_confidence(items_field, 0.0),
        }

        non_zero_confidence = [value for value in field_confidence.values() if value > 0]
        overall_confidence = sum(non_zero_confidence) / len(non_zero_confidence) if non_zero_confidence else 0.0

        result = {
            "invoice_number": self._field_content(fields.get("InvoiceId")),
            "issue_date": self._field_content(fields.get("InvoiceDate")),
            "due_date": self._field_content(fields.get("DueDate")),
            "amounts": {
                "subtotal": self._field_content(fields.get("SubTotal")),
                "tax": self._field_content(fields.get("TotalTax")),
                "total": self._field_content(fields.get("InvoiceTotal")),
            },
            "supplier": {
                "name": self._field_content(fields.get("VendorName")),
                "tax_id": self._field_content(fields.get("VendorTaxId")),
                "address": self._field_content(fields.get("VendorAddress")),
                "phone": self._field_content(fields.get("VendorPhoneNumber")),
                "email": self._field_content(fields.get("VendorEmail")),
            },
            "customer": {
                "name": self._field_content(fields.get("CustomerName")),
                "tax_id": self._field_content(fields.get("CustomerTaxId")),
                "address": self._field_content(fields.get("CustomerAddress")),
            },
            "items": line_items,
            "raw_text": content,
            "ocr_confidence": overall_confidence,
            "overall_confidence": overall_confidence,
            "field_confidence": field_confidence,
        }
        return _normalize_result(result, self.provider_name, self.model_version)


class HybridDocumentProvider(DocumentExtractionProvider):
    provider_name = "hybrid_document_ai"
    model_version = "hybrid-v1"

    def __init__(self) -> None:
        self.local_provider = LocalOCRProvider()
        self.azure_provider: Optional[AzureDocumentIntelligenceProvider]
        try:
            self.azure_provider = AzureDocumentIntelligenceProvider()
        except RuntimeError:
            self.azure_provider = None

    def extract(self, file_path: str) -> Dict[str, Any]:
        if self.azure_provider:
            try:
                azure_result = self.azure_provider.extract(file_path)
                if (
                    azure_result.get("overall_confidence", 0.0) >= 0.72
                    or (azure_result.get("invoice_number") and azure_result.get("amounts", {}).get("total"))
                ):
                    return azure_result
            except (RuntimeError, urllib.error.URLError, json.JSONDecodeError):
                pass

        return self.local_provider.extract(file_path)


class DocumentExtractionService:
    def __init__(self) -> None:
        provider_mode = os.getenv("DOCUMENT_AI_PROVIDER", "hybrid").strip().lower()
        if provider_mode == "azure":
            self.provider: DocumentExtractionProvider = AzureDocumentIntelligenceProvider()
        elif provider_mode == "local":
            self.provider = LocalOCRProvider()
        else:
            self.provider = HybridDocumentProvider()

    def extract_document(self, file_path: str) -> Dict[str, Any]:
        return self.provider.extract(file_path)


_document_extraction_service: Optional[DocumentExtractionService] = None


def get_document_extraction_service() -> DocumentExtractionService:
    global _document_extraction_service
    if _document_extraction_service is None:
        _document_extraction_service = DocumentExtractionService()
    return _document_extraction_service
