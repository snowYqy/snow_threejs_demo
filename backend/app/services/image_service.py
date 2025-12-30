"""
Image processing service
"""
import base64
import io
import re
import uuid
from typing import Tuple, Optional
from PIL import Image

from app.core.config import settings


class ImageValidationError(Exception):
    """Custom exception for image validation errors"""
    pass


class ImageService:
    """Service for handling image uploads and validation"""
    
    # Maximum file size in bytes (10MB default)
    MAX_SIZE_BYTES = settings.max_file_size_mb * 1024 * 1024
    
    # Allowed image formats
    ALLOWED_FORMATS = {"PNG", "JPEG", "JPG"}
    
    # Data URI pattern
    DATA_URI_PATTERN = re.compile(
        r'^data:image/(?P<format>\w+);base64,(?P<data>.+)$',
        re.IGNORECASE
    )
    
    @classmethod
    def decode_base64_image(cls, base64_string: str) -> Tuple[bytes, Optional[str]]:
        """
        Decode base64 image string to bytes.
        
        Args:
            base64_string: Base64 encoded image (with or without data URI prefix)
            
        Returns:
            Tuple of (image_bytes, detected_format)
            
        Raises:
            ImageValidationError: If decoding fails
        """
        detected_format = None
        
        # Check for data URI format
        match = cls.DATA_URI_PATTERN.match(base64_string)
        if match:
            detected_format = match.group("format").upper()
            base64_data = match.group("data")
        else:
            base64_data = base64_string
        
        try:
            image_bytes = base64.b64decode(base64_data)
        except Exception as e:
            raise ImageValidationError(f"Invalid base64 encoding: {str(e)}")
        
        return image_bytes, detected_format
    
    @classmethod
    def validate_image_size(cls, image_bytes: bytes) -> None:
        """
        Validate image file size.
        
        Args:
            image_bytes: Raw image bytes
            
        Raises:
            ImageValidationError: If file exceeds size limit
        """
        size = len(image_bytes)
        if size > cls.MAX_SIZE_BYTES:
            max_mb = settings.max_file_size_mb
            actual_mb = size / (1024 * 1024)
            raise ImageValidationError(
                f"File size ({actual_mb:.2f}MB) exceeds maximum allowed size ({max_mb}MB)"
            )
    
    @classmethod
    def validate_image_format(
        cls, 
        image_bytes: bytes, 
        filename: Optional[str] = None
    ) -> Tuple[Image.Image, str]:
        """
        Validate image format and return PIL Image.
        
        Args:
            image_bytes: Raw image bytes
            filename: Optional filename for format hint
            
        Returns:
            Tuple of (PIL Image, format string)
            
        Raises:
            ImageValidationError: If format is not supported
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image_format = image.format
        except Exception as e:
            raise ImageValidationError(f"Cannot read image: {str(e)}")
        
        if image_format is None:
            # Try to detect from filename
            if filename:
                ext = filename.rsplit(".", 1)[-1].upper()
                if ext in cls.ALLOWED_FORMATS:
                    image_format = ext
        
        if image_format is None:
            raise ImageValidationError("Cannot detect image format")
        
        # Normalize JPEG/JPG
        if image_format == "JPG":
            image_format = "JPEG"
        
        if image_format not in cls.ALLOWED_FORMATS:
            raise ImageValidationError(
                f"Unsupported image format: {image_format}. "
                f"Allowed formats: {', '.join(cls.ALLOWED_FORMATS)}"
            )
        
        return image, image_format
    
    @classmethod
    def process_upload(
        cls,
        base64_image: str,
        filename: Optional[str] = None
    ) -> dict:
        """
        Process an uploaded base64 image.
        
        Args:
            base64_image: Base64 encoded image string
            filename: Optional original filename
            
        Returns:
            Dictionary with image info
            
        Raises:
            ImageValidationError: If validation fails
        """
        # Decode base64
        image_bytes, uri_format = cls.decode_base64_image(base64_image)
        
        # Validate size
        cls.validate_image_size(image_bytes)
        
        # Validate format and get image
        image, image_format = cls.validate_image_format(image_bytes, filename)
        
        # Generate unique ID
        image_id = str(uuid.uuid4())
        
        return {
            "image_id": image_id,
            "width": image.width,
            "height": image.height,
            "format": image_format,
            "size_bytes": len(image_bytes),
            "image": image,
            "image_bytes": image_bytes
        }
