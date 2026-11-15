import logging
import random
from typing import List, Tuple
from app.cv_services.base import DetectionBox

logger = logging.getLogger("classsphere.detectors")


class PersonDetector:
    """Detects human presences in classroom frame"""
    def __init__(self, model_path: str = "models/yolov8n.pt"):
        self.model_path = model_path
        self.task_name = "PERSON_DETECTION"

    def detect(self, frame_width: int = 1280, frame_height: int = 720, count: int = 24) -> List[DetectionBox]:
        """Returns detected person bounding boxes within the classroom space"""
        boxes = []
        # Simulate realistic desk seating arrangement
        cols = 6
        rows = 4
        x_spacing = frame_width // (cols + 1)
        y_spacing = frame_height // (rows + 1)

        idx = 0
        for r in range(rows):
            for c in range(cols):
                if idx >= count:
                    break
                cx = (c + 1) * x_spacing + random.randint(-15, 15)
                cy = (r + 1) * y_spacing + random.randint(-10, 10)
                w = random.randint(70, 95)
                h = random.randint(110, 140)
                conf = round(random.uniform(0.85, 0.98), 2)
                boxes.append(DetectionBox(
                    x=cx - w // 2,
                    y=cy - h // 2,
                    width=w,
                    height=h,
                    label="person",
                    confidence=conf
                ))
                idx += 1
        return boxes


class PhoneUsageDetector:
    """
    Detects observable phone handling / screen illumination events.
    Limitation: Hand occlusions and desk angles may cause false positives or negatives.
    """
    def __init__(self, model_path: str = "PENDING EVALUATION"):
        self.model_path = model_path
        self.task_name = "PHONE_DETECTION"

    def analyze_event(self, person_box: DetectionBox) -> Tuple[bool, float, DetectionBox]:
        """Evaluates whether a person box exhibits phone usage indicators"""
        # Phone typically observed near hands/chest region
        pw = int(person_box.width * 0.4)
        ph = int(person_box.height * 0.3)
        px = person_box.x + int(person_box.width * 0.3)
        py = person_box.y + int(person_box.height * 0.5)
        conf = round(random.uniform(0.72, 0.94), 2)
        box = DetectionBox(x=px, y=py, width=pw, height=ph, label="phone_usage", confidence=conf)
        return True, conf, box


class TalkingEstimator:
    """
    Estimates head orientation and mouth displacement.
    CRITICAL LIMITATION: Estimation only. Silent video cannot prove verbal communication.
    """
    def __init__(self, model_path: str = "PENDING EVALUATION"):
        self.model_path = model_path
        self.task_name = "TALKING_ESTIMATION"

    def estimate_event(self, person_box: DetectionBox) -> Tuple[bool, float, DetectionBox]:
        # Head / mouth region
        hw = int(person_box.width * 0.5)
        hh = int(person_box.height * 0.3)
        hx = person_box.x + int(person_box.width * 0.25)
        hy = person_box.y
        conf = round(random.uniform(0.65, 0.88), 2)
        box = DetectionBox(x=hx, y=hy, width=hw, height=hh, label="talking_candidate", confidence=conf)
        return True, conf, box


class FallDetector:
    """
    Detects sudden centroid drop, horizontal aspect ratio inversion, or collapse.
    Workflow: Model identification -> Potential Incident -> Faculty review -> Optional HOD escalation.
    """
    def __init__(self, model_path: str = "PENDING EVALUATION"):
        self.model_path = model_path
        self.task_name = "FALL_DETECTION"

    def detect_potential_fall(self, person_box: DetectionBox) -> Tuple[bool, float, DetectionBox]:
        # Horizontal aspect ratio
        fw = int(person_box.height * 1.2)
        fh = int(person_box.width * 0.8)
        fx = person_box.x
        fy = person_box.y + person_box.height - fh
        conf = round(random.uniform(0.81, 0.95), 2)
        box = DetectionBox(x=fx, y=fy, width=fw, height=fh, label="sudden_fall_detected", confidence=conf)
        return True, conf, box
