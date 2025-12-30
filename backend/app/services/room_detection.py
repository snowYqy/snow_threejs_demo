"""
Room Detection Service

Requirements covered:
- 4.1: Identify enclosed areas as rooms
- 4.2: Calculate room center position
- 4.3: Calculate room dimensions (width, depth)
- 4.4: Detect room shape (rectangular, L-shaped, etc.)
"""
import cv2
import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum


class RoomShape(Enum):
    """Room shape classification"""
    RECTANGULAR = "rectangular"
    L_SHAPED = "l_shaped"
    T_SHAPED = "t_shaped"
    U_SHAPED = "u_shaped"
    IRREGULAR = "irregular"


@dataclass
class RoomContour:
    """Represents a detected room contour"""
    id: str
    contour: np.ndarray  # Original contour points
    bounds: Tuple[int, int, int, int]  # (x, y, width, height) bounding rect
    center: Tuple[float, float]  # (x, y) center position
    area: float  # Area in pixels
    perimeter: float  # Perimeter in pixels
    shape: RoomShape  # Detected shape type
    confidence: float  # Detection confidence 0-1
    vertices: List[Tuple[int, int]]  # Simplified polygon vertices
    
    @property
    def width(self) -> int:
        """Room width from bounding rectangle"""
        return self.bounds[2]
    
    @property
    def height(self) -> int:
        """Room height (depth) from bounding rectangle"""
        return self.bounds[3]
    
    @property
    def aspect_ratio(self) -> float:
        """Width to height ratio"""
        if self.height == 0:
            return 0
        return self.width / self.height
    
    @property
    def rectangularity(self) -> float:
        """How rectangular the room is (area / bounding rect area)"""
        rect_area = self.width * self.height
        if rect_area == 0:
            return 0
        return self.area / rect_area
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "bounds": {
                "x": self.bounds[0],
                "y": self.bounds[1],
                "width": self.bounds[2],
                "height": self.bounds[3]
            },
            "center": {"x": self.center[0], "y": self.center[1]},
            "area": self.area,
            "perimeter": self.perimeter,
            "shape": self.shape.value,
            "confidence": self.confidence,
            "vertices": [{"x": v[0], "y": v[1]} for v in self.vertices],
            "aspect_ratio": self.aspect_ratio,
            "rectangularity": self.rectangularity
        }


@dataclass
class RoomDetectionResult:
    """Result of room detection"""
    rooms: List[RoomContour]
    filled_image: np.ndarray  # Image with walls filled
    contour_image: np.ndarray  # Image with detected contours
    image_size: Tuple[int, int]  # (width, height)
    total_room_area: float  # Sum of all room areas
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "rooms": [r.to_dict() for r in self.rooms],
            "image_size": {"width": self.image_size[0], "height": self.image_size[1]},
            "room_count": len(self.rooms),
            "total_room_area": self.total_room_area,
            "shape_distribution": self._get_shape_distribution()
        }
    
    def _get_shape_distribution(self) -> dict:
        """Get count of each room shape type"""
        distribution = {}
        for room in self.rooms:
            shape = room.shape.value
            distribution[shape] = distribution.get(shape, 0) + 1
        return distribution


class RoomDetectionConfig:
    """Configuration for room detection parameters"""
    
    # Contour detection parameters
    # Lowered to detect smaller rooms like bathrooms
    MIN_ROOM_AREA = 5000  # Minimum room area in pixels
    MAX_ROOM_AREA_RATIO = 0.7  # Maximum room area as ratio of image
    MIN_ROOM_AREA_RATIO = 0.005  # Minimum room area as ratio of image
    
    # Morphological operation parameters
    MORPH_KERNEL_SIZE = 3  # Smaller kernel for finer details
    MORPH_CLOSE_ITERATIONS = 3  # Connect broken walls
    MORPH_OPEN_ITERATIONS = 1  # Remove small noise
    
    # Dilation to thicken walls for better closure
    WALL_DILATION_SIZE = 5
    WALL_DILATION_ITERATIONS = 2
    
    # Contour approximation
    CONTOUR_APPROX_EPSILON = 0.02  # Polygon approximation factor
    
    # Shape detection thresholds
    RECTANGULAR_THRESHOLD = 0.70  # Lowered for real floor plans
    L_SHAPE_VERTEX_COUNT = (5, 8)  # Vertex count range for L-shaped rooms
    
    # Confidence calculation
    MIN_CONFIDENCE_AREA = 15000  # Minimum area for full confidence
    IDEAL_RECTANGULARITY = 0.80  # Ideal rectangularity for confidence
    
    # Aspect ratio filtering (to exclude furniture-like shapes)
    MIN_ASPECT_RATIO = 0.15  # More permissive for narrow rooms
    MAX_ASPECT_RATIO = 6.0   # More permissive for elongated rooms
    
    # Minimum rectangularity to be considered a room
    MIN_RECTANGULARITY = 0.3


class RoomDetector:
    """
    Room detection module for floor plan recognition.
    
    Implements:
    - Enclosed area detection using contour analysis
    - Room center and dimension calculation
    - Room shape classification
    - Contour filtering and validation
    """
    
    def __init__(self, config: Optional[RoomDetectionConfig] = None):
        self.config = config or RoomDetectionConfig()
        self._room_counter = 0
    
    def detect(
        self, 
        binary_image: np.ndarray,
        walls_image: Optional[np.ndarray] = None
    ) -> RoomDetectionResult:
        """
        Detect rooms in a preprocessed floor plan image.
        
        Requirement 4.1: THE Room_Detector SHALL identify enclosed areas as rooms.
        
        Args:
            binary_image: Binary image from wall detection (walls are white)
            walls_image: Optional edge image from wall detection
            
        Returns:
            RoomDetectionResult with detected rooms and metadata
        """
        height, width = binary_image.shape[:2]
        self._room_counter = 0
        
        # Step 1: Fill walls to create closed regions
        filled = self._fill_walls(binary_image)
        
        # Step 2: Try flood fill approach first (more reliable)
        rooms = self._detect_rooms_flood_fill(filled)
        
        # Step 3: If flood fill didn't find enough rooms, try contour approach
        if len(rooms) < 2:
            contours = self._find_contours(filled)
            filtered_contours = self._filter_contours(contours, width * height)
            contour_rooms = self._create_rooms(filtered_contours, width * height)
            
            # Use whichever method found more rooms
            if len(contour_rooms) > len(rooms):
                rooms = contour_rooms
        
        # Step 4: Create visualization image
        contour_image = self._create_contour_visualization(
            binary_image, rooms
        )
        
        # Calculate total room area
        total_area = sum(room.area for room in rooms)
        
        return RoomDetectionResult(
            rooms=rooms,
            filled_image=filled,
            contour_image=contour_image,
            image_size=(width, height),
            total_room_area=total_area
        )
    
    def _detect_rooms_flood_fill(
        self, 
        filled_image: np.ndarray
    ) -> List[RoomContour]:
        """
        Detect rooms using flood fill algorithm.
        
        This method is more reliable for detecting enclosed areas
        as it fills each room region separately.
        
        Args:
            filled_image: Binary image with walls as white pixels
            
        Returns:
            List of detected RoomContour objects
        """
        height, width = filled_image.shape[:2]
        image_area = width * height
        
        # Create a copy for flood filling
        # Add 1-pixel border for flood fill to work properly
        padded = cv2.copyMakeBorder(
            filled_image, 1, 1, 1, 1, 
            cv2.BORDER_CONSTANT, value=255
        )
        
        # Create mask for flood fill (must be 2 pixels larger than image)
        mask = np.zeros((height + 4, width + 4), np.uint8)
        
        rooms = []
        fill_color = 128  # Gray color to mark filled regions
        
        # Scan for black pixels (potential room interiors)
        for y in range(1, height + 1):
            for x in range(1, width + 1):
                # Check if this pixel is black (room interior) and not yet filled
                if padded[y, x] == 0:
                    # Reset mask
                    mask.fill(0)
                    
                    # Flood fill from this point
                    rect = cv2.floodFill(
                        padded, mask, (x, y), fill_color,
                        flags=cv2.FLOODFILL_FIXED_RANGE
                    )
                    
                    # rect[0] is the number of pixels filled
                    filled_area = rect[0]
                    
                    # Check if this is a valid room (not too small, not too large)
                    min_area = max(
                        self.config.MIN_ROOM_AREA,
                        image_area * self.config.MIN_ROOM_AREA_RATIO
                    )
                    max_area = image_area * self.config.MAX_ROOM_AREA_RATIO
                    
                    if filled_area >= min_area and filled_area <= max_area:
                        # Extract the filled region as a contour
                        room_mask = (padded == fill_color).astype(np.uint8) * 255
                        
                        # Remove padding
                        room_mask = room_mask[1:-1, 1:-1]
                        
                        # Find contour of this room
                        contours, _ = cv2.findContours(
                            room_mask,
                            cv2.RETR_EXTERNAL,
                            cv2.CHAIN_APPROX_SIMPLE
                        )
                        
                        if contours:
                            contour = max(contours, key=cv2.contourArea)
                            
                            # Validate contour
                            x_c, y_c, w, h = cv2.boundingRect(contour)
                            
                            # Check aspect ratio
                            if h > 0 and w > 0:
                                aspect_ratio = w / h
                                if self.config.MIN_ASPECT_RATIO <= aspect_ratio <= self.config.MAX_ASPECT_RATIO:
                                    # Check rectangularity
                                    rect_area = w * h
                                    rectangularity = filled_area / rect_area if rect_area > 0 else 0
                                    
                                    if rectangularity >= self.config.MIN_RECTANGULARITY:
                                        # Create room object
                                        room = self._create_single_room(
                                            contour, image_area
                                        )
                                        if room:
                                            rooms.append(room)
                    
                    # Mark this region as processed (change to wall color)
                    padded[padded == fill_color] = 255
        
        # Sort rooms by area (largest first)
        rooms.sort(key=lambda r: r.area, reverse=True)
        
        return rooms
    
    def _create_single_room(
        self,
        contour: np.ndarray,
        image_area: int
    ) -> Optional[RoomContour]:
        """
        Create a single RoomContour object from a contour.
        
        Args:
            contour: Room contour
            image_area: Total image area
            
        Returns:
            RoomContour object or None if invalid
        """
        # Generate unique ID
        self._room_counter += 1
        room_id = f"room-{self._room_counter}"
        
        # Calculate bounding rectangle
        x, y, w, h = cv2.boundingRect(contour)
        bounds = (x, y, w, h)
        
        # Calculate center position
        center = self._calculate_center(contour)
        
        # Calculate area and perimeter
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        
        # Simplify contour to polygon
        vertices = self._simplify_contour(contour)
        
        # Detect room shape
        shape = self._detect_shape(contour, vertices, area, bounds)
        
        # Calculate confidence
        confidence = self._calculate_confidence(area, bounds, shape)
        
        return RoomContour(
            id=room_id,
            contour=contour,
            bounds=bounds,
            center=center,
            area=area,
            perimeter=perimeter,
            shape=shape,
            confidence=confidence,
            vertices=vertices
        )
    
    def _fill_walls(self, binary_image: np.ndarray) -> np.ndarray:
        """
        Fill walls to create closed regions for contour detection.
        
        Uses morphological operations to connect broken wall segments
        and create enclosed areas.
        
        Args:
            binary_image: Binary image with walls as white pixels
            
        Returns:
            Filled binary image with thickened walls
        """
        # Step 1: Dilate walls to close small gaps (doors, windows)
        dilation_kernel = np.ones(
            (self.config.WALL_DILATION_SIZE, self.config.WALL_DILATION_SIZE),
            np.uint8
        )
        dilated = cv2.dilate(
            binary_image,
            dilation_kernel,
            iterations=self.config.WALL_DILATION_ITERATIONS
        )
        
        # Step 2: Apply closing to connect remaining gaps
        close_kernel = np.ones(
            (self.config.MORPH_KERNEL_SIZE, self.config.MORPH_KERNEL_SIZE),
            np.uint8
        )
        closed = cv2.morphologyEx(
            dilated,
            cv2.MORPH_CLOSE,
            close_kernel,
            iterations=self.config.MORPH_CLOSE_ITERATIONS
        )
        
        # Step 3: Apply opening to remove small noise
        opened = cv2.morphologyEx(
            closed,
            cv2.MORPH_OPEN,
            close_kernel,
            iterations=self.config.MORPH_OPEN_ITERATIONS
        )
        
        return opened

    def _find_contours(
        self, 
        filled_image: np.ndarray
    ) -> List[np.ndarray]:
        """
        Find contours representing enclosed areas (rooms).
        
        Requirement 4.1: THE Room_Detector SHALL identify enclosed areas as rooms.
        
        Args:
            filled_image: Binary image with filled walls
            
        Returns:
            List of contours representing potential rooms
        """
        height, width = filled_image.shape[:2]
        
        # Invert image so rooms (background/black) become foreground (white)
        inverted = cv2.bitwise_not(filled_image)
        
        # Find all contours using RETR_TREE to get full hierarchy
        contours, hierarchy = cv2.findContours(
            inverted,
            cv2.RETR_TREE,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        if hierarchy is None or len(contours) == 0:
            return []
        
        room_contours = []
        
        # hierarchy[0][i] = [next, prev, first_child, parent]
        for i, contour in enumerate(contours):
            x, y, w, h = cv2.boundingRect(contour)
            area = cv2.contourArea(contour)
            
            # Skip very small contours (noise)
            if area < 1000:
                continue
            
            # Skip contours that touch the image boundary (outer boundary)
            margin = 3
            touches_edge = (
                x <= margin or 
                y <= margin or 
                x + w >= width - margin or 
                y + h >= height - margin
            )
            
            # Get hierarchy info
            parent = hierarchy[0][i][3]
            has_children = hierarchy[0][i][2] >= 0
            
            # A room is typically:
            # 1. An inner contour (has a parent) - this is the main case
            # 2. OR a contour that doesn't touch edges and has reasonable size
            
            if parent >= 0:
                # This is an inner contour - likely a room
                room_contours.append(contour)
            elif not touches_edge:
                # Doesn't touch edges - could be an isolated room
                room_contours.append(contour)
        
        return room_contours
    
    def _filter_contours(
        self, 
        contours: List[np.ndarray],
        image_area: int
    ) -> List[np.ndarray]:
        """
        Filter contours by area and shape to identify rooms.
        
        Args:
            contours: List of detected contours
            image_area: Total image area in pixels
            
        Returns:
            Filtered list of contours that are likely rooms
        """
        filtered = []
        max_area = image_area * self.config.MAX_ROOM_AREA_RATIO
        min_area = max(
            self.config.MIN_ROOM_AREA,
            image_area * self.config.MIN_ROOM_AREA_RATIO
        )
        
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Filter by minimum area
            if area < min_area:
                continue
            
            # Filter by maximum area (avoid detecting entire image as room)
            if area > max_area:
                continue
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by aspect ratio
            if h > 0 and w > 0:
                aspect_ratio = w / h
                if aspect_ratio < self.config.MIN_ASPECT_RATIO or aspect_ratio > self.config.MAX_ASPECT_RATIO:
                    continue
            
            # Filter by rectangularity (rooms should fill their bounding box reasonably)
            rect_area = w * h
            if rect_area > 0:
                rectangularity = area / rect_area
                if rectangularity < self.config.MIN_RECTANGULARITY:
                    continue
            
            filtered.append(contour)
        
        return filtered
    
    def _create_rooms(
        self, 
        contours: List[np.ndarray],
        image_area: int
    ) -> List[RoomContour]:
        """
        Create RoomContour objects from filtered contours.
        
        Requirements:
        - 4.2: Calculate room center position
        - 4.3: Calculate room dimensions (width, depth)
        - 4.4: Detect room shape
        
        Args:
            contours: Filtered contours
            image_area: Total image area
            
        Returns:
            List of RoomContour objects
        """
        rooms = []
        
        for contour in contours:
            # Generate unique ID
            self._room_counter += 1
            room_id = f"room-{self._room_counter}"
            
            # Calculate bounding rectangle (Requirement 4.3)
            x, y, w, h = cv2.boundingRect(contour)
            bounds = (x, y, w, h)
            
            # Calculate center position (Requirement 4.2)
            center = self._calculate_center(contour)
            
            # Calculate area and perimeter
            area = cv2.contourArea(contour)
            perimeter = cv2.arcLength(contour, True)
            
            # Simplify contour to polygon
            vertices = self._simplify_contour(contour)
            
            # Detect room shape (Requirement 4.4)
            shape = self._detect_shape(contour, vertices, area, bounds)
            
            # Calculate confidence
            confidence = self._calculate_confidence(area, bounds, shape)
            
            rooms.append(RoomContour(
                id=room_id,
                contour=contour,
                bounds=bounds,
                center=center,
                area=area,
                perimeter=perimeter,
                shape=shape,
                confidence=confidence,
                vertices=vertices
            ))
        
        # Sort rooms by area (largest first)
        rooms.sort(key=lambda r: r.area, reverse=True)
        
        return rooms
    
    def _calculate_center(self, contour: np.ndarray) -> Tuple[float, float]:
        """
        Calculate the center position of a room contour.
        
        Requirement 4.2: THE Room_Detector SHALL calculate room center position.
        
        Uses image moments to find the centroid, which is more accurate
        than bounding box center for irregular shapes.
        
        Args:
            contour: Room contour
            
        Returns:
            (x, y) center coordinates
        """
        moments = cv2.moments(contour)
        
        if moments["m00"] == 0:
            # Fallback to bounding box center
            x, y, w, h = cv2.boundingRect(contour)
            return (x + w / 2, y + h / 2)
        
        cx = moments["m10"] / moments["m00"]
        cy = moments["m01"] / moments["m00"]
        
        return (cx, cy)
    
    def _simplify_contour(
        self, 
        contour: np.ndarray
    ) -> List[Tuple[int, int]]:
        """
        Simplify contour to a polygon with fewer vertices.
        
        Args:
            contour: Original contour
            
        Returns:
            List of (x, y) vertex coordinates
        """
        # Calculate epsilon based on perimeter
        perimeter = cv2.arcLength(contour, True)
        epsilon = self.config.CONTOUR_APPROX_EPSILON * perimeter
        
        # Approximate polygon
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Convert to list of tuples
        vertices = [(int(p[0][0]), int(p[0][1])) for p in approx]
        
        return vertices

    def _detect_shape(
        self,
        contour: np.ndarray,
        vertices: List[Tuple[int, int]],
        area: float,
        bounds: Tuple[int, int, int, int]
    ) -> RoomShape:
        """
        Detect the shape type of a room.
        
        Requirement 4.4: THE Room_Detector SHALL detect room shape 
        (rectangular, L-shaped, etc.)
        
        Args:
            contour: Original contour
            vertices: Simplified polygon vertices
            area: Room area
            bounds: Bounding rectangle (x, y, w, h)
            
        Returns:
            Detected RoomShape
        """
        vertex_count = len(vertices)
        x, y, w, h = bounds
        rect_area = w * h
        
        # Calculate rectangularity (how well the shape fills its bounding box)
        rectangularity = area / rect_area if rect_area > 0 else 0
        
        # Check for rectangular shape
        if vertex_count == 4 and rectangularity >= self.config.RECTANGULAR_THRESHOLD:
            return RoomShape.RECTANGULAR
        
        # Check for L-shaped room
        if self._is_l_shaped(vertices, rectangularity):
            return RoomShape.L_SHAPED
        
        # Check for T-shaped room
        if self._is_t_shaped(vertices, rectangularity):
            return RoomShape.T_SHAPED
        
        # Check for U-shaped room
        if self._is_u_shaped(vertices, rectangularity):
            return RoomShape.U_SHAPED
        
        # Default to irregular
        return RoomShape.IRREGULAR
    
    def _is_l_shaped(
        self, 
        vertices: List[Tuple[int, int]], 
        rectangularity: float
    ) -> bool:
        """
        Check if the shape is L-shaped.
        
        L-shaped rooms typically have 6 vertices and fill about 75% 
        of their bounding box.
        
        Args:
            vertices: Polygon vertices
            rectangularity: Area ratio to bounding box
            
        Returns:
            True if L-shaped
        """
        vertex_count = len(vertices)
        
        # L-shape typically has 6 vertices (or 5-8 with approximation)
        min_v, max_v = self.config.L_SHAPE_VERTEX_COUNT
        if not (min_v <= vertex_count <= max_v):
            return False
        
        # L-shape fills about 50-80% of bounding box
        if not (0.45 <= rectangularity <= 0.85):
            return False
        
        # Check for right angles (L-shapes have mostly 90-degree angles)
        right_angle_count = self._count_right_angles(vertices)
        
        # L-shape should have at least 4 right angles
        return right_angle_count >= 4
    
    def _is_t_shaped(
        self, 
        vertices: List[Tuple[int, int]], 
        rectangularity: float
    ) -> bool:
        """
        Check if the shape is T-shaped.
        
        T-shaped rooms typically have 8 vertices and fill about 60-75%
        of their bounding box.
        
        Args:
            vertices: Polygon vertices
            rectangularity: Area ratio to bounding box
            
        Returns:
            True if T-shaped
        """
        vertex_count = len(vertices)
        
        # T-shape typically has 8 vertices
        if not (7 <= vertex_count <= 10):
            return False
        
        # T-shape fills about 50-75% of bounding box
        if not (0.45 <= rectangularity <= 0.80):
            return False
        
        # Check for right angles
        right_angle_count = self._count_right_angles(vertices)
        
        # T-shape should have at least 6 right angles
        return right_angle_count >= 6
    
    def _is_u_shaped(
        self, 
        vertices: List[Tuple[int, int]], 
        rectangularity: float
    ) -> bool:
        """
        Check if the shape is U-shaped.
        
        U-shaped rooms typically have 8 vertices and fill about 60-80%
        of their bounding box.
        
        Args:
            vertices: Polygon vertices
            rectangularity: Area ratio to bounding box
            
        Returns:
            True if U-shaped
        """
        vertex_count = len(vertices)
        
        # U-shape typically has 8 vertices
        if not (7 <= vertex_count <= 10):
            return False
        
        # U-shape fills about 55-80% of bounding box
        if not (0.50 <= rectangularity <= 0.85):
            return False
        
        # Check for right angles
        right_angle_count = self._count_right_angles(vertices)
        
        # U-shape should have at least 6 right angles
        return right_angle_count >= 6
    
    def _count_right_angles(
        self, 
        vertices: List[Tuple[int, int]],
        tolerance: float = 15.0
    ) -> int:
        """
        Count the number of approximately right angles in a polygon.
        
        Args:
            vertices: Polygon vertices
            tolerance: Angle tolerance in degrees
            
        Returns:
            Number of right angles
        """
        if len(vertices) < 3:
            return 0
        
        count = 0
        n = len(vertices)
        
        for i in range(n):
            # Get three consecutive vertices
            p1 = vertices[(i - 1) % n]
            p2 = vertices[i]
            p3 = vertices[(i + 1) % n]
            
            # Calculate vectors
            v1 = (p1[0] - p2[0], p1[1] - p2[1])
            v2 = (p3[0] - p2[0], p3[1] - p2[1])
            
            # Calculate angle using dot product
            dot = v1[0] * v2[0] + v1[1] * v2[1]
            mag1 = np.sqrt(v1[0]**2 + v1[1]**2)
            mag2 = np.sqrt(v2[0]**2 + v2[1]**2)
            
            if mag1 == 0 or mag2 == 0:
                continue
            
            cos_angle = dot / (mag1 * mag2)
            cos_angle = np.clip(cos_angle, -1, 1)
            angle = np.degrees(np.arccos(cos_angle))
            
            # Check if angle is approximately 90 degrees
            if abs(angle - 90) <= tolerance:
                count += 1
        
        return count
    
    def _calculate_confidence(
        self,
        area: float,
        bounds: Tuple[int, int, int, int],
        shape: RoomShape
    ) -> float:
        """
        Calculate detection confidence for a room.
        
        Args:
            area: Room area in pixels
            bounds: Bounding rectangle
            shape: Detected shape
            
        Returns:
            Confidence score 0-1
        """
        x, y, w, h = bounds
        rect_area = w * h
        rectangularity = area / rect_area if rect_area > 0 else 0
        
        # Area score - larger rooms are more confident
        area_score = min(1.0, area / self.config.MIN_CONFIDENCE_AREA)
        
        # Shape score - rectangular rooms are more confident
        if shape == RoomShape.RECTANGULAR:
            shape_score = 1.0
        elif shape in (RoomShape.L_SHAPED, RoomShape.T_SHAPED, RoomShape.U_SHAPED):
            shape_score = 0.85
        else:
            shape_score = 0.6
        
        # Rectangularity score
        rect_score = min(1.0, rectangularity / self.config.IDEAL_RECTANGULARITY)
        
        # Combined confidence
        confidence = (area_score * 0.3 + shape_score * 0.4 + rect_score * 0.3)
        
        return round(confidence, 3)
    
    def _create_contour_visualization(
        self,
        original_image: np.ndarray,
        rooms: List[RoomContour]
    ) -> np.ndarray:
        """
        Create a visualization image with detected room contours.
        
        Args:
            original_image: Original binary image
            rooms: Detected rooms
            
        Returns:
            Visualization image (BGR)
        """
        # Convert to BGR for colored visualization
        if len(original_image.shape) == 2:
            vis_image = cv2.cvtColor(original_image, cv2.COLOR_GRAY2BGR)
        else:
            vis_image = original_image.copy()
        
        # Define colors for different shapes
        shape_colors = {
            RoomShape.RECTANGULAR: (0, 255, 0),    # Green
            RoomShape.L_SHAPED: (255, 165, 0),     # Orange
            RoomShape.T_SHAPED: (255, 0, 255),     # Magenta
            RoomShape.U_SHAPED: (0, 255, 255),     # Cyan
            RoomShape.IRREGULAR: (128, 128, 128),  # Gray
        }
        
        for room in rooms:
            color = shape_colors.get(room.shape, (0, 255, 0))
            
            # Draw contour
            cv2.drawContours(vis_image, [room.contour], -1, color, 2)
            
            # Draw bounding rectangle
            x, y, w, h = room.bounds
            cv2.rectangle(vis_image, (x, y), (x + w, y + h), (255, 0, 0), 1)
            
            # Draw center point
            cx, cy = int(room.center[0]), int(room.center[1])
            cv2.circle(vis_image, (cx, cy), 5, (0, 0, 255), -1)
            
            # Draw room ID
            cv2.putText(
                vis_image, room.id, (x + 5, y + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1
            )
        
        return vis_image


def detect_rooms(
    binary_image: np.ndarray,
    walls_image: Optional[np.ndarray] = None
) -> RoomDetectionResult:
    """
    Convenience function to detect rooms with default settings.
    
    Args:
        binary_image: Binary image from wall detection
        walls_image: Optional edge image from wall detection
        
    Returns:
        RoomDetectionResult with detected rooms
    """
    detector = RoomDetector()
    return detector.detect(binary_image, walls_image)
