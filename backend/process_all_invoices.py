"""
Batch process all invoices from test_invoices/invoice_data directory
"""

import requests
from pathlib import Path
import time
import json
from typing import List, Dict

API_BASE_URL = "http://localhost:8000/api/v1/upload"


def process_invoice(image_path: Path) -> Dict:
    """Process a single invoice image"""
    print(f"Processing: {image_path.name}...", end=" ")
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (image_path.name, f, 'image/png')}
            response = requests.post(
                f"{API_BASE_URL}/invoice",
                files=files,
                timeout=120  # 2 minute timeout per invoice
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success (Invoice ID: {result.get('invoice_id', 'N/A')})")
                return {
                    "file": image_path.name,
                    "success": True,
                    "invoice_id": result.get('invoice_id'),
                    "invoice_number": result.get('extracted_data', {}).get('invoice_number'),
                    "total": result.get('extracted_data', {}).get('amounts', {}).get('total', 0),
                    "confidence": result.get('extracted_data', {}).get('ocr_confidence', 0)
                }
            else:
                error_msg = response.json().get('detail', 'Unknown error')
                print(f"❌ Failed: {error_msg}")
                return {
                    "file": image_path.name,
                    "success": False,
                    "error": error_msg
                }
    except requests.exceptions.ConnectionError:
        print("❌ Failed: Could not connect to API. Is the server running?")
        return {
            "file": image_path.name,
            "success": False,
            "error": "Connection error - server not running"
        }
    except Exception as e:
        print(f"❌ Failed: {str(e)}")
        return {
            "file": image_path.name,
            "success": False,
            "error": str(e)
        }


def process_all_invoices(invoice_dir: str = "test_invoices/invoice_data", output_file: str = "processing_results.json"):
    """Process all invoice images in the directory"""
    invoice_path = Path(invoice_dir)
    
    if not invoice_path.exists():
        print(f"Error: Directory not found: {invoice_dir}")
        return
    
    # Find all image files
    image_extensions = ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']
    invoice_files = []
    for ext in image_extensions:
        invoice_files.extend(invoice_path.glob(f"*{ext}"))
    
    if not invoice_files:
        print(f"No image files found in {invoice_dir}")
        return
    
    print(f"Found {len(invoice_files)} invoice images")
    print("=" * 60)
    
    results = []
    successful = 0
    failed = 0
    
    for i, invoice_file in enumerate(invoice_files, 1):
        print(f"[{i}/{len(invoice_files)}] ", end="")
        result = process_invoice(invoice_file)
        results.append(result)
        
        if result.get("success"):
            successful += 1
        else:
            failed += 1
        
        # Small delay to avoid overwhelming the server
        time.sleep(0.5)
    
    # Save results to file
    summary = {
        "total": len(invoice_files),
        "successful": successful,
        "failed": failed,
        "results": results
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("=" * 60)
    print("Processing Summary:")
    print(f"  Total invoices: {len(invoice_files)}")
    print(f"  ✅ Successful: {successful}")
    print(f"  ❌ Failed: {failed}")
    print(f"  Results saved to: {output_file}")
    
    # Print failed files
    if failed > 0:
        print("\nFailed files:")
        for result in results:
            if not result.get("success"):
                print(f"  - {result['file']}: {result.get('error', 'Unknown error')}")


if __name__ == "__main__":
    import sys
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code != 200:
            print("Warning: Server health check failed")
    except:
        print("Error: Cannot connect to API server at http://localhost:8000")
        print("Please start the server first:")
        print("  cd backend")
        print("  python -m app.main")
        sys.exit(1)
    
    # Process invoices
    invoice_directory = sys.argv[1] if len(sys.argv) > 1 else "test_invoices/invoice_data"
    process_all_invoices(invoice_directory)




