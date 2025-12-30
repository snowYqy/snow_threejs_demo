"""
Image Preprocessing Service

Requirements covered:
- 2.1: Convert image to grayscale
- 2.2: Apply noise reduction filtering
- 2.3: Enhance contrast for better edge detection
- 2.4: Detect and correct image rotation if skewed
- 2.5: Normalize image resolution for consistent processing
"""
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional
from dataclasses import dataclass


@dataclass
class PreprocessingResult:
    """Result of image preprocessing"""
    original_image: np.ndarray
    grayscale: np.ndarray
    processed: np.ndarray
    rotation_angle: float
    was_rotated: bool
    original_size: Tuple[int, int]
    processed_size: Tuple[int, int]
    scale_factor: float


class PreprocessingConfig:
    """Configuration for preprocessing parameters"""
    
    # Target resolution for normalization
    TARGET_WIDTH = 1600
    TARGET_HEIGHT = 1200
    MAX_DIMENSION = 2000
    MIN_DIMENSION = 800
    
    # Noise reduction parameters
    BILATERAL_D = 9
    BILATERAL_SIGMA_COLOR = 75
    BILATERAL_SIGMA_SPACE = 75
    
    # Contrast enhancement parameters
    CLAHE_CLIP_LIMIT = 2.0
    CLAHE_TILE_SIZE = (8, 8)
    
    # Skew detection parameters
    HOUGH_THRESHOLD = 100
    MIN_LINE_LENGTH = 100
    MAX_LINE_GAP = 10
    ANGLE_TOLERANCE = 0.5  # degrees


class ImagePreprocessor:
    """
    Image preprocessing pipeline for floor plan recognition.
    
    Pipeline steps:
    1. Convert to grayscale
    2. Apply noise reduction
    3. Enhance contrast
    4. Detect and correct skew
    5. Normalize resolution
    """
    
    def __init__(self, config: Optional[PreprocessingConfig] = None):
        self.config = config or PreprocessingConfig()
    
    def preprocess(self, image: np.ndarray) -> PreprocessingResult:
        """
        Run the complete preprocessing pipeline.
        
        Args:
            image: Input image as numpy array (BGR format from cv2)
            
        Returns:
            PreprocessingResult with all preprocessing outputs
        """
        original_size = (image.shape[1], image.shape[0])
        
        # Step 1: Convert to grayscale (Requirement 2.1)
        grayscale = self.convert_to_grayscale(image)
        
        # Step 2: Apply noise reduction (Requirement 2.2)
        denoised = self.remove_noise(grayscale)
        
        # Step 3: Enhance contrast (Requirement 2.3)
        enhanced = self.enhance_contrast(denoised)
        
        # Step 4: Detect and correct skew (Requirement 2.4)
        rotation_angle = self.detect_skew(enhanced)
        was_rotated = abs(rotation_angle) > self.config.ANGLE_TOLERANCE
        
        if was_rotated:
            corrected = self.rotate_image(enhanced, rotation_angle)
        else:
            corrected = enhanced
        
        # Step 5: Normalize resolution (Requirement 2.5)
        normalized, scale_factor = self.normalize_resolution(corrected)
        
        processed_size = (normalized.shape[1], normalized.shape[0])
        
        return PreprocessingResult(
            original_image=image,
            grayscale=grayscale,
            processed=normalized,
            rotation_angle=rotation_angle,
            was_rotated=was_rotated,
            original_size=original_size,
            processed_size=processed_size,
            scale_factor=scale_factor
        )

    def convert_to_grayscale(self, image: np.ndarray) -> np.ndarray:
        """
        Convert image to grayscale.
        
        Requirement 2.1: WHEN an image is uploaded, THE Preprocessor SHALL 
        convert it to grayscale.
        
        Args:
            image: Input BGR image
            
        Returns:
            Grayscale image
        """
        if len(image.shape) == 2:
            # Already grayscale
            return image
        
        if len(image.shape) == 3:
            if image.shape[2] == 4:
                # BGRA to grayscale
                return cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
            elif image.shape[2] == 3:
                # BGR to grayscale
                return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        raise ValueError(f"Unsupported image shape: {image.shape}")
    
    def remove_noise(self, image: np.ndarray) -> np.ndarray:
        """
        Apply noise reduction filtering.
        
        Requirement 2.2: THE Preprocessor SHALL apply noise reduction filtering.
        
        Uses bilateral filter which preserves edges while smoothing noise,
        ideal for floor plan images where we need to preserve wall edges.
        
        Args:
            image: Grayscale image
            
        Returns:
            Denoised image
        """
        # Bilateral filter preserves edges while removing noise
        denoised = cv2.bilateralFilter(
            image,
            d=self.config.BILATERAL_D,
            sigmaColor=self.config.BILATERAL_SIGMA_COLOR,
            sigmaSpace=self.config.BILATERAL_SIGMA_SPACE
        )
        
        return denoised
    
    def enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance contrast for better edge detection.
        
        Requirement 2.3: THE Preprocessor SHALL enhance contrast for 
        better edge detection.
        
        Uses CLAHE (Contrast Limited Adaptive Histogram Equalization)
        which works well for images with varying lighting conditions.
        
        Args:
            image: Grayscale image
            
        Returns:
            Contrast-enhanced image
        """
        clahe = cv2.createCLAHE(
            clipLimit=self.config.CLAHE_CLIP_LIMIT,
            tileGridSize=self.config.CLAHE_TILE_SIZE
        )
        enhanced = clahe.apply(image)
        
        return enhanced
    
    def detect_skew(self, image: np.ndarray) -> float:
        """
        Detect image skew angle using Hough line transform.
        
        Requirement 2.4: THE Preprocessor SHALL detect and correct 
        image rotation if skewed.
        
        Args:
            image: Grayscale image
            
        Returns:
            Detected skew angle in degrees (positive = counterclockwise)
        """
        # Apply edge detection
        edges = cv2.Canny(image, 50, 150, apertureSize=3)
        
        # Detect lines using Hough transform
        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=self.config.HOUGH_THRESHOLD,
            minLineLength=self.config.MIN_LINE_LENGTH,
            maxLineGap=self.config.MAX_LINE_GAP
        )
        
        if lines is None or len(lines) == 0:
            return 0.0
        
        # Calculate angles of detected lines
        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            
            # Skip very short lines
            length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            if length < self.config.MIN_LINE_LENGTH:
                continue
            
            # Calculate angle
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            
            # Normalize angle to [-45, 45] range
            # We assume walls are mostly horizontal or vertical
            angle = angle % 90
            if angle > 45:
                angle -= 90
            
            angles.append(angle)
        
        if not angles:
            return 0.0
        
        # Use median angle to be robust against outliers
        median_angle = np.median(angles)
        
        # Only return significant skew
        if abs(median_angle) < self.config.ANGLE_TOLERANCE:
            return 0.0
        
        return float(median_angle)

    def rotate_image(self, image: np.ndarray, angle: float) -> np.ndarray:
        """
        Rotate image to correct skew.
        
        Requirement 2.4: THE Preprocessor SHALL detect and correct 
        image rotation if skewed.
        
        Args:
            image: Input image
            angle: Rotation angle in degrees (positive = counterclockwise)
            
        Returns:
            Rotated image with white background
        """
        height, width = image.shape[:2]
        center = (width // 2, height // 2)
        
        # Get rotation matrix
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        # Calculate new image bounds to avoid cropping
        cos = np.abs(rotation_matrix[0, 0])
        sin = np.abs(rotation_matrix[0, 1])
        
        new_width = int(height * sin + width * cos)
        new_height = int(height * cos + width * sin)
        
        # Adjust rotation matrix for new bounds
        rotation_matrix[0, 2] += (new_width - width) / 2
        rotation_matrix[1, 2] += (new_height - height) / 2
        
        # Rotate with white background (255 for grayscale)
        rotated = cv2.warpAffine(
            image,
            rotation_matrix,
            (new_width, new_height),
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=255
        )
        
        return rotated
    
    def normalize_resolution(
        self, 
        image: np.ndarray
    ) -> Tuple[np.ndarray, float]:
        """
        Normalize image resolution for consistent processing.
        
        Requirement 2.5: THE Preprocessor SHALL normalize image resolution 
        for consistent processing.
        
        Scales image to fit within target dimensions while maintaining
        aspect ratio.
        
        Args:
            image: Input image
            
        Returns:
            Tuple of (normalized image, scale factor)
        """
        height, width = image.shape[:2]
        
        # Calculate scale factor
        max_dim = max(width, height)
        min_dim = min(width, height)
        
        if max_dim > self.config.MAX_DIMENSION:
            # Scale down if too large
            scale = self.config.MAX_DIMENSION / max_dim
        elif min_dim < self.config.MIN_DIMENSION:
            # Scale up if too small (but don't exceed max)
            scale = min(
                self.config.MIN_DIMENSION / min_dim,
                self.config.MAX_DIMENSION / max_dim
            )
        else:
            # No scaling needed
            scale = 1.0
        
        if scale == 1.0:
            return image, scale
        
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        # Use appropriate interpolation
        if scale < 1.0:
            # Downscaling - use INTER_AREA for best quality
            interpolation = cv2.INTER_AREA
        else:
            # Upscaling - use INTER_CUBIC for smoother result
            interpolation = cv2.INTER_CUBIC
        
        resized = cv2.resize(
            image, 
            (new_width, new_height), 
            interpolation=interpolation
        )
        
        return resized, scale
    
    @staticmethod
    def pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
        """
        Convert PIL Image to OpenCV format (numpy array).
        
        Args:
            pil_image: PIL Image object
            
        Returns:
            OpenCV image (BGR format)
        """
        # Convert to RGB if necessary
        if pil_image.mode == 'RGBA':
            pil_image = pil_image.convert('RGB')
        elif pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Convert to numpy array
        numpy_image = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV
        cv2_image = cv2.cvtColor(numpy_image, cv2.COLOR_RGB2BGR)
        
        return cv2_image
    
    @staticmethod
    def cv2_to_pil(cv2_image: np.ndarray) -> Image.Image:
        """
        Convert OpenCV image to PIL Image.
        
        Args:
            cv2_image: OpenCV image (BGR or grayscale)
            
        Returns:
            PIL Image object
        """
        if len(cv2_image.shape) == 2:
            # Grayscale
            return Image.fromarray(cv2_image, mode='L')
        else:
            # BGR to RGB
            rgb_image = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB)
            return Image.fromarray(rgb_image)


def preprocess_image(image: np.ndarray) -> PreprocessingResult:
    """
    Convenience function to preprocess an image with default settings.
    
    Args:
        image: Input image as numpy array
        
    Returns:
        PreprocessingResult with all preprocessing outputs
    """
    preprocessor = ImagePreprocessor()
    return preprocessor.preprocess(image)


def preprocess_pil_image(pil_image: Image.Image) -> PreprocessingResult:
    """
    Convenience function to preprocess a PIL Image.
    
    Args:
        pil_image: PIL Image object
        
    Returns:
        PreprocessingResult with all preprocessing outputs
    """
    cv2_image = ImagePreprocessor.pil_to_cv2(pil_image)
    return preprocess_image(cv2_image)
