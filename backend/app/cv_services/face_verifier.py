import json
import logging
import math
from typing import List, Dict, Optional, Tuple
from app.cv_services.base import DetectionBox

logger = logging.getLogger("classsphere.face_verifier")

# Verification thresholds as defined in PRD Section FR-03
HIGH_CONFIDENCE_THRESHOLD = 0.82
UNCERTAIN_REVIEW_THRESHOLD = 0.50


def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two feature embedding vectors"""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    sim = dot / (norm_a * norm_b)
    # Clamp to [0.0, 1.0]
    return max(0.0, min(1.0, (sim + 1.0) / 2.0))


class FaceVerifier:
    def __init__(self):
        self.high_threshold = HIGH_CONFIDENCE_THRESHOLD
        self.review_threshold = UNCERTAIN_REVIEW_THRESHOLD

    def match_candidate_against_references(
        self,
        candidate_embedding: List[float],
        enrolled_references: List[Dict]
    ) -> Tuple[Optional[int], float, str]:
        """
        Matches a candidate face embedding against a list of enrolled student references.
        Returns: (matched_student_id, best_confidence, verification_verdict)
        verdict: 'MATCH_HIGH', 'REVIEW_QUEUE', or 'NO_MATCH'
        """
        best_student_id: Optional[int] = None
        best_confidence: float = 0.0

        for ref in enrolled_references:
            ref_emb = ref.get("embedding")
            if isinstance(ref_emb, str):
                try:
                    ref_emb = json.loads(ref_emb)
                except Exception:
                    continue

            if not ref_emb:
                continue

            similarity = compute_cosine_similarity(candidate_embedding, ref_emb)
            if similarity > best_confidence:
                best_confidence = similarity
                best_student_id = ref.get("student_id")

        if best_confidence >= self.high_threshold:
            return best_student_id, round(best_confidence, 4), "MATCH_HIGH"
        elif best_confidence >= self.review_threshold:
            return best_student_id, round(best_confidence, 4), "REVIEW_QUEUE"
        else:
            return None, round(best_confidence, 4), "NO_MATCH"
