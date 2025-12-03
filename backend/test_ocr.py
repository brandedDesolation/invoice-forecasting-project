"""
Test script for OCR invoice extraction
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ocr_service import InvoiceOCRService
from pathlib import Path

def test_ocr_on_invoice(image_path: str):
    """Test OCR extraction on a single invoice"""
    print(f"Testing OCR on: {image_path}")
    print("-" * 50)
    
    if not os.path.exists(image_path):
        print(f"Error: File not found: {image_path}")
        return
    
    try:
        # Initialize OCR service
        print("Initializing OCR service...")
        ocr_service = InvoiceOCRService()
        
        # Process invoice
        print("Processing invoice...")
        result = ocr_service.process_invoice(image_path)
        
        # Print results
        print("\nExtracted Data:")
        print(f"Invoice Number: {result.get('invoice_number')}")
        print(f"Issue Date: {result.get('issue_date')}")
        print(f"Due Date: {result.get('due_date')}")
        print(f"\nAmounts:")
        amounts = result.get('amounts', {})
        print(f"  Subtotal: {amounts.get('subtotal', 0.0)}")
        print(f"  Tax: {amounts.get('tax', 0.0)}")
        print(f"  Total: {amounts.get('total', 0.0)}")
        print(f"\nSupplier:")
        supplier = result.get('supplier', {})
        print(f"  Name: {supplier.get('name')}")
        print(f"  Tax ID: {supplier.get('tax_id')}")
        print(f"  Phone: {supplier.get('phone')}")
        print(f"\nOCR Confidence: {result.get('ocr_confidence', 0.0):.2f}%")
        print(f"Word Count: {result.get('word_count', 0)}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Test with a sample invoice
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        # Default to first invoice in test_invoices directory
        test_dir = Path("test_invoices")
        if test_dir.exists():
            images = list(test_dir.glob("*.png")) + list(test_dir.glob("*.jpeg")) + list(test_dir.glob("*.jpg"))
            if images:
                image_path = str(images[0])
                print(f"Using default image: {image_path}")
            else:
                print("No test images found. Please provide image path as argument.")
                sys.exit(1)
        else:
            print("Please provide image path as argument.")
            sys.exit(1)
    
    test_ocr_on_invoice(image_path)




