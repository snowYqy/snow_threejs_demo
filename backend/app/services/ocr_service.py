"""
OCR Service for Floor Plan Text Recognition

Requirements covered:
- 5.1: Use OCR to detect text in the image
- 5.2: Identify room type keywords (客厅, 卧室, 厨房, 卫生间, 阳台, etc.)
- 5.3: Associate labels with their nearest room
- 5.4: Assign default name based on size/position when no label detected
"""
import cv2
import numpy as np
import pytesseract
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass
from enum import Enum


class RoomType(Enum):
    """Room type classification based on detected labels"""
    LIVING = "living"
    BEDROOM = "bedroom"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    BALCONY = "balcony"
    DINING = "dining"
    STUDY = "study"
    STORAGE = "storage"
    HALLWAY = "hallway"
    OTHER = "other"


@dataclass
class TextLabel:
    """Represents a detected text label in the floor plan"""
    text: str
    position: Tuple[int, int]  # (x, y) top-left corner
    size: Tuple[int, int]  # (width, height)
    confidence: float  # OCR confidence 0-100
    center: Tuple[float, float]  # (x, y) center position
    room_type: Optional[RoomType] = None  # Inferred room type
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "text": self.text,
            "position": {"x": self.position[0], "y": self.position[1]},
            "size": {"width": self.size[0], "height": self.size[1]},
            "center": {"x": self.center[0], "y": self.center[1]},
            "confidence": self.confidence,
            "room_type": self.room_type.value if self.room_type else None
        }


@dataclass
class RoomLabelAssociation:
    """Association between a room and its detected label"""
    room_id: str
    label: Optional[TextLabel]
    room_type: RoomType
    room_name: str
    is_default_name: bool  # True if name was assigned by default
    distance: Optional[float] = None  # Distance from label to room center
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "room_id": self.room_id,
            "label": self.label.to_dict() if self.label else None,
            "room_type": self.room_type.value,
            "room_name": self.room_name,
            "is_default_name": self.is_default_name,
            "distance": self.distance
        }


@dataclass
class OCRResult:
    """Result of OCR text detection"""
    labels: List[TextLabel]
    image_size: Tuple[int, int]  # (width, height)
    language: str  # OCR language used
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "labels": [label.to_dict() for label in self.labels],
            "image_size": {"width": self.image_size[0], "height": self.image_size[1]},
            "label_count": len(self.labels),
            "language": self.language
        }


class OCRConfig:
    """Configuration for OCR parameters"""
    
    # Tesseract configuration
    # OEM 3 = Default, based on what is available
    # PSM 11 = Sparse text. Find as much text as possible in no particular order
    TESSERACT_CONFIG = r'--oem 3 --psm 11'
    
    # Language configuration (Chinese Simplified + English)
    DEFAULT_LANGUAGE = 'chi_sim+eng'
    FALLBACK_LANGUAGE = 'eng'
    
    # Confidence threshold for accepting text
    MIN_CONFIDENCE = 30  # Minimum confidence to accept text
    
    # Text filtering
    MIN_TEXT_LENGTH = 1  # Minimum text length to consider
    MAX_TEXT_LENGTH = 20  # Maximum text length (room names are short)
    
    # Preprocessing for OCR
    BINARY_THRESHOLD = 180  # Threshold for binarization
    MORPH_KERNEL_SIZE = 2  # Kernel size for morphological operations


# Room type keywords mapping (Chinese and English)
ROOM_TYPE_KEYWORDS: Dict[RoomType, List[str]] = {
    RoomType.LIVING: [
        '客厅', '起居室', '起居', 'living', 'living room', 'lounge'
    ],
    RoomType.BEDROOM: [
        '卧室', '主卧', '次卧', '房间', '卧', '主卧室', '次卧室',
        '儿童房', '客房', 'bedroom', 'master bedroom', 'room'
    ],
    RoomType.KITCHEN: [
        '厨房', '厨', 'kitchen', 'ktc'
    ],
    RoomType.BATHROOM: [
        '卫生间', '洗手间', '厕所', '卫', '浴室', '主卫', '次卫',
        '公卫', 'bathroom', 'wc', 'toilet', 'restroom', 'bath'
    ],
    RoomType.BALCONY: [
        '阳台', '露台', '生活阳台', '景观阳台', 'balcony', 'terrace'
    ],
    RoomType.DINING: [
        '餐厅', '饭厅', '餐', 'dining', 'dining room'
    ],
    RoomType.STUDY: [
        '书房', '办公室', '工作室', '书', 'study', 'office', 'workspace'
    ],
    RoomType.STORAGE: [
        '储藏室', '储物间', '杂物间', '衣帽间', '储', 'storage', 'closet'
    ],
    RoomType.HALLWAY: [
        '走廊', '过道', '玄关', '门厅', 'hallway', 'corridor', 'entrance'
    ],
}

# Default room names by type (Chinese)
DEFAULT_ROOM_NAMES: Dict[RoomType, str] = {
    RoomType.LIVING: "客厅",
    RoomType.BEDROOM: "卧室",
    RoomType.KITCHEN: "厨房",
    RoomType.BATHROOM: "卫生间",
    RoomType.BALCONY: "阳台",
    RoomType.DINING: "餐厅",
    RoomType.STUDY: "书房",
    RoomType.STORAGE: "储藏室",
    RoomType.HALLWAY: "走廊",
    RoomType.OTHER: "房间",
}


class OCRService:
    """
    OCR service for detecting and extracting text labels from floor plans.
    
    Implements:
    - Text detection using Tesseract OCR
    - Chinese and English text recognition
    - Room type inference from keywords
    - Label-to-room association
    """
    
    def __init__(self, config: Optional[OCRConfig] = None):
        self.config = config or OCRConfig()
        self._check_tesseract()
    
    def _check_tesseract(self) -> None:
        """Check if Tesseract is available"""
        try:
            pytesseract.get_tesseract_version()
        except Exception as e:
            print(f"Warning: Tesseract OCR may not be properly installed: {e}")

    def detect_text(
        self, 
        image: np.ndarray,
        language: Optional[str] = None
    ) -> OCRResult:
        """
        Detect text in a floor plan image.
        
        Requirement 5.1: THE Label_Extractor SHALL use OCR to detect text in the image.
        
        Args:
            image: Input image (grayscale or BGR)
            language: OCR language (default: chi_sim+eng)
            
        Returns:
            OCRResult with detected text labels
        """
        height, width = image.shape[:2]
        lang = language or self.config.DEFAULT_LANGUAGE
        
        # Preprocess image for better OCR
        processed = self._preprocess_for_ocr(image)
        
        # Try OCR with specified language
        try:
            labels = self._run_ocr(processed, lang)
        except Exception as e:
            # Fallback to English only if Chinese fails
            print(f"OCR with {lang} failed: {e}, falling back to {self.config.FALLBACK_LANGUAGE}")
            labels = self._run_ocr(processed, self.config.FALLBACK_LANGUAGE)
            lang = self.config.FALLBACK_LANGUAGE
        
        # Infer room types for each label
        for label in labels:
            label.room_type = self._infer_room_type(label.text)
        
        return OCRResult(
            labels=labels,
            image_size=(width, height),
            language=lang
        )
    
    def _preprocess_for_ocr(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for better OCR results.
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image optimized for OCR
        """
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Apply adaptive thresholding for better text contrast
        binary = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)
        
        return denoised
    
    def _run_ocr(
        self, 
        image: np.ndarray, 
        language: str
    ) -> List[TextLabel]:
        """
        Run Tesseract OCR on the image.
        
        Requirement 5.1: THE Label_Extractor SHALL use OCR to detect text in the image.
        
        Args:
            image: Preprocessed image
            language: OCR language code
            
        Returns:
            List of detected TextLabel objects
        """
        config = f'{self.config.TESSERACT_CONFIG} -l {language}'
        
        # Get detailed OCR data
        data = pytesseract.image_to_data(
            image, 
            config=config,
            output_type=pytesseract.Output.DICT
        )
        
        labels = []
        n_boxes = len(data['text'])
        
        for i in range(n_boxes):
            text = data['text'][i].strip()
            conf = float(data['conf'][i])
            
            # Filter by confidence and text length
            if conf < self.config.MIN_CONFIDENCE:
                continue
            
            if len(text) < self.config.MIN_TEXT_LENGTH:
                continue
            
            if len(text) > self.config.MAX_TEXT_LENGTH:
                continue
            
            # Skip pure numbers or single characters that aren't Chinese
            if text.isdigit():
                continue
            
            x = data['left'][i]
            y = data['top'][i]
            w = data['width'][i]
            h = data['height'][i]
            
            # Calculate center
            center_x = x + w / 2
            center_y = y + h / 2
            
            labels.append(TextLabel(
                text=text,
                position=(x, y),
                size=(w, h),
                confidence=conf,
                center=(center_x, center_y)
            ))
        
        return labels
    
    def _infer_room_type(self, text: str) -> Optional[RoomType]:
        """
        Infer room type from text label.
        
        Requirement 5.2: THE Label_Extractor SHALL identify room type keywords.
        
        Args:
            text: Detected text
            
        Returns:
            Inferred RoomType or None if not recognized
        """
        text_lower = text.lower()
        
        for room_type, keywords in ROOM_TYPE_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in text_lower or text_lower in keyword.lower():
                    return room_type
        
        return None


class LabelAssociator:
    """
    Associates detected text labels with rooms.
    
    Implements:
    - Label-to-room matching based on proximity
    - Default name assignment for unlabeled rooms
    - Room type inference from labels
    """
    
    def __init__(self):
        self._room_type_counters: Dict[RoomType, int] = {}
    
    def associate_labels(
        self,
        rooms: List[dict],
        labels: List[TextLabel],
        image_size: Tuple[int, int]
    ) -> List[RoomLabelAssociation]:
        """
        Associate text labels with detected rooms.
        
        Requirement 5.3: THE Label_Extractor SHALL associate labels with 
        their nearest room.
        
        Args:
            rooms: List of detected rooms (from RoomDetector)
            labels: List of detected text labels
            image_size: (width, height) of the image
            
        Returns:
            List of RoomLabelAssociation objects
        """
        self._room_type_counters = {}
        associations = []
        used_labels = set()
        
        for room in rooms:
            room_id = room.get('id', '')
            room_center = (
                room.get('center', {}).get('x', 0),
                room.get('center', {}).get('y', 0)
            )
            room_bounds = room.get('bounds', {})
            room_area = room.get('area', 0)
            
            # Find the nearest label inside or close to this room
            best_label = None
            best_distance = float('inf')
            
            for i, label in enumerate(labels):
                if i in used_labels:
                    continue
                
                # Check if label is inside room bounds
                if self._is_label_in_room(label, room_bounds):
                    distance = self._calculate_distance(
                        label.center, room_center
                    )
                    if distance < best_distance:
                        best_distance = distance
                        best_label = label
                        best_label_idx = i
            
            # If no label inside, check nearby labels
            if best_label is None:
                for i, label in enumerate(labels):
                    if i in used_labels:
                        continue
                    
                    distance = self._calculate_distance(
                        label.center, room_center
                    )
                    
                    # Only consider labels within reasonable distance
                    max_distance = max(
                        room_bounds.get('width', 100),
                        room_bounds.get('height', 100)
                    ) * 0.8
                    
                    if distance < max_distance and distance < best_distance:
                        best_distance = distance
                        best_label = label
                        best_label_idx = i
            
            # Mark label as used
            if best_label is not None:
                used_labels.add(best_label_idx)
            
            # Determine room type and name
            room_type, room_name, is_default = self._determine_room_info(
                best_label, room_area, room_bounds, image_size
            )
            
            associations.append(RoomLabelAssociation(
                room_id=room_id,
                label=best_label,
                room_type=room_type,
                room_name=room_name,
                is_default_name=is_default,
                distance=best_distance if best_label else None
            ))
        
        return associations
    
    def _is_label_in_room(
        self, 
        label: TextLabel, 
        room_bounds: dict
    ) -> bool:
        """
        Check if a label is inside a room's bounding box.
        
        Args:
            label: Text label
            room_bounds: Room bounding box {x, y, width, height}
            
        Returns:
            True if label center is inside room bounds
        """
        x = room_bounds.get('x', 0)
        y = room_bounds.get('y', 0)
        w = room_bounds.get('width', 0)
        h = room_bounds.get('height', 0)
        
        lx, ly = label.center
        
        return (x <= lx <= x + w) and (y <= ly <= y + h)
    
    def _calculate_distance(
        self, 
        point1: Tuple[float, float], 
        point2: Tuple[float, float]
    ) -> float:
        """Calculate Euclidean distance between two points"""
        return np.sqrt(
            (point1[0] - point2[0]) ** 2 + 
            (point1[1] - point2[1]) ** 2
        )
    
    def _determine_room_info(
        self,
        label: Optional[TextLabel],
        room_area: float,
        room_bounds: dict,
        image_size: Tuple[int, int]
    ) -> Tuple[RoomType, str, bool]:
        """
        Determine room type and name from label or defaults.
        
        Requirement 5.4: WHEN no label is detected for a room, THE System 
        SHALL assign a default name based on size/position.
        
        Args:
            label: Associated text label (may be None)
            room_area: Room area in pixels
            room_bounds: Room bounding box
            image_size: Image dimensions
            
        Returns:
            Tuple of (room_type, room_name, is_default_name)
        """
        if label and label.room_type:
            # Use detected label
            room_type = label.room_type
            room_name = label.text
            return (room_type, room_name, False)
        
        if label:
            # Label exists but no room type inferred
            return (RoomType.OTHER, label.text, False)
        
        # No label - assign default based on size/position
        room_type = self._infer_type_from_characteristics(
            room_area, room_bounds, image_size
        )
        
        # Generate numbered name
        self._room_type_counters[room_type] = \
            self._room_type_counters.get(room_type, 0) + 1
        count = self._room_type_counters[room_type]
        
        base_name = DEFAULT_ROOM_NAMES.get(room_type, "房间")
        if count > 1:
            room_name = f"{base_name}{count}"
        else:
            room_name = base_name
        
        return (room_type, room_name, True)
    
    def _infer_type_from_characteristics(
        self,
        room_area: float,
        room_bounds: dict,
        image_size: Tuple[int, int]
    ) -> RoomType:
        """
        Infer room type from size and position characteristics.
        
        Requirement 5.4: Assign default name based on size/position.
        
        Heuristics:
        - Largest room is likely living room
        - Small rooms near edges might be bathrooms
        - Medium rooms are likely bedrooms
        - Very small rooms might be storage
        
        Args:
            room_area: Room area in pixels
            room_bounds: Room bounding box
            image_size: Image dimensions
            
        Returns:
            Inferred RoomType
        """
        img_width, img_height = image_size
        total_area = img_width * img_height
        
        # Calculate relative area
        area_ratio = room_area / total_area if total_area > 0 else 0
        
        # Get room position
        x = room_bounds.get('x', 0)
        y = room_bounds.get('y', 0)
        w = room_bounds.get('width', 0)
        h = room_bounds.get('height', 0)
        
        # Calculate aspect ratio
        aspect_ratio = w / h if h > 0 else 1
        
        # Heuristics for room type inference
        if area_ratio > 0.15:
            # Large room - likely living room
            return RoomType.LIVING
        elif area_ratio < 0.03:
            # Very small room
            if aspect_ratio < 0.6 or aspect_ratio > 1.7:
                # Elongated small room - might be hallway
                return RoomType.HALLWAY
            else:
                # Small square-ish room - might be bathroom or storage
                return RoomType.BATHROOM
        elif area_ratio < 0.06:
            # Small room - could be bathroom, kitchen, or balcony
            # Check if near edge (balcony tends to be at edges)
            center_x = x + w / 2
            center_y = y + h / 2
            
            edge_threshold = 0.15
            near_edge = (
                center_x < img_width * edge_threshold or
                center_x > img_width * (1 - edge_threshold) or
                center_y < img_height * edge_threshold or
                center_y > img_height * (1 - edge_threshold)
            )
            
            if near_edge and aspect_ratio > 1.5:
                return RoomType.BALCONY
            else:
                return RoomType.BATHROOM
        else:
            # Medium room - likely bedroom
            return RoomType.BEDROOM


def detect_text(
    image: np.ndarray,
    language: Optional[str] = None
) -> OCRResult:
    """
    Convenience function to detect text with default settings.
    
    Args:
        image: Input image
        language: OCR language
        
    Returns:
        OCRResult with detected labels
    """
    service = OCRService()
    return service.detect_text(image, language)


def associate_labels_with_rooms(
    rooms: List[dict],
    labels: List[TextLabel],
    image_size: Tuple[int, int]
) -> List[RoomLabelAssociation]:
    """
    Convenience function to associate labels with rooms.
    
    Args:
        rooms: List of detected rooms
        labels: List of detected text labels
        image_size: Image dimensions
        
    Returns:
        List of RoomLabelAssociation objects
    """
    associator = LabelAssociator()
    return associator.associate_labels(rooms, labels, image_size)
