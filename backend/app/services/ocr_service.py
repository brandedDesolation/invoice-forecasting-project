"""
OCR Service for Invoice Data Extraction using EasyOCR
"""

import easyocr
import re
import os
from datetime import datetime
from dateutil import parser as date_parser
from typing import Dict, List, Optional, Tuple
import numpy as np
from PIL import Image
import cv2


class InvoiceOCRService:
    """Service for extracting invoice data using EasyOCR"""
    
    def __init__(self, languages: List[str] = ['en', 'tr']):
        """
        Initialize EasyOCR reader
        
        Args:
            languages: List of languages to support (default: English and Turkish)
        """
        print("Initializing EasyOCR reader...")
        self.reader = easyocr.Reader(languages, gpu=False)
        print("EasyOCR reader initialized successfully!")
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for better OCR results
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Preprocessed image as numpy array
        """
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # Apply thresholding
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh
    
    def extract_text(self, image_path: str) -> Tuple[str, float, List[str]]:
        """
        Extract text from invoice image
        
        Args:
            image_path: Path to the invoice image
            
        Returns:
            Tuple of (full_text, average_confidence, lines)
        """
        # Preprocess image
        processed_img = self.preprocess_image(image_path)
        
        # Perform OCR
        results = self.reader.readtext(processed_img)
        
        # Extract text and confidence scores
        lines = []
        confidences = []
        full_text = ""
        
        for (bbox, text, confidence) in results:
            if confidence > 0.3:  # Filter low confidence results
                lines.append(text)
                confidences.append(confidence)
                full_text += text + " "
        
        avg_confidence = np.mean(confidences) if confidences else 0.0
        
        return full_text.strip(), avg_confidence, lines
    
    def extract_invoice_number(self, text: str, lines: List[str]) -> Optional[str]:
        """Extract invoice number from text"""
        patterns = [
            r'Fatura\s*No[:\s]*([A-Z0-9\-]+)',
            r'Invoice\s*No[:\s]*([A-Z0-9\-]+)',
            r'No[:\s]*([A-Z0-9\-]+)',
            r'Invoice\s*Number[:\s]*([A-Z0-9\-]+)',
            r'([A-Z]{2,4}\d{10,})',  # Pattern like EMR2025000000035
            r'(\d{4,}[A-Z]?\d{4,})',  # Numeric patterns
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def extract_date(self, text: str, date_type: str = "issue") -> Optional[datetime]:
        """Extract date from text"""
        patterns = {
            "issue": [
                r'Fatura\s*Tarihi[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Invoice\s*Date[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Düzenleme\s*Tarihi[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            ],
            "due": [
                r'Son\s*Ödeme\s*Tarihi[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Due\s*Date[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            ]
        }
        
        for pattern in patterns.get(date_type, []):
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                try:
                    # Try parsing with dateutil
                    return date_parser.parse(date_str, dayfirst=True)
                except:
                    try:
                        # Try common formats
                        for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%y', '%d/%m/%y']:
                            try:
                                return datetime.strptime(date_str, fmt)
                            except:
                                continue
                    except:
                        pass
        
        return None
    
    def extract_amounts(self, text: str) -> Dict[str, float]:
        """Extract monetary amounts from text"""
        amounts = {
            "subtotal": 0.0,
            "tax": 0.0,
            "total": 0.0
        }
        
        # Patterns for Turkish invoices
        # KDV = tax, Mal Hizmet Toplamı = subtotal, Ödenecek Tutar = total
        patterns = {
            "subtotal": [
                r'Mal\s+Hizmet\s+Toplam\s+Tutarı[:\s]*([\d.,]+)',  # Mal Hizmet Toplam Tutarı = subtotal
                r'Mal\s+Hizmet\s+Toplam[:\s]*([\d.,]+)',
                r'KDV\s*Matrahı[:\s]*([\d.,]+)',  # KDV Matrahı = subtotal (tax base)
                r'Matrah[:\s]*([\d.,]+)',
                r'Toplam\s*Tutar[:\s]*([\d.,]+)',
                r'Subtotal[:\s]*([\d.,]+)',
            ],
            "tax": [
                r'Hesaplanan\s*Katma\s+De[ğg]er[:\s]*([\d.,]+)',  # Hesaplanan Katma Değer/Deger = tax (summary)
                r'Hesaplanan\s*KDV[:\s]*\(?%?[\d.,]+\)?[:\s]*([\d.,]+)',  # Hesaplanan KDV = tax (summary)
                # Look for KDV Tutarı in summary section (after "Toplam" or before "Vergiler Dahil")
                r'(?:Toplam|Mal\s+Hizmet\s+Toplam).*?KDV\s*Tutar[ıi]?[:\s]*([\d.,]+)',
                r'KDV\s*Tutar[ıi]?[:\s]*([\d.,]+)(?=.*?(?:Vergiler\s+Dahil|Ödenecek|Toplam\s+Tutar))',  # KDV before summary totals
                r'KDV\s*Tutar[ıi]?[:\s]*([\d.,]+)',  # KDV Tutarı = tax (fallback)
                r'KDV\s*%?\d+[:\s]*\(?Matrah[:\s]*[\d.,]+\s*([\d.,]+)',  # KDV amount after matrah
                r'DEVLETE\s*ÖDENEN\s*VERGİLER\s*TOPLAMI[:\s]*([\d.,]+)',  # Total taxes paid
                r'Tax[:\s]*([\d.,]+)',
            ],
            "total": [
                r'Ödenecek\s*Tutar[:\s]*([\d.,]+)',  # Ödenecek Tutar = total amount
                r'ÖDENECEK\s*TOPLAM[:\s]*([\d.,]+)',  # ÖDENECEK TOPLAM = total
                r'Vergiler\s*Dahil\s*Toplam\s*Tutar[:\s]*([\d.,]+)',  # Total including taxes
                r'Total[:\s]*([\d.,]+)',
            ]
        }
        
        for amount_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    amount_str = match.group(1).strip()
                    # Handle Turkish number format: 726.16 (dot = decimal) or 726,16 (comma = decimal)
                    # If contains comma, it's Turkish format (comma = decimal)
                    # If contains dot but no comma, check if it's thousands separator or decimal
                    if ',' in amount_str:
                        # Turkish format: comma is decimal separator
                        amount_str = amount_str.replace('.', '').replace(',', '.')
                    elif '.' in amount_str:
                        # Could be either format - check if it looks like decimal (2 digits after dot)
                        parts = amount_str.split('.')
                        if len(parts) == 2 and len(parts[1]) <= 2:
                            # Likely decimal separator
                            amount_str = amount_str.replace(',', '')
                        else:
                            # Likely thousands separator
                            amount_str = amount_str.replace('.', '').replace(',', '.')
                    try:
                        amounts[amount_type] = float(amount_str)
                        break
                    except:
                        pass
        
        # If total is 0, try to find the largest number that looks like a total
        if amounts["total"] == 0.0:
            total_pattern = r'([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)'
            matches = re.findall(total_pattern, text)
            if matches:
                try:
                    # Get the last large number (likely the total)
                    for match in reversed(matches):
                        amount_str = match.replace('.', '').replace(',', '.')
                        amount = float(amount_str)
                        if amount > 100:  # Reasonable minimum for invoice total
                            amounts["total"] = amount
                            break
                except:
                    pass
        
        return amounts
    
    def extract_supplier_info(self, text: str, lines: List[str]) -> Dict[str, Optional[str]]:
        """Extract supplier information"""
        supplier = {
            "name": None,
            "tax_id": None,
            "address": None,
            "phone": None,
            "email": None
        }
        
        # Extract tax ID (VKN/TCKN)
        vkn_patterns = [
            r'VKN[:\s]*(\d+)',
            r'TCKN[:\s]*(\d+)',
            r'Tax\s*ID[:\s]*(\d+)',
        ]
        for pattern in vkn_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                supplier["tax_id"] = match.group(1)
                break
        
        # Extract phone
        phone_patterns = [
            r'Tel[:\s]*(\d{10,})',
            r'Phone[:\s]*(\d{10,})',
        ]
        for pattern in phone_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                supplier["phone"] = match.group(1)
                break
        
        # Extract email
        email_pattern = r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
        match = re.search(email_pattern, text)
        if match:
            supplier["email"] = match.group(1)
        
        # Extract supplier name (usually appears early in the document)
        # Look for company-like names (containing LTD, A.Ş., etc.)
        company_patterns = [
            r'(TTNET\s+ANONIM\s+SIRKETI|TURKCELL\s+[A-ZÇĞIİÖŞÜ\s]+|VODAFONE\s+[A-ZÇĞIİÖŞÜ\s]+|TURK\s+TELEKOM)',
            r'([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]{2,}?(?:LTD|A\.Ş\.|ŞTİ|INC|LLC|ANONIM\s+SIRKETI))',
        ]
        for pattern in company_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                # Clean up - remove common prefixes
                name = re.sub(r'^(Fatura\s+Tipi\s+SATIS\s+)', '', name, flags=re.IGNORECASE)
                name = re.sub(r'\s+', ' ', name)  # Multiple spaces to single
                if len(name) > 3:
                    supplier["name"] = name
                    break
        
        return supplier
    
    def extract_customer_info(self, text: str) -> Dict[str, Optional[str]]:
        """Extract customer information"""
        customer = {
            "name": None,
            "tax_id": None,
            "address": None
        }
        
        # Extract customer name - usually after "SAYIN" in Turkish invoices
        # Look for text between SAYIN and next address/metadata keyword
        customer_patterns = [
            r'SAYIN\s+([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]+?)(?=\s+(?:TİCARET|LİMİTED|SİRKETİ|SON\s+ÖDEME))',
            r'SAYIN\s+([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]{10,}?)(?=\s+(?:SON\s+ÖDEME|LİMİTED))',
            r'SAYIN\s+([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]+?)(?=\s+SON\s+ÖDEME)',
            # Fallback: capture everything between SAYIN and next all-caps word followed by date pattern
            r'SAYIN\s+([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]+?)(?=\s+[A-ZÇĞIİÖŞÜ]+\s+\d{1,2}/\d{1,2}/\d{4})',
            # Allow noisy text between SAYIN and the actual name (e.g., OCR artifacts)
            r'SAYIN\s+(?:.{0,40}?)([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]+?)(?=\s+(?:MAH|CAD|SOK|SK|FATURA|ÖZEL|SENARYO|VERGİ|SON|Plaka|Adres|$))',
        ]
        for pattern in customer_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                name = match.group(1).strip()
                # Clean up the name
                name = re.sub(r'\s+', ' ', name)  # Multiple spaces to single
                if len(name) > 5:  # Only accept names longer than 5 characters
                    customer["name"] = name
                    break
        
        # Extract customer tax ID - usually near customer name/address
        # Look for tax number after customer address section
        tax_patterns = [
            r'(?:MECİDİYEKÖY|VERGİ\s+DAİRESİ|Vergi\s+Dairesi)[\s\w:]*Vergi\s*No[:\s]*(\d{10,11})',
            r'Vergi\s*No[:\s]*(\d{10,11})',
            r'Vergi\s*Numarası[:\s]*(\d{10,11})',
            r'VKN[:\s]*(\d{10,11})',
        ]
        for pattern in tax_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                customer["tax_id"] = match.group(1)
                break
        
        # Extract customer address - usually after customer name
        address_patterns = [
            r'(?:Mah|Mahallesi|Sokak|Sk|Cadde|Caddesi|No|Plaza)[\s\w,.-]+(?:İSTANBUL|ANKARA|İZMİR|BURSA|ANTALYA)',
        ]
        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                customer["address"] = match.group(0).strip()
                break
        
        return customer
    
    def extract_invoice_items(self, text: str, lines: List[str]) -> List[Dict]:
        """Extract line items from invoice"""
        items = []
        
        # This is a simplified extraction - can be enhanced with table detection
        # For now, return empty list as items extraction requires more sophisticated parsing
        
        return items
    
    def process_invoice(self, image_path: str) -> Dict:
        """
        Process invoice image and extract all relevant data
        
        Args:
            image_path: Path to the invoice image
            
        Returns:
            Dictionary containing extracted invoice data
        """
        # Extract text
        full_text, confidence, lines = self.extract_text(image_path)
        
        # Extract structured data
        invoice_number = self.extract_invoice_number(full_text, lines)
        issue_date = self.extract_date(full_text, "issue")
        due_date = self.extract_date(full_text, "due")
        amounts = self.extract_amounts(full_text)
        supplier = self.extract_supplier_info(full_text, lines)
        customer = self.extract_customer_info(full_text)
        items = self.extract_invoice_items(full_text, lines)
        
        return {
            "invoice_number": invoice_number,
            "issue_date": issue_date.date() if issue_date else None,
            "due_date": due_date.date() if due_date else None,
            "amounts": amounts,
            "supplier": supplier,
            "customer": customer,
            "items": items,
            "raw_text": full_text,
            "ocr_confidence": float(confidence),
            "word_count": len(full_text.split())
        }


# Global instance (will be initialized on first use)
_ocr_service_instance = None


def get_ocr_service() -> InvoiceOCRService:
    """Get or create OCR service instance"""
    global _ocr_service_instance
    if _ocr_service_instance is None:
        _ocr_service_instance = InvoiceOCRService()
    return _ocr_service_instance

