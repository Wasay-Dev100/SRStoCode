#!/usr/bin/env python3
"""
Setup script for Docling dependencies
Installs required Python packages for PDF parsing
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements for Docling"""
    try:
        print("🔧 [SETUP] Installing Docling dependencies...")
        
        # Install requirements
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        
        print("✅ [SETUP] Docling dependencies installed successfully!")
        print("📦 [SETUP] Installed packages:")
        print("   - docling (PDF parsing)")
        print("   - pypdfium2 (PDF backend)")
        print("   - python-dotenv (Environment variables)")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ [SETUP] Failed to install dependencies: {e}")
        return False
    except Exception as e:
        print(f"❌ [SETUP] Setup error: {e}")
        return False

def test_docling():
    """Test if Docling is working correctly"""
    try:
        print("🧪 [SETUP] Testing Docling installation...")
        
        from docling.document_converter import DocumentConverter
        from docling.datamodel.base_models import InputFormat
        
        print("✅ [SETUP] Docling import successful!")
        print("✅ [SETUP] Docling is ready to use!")
        
        return True
        
    except ImportError as e:
        print(f"❌ [SETUP] Docling import failed: {e}")
        print("💡 [SETUP] Try running: pip install docling")
        return False
    except Exception as e:
        print(f"❌ [SETUP] Docling test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 [SETUP] Setting up Docling for Kinmail Extension")
    print("=" * 50)
    
    # Check if requirements.txt exists
    if not os.path.exists("requirements.txt"):
        print("❌ [SETUP] requirements.txt not found!")
        return False
    
    # Install dependencies
    if not install_requirements():
        return False
    
    # Test installation
    if not test_docling():
        return False
    
    print("=" * 50)
    print("🎉 [SETUP] Docling setup completed successfully!")
    print("📝 [SETUP] You can now use Docling for PDF parsing in the extension.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)









