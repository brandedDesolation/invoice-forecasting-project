# Invoice OCR Setup Guide

This guide explains how to set up and use the EasyOCR-based invoice extraction system.

## Installation

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

Note: EasyOCR will download language models on first use. This may take a few minutes.

## Database Setup

The system will automatically create database tables on first run. The database file will be created at `backend/invoice_forecast.db`.

## Usage

### 1. Start the FastAPI Server

```bash
cd backend
python -m app.main
# or
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### 2. API Endpoints

#### Upload Single Invoice
```bash
curl -X POST "http://localhost:8000/api/v1/upload/invoice" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/invoice.png"
```

#### Upload Multiple Invoices (Batch)
```bash
curl -X POST "http://localhost:8000/api/v1/upload/invoices/batch" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@invoice1.png" \
  -F "files=@invoice2.png"
```

#### Check Upload Status
```bash
curl "http://localhost:8000/api/v1/upload/status"
```

### 3. Testing OCR Locally

Test OCR extraction on a single invoice:

```bash
python test_ocr.py path/to/invoice.png
```

Or test with default invoice from test_invoices directory:
```bash
python test_ocr.py
```

## How It Works

1. **Image Upload**: Invoice images are uploaded via the API endpoint
2. **Image Preprocessing**: Images are preprocessed (grayscale, denoising, thresholding) for better OCR accuracy
3. **Text Extraction**: EasyOCR extracts text from the invoice
4. **Data Parsing**: The extracted text is parsed to extract:
   - Invoice number
   - Issue date and due date
   - Amounts (subtotal, tax, total)
   - Supplier information (name, tax ID, phone, email, address)
   - Customer information
   - Line items (if detectable)
5. **Database Storage**: 
   - Suppliers and customers are created or matched if they exist
   - Invoice is created with extracted data
   - Invoice items are stored if extracted

## Supported Invoice Formats

The system is optimized for Turkish invoices (e-Fatura format) but also supports English invoices. It can extract:

- Invoice numbers (various formats)
- Dates (DD-MM-YYYY, DD/MM/YYYY formats)
- Monetary amounts (Turkish and English formats)
- Supplier/Vendor information
- Tax IDs (VKN/TCKN)
- Contact information

## Frontend Integration

To upload invoices from your Next.js frontend:

```typescript
const uploadInvoice = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:8000/api/v1/upload/invoice', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return data;
};
```

## Processing Your 40 Invoice Images

You can process all your invoices in batch:

```python
import requests
from pathlib import Path

# Process all invoices in a directory
invoice_dir = Path("test_invoices/invoice_data")
for invoice_file in invoice_dir.glob("*.png"):
    with open(invoice_file, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            'http://localhost:8000/api/v1/upload/invoice',
            files=files
        )
        print(f"Processed {invoice_file.name}: {response.json()}")
```

## Troubleshooting

1. **EasyOCR initialization is slow**: This is normal on first run. Models are downloaded and cached.

2. **Low OCR confidence**: 
   - Ensure images are clear and high resolution
   - Check if images are rotated correctly
   - Try preprocessing images manually if needed

3. **Missing data extraction**:
   - The extraction patterns are optimized for Turkish e-Fatura format
   - You may need to adjust regex patterns in `app/services/ocr_service.py` for different formats

4. **Database errors**: 
   - Ensure SQLite database file is writable
   - Check database file permissions

## Next Steps

- Review extracted data in the database
- Adjust extraction patterns based on your invoice formats
- Fine-tune OCR preprocessing for better accuracy
- Add custom field extraction for your specific invoice types




