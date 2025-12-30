"""
Floor Plan Recognition API - Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload, preprocess, wall_detection, room_detection, generate, ocr, vision_ai, gemini_vision, qwen_vision
from app.core.env_check import check_all

app = FastAPI(
    title="Floor Plan Recognition API",
    description="API for recognizing 2D floor plans and converting them to 3D model data",
    version="1.0.0"
)

# Configure CORS to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(preprocess.router, prefix="/api", tags=["preprocess"])
app.include_router(wall_detection.router, prefix="/api", tags=["wall-detection"])
app.include_router(room_detection.router, prefix="/api", tags=["room-detection"])
app.include_router(generate.router, prefix="/api", tags=["generate"])
app.include_router(ocr.router, prefix="/api", tags=["ocr"])
app.include_router(vision_ai.router, prefix="/api", tags=["vision-ai"])
app.include_router(gemini_vision.router, prefix="/api", tags=["gemini-vision"])
app.include_router(qwen_vision.router, prefix="/api", tags=["qwen-vision"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Floor Plan Recognition API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/env")
async def environment_status():
    """Check environment dependencies status"""
    return check_all()
