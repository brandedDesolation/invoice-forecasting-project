"""
OCR Service for Invoice Data Extraction
Supports multiple OCR backends: pytesseract (primary), easyocr (fallback)
"""

import re
import os
from datetime import datetime
from dateutil import parser as date_parser
from typing import Dict, List, Optional, Tuple, Union
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

PDF_TEXT_AVAILABLE = False
PDF_RENDER_AVAILABLE = False
try:
    from pypdf import PdfReader
    PDF_TEXT_AVAILABLE = True
except ImportError:
    print("⚠️ pypdf not available, direct PDF text extraction disabled")

try:
    import pypdfium2 as pdfium
    PDF_RENDER_AVAILABLE = True
except ImportError:
    print("⚠️ pypdfium2 not available, PDF rendering disabled")


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
    
    def _preprocess_pil_image(self, image: Image.Image):
        """Preprocess an in-memory image for OCR"""
        if CV2_AVAILABLE:
            import numpy as np

            img_array = np.array(image.convert("RGB"))
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
            _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            return thresh

        return image.convert("L")

    def preprocess_image(self, image_source: Union[str, Image.Image]):
        """
        Preprocess image for better OCR results
        
        Args:
            image_source: Path to the image file or a PIL image
            
        Returns:
            Preprocessed image (PIL Image or numpy array depending on backend)
        """
        if isinstance(image_source, Image.Image):
            return self._preprocess_pil_image(image_source)

        image_path = image_source

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

    def _extract_text_from_pdf_text_layer(self, pdf_path: str) -> Tuple[str, float, List[str]]:
        """Extract embedded text from a digital PDF when available"""
        if not PDF_TEXT_AVAILABLE:
            return "", 0.0, []

        try:
            reader = PdfReader(pdf_path)
            page_texts: List[str] = []
            for page in reader.pages[:3]:
                text = page.extract_text() or ""
                if text.strip():
                    page_texts.append(text)

            full_text = "\n".join(page_texts).strip()
            lines = [line.strip() for line in full_text.splitlines() if line.strip()]
            if len(full_text) < 20:
                return "", 0.0, []

            return full_text, 0.95, lines
        except Exception as e:
            print(f"PDF text extraction failed: {e}")
            return "", 0.0, []

    def _render_pdf_pages(self, pdf_path: str, max_pages: int = 3) -> List[Image.Image]:
        """Render first pages of PDF to images for OCR"""
        if not PDF_RENDER_AVAILABLE:
            raise RuntimeError("PDF rendering is not available. Please install pypdfium2.")

        images: List[Image.Image] = []
        pdf = pdfium.PdfDocument(pdf_path)
        try:
            page_count = min(len(pdf), max_pages)
            for page_index in range(page_count):
                page = pdf[page_index]
                bitmap = page.render(scale=2.0)
                images.append(bitmap.to_pil())
                page.close()
        finally:
            pdf.close()

        return images

    def _extract_text_from_pdf_render(self, pdf_path: str) -> Tuple[str, float, List[str]]:
        """Fallback OCR path for scanned PDFs"""
        page_texts: List[str] = []
        page_lines: List[str] = []
        confidences: List[float] = []

        for rendered_page in self._render_pdf_pages(pdf_path):
            processed_img = self.preprocess_image(rendered_page)
            if self.backend == "tesseract":
                page_text, confidence, lines = self._extract_with_tesseract(processed_img)
            elif self.backend == "easyocr":
                page_text, confidence, lines = self._extract_with_easyocr(processed_img)
            else:
                raise RuntimeError("No OCR backend available")

            if page_text.strip():
                page_texts.append(page_text.strip())
                page_lines.extend(lines)
                confidences.append(confidence)

        full_text = "\n".join(page_texts).strip()
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        return full_text, avg_confidence, page_lines
    
    def extract_text(self, image_path: str) -> Tuple[str, float, List[str]]:
        """
        Extract text from invoice image
        
        Args:
            image_path: Path to the invoice image
            
        Returns:
            Tuple of (full_text, average_confidence, lines)
        """
        if image_path.lower().endswith(".pdf"):
            full_text, confidence, lines = self._extract_text_from_pdf_text_layer(image_path)
            if full_text:
                return full_text, confidence, lines
            return self._extract_text_from_pdf_render(image_path)

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
    
    def _extract_amount_from_patterns(
        self,
        text: str,
        lines: List[str],
        patterns: List[str],
        prefer_last: bool = True,
    ) -> Optional[float]:
        """Extract an amount by scanning lines first, then the whole text"""
        non_empty_lines = [" ".join(line.split()) for line in lines if line and line.strip()]

        search_scopes = [
            non_empty_lines[-20:],  # bottom summary table is usually near the end
            non_empty_lines,
        ]

        for scope in search_scopes:
            candidates: List[float] = []
            for line in scope:
                for pattern in patterns:
                    for match in re.finditer(pattern, line, re.IGNORECASE):
                        parsed = self.parse_turkish_number(match.group(1).strip())
                        if parsed is not None and parsed > 0:
                            candidates.append(parsed)

            if candidates:
                return candidates[-1] if prefer_last else candidates[0]

        text_candidates: List[float] = []
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                parsed = self.parse_turkish_number(match.group(1).strip())
                if parsed is not None and parsed > 0:
                    text_candidates.append(parsed)

        if text_candidates:
            return text_candidates[-1] if prefer_last else text_candidates[0]

        return None

    def extract_amounts(self, text: str, lines: List[str]) -> Dict[str, float]:
        """Extract monetary amounts with strong preference for invoice summary totals"""
        amounts = {
            "subtotal": 0.0,
            "tax": 0.0,
            "total": 0.0
        }

        total_patterns = [
            r'Ödenecek\s*Tutar\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'Vergiler\s*Dahil\s*Toplam\s*Tutar\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'(?:Genel|Net)\s*Toplam\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'Grand\s*Total\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            r'Total\s+Amount\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            r'([\d.,]+)\s*(?:TL|TY|₺)?\s*(?:Ödenecek\s*Tutar|Vergiler\s*Dahil\s*Toplam\s*Tutar|(?:Genel|Net)\s*Toplam)',
        ]
        subtotal_patterns = [
            r'Mal\s*Hizmet\s*Toplam\s*Tutarı?\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'KDV\s*Matrahı\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'Matrah\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'Ara\s*Toplam\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'Subtotal\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            r'([\d.,]+)\s*(?:TL|TY|₺)?\s*(?:Mal\s*Hizmet\s*Toplam\s*Tutarı?|KDV\s*Matrahı|Ara\s*Toplam)',
        ]
        tax_patterns = [
            r'Hesaplanan\s*KDV(?:\s*\(%?\d+[.,]?\d*\))?\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'KDV\s*Tutarı?\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'Vergi\s*[:\s|]*[₺TL\s]*([\d.,]+)',
            r'Tax\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            r'VAT\s*[:\s|]*[\$€₺TL\s]*([\d.,]+)',
            r'([\d.,]+)\s*(?:TL|TY|₺)?\s*(?:Hesaplanan\s*KDV|KDV\s*Tutarı?|Vergi|VAT)',
        ]

        total_value = self._extract_amount_from_patterns(text, lines, total_patterns)
        subtotal_value = self._extract_amount_from_patterns(text, lines, subtotal_patterns)
        tax_value = self._extract_amount_from_patterns(text, lines, tax_patterns)

        if total_value is not None:
            amounts["total"] = total_value
        if subtotal_value is not None:
            amounts["subtotal"] = subtotal_value
        if tax_value is not None:
            amounts["tax"] = tax_value

        # Keep totals internally consistent when OCR gets one field right and misses another.
        if amounts["total"] <= 0.0 and amounts["subtotal"] > 0.0:
            amounts["total"] = amounts["subtotal"] + amounts["tax"]

        if amounts["total"] > 0.0 and amounts["subtotal"] > 0.0 and amounts["tax"] > 0.0:
            expected_total = amounts["subtotal"] + amounts["tax"]
            if abs(amounts["total"] - expected_total) > 0.01:
                # Prefer explicit "Ödenecek Tutar", but if OCR grabbed a line item / subtotal as total,
                # snap back to the summary arithmetic.
                if amounts["total"] <= amounts["subtotal"]:
                    amounts["total"] = expected_total

        # Final fallback: the last monetary value near the end of the document is often the payable total.
        if amounts["total"] == 0.0:
            tail_text = "\n".join([" ".join(line.split()) for line in lines[-20:] if line.strip()])
            tl_amounts = re.findall(r'([\d.,]+)\s*(?:TL|TY|₺)', tail_text or text, re.IGNORECASE)
            if tl_amounts:
                for amount_str in reversed(tl_amounts):
                    parsed = self.parse_turkish_number(amount_str)
                    if parsed is not None and parsed > 50:
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
        """Extract invoice line items from table-like OCR output"""
        normalized_lines = [" ".join(line.split()) for line in lines if line and line.strip()]
        if not normalized_lines:
            return []

        start_idx = 0
        end_idx = len(normalized_lines)

        for index, line in enumerate(normalized_lines):
            if re.search(r'(mal\s*hizmet|açıklama|miktar|birim\s*fiyat|kdv\s*tutarı)', line, re.IGNORECASE):
                start_idx = index + 1
                break

        for index in range(start_idx, len(normalized_lines)):
            if re.search(r'(mal\s*hizmet\s*toplam|toplam\s*iskonto|kdv\s*matrah|ödenecek\s*tutar|vergiler\s*dahil)', normalized_lines[index], re.IGNORECASE):
                end_idx = index
                break

        table_lines = normalized_lines[start_idx:end_idx]
        items: List[Dict] = []
        description_buffer: List[str] = []

        quantity_pattern = r'(\d+(?:[.,]\d+)?)\s*(?:Adet|ADET|Kg|KG|Paket|Koli|Saat|Gün|Ay|Yıl|Mt|M2|M3|Lt|Litre|Piece|PCS|PC)\b'
        amount_token_pattern = r'(\d[\d.,]*)\s*(?:TL|TY|₺)?'
        percent_pattern = r'%\s*(\d+(?:[.,]\d+)?)'

        def flush_item(description_parts: List[str], numeric_line: str) -> Optional[Dict]:
            qty_match = re.search(quantity_pattern, numeric_line, re.IGNORECASE)
            if not qty_match:
                return None

            quantity = self.parse_turkish_number(qty_match.group(1)) or 1.0
            trailing_segment = numeric_line[qty_match.end():]
            amount_tokens = re.findall(amount_token_pattern, trailing_segment, re.IGNORECASE)
            parsed_amounts = [self.parse_turkish_number(token) for token in amount_tokens]
            parsed_amounts = [value for value in parsed_amounts if value is not None and value > 0]

            if not parsed_amounts:
                return None

            unit_price = parsed_amounts[0] if len(parsed_amounts) >= 1 else None
            tax_amount = parsed_amounts[-2] if len(parsed_amounts) >= 2 else 0.0
            total = parsed_amounts[-1]

            tax_rate_match = re.search(percent_pattern, trailing_segment)
            tax_rate = self.parse_turkish_number(tax_rate_match.group(1)) if tax_rate_match else 0.0

            description = " ".join(part.strip(" -") for part in description_parts if part.strip(" -")).strip()
            if not description:
                description = numeric_line[:qty_match.start()].strip(" -")
            if not description:
                return None

            return {
                "description": description,
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": 0.0,
                "tax_rate": tax_rate or 0.0,
                "tax_amount": tax_amount or 0.0,
                "total": total,
            }

        for line in table_lines:
            if re.fullmatch(r'\d+', line):
                continue
            if re.search(r'(sıra\s*no|mal\s*hizmet|açıklama|miktar|birim\s*fiyat|iskonto|diğer\s*vergiler)', line, re.IGNORECASE):
                continue

            qty_match = re.search(quantity_pattern, line, re.IGNORECASE)
            if qty_match:
                item = flush_item(description_buffer, line)
                if item:
                    items.append(item)
                description_buffer = []
                continue

            if re.search(r'[A-Za-zÇĞIİÖŞÜçğıiöşü]', line):
                description_buffer.append(line)

            if len(items) >= 20:
                break

        if not items:
            # Fallback for single-line rows where description and values are in the same OCR line.
            for line in table_lines:
                qty_match = re.search(quantity_pattern, line, re.IGNORECASE)
                if not qty_match:
                    continue
                item = flush_item([], line)
                if item:
                    items.append(item)
                if len(items) >= 20:
                    break

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
        amounts = self.extract_amounts(full_text, lines)
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
            "overall_confidence": float(confidence),
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
