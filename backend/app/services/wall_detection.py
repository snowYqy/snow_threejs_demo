"""
Wall Detection Service

Requirements covered:
- 3.1: Identify wall segments using edge detection
- 3.2: Distinguish between exterior and interior walls
- 3.3: Detect wall thickness
- 3.4: Output wall coordinates as line segments
"""
import cv2
import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum


class WallType(Enum):
    """Wall classification types"""
    EXTERIOR = "exterior"
    INTERIOR = "interior"
    UNKNOWN = "unknown"


@dataclass
class WallSegment:
    """Represents a detected wall segment"""
    start: Tuple[int, int]  # (x, y) start point
    end: Tuple[int, int]    # (x, y) end point
    thickness: float        # Estimated wall thickness in pixels
    wall_type: WallType     # Exterior or interior wall
    confidence: float       # Detection confidence 0-1
    
    @property
    def length(self) -> float:
        """Calculate wall segment length"""
        dx = self.end[0] - self.start[0]
        dy = self.end[1] - self.start[1]
        return np.sqrt(dx * dx + dy * dy)
    
    @property
    def angle(self) -> float:
        """Calculate wall angle in degrees"""
        dx = self.end[0] - self.start[0]
        dy = self.end[1] - self.start[1]
        return np.degrees(np.arctan2(dy, dx))
    
    @property
    def midpoint(self) -> Tuple[float, float]:
        """Calculate wall midpoint"""
        return (
            (self.start[0] + self.end[0]) / 2,
            (self.start[1] + self.end[1]) / 2
        )
    
    @property
    def is_horizontal(self) -> bool:
        """Check if wall is approximately horizontal"""
        angle = abs(self.angle)
        return angle < 15 or angle > 165
    
    @property
    def is_vertical(self) -> bool:
        """Check if wall is approximately vertical"""
        angle = abs(self.angle)
        return 75 < angle < 105
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "start": list(self.start),
            "end": list(self.end),
            "thickness": self.thickness,
            "wall_type": self.wall_type.value,
            "confidence": self.confidence,
            "length": self.length,
            "angle": self.angle
        }


@dataclass
class WallDetectionResult:
    """Result of wall detection"""
    walls: List[WallSegment]
    edges_image: np.ndarray
    binary_image: np.ndarray
    image_size: Tuple[int, int]  # (width, height)
    exterior_boundary: Optional[List[Tuple[int, int]]] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "walls": [w.to_dict() for w in self.walls],
            "image_size": {"width": self.image_size[0], "height": self.image_size[1]},
            "wall_count": len(self.walls),
            "exterior_walls": len([w for w in self.walls if w.wall_type == WallType.EXTERIOR]),
            "interior_walls": len([w for w in self.walls if w.wall_type == WallType.INTERIOR])
        }


class WallDetectionConfig:
    """Configuration for wall detection parameters"""
    
    # Canny edge detection parameters
    CANNY_LOW_THRESHOLD = 30
    CANNY_HIGH_THRESHOLD = 100
    CANNY_APERTURE_SIZE = 3
    
    # Binary threshold parameters - adjusted for colored floor plans
    BINARY_THRESHOLD = 180  # Lower threshold to catch dark walls
    ADAPTIVE_BLOCK_SIZE = 15
    ADAPTIVE_C = 5
    
    # Morphological operation parameters
    MORPH_KERNEL_SIZE = 5
    MORPH_ITERATIONS = 2
    
    # Hough line transform parameters
    HOUGH_RHO = 1
    HOUGH_THETA = np.pi / 180
    HOUGH_THRESHOLD = 80
    HOUGH_MIN_LINE_LENGTH = 50
    HOUGH_MAX_LINE_GAP = 15
    
    # Line merging parameters
    MERGE_ANGLE_THRESHOLD = 5.0      # degrees
    MERGE_DISTANCE_THRESHOLD = 20.0  # pixels
    MERGE_GAP_THRESHOLD = 30.0       # pixels
    
    # Wall filtering parameters
    MIN_WALL_LENGTH = 30             # pixels
    
    # Thickness estimation parameters
    THICKNESS_SAMPLE_POINTS = 5
    DEFAULT_WALL_THICKNESS = 10.0
    
    # Exterior wall detection
    EXTERIOR_MARGIN = 50             # pixels from image edge


class WallDetector:
    """
    Wall detection module for floor plan recognition.
    
    Implements:
    - Canny edge detection
    - Hough line transform
    - Line segment merging
    - Wall classification (exterior/interior)
    - Wall thickness estimation
    """
    
    def __init__(self, config: Optional[WallDetectionConfig] = None):
        self.config = config or WallDetectionConfig()
    
    def detect(self, image: np.ndarray) -> WallDetectionResult:
        """
        Detect walls in a preprocessed floor plan image.
        
        Args:
            image: Preprocessed grayscale image
            
        Returns:
            WallDetectionResult with detected walls and metadata
        """
        height, width = image.shape[:2]
        
        # Step 1: Create binary image
        binary = self._create_binary_image(image)
        
        # Step 2: Apply morphological operations
        binary = self._apply_morphology(binary)
        
        # Step 3: Detect edges using Canny
        edges = self._detect_edges(binary)
        
        # Step 4: Detect lines using Hough transform
        lines = self._detect_lines(edges)
        
        # Step 5: Merge nearby line segments
        merged_lines = self._merge_lines(lines)
        
        # Step 6: Find exterior boundary
        exterior_boundary = self._find_exterior_boundary(binary)
        
        # Step 7: Create wall segments with classification
        walls = self._create_wall_segments(
            merged_lines, binary, exterior_boundary, (width, height)
        )
        
        return WallDetectionResult(
            walls=walls,
            edges_image=edges,
            binary_image=binary,
            image_size=(width, height),
            exterior_boundary=exterior_boundary
        )

    def _create_binary_image(self, image: np.ndarray) -> np.ndarray:
        """
        Create binary image from grayscale.
        
        Uses adaptive thresholding for better results with varying
        lighting conditions in floor plan images.
        
        Args:
            image: Grayscale image
            
        Returns:
            Binary image (walls are white, background is black)
        """
        # Apply adaptive thresholding
        binary = cv2.adaptiveThreshold(
            image,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            self.config.ADAPTIVE_BLOCK_SIZE,
            self.config.ADAPTIVE_C
        )
        
        return binary
    
    def _apply_morphology(self, binary: np.ndarray) -> np.ndarray:
        """
        Apply morphological operations to clean up binary image.
        
        Uses closing operation to connect broken wall segments
        and opening to remove small noise.
        
        Args:
            binary: Binary image
            
        Returns:
            Cleaned binary image
        """
        kernel = np.ones(
            (self.config.MORPH_KERNEL_SIZE, self.config.MORPH_KERNEL_SIZE),
            np.uint8
        )
        
        # Close operation to connect broken lines
        closed = cv2.morphologyEx(
            binary, cv2.MORPH_CLOSE, kernel,
            iterations=self.config.MORPH_ITERATIONS
        )
        
        # Open operation to remove small noise
        opened = cv2.morphologyEx(
            closed, cv2.MORPH_OPEN, kernel,
            iterations=self.config.MORPH_ITERATIONS
        )
        
        return opened
    
    def _detect_edges(self, binary: np.ndarray) -> np.ndarray:
        """
        Detect edges using Canny edge detector.
        
        Requirement 3.1: THE Wall_Detector SHALL identify wall segments 
        using edge detection.
        
        Args:
            binary: Binary image
            
        Returns:
            Edge image
        """
        edges = cv2.Canny(
            binary,
            self.config.CANNY_LOW_THRESHOLD,
            self.config.CANNY_HIGH_THRESHOLD,
            apertureSize=self.config.CANNY_APERTURE_SIZE
        )
        
        return edges
    
    def _detect_lines(self, edges: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect line segments using Hough Line Transform.
        
        Requirement 3.4: THE Wall_Detector SHALL output wall coordinates 
        as line segments.
        
        Args:
            edges: Edge image
            
        Returns:
            List of line segments as (x1, y1, x2, y2) tuples
        """
        lines = cv2.HoughLinesP(
            edges,
            rho=self.config.HOUGH_RHO,
            theta=self.config.HOUGH_THETA,
            threshold=self.config.HOUGH_THRESHOLD,
            minLineLength=self.config.HOUGH_MIN_LINE_LENGTH,
            maxLineGap=self.config.HOUGH_MAX_LINE_GAP
        )
        
        if lines is None:
            return []
        
        # Convert to list of tuples
        return [tuple(line[0]) for line in lines]
    
    def _merge_lines(
        self, 
        lines: List[Tuple[int, int, int, int]]
    ) -> List[Tuple[int, int, int, int]]:
        """
        Merge nearby collinear line segments.
        
        This reduces fragmentation from the Hough transform and creates
        more coherent wall segments.
        
        Args:
            lines: List of line segments
            
        Returns:
            Merged line segments
        """
        if not lines:
            return []
        
        # Group lines by angle (horizontal, vertical, or diagonal)
        horizontal_lines = []
        vertical_lines = []
        diagonal_lines = []
        
        for line in lines:
            x1, y1, x2, y2 = line
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            
            # Normalize angle to [0, 180)
            angle = angle % 180
            
            if angle < 15 or angle > 165:
                horizontal_lines.append(line)
            elif 75 < angle < 105:
                vertical_lines.append(line)
            else:
                diagonal_lines.append(line)
        
        # Merge each group separately
        merged = []
        merged.extend(self._merge_parallel_lines(horizontal_lines, is_horizontal=True))
        merged.extend(self._merge_parallel_lines(vertical_lines, is_horizontal=False))
        merged.extend(diagonal_lines)  # Don't merge diagonals for now
        
        return merged
    
    def _merge_parallel_lines(
        self,
        lines: List[Tuple[int, int, int, int]],
        is_horizontal: bool
    ) -> List[Tuple[int, int, int, int]]:
        """
        Merge parallel lines that are close together.
        
        Args:
            lines: List of parallel line segments
            is_horizontal: True if lines are horizontal
            
        Returns:
            Merged line segments
        """
        if not lines:
            return []
        
        # Sort lines by their perpendicular position
        if is_horizontal:
            # Sort by y coordinate
            lines = sorted(lines, key=lambda l: (l[1] + l[3]) / 2)
        else:
            # Sort by x coordinate
            lines = sorted(lines, key=lambda l: (l[0] + l[2]) / 2)
        
        merged = []
        current_group = [lines[0]]
        
        for line in lines[1:]:
            # Check if line should be merged with current group
            if self._should_merge(current_group[-1], line, is_horizontal):
                current_group.append(line)
            else:
                # Merge current group and start new one
                merged.append(self._merge_line_group(current_group, is_horizontal))
                current_group = [line]
        
        # Don't forget the last group
        merged.append(self._merge_line_group(current_group, is_horizontal))
        
        return merged
    
    def _should_merge(
        self,
        line1: Tuple[int, int, int, int],
        line2: Tuple[int, int, int, int],
        is_horizontal: bool
    ) -> bool:
        """
        Check if two lines should be merged.
        
        Args:
            line1: First line segment
            line2: Second line segment
            is_horizontal: True if lines are horizontal
            
        Returns:
            True if lines should be merged
        """
        x1_1, y1_1, x2_1, y2_1 = line1
        x1_2, y1_2, x2_2, y2_2 = line2
        
        if is_horizontal:
            # Check y distance
            y_dist = abs((y1_2 + y2_2) / 2 - (y1_1 + y2_1) / 2)
            if y_dist > self.config.MERGE_DISTANCE_THRESHOLD:
                return False
            
            # Check x overlap or gap
            min1, max1 = min(x1_1, x2_1), max(x1_1, x2_1)
            min2, max2 = min(x1_2, x2_2), max(x1_2, x2_2)
            gap = max(min1, min2) - min(max1, max2)
            
            return gap < self.config.MERGE_GAP_THRESHOLD
        else:
            # Check x distance
            x_dist = abs((x1_2 + x2_2) / 2 - (x1_1 + x2_1) / 2)
            if x_dist > self.config.MERGE_DISTANCE_THRESHOLD:
                return False
            
            # Check y overlap or gap
            min1, max1 = min(y1_1, y2_1), max(y1_1, y2_1)
            min2, max2 = min(y1_2, y2_2), max(y1_2, y2_2)
            gap = max(min1, min2) - min(max1, max2)
            
            return gap < self.config.MERGE_GAP_THRESHOLD
    
    def _merge_line_group(
        self,
        lines: List[Tuple[int, int, int, int]],
        is_horizontal: bool
    ) -> Tuple[int, int, int, int]:
        """
        Merge a group of lines into a single line.
        
        Args:
            lines: List of lines to merge
            is_horizontal: True if lines are horizontal
            
        Returns:
            Merged line segment
        """
        if len(lines) == 1:
            return lines[0]
        
        if is_horizontal:
            # Average y coordinate, extend x range
            avg_y = int(np.mean([
                (l[1] + l[3]) / 2 for l in lines
            ]))
            min_x = min(min(l[0], l[2]) for l in lines)
            max_x = max(max(l[0], l[2]) for l in lines)
            return (min_x, avg_y, max_x, avg_y)
        else:
            # Average x coordinate, extend y range
            avg_x = int(np.mean([
                (l[0] + l[2]) / 2 for l in lines
            ]))
            min_y = min(min(l[1], l[3]) for l in lines)
            max_y = max(max(l[1], l[3]) for l in lines)
            return (avg_x, min_y, avg_x, max_y)

    def _find_exterior_boundary(
        self, 
        binary: np.ndarray
    ) -> Optional[List[Tuple[int, int]]]:
        """
        Find the exterior boundary of the floor plan.
        
        This is used to distinguish exterior walls from interior walls.
        
        Args:
            binary: Binary image
            
        Returns:
            List of boundary points or None if not found
        """
        # Find contours
        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        
        if not contours:
            return None
        
        # Find the largest contour (assumed to be exterior boundary)
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Simplify the contour
        epsilon = 0.02 * cv2.arcLength(largest_contour, True)
        simplified = cv2.approxPolyDP(largest_contour, epsilon, True)
        
        # Convert to list of tuples
        return [(int(p[0][0]), int(p[0][1])) for p in simplified]
    
    def _create_wall_segments(
        self,
        lines: List[Tuple[int, int, int, int]],
        binary: np.ndarray,
        exterior_boundary: Optional[List[Tuple[int, int]]],
        image_size: Tuple[int, int]
    ) -> List[WallSegment]:
        """
        Create WallSegment objects from detected lines.
        
        Includes wall classification and thickness estimation.
        
        Args:
            lines: Detected line segments
            binary: Binary image for thickness estimation
            exterior_boundary: Exterior boundary points
            image_size: (width, height) of image
            
        Returns:
            List of WallSegment objects
        """
        walls = []
        
        for line in lines:
            x1, y1, x2, y2 = line
            
            # Filter out very short lines
            length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            if length < self.config.MIN_WALL_LENGTH:
                continue
            
            # Estimate wall thickness
            thickness = self._estimate_thickness(binary, line)
            
            # Classify wall type
            wall_type = self._classify_wall(
                line, exterior_boundary, image_size
            )
            
            # Calculate confidence based on length and thickness
            confidence = self._calculate_confidence(length, thickness)
            
            walls.append(WallSegment(
                start=(x1, y1),
                end=(x2, y2),
                thickness=thickness,
                wall_type=wall_type,
                confidence=confidence
            ))
        
        return walls
    
    def _estimate_thickness(
        self,
        binary: np.ndarray,
        line: Tuple[int, int, int, int]
    ) -> float:
        """
        Estimate wall thickness by sampling perpendicular to the wall.
        
        Requirement 3.3: THE Wall_Detector SHALL detect wall thickness.
        
        Args:
            binary: Binary image
            line: Line segment (x1, y1, x2, y2)
            
        Returns:
            Estimated wall thickness in pixels
        """
        x1, y1, x2, y2 = line
        
        # Calculate perpendicular direction
        dx = x2 - x1
        dy = y2 - y1
        length = np.sqrt(dx * dx + dy * dy)
        
        if length == 0:
            return self.config.DEFAULT_WALL_THICKNESS
        
        # Normalize and rotate 90 degrees for perpendicular
        perp_x = -dy / length
        perp_y = dx / length
        
        # Sample at multiple points along the wall
        thicknesses = []
        height, width = binary.shape[:2]
        
        for i in range(self.config.THICKNESS_SAMPLE_POINTS):
            # Sample point along the wall
            t = (i + 1) / (self.config.THICKNESS_SAMPLE_POINTS + 1)
            px = int(x1 + t * dx)
            py = int(y1 + t * dy)
            
            # Measure thickness by scanning perpendicular
            thickness = self._measure_thickness_at_point(
                binary, px, py, perp_x, perp_y, width, height
            )
            
            if thickness > 0:
                thicknesses.append(thickness)
        
        if not thicknesses:
            return self.config.DEFAULT_WALL_THICKNESS
        
        # Use median for robustness
        return float(np.median(thicknesses))
    
    def _measure_thickness_at_point(
        self,
        binary: np.ndarray,
        px: int,
        py: int,
        perp_x: float,
        perp_y: float,
        width: int,
        height: int
    ) -> float:
        """
        Measure wall thickness at a specific point.
        
        Args:
            binary: Binary image
            px, py: Point coordinates
            perp_x, perp_y: Perpendicular direction
            width, height: Image dimensions
            
        Returns:
            Measured thickness in pixels
        """
        max_search = 50  # Maximum search distance
        
        # Search in positive direction
        pos_dist = 0
        for d in range(1, max_search):
            x = int(px + d * perp_x)
            y = int(py + d * perp_y)
            
            if x < 0 or x >= width or y < 0 or y >= height:
                break
            
            if binary[y, x] == 0:  # Found background
                pos_dist = d
                break
        
        # Search in negative direction
        neg_dist = 0
        for d in range(1, max_search):
            x = int(px - d * perp_x)
            y = int(py - d * perp_y)
            
            if x < 0 or x >= width or y < 0 or y >= height:
                break
            
            if binary[y, x] == 0:  # Found background
                neg_dist = d
                break
        
        return float(pos_dist + neg_dist)
    
    def _classify_wall(
        self,
        line: Tuple[int, int, int, int],
        exterior_boundary: Optional[List[Tuple[int, int]]],
        image_size: Tuple[int, int]
    ) -> WallType:
        """
        Classify wall as exterior or interior.
        
        Requirement 3.2: THE Wall_Detector SHALL distinguish between 
        exterior and interior walls.
        
        Args:
            line: Line segment
            exterior_boundary: Exterior boundary points
            image_size: (width, height) of image
            
        Returns:
            WallType classification
        """
        x1, y1, x2, y2 = line
        width, height = image_size
        
        # Check if wall is near image edges (likely exterior)
        margin = self.config.EXTERIOR_MARGIN
        near_edge = (
            min(x1, x2) < margin or
            max(x1, x2) > width - margin or
            min(y1, y2) < margin or
            max(y1, y2) > height - margin
        )
        
        if near_edge:
            return WallType.EXTERIOR
        
        # Check if wall is close to exterior boundary
        if exterior_boundary:
            midpoint = ((x1 + x2) / 2, (y1 + y2) / 2)
            
            min_dist = float('inf')
            for point in exterior_boundary:
                dist = np.sqrt(
                    (midpoint[0] - point[0]) ** 2 +
                    (midpoint[1] - point[1]) ** 2
                )
                min_dist = min(min_dist, dist)
            
            # If close to exterior boundary, classify as exterior
            if min_dist < margin:
                return WallType.EXTERIOR
        
        return WallType.INTERIOR
    
    def _calculate_confidence(self, length: float, thickness: float) -> float:
        """
        Calculate detection confidence based on wall properties.
        
        Args:
            length: Wall length in pixels
            thickness: Wall thickness in pixels
            
        Returns:
            Confidence score 0-1
        """
        # Longer walls are more confident
        length_score = min(1.0, length / 100)
        
        # Reasonable thickness increases confidence
        if 5 <= thickness <= 30:
            thickness_score = 1.0
        elif thickness < 5:
            thickness_score = thickness / 5
        else:
            thickness_score = max(0.5, 1.0 - (thickness - 30) / 50)
        
        return (length_score + thickness_score) / 2


def detect_walls(image: np.ndarray) -> WallDetectionResult:
    """
    Convenience function to detect walls with default settings.
    
    Args:
        image: Preprocessed grayscale image
        
    Returns:
        WallDetectionResult with detected walls
    """
    detector = WallDetector()
    return detector.detect(image)
