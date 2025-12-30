"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

# Load .env file from backend directory
from dotenv import load_dotenv
backend_dir = Path(__file__).parent.parent.parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(env_path)


class Settings(BaseSettings):
    """Application settings"""
    
    # API settings
    api_title: str = "Floor Plan Recognition API"
    api_version: str = "1.0.0"
    
    # File upload settings
    max_file_size_mb: int = 10
    allowed_extensions: list[str] = ["png", "jpg", "jpeg"]
    
    # Tesseract settings
    tesseract_cmd: Optional[str] = None  # Path to tesseract executable
    tesseract_lang: str = "chi_sim+eng"  # Chinese simplified + English
    
    # OpenCV settings
    wall_threshold: int = 50
    min_room_area: int = 1000
    
    # OpenAI settings
    openai_api_key: Optional[str] = None
    
    # Google Gemini settings
    gemini_api_key: Optional[str] = None
    
    # Alibaba DashScope settings (通义千问)
    dashscope_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()
