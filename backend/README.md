# Floor Plan Recognition Backend

Python backend service for recognizing 2D floor plans and converting them to 3D model data.

## Prerequisites

- Python 3.10+
- Tesseract OCR (with Chinese language pack)

### Installing Tesseract

**macOS:**
```bash
brew install tesseract
brew install tesseract-lang  # For Chinese language support
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-chi-sim  # Chinese simplified
```

**Windows:**
Download installer from: https://github.com/UB-Mannheim/tesseract/wiki

## Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Check environment:
```bash
python -m app.core.env_check
```

## Running the Server

Development mode:
```bash
python run.py
```

Or with uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
