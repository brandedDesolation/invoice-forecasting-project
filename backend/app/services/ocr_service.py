"""
OCR Service for Invoice Data Extraction
Supports multiple OCR backends: pytesseract (primary), easyocr (fallback)
"""

import re
import os
from datetime import datetime
from dateutil import parser as date_parser
from typing import Dict, List, Optional, Tuple
from PIL import Image

# Try to import OCR libraries
TESSERACT_AVAILABLE = False
EASYOCR_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    print("✅ pytesseract is available")
except ImportError:
    print("⚠️ pytesseract not available")

try:
    import easyocr
    import numpy as np
    EASYOCR_AVAILABLE = True
    print("✅ easyocr is available")
except ImportError:
    print("⚠️ easyocr not available")

# Try to import cv2 for image preprocessing
CV2_AVAILABLE = False
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    print("⚠️ cv2 not available, using PIL for image processing")


class InvoiceOCRService:
    """Service for extracting invoice data using OCR"""
    
    def __init__(self, languages: List[str] = ['eng', 'tur']):
        """
        Initialize OCR service
        
        Args:
            languages: List of languages to support
        """
        self.backend = None
        self.reader = None
        
        # Try pytesseract first (more compatible)
        if TESSERACT_AVAILABLE:
            try:
                # Test if tesseract is actually installed
                pytesseract.get_tesseract_version()
                self.backend = "tesseract"
                self.languages = '+'.join(languages)
                print(f"✅ Using Tesseract OCR with languages: {self.languages}")
            except Exception as e:
                print(f"⚠️ Tesseract not properly installed: {e}")
        
        # Fallback to EasyOCR
        if self.backend is None and EASYOCR_AVAILABLE:
            try:
                # Convert language codes for easyocr
                easyocr_langs = []
                for lang in languages:
                    if lang in ['eng', 'en']:
                        easyocr_langs.append('en')
                    elif lang in ['tur', 'tr']:
                        easyocr_langs.append('tr')
                    else:
                        easyocr_langs.append(lang)
                
                print("Initializing EasyOCR reader...")
                self.reader = easyocr.Reader(easyocr_langs, gpu=False)
                self.backend = "easyocr"
                print(f"✅ Using EasyOCR with languages: {easyocr_langs}")
            except Exception as e:
                print(f"⚠️ EasyOCR initialization failed: {e}")
        
        if self.backend is None:
            print("❌ No OCR backend available!")
            raise RuntimeError("No OCR backend available. Please install pytesseract or easyocr.")
    
    def preprocess_image(self, image_path: str):
        """
        Preprocess image for better OCR results
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Preprocessed image (PIL Image or numpy array depending on backend)
        """
        if CV2_AVAILABLE:
            # Use OpenCV for preprocessing
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
        else:
            # Use PIL for basic preprocessing
            img = Image.open(image_path)
            # Convert to grayscale
            img = img.convert('L')
            return img
    
    def extract_text(self, image_path: str) -> Tuple[str, float, List[str]]:
        """
        Extract text from invoice image
        
        Args:
            image_path: Path to the invoice image
            
        Returns:
            Tuple of (full_text, average_confidence, lines)
        """
        processed_img = self.preprocess_image(image_path)
        
        if self.backend == "tesseract":
            return self._extract_with_tesseract(processed_img)
        elif self.backend == "easyocr":
            return self._extract_with_easyocr(processed_img)
        else:
            raise RuntimeError("No OCR backend available")
    
    def _extract_with_tesseract(self, image) -> Tuple[str, float, List[str]]:
        """Extract text using Tesseract OCR"""
        # Convert numpy array to PIL Image if needed
        if CV2_AVAILABLE and not isinstance(image, Image.Image):
            image = Image.fromarray(image)
        
        # Get detailed OCR data
        try:
            data = pytesseract.image_to_data(image, lang=self.languages, output_type=pytesseract.Output.DICT)
            
            lines = []
            confidences = []
            full_text = ""
            
            for i, text in enumerate(data['text']):
                conf = int(data['conf'][i])
                if conf > 30 and text.strip():  # Filter low confidence
                    lines.append(text)
                    confidences.append(conf / 100.0)
                    full_text += text + " "
            
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            return full_text.strip(), avg_confidence, lines
            
        except Exception as e:
            print(f"Tesseract detailed extraction failed: {e}")
            # Fallback to simple extraction
            full_text = pytesseract.image_to_string(image, lang=self.languages)
            lines = [line for line in full_text.split('\n') if line.strip()]
            return full_text, 0.7, lines  # Assume 70% confidence for simple extraction
    
    def _extract_with_easyocr(self, image) -> Tuple[str, float, List[str]]:
        """Extract text using EasyOCR"""
        import numpy as np
        
        # Perform OCR
        results = self.reader.readtext(image)
        
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
            # Turkish e-invoice format (ETTN/UUID style)
            r'ETTN[:\s]*([a-f0-9\-]{36})',
            # Standard invoice number patterns
            r'Fatura\s*No[:\s]*([A-Z0-9]{3,}[\-]?[A-Z0-9]+)',
            r'Invoice\s*No[:\s]*([A-Z0-9]{3,}[\-]?[A-Z0-9]+)',
            r'Invoice\s*Number[:\s]*([A-Z0-9]{3,}[\-]?[A-Z0-9]+)',
            # Common Turkish invoice number formats
            r'([A-Z]{2,4}\d{10,})',  # Pattern like EMR2025000000035, 48Q2025000000267
            r'(\d{2}[A-Z]\d{10,})',  # Pattern like 48Q2025000000267
            # Generic alphanumeric invoice numbers (at least 8 chars)
            r'(?:No|Number|Numara)[:\s]*([A-Z0-9\-]{8,})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                result = match.group(1).strip()
                # Filter out false positives
                if result.upper() in ['FATURA', 'INVOICE', 'NO', 'NUMBER']:
                    continue
                if len(result) >= 4:  # Invoice numbers are usually at least 4 chars
                    return result
        
        return None
    
    def extract_date(self, text: str, date_type: str = "issue") -> Optional[datetime]:
        """Extract date from text"""
        patterns = {
            "issue": [
                r'Fatura\s*Tarihi[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Invoice\s*Date[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Düzenleme\s*Tarihi[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Date[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            ],
            "due": [
                r'Son\s*Ödeme\s*Tarihi[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Due\s*Date[:\s\[\(]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Vade[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
            ]
        }
        
        for pattern in patterns.get(date_type, []):
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                try:
                    return date_parser.parse(date_str, dayfirst=True)
                except:
                    for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%y', '%d/%m/%y']:
                        try:
                            return datetime.strptime(date_str, fmt)
                        except:
                            continue
        
        return None
    
    def parse_turkish_number(self, amount_str: str) -> Optional[float]:
        """
        Parse Turkish number format properly
        Turkish: 1.234,56 (dot = thousands, comma = decimal)
        English: 1,234.56 (comma = thousands, dot = decimal)
        """
        if not amount_str:
            return None
        
        amount_str = amount_str.strip()
        
        # Remove any currency symbols and spaces
        amount_str = re.sub(r'[₺TL\s]', '', amount_str)
        
        if not amount_str:
            return None
        
        try:
            # Case 1: Has both dot and comma - determine format
            if '.' in amount_str and ',' in amount_str:
                # Find which comes last - that's the decimal separator
                last_dot = amount_str.rfind('.')
                last_comma = amount_str.rfind(',')
                
                if last_comma > last_dot:
                    # Turkish format: 1.234,56
                    amount_str = amount_str.replace('.', '').replace(',', '.')
                else:
                    # English format: 1,234.56
                    amount_str = amount_str.replace(',', '')
            
            # Case 2: Only comma - likely Turkish decimal
            elif ',' in amount_str:
                parts = amount_str.split(',')
                if len(parts) == 2 and len(parts[1]) <= 2:
                    # 944,00 -> 944.00
                    amount_str = amount_str.replace(',', '.')
                else:
                    # 1,234 could be thousands separator
                    amount_str = amount_str.replace(',', '')
            
            # Case 3: Only dot - check if decimal or thousands
            elif '.' in amount_str:
                parts = amount_str.split('.')
                if len(parts) == 2 and len(parts[1]) <= 2:
                    # 944.00 -> decimal
                    pass  # keep as is
                else:
                    # 1.234 -> thousands separator in Turkish
                    amount_str = amount_str.replace('.', '')
            
            return float(amount_str)
        except (ValueError, TypeError):
            return None
    
    def extract_amounts(self, text: str) -> Dict[str, float]:
        """Extract monetary amounts from text - optimized for Turkish invoices"""
        amounts = {
            "subtotal": 0.0,
            "tax": 0.0,
            "total": 0.0
        }
        
        # More specific patterns for Turkish invoices
        # Pattern captures the amount that appears NEAR the keyword (before or after)
        patterns = {
            "total": [
                # Amount BEFORE keyword (common in tables)
                r'([\d.,]+)\s*[₺TL]*\s*(?:TOPLAM|Toplam|ÖDENECEK|Ödenecek)',
                # Amount AFTER keyword
                r'(?:GENEL\s*)?TOPLAM\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'ÖDENECEK\s*TUTAR\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Ödenecek\s*Tutar\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Vergiler\s*Dahil\s*Toplam\s*Tutar\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'NET\s*TOPLAM\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                # English fallbacks
                r'Grand\s*Total\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
                r'Total\s+Amount\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            ],
            "subtotal": [
                # Amount with TL/₺ suffix (common pattern)
                r'([\d.,]+)\s*(?:TL|TY|₺)\s*(?:Mal\s*Hizmet|KDV\s*Matrah)',
                r'Mal\s*Hizmet\s*Toplam\s*Tutarı?\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'KDV\s*Matrahı\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Matrah\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Ara\s*Toplam\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Subtotal\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            ],
            "tax": [
                r'KDV\s*Tutarı?\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Hesaplanan\s*KDV\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Vergi\s*[:\s|]*[₺TL\s]*([\d.,]+)',
                r'Tax\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
                r'VAT\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            ]
        }
        
        for amount_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    amount_str = match.group(1).strip()
                    parsed = self.parse_turkish_number(amount_str)
                    if parsed is not None and parsed > 0:
                        amounts[amount_type] = parsed
                        break
        
        # If we have subtotal and tax but no total, calculate it
        if amounts["total"] == 0.0 and amounts["subtotal"] > 0:
            amounts["total"] = amounts["subtotal"] + amounts["tax"]
        
        # Try to find the last TL amount in the text as a fallback for total
        # This is common at the end of invoices
        if amounts["total"] == 0.0:
            # Find all amounts with TL suffix at the end of text
            tl_amounts = re.findall(r'([\d.,]+)\s*(?:TL|TY|₺)', text, re.IGNORECASE)
            if tl_amounts:
                # Try the LAST TL amount (usually the total at bottom of invoice)
                for amount_str in reversed(tl_amounts):
                    parsed = self.parse_turkish_number(amount_str)
                    if parsed is not None and parsed > 50:  # Reasonable minimum
                        amounts["total"] = parsed
                        break
        
        return amounts
    
    def extract_supplier_info(self, text: str, lines: List[str]) -> Dict[str, Optional[str]]:
        """
        Extract supplier information.
        
        In Turkish invoices:
        - Supplier info is at the TOP of the invoice (before "SAYIN")
        - Supplier's VKN/TCKN appears before the "SAYIN" section
        """
        supplier = {
            "name": None,
            "tax_id": None,
            "address": None,
            "phone": None,
            "email": None
        }
        
        # Split text at "SAYIN" - supplier info is BEFORE it
        sayin_match = re.search(r'SAYIN', text, re.IGNORECASE)
        supplier_section = text[:sayin_match.start()] if sayin_match else text[:len(text)//2]
        
        # Extract supplier tax ID (VKN/TCKN) from supplier section only
        vkn_patterns = [
            r'(?:VKN|TCKN)[:\s]*(\d{10,11})',
            r'Vergi\s*(?:Kimlik\s*)?(?:No|Numarası)[:\s]*(\d{10,11})',
        ]
        for pattern in vkn_patterns:
            match = re.search(pattern, supplier_section, re.IGNORECASE)
            if match:
                supplier["tax_id"] = match.group(1)
                break
        
        # Extract phone from supplier section
        phone_match = re.search(r'Tel[:\s]*(\+?[\d\s\-\(\)]{10,})', supplier_section, re.IGNORECASE)
        if phone_match:
            supplier["phone"] = re.sub(r'[\s\-\(\)]', '', phone_match.group(1))
        
        # Extract email from supplier section
        email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', supplier_section)
        if email_match:
            supplier["email"] = email_match.group(1)
        
        # Extract supplier name - company at the TOP (before SAYIN)
        # Look for company names with Turkish business suffixes
        company_patterns = [
            # Full company name with suffix
            r'([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜa-zçğıiöşü\s]+(?:ANONİM\s*ŞİRKETİ|A\.?Ş\.?|LTD\.?\s*ŞTİ\.?|LİMİTED|TİCARET))',
            # Well-known companies
            r'(TTNET|TURKCELL|VODAFONE|TÜRK\s*TELEKOM)',
            # Name followed by address indicators
            r'^([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜa-zçğıiöşü\s]{5,50})(?=\s+(?:MAH|CAD|SOK|ADRES))',
        ]
        
        for pattern in company_patterns:
            match = re.search(pattern, supplier_section, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                name = re.sub(r'\s+', ' ', name)
                # Remove address parts from name (Turkish address keywords)
                name = re.sub(r'\s+(MAH|MAHALLE|MAHALLESİ|CAD|CADDE|CADDESİ|SOK|SOKAK|SOKAGI|NO:|ADRES|CUMHURİYET|ATATÜRK|İSTİKLAL|BAĞDAT).*$', '', name, flags=re.IGNORECASE)
                name = re.sub(r'\s+(MECİDİYEKÖY|ŞİŞLİ|KADIKÖY|ÜSKÜDAR|BEYOĞLU|BEŞİKTAŞ|FATİH|ISTANBUL|İSTANBUL|ANKARA|İZMİR|BURSA|ANTALYA).*$', '', name, flags=re.IGNORECASE)
                # Remove leading noise
                name = re.sub(r'^[a-z\s]+', '', name)  # Remove lowercase prefix
                name = name.strip()
                # Filter out common false positives
                if len(name) > 3 and name.upper() not in ['E-FATURA', 'FATURA', 'SAYIN', 'TEL', 'FAX']:
                    supplier["name"] = name
                    break
        
        return supplier
    
    def extract_customer_info(self, text: str) -> Dict[str, Optional[str]]:
        """
        Extract customer information.
        
        In Turkish invoices:
        - "SAYIN" (Dear/Mr./Ms.) indicates the CUSTOMER name follows
        - Customer's VKN appears AFTER the "SAYIN" section
        """
        customer = {
            "name": None,
            "tax_id": None,
            "address": None
        }
        
        # Find the "SAYIN" section - customer name comes AFTER it
        # Pattern: SAYIN followed by company/person name
        customer_patterns = [
            # SAYIN followed by company name (with suffix)
            r'SAYIN\s+([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜa-zçğıiöşü\s]+(?:ANONİM\s*ŞİRKETİ|A\.?Ş\.?|LTD\.?\s*ŞTİ\.?|LİMİTED|TİCARET))',
            # SAYIN followed by name until next section
            r'SAYIN\s+([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜa-zçğıiöşü\s]{5,60})(?=\s+(?:VKN|TCKN|Vergi|MAH|CAD|SOK|ADRES|Web|Tel|E-?Posta))',
            # SAYIN followed by any caps name
            r'SAYIN\s+([A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]{5,60}?)(?=\s+[A-ZÇĞIİÖŞÜ]{2,}\s+(?:MAH|CAD|SOK))',
            # Simpler: SAYIN followed by text until common delimiters
            r'SAYIN\s+([A-ZÇĞIİÖŞÜa-zçğıiöşü\s]{5,80}?)(?=\s+(?:No:|VKN|TCKN|Vergi|Adres|Tel|Fax|Web|\d{5,}))',
            # English patterns
            r'(?:Bill\s*To|Customer)[:\s]+([A-Za-z\s]{5,60})(?=\s+(?:Address|Phone|Email|$))',
        ]
        
        for pattern in customer_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                name = match.group(1).strip()
                name = re.sub(r'\s+', ' ', name)
                # Clean up - remove trailing address/metadata
                name = re.sub(r'\s+(MAH|MAHALLE|MAHALLESİ|CAD|CADDE|CADDESİ|SOK|SOKAK|NO:|ADRES|VE|VKN|TCKN|Vergi).*$', '', name, flags=re.IGNORECASE)
                name = re.sub(r'\s+(MECİDİYEKÖY|ŞİŞLİ|KADIKÖY|ÜSKÜDAR|BEYOĞLU|BEŞİKTAŞ|FATİH|ISTANBUL|İSTANBUL|ANKARA|İZMİR).*$', '', name, flags=re.IGNORECASE)
                name = name.strip()
                if len(name) > 3 and name.upper() not in ['E-FATURA', 'FATURA', 'SAYIN']:
                    customer["name"] = name
                    break
        
        # Extract customer tax ID - look in section AFTER "SAYIN"
        sayin_match = re.search(r'SAYIN', text, re.IGNORECASE)
        customer_section = text[sayin_match.end():] if sayin_match else text[len(text)//2:]
        
        # Find VKN in customer section (not the supplier's VKN)
        tax_patterns = [
            r'VKN[:\s]*(\d{10,11})',
            r'TCKN[:\s]*(\d{10,11})',
            r'Vergi\s*(?:Kimlik\s*)?(?:No|Numarası)[:\s]*(\d{10,11})',
        ]
        for pattern in tax_patterns:
            match = re.search(pattern, customer_section, re.IGNORECASE)
            if match:
                customer["tax_id"] = match.group(1)
                break
        
        return customer
    
    def extract_invoice_items(self, text: str, lines: List[str]) -> List[Dict]:
        """Extract line items from invoice"""
        # Simplified - returns empty list for now
        return []
    
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
            "word_count": len(full_text.split()),
            "ocr_backend": self.backend
        }


# Global instance (will be initialized on first use)
_ocr_service_instance = None


def get_ocr_service() -> InvoiceOCRService:
    """Get or create OCR service instance"""
    global _ocr_service_instance
    if _ocr_service_instance is None:
        _ocr_service_instance = InvoiceOCRService()
    return _ocr_service_instance
