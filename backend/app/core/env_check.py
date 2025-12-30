"""
Environment detection script for OpenCV and Tesseract
"""
import sys
from typing import Dict, Any


def check_opencv() -> Dict[str, Any]:
    """Check OpenCV installation"""
    result = {
        "installed": False,
        "version": None,
        "error": None
    }
    
    try:
        import cv2
        result["installed"] = True
        result["version"] = cv2.__version__
    except ImportError as e:
        result["error"] = str(e)
    
    return result


def check_tesseract() -> Dict[str, Any]:
    """Check Tesseract OCR installation"""
    result = {
        "installed": False,
        "version": None,
        "languages": [],
        "error": None
    }
    
    try:
        import pytesseract
        
        # Try to get version
        try:
            version = pytesseract.get_tesseract_version()
            result["installed"] = True
            result["version"] = str(version)
        except Exception as e:
            result["error"] = f"Tesseract not found: {e}"
            return result
        
        # Get available languages
        try:
            languages = pytesseract.get_languages()
            result["languages"] = languages
        except Exception:
            result["languages"] = []
            
    except ImportError as e:
        result["error"] = f"pytesseract not installed: {e}"
    
    return result


def check_numpy() -> Dict[str, Any]:
    """Check NumPy installation"""
    result = {
        "installed": False,
        "version": None,
        "error": None
    }
    
    try:
        import numpy as np
        result["installed"] = True
        result["version"] = np.__version__
    except ImportError as e:
        result["error"] = str(e)
    
    return result


def check_pillow() -> Dict[str, Any]:
    """Check Pillow installation"""
    result = {
        "installed": False,
        "version": None,
        "error": None
    }
    
    try:
        from PIL import Image
        import PIL
        result["installed"] = True
        result["version"] = PIL.__version__
    except ImportError as e:
        result["error"] = str(e)
    
    return result


def check_all() -> Dict[str, Any]:
    """Check all required dependencies"""
    return {
        "python_version": sys.version,
        "opencv": check_opencv(),
        "tesseract": check_tesseract(),
        "numpy": check_numpy(),
        "pillow": check_pillow()
    }


def print_env_status():
    """Print environment status to console"""
    status = check_all()
    
    print("=" * 50)
    print("Environment Status Check")
    print("=" * 50)
    print(f"\nPython: {status['python_version']}")
    
    print("\n--- OpenCV ---")
    opencv = status["opencv"]
    if opencv["installed"]:
        print(f"  ✓ Installed: v{opencv['version']}")
    else:
        print(f"  ✗ Not installed: {opencv['error']}")
    
    print("\n--- Tesseract OCR ---")
    tesseract = status["tesseract"]
    if tesseract["installed"]:
        print(f"  ✓ Installed: v{tesseract['version']}")
        print(f"  Languages: {', '.join(tesseract['languages'])}")
        if "chi_sim" in tesseract["languages"]:
            print("  ✓ Chinese (Simplified) language pack available")
        else:
            print("  ⚠ Chinese (Simplified) language pack NOT found")
            print("    Install with: brew install tesseract-lang (macOS)")
            print("    Or: apt-get install tesseract-ocr-chi-sim (Ubuntu)")
    else:
        print(f"  ✗ Not installed: {tesseract['error']}")
        print("    Install with: brew install tesseract (macOS)")
        print("    Or: apt-get install tesseract-ocr (Ubuntu)")
    
    print("\n--- NumPy ---")
    numpy = status["numpy"]
    if numpy["installed"]:
        print(f"  ✓ Installed: v{numpy['version']}")
    else:
        print(f"  ✗ Not installed: {numpy['error']}")
    
    print("\n--- Pillow ---")
    pillow = status["pillow"]
    if pillow["installed"]:
        print(f"  ✓ Installed: v{pillow['version']}")
    else:
        print(f"  ✗ Not installed: {pillow['error']}")
    
    print("\n" + "=" * 50)
    
    # Overall status
    all_ok = all([
        opencv["installed"],
        tesseract["installed"],
        numpy["installed"],
        pillow["installed"]
    ])
    
    if all_ok:
        print("✓ All dependencies are installed!")
    else:
        print("✗ Some dependencies are missing. Please install them.")
    
    return all_ok


if __name__ == "__main__":
    success = print_env_status()
    sys.exit(0 if success else 1)
