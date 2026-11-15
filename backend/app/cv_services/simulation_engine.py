import datetime
import random
from typing import Dict, List, Optional
from app.cv_services.base import FrameMetadata, DetectionBox
from app.cv_services.detectors import PersonDetector, PhoneUsageDetector, TalkingEstimator, FallDetector


class ClassroomSimulationEngine:
    """
    High-fidelity simulation engine for development and demonstration.
    Strictly adheres to PRD:
    'The application must never pretend that a simulated camera or detection is a real camera or verified event.'
    """
    def __init__(self, camera_id: int = 1, room_number: str = "Hall A-101"):
        self.camera_id = camera_id
        self.camera_name = f"CAM-{room_number}-SIM"
        self.room_number = room_number
        self.frame_counter = 0
        self.is_running = True
        self.person_detector = PersonDetector()
        self.phone_detector = PhoneUsageDetector()
        self.talking_estimator = TalkingEstimator()
        self.fall_detector = FallDetector()

    def generate_current_frame_state(self, student_roster: Optional[List[Dict]] = None) -> Dict:
        """
        Produces a simulated frame snapshot with current bounding boxes,
        associated students, and active detections.
        """
        self.frame_counter += 1
        now = datetime.datetime.utcnow()

        persons = self.person_detector.detect(1280, 720, count=len(student_roster) if student_roster else 20)

        # Associate some persons with students if roster provided
        annotated_persons = []
        for i, p in enumerate(persons):
            if student_roster and i < len(student_roster):
                p.student_id = student_roster[i].get("id")
                p.roll_number = student_roster[i].get("roll_number")
            annotated_persons.append({
                "x": p.x, "y": p.y, "width": p.width, "height": p.height,
                "label": p.label, "confidence": p.confidence,
                "student_id": p.student_id, "roll_number": p.roll_number
            })

        # Generate occasional simulated detections
        simulated_events = []
        # Random phone event
        if len(annotated_persons) > 2 and random.random() < 0.35:
            target = random.choice(annotated_persons[:5])
            simulated_events.append({
                "type": "PHONE_USAGE",
                "student_id": target.get("student_id"),
                "roll_number": target.get("roll_number"),
                "confidence": round(random.uniform(0.78, 0.93), 2),
                "timestamp": now.isoformat(),
                "box": {"x": target["x"] + 15, "y": target["y"] + 45, "width": 25, "height": 35}
            })

        # Random talking estimation
        if len(annotated_persons) > 4 and random.random() < 0.40:
            target = random.choice(annotated_persons[5:12])
            simulated_events.append({
                "type": "TALKING",
                "student_id": target.get("student_id"),
                "roll_number": target.get("roll_number"),
                "confidence": round(random.uniform(0.68, 0.86), 2),
                "timestamp": now.isoformat(),
                "box": {"x": target["x"] + 10, "y": target["y"] + 5, "width": 30, "height": 25}
            })

        return {
            "mode": "SIMULATION",
            "simulation_label": "[SIMULATED CAMERA - DEMONSTRATION DATA]",
            "frame_id": self.frame_counter,
            "timestamp": now.isoformat(),
            "camera_id": self.camera_id,
            "camera_name": self.camera_name,
            "room_number": self.room_number,
            "stream_health": "HEALTHY",
            "fps": 24.0,
            "resolution": "1920x1080",
            "persons_count": len(annotated_persons),
            "persons": annotated_persons,
            "active_events": simulated_events,
            "diagnostics": {
                "packet_loss_pct": 0.0,
                "latency_ms": 14.2,
                "encoding": "H.264 (simulated)",
                "source": "simulated://classroom_a101"
            }
        }


simulation_engines: Dict[str, ClassroomSimulationEngine] = {
    "A-101": ClassroomSimulationEngine(1, "A-101"),
    "B-204": ClassroomSimulationEngine(2, "B-204"),
    "C-305": ClassroomSimulationEngine(3, "C-305")
}
