#!/usr/bin/env python3
"""
Docling PDF Parser for Kinmail Extension
Parses PDF documents using Docling and returns structured content
"""

import sys
import json
import os
from pathlib import Path

try:
    from docling.document_converter import DocumentConverter
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
except ImportError:
    print("ERROR: Docling not installed. Run: pip install docling")
    sys.exit(1)

def parse_pdf_with_docling(pdf_path):
    """
    Parse PDF using Docling and return structured content
    """
    try:
        # Check if file exists
        if not os.path.exists(pdf_path):
            return {"error": f"File not found: {pdf_path}"}
        
        # Initialize Docling converter with basic settings
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        
        # Extract content
        document = result.document
        
        # Get markdown content
        markdown_content = document.export_to_markdown()
        
        # Get structured data
        structured_data = {
            "content": markdown_content,
            "metadata": {
                "title": getattr(document, 'title', ''),
                "author": getattr(document, 'author', ''),
                "pages": len(document.pages) if hasattr(document, 'pages') else 0,
                "word_count": len(markdown_content.split()) if markdown_content else 0,
                "char_count": len(markdown_content) if markdown_content else 0
            },
            "tables": [],
            "images": [],
            "structure": {
                "headings": [],
                "paragraphs": [],
                "lists": []
            }
        }
        
        # Extract tables if any
        if hasattr(document, 'tables') and document.tables:
            for i, table in enumerate(document.tables):
                structured_data["tables"].append({
                    "index": i,
                    "content": str(table),
                    "rows": len(table.rows) if hasattr(table, 'rows') else 0,
                    "columns": len(table.columns) if hasattr(table, 'columns') else 0
                })
        
        # Extract images if any
        if hasattr(document, 'images') and document.images:
            for i, image in enumerate(document.images):
                structured_data["images"].append({
                    "index": i,
                    "description": getattr(image, 'description', ''),
                    "caption": getattr(image, 'caption', '')
                })
        
        # Extract structure elements
        if hasattr(document, 'elements'):
            for element in document.elements:
                if hasattr(element, 'label') and element.label:
                    if 'heading' in element.label.lower():
                        structured_data["structure"]["headings"].append({
                            "text": getattr(element, 'text', ''),
                            "level": getattr(element, 'level', 1)
                        })
                    elif 'paragraph' in element.label.lower():
                        structured_data["structure"]["paragraphs"].append({
                            "text": getattr(element, 'text', ''),
                            "length": len(getattr(element, 'text', ''))
                        })
                    elif 'list' in element.label.lower():
                        structured_data["structure"]["lists"].append({
                            "text": getattr(element, 'text', ''),
                            "items": getattr(element, 'text', '').count('\n') + 1
                        })
        
        # Only output JSON, no debug text
        
        return structured_data
        
    except Exception as e:
        error_msg = f"Docling parsing failed: {str(e)}"
        # Only output JSON, no debug text
        return {"error": error_msg}

def main():
    """
    Main function to handle command line arguments
    """
    if len(sys.argv) != 2:
        print("Usage: python docling_parser.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Parse PDF
    result = parse_pdf_with_docling(pdf_path)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
