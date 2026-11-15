from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, AuditLog
from app.models.academic import Faculty
from app.models.session import ClassSession, ClassLog
from app.models.event import IncidentRecord, ReviewAction, IncidentStatus, IncidentType
from app.core.dependencies import get_current_user, require_faculty, require_hod
from app.core.websockets import manager
from app.schemas.event import (
    IncidentRecordOut, IncidentAcknowledgeRequest,
    IncidentDismissRequest, IncidentEscalateRequest, IncidentHODResolveRequest
)

router = APIRouter(prefix="/api/incidents", tags=["Safety Centre"])


@router.get("/active", response_model=List[IncidentRecordOut])
async def get_active_incidents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(IncidentRecord).where(
        IncidentRecord.status.in_([
            IncidentStatus.PENDING_FACULTY_REVIEW,
            IncidentStatus.ESCALATED_TO_HOD
        ])
    ).order_by(IncidentRecord.timestamp.desc()).options(
        selectinload(IncidentRecord.class_session).selectinload(ClassSession.subject)
    )
    res = await db.execute(query)
    incidents = res.scalars().all()

    items = []
    for inc in incidents:
        cs = inc.class_session
        items.append(IncidentRecordOut(
            id=inc.id,
            class_session_id=inc.class_session_id,
            room_number=cs.room_number if cs else "Unknown",
            subject_name=cs.subject.name if cs and cs.subject else "Class Session",
            incident_type=inc.incident_type.value,
            confidence=inc.confidence,
            timestamp=inc.timestamp,
            evidence_snapshot_url=inc.evidence_snapshot_url,
            status=inc.status.value,
            faculty_notes=inc.faculty_notes,
            hod_decision=inc.hod_decision,
            is_simulated=inc.is_simulated,
            created_at=inc.created_at
        ))
    return items


@router.get("/history", response_model=List[IncidentRecordOut])
async def get_incident_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(IncidentRecord).order_by(IncidentRecord.timestamp.desc()).options(
        selectinload(IncidentRecord.class_session).selectinload(ClassSession.subject)
    )
    res = await db.execute(query)
    incidents = res.scalars().all()

    items = []
    for inc in incidents:
        cs = inc.class_session
        items.append(IncidentRecordOut(
            id=inc.id,
            class_session_id=inc.class_session_id,
            room_number=cs.room_number if cs else "Unknown",
            subject_name=cs.subject.name if cs and cs.subject else "Class Session",
            incident_type=inc.incident_type.value,
            confidence=inc.confidence,
            timestamp=inc.timestamp,
            evidence_snapshot_url=inc.evidence_snapshot_url,
            status=inc.status.value,
            faculty_notes=inc.faculty_notes,
            hod_decision=inc.hod_decision,
            is_simulated=inc.is_simulated,
            created_at=inc.created_at
        ))
    return items


@router.post("/acknowledge")
async def acknowledge_incident(
    req: IncidentAcknowledgeRequest,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    inc = await db.get(IncidentRecord, req.incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = IncidentStatus.ACKNOWLEDGED_FACULTY
    inc.faculty_notes = req.notes

    # Add review action
    action = ReviewAction(
        incident_id=inc.id,
        reviewer_id=current_user.id,
        action="ACKNOWLEDGE",
        reason=req.notes or "Faculty acknowledged alert after verifying classroom condition."
    )
    db.add(action)

    # Class log
    log = ClassLog(
        class_session_id=inc.class_session_id,
        event_type="INCIDENT_ACKNOWLEDGED",
        description=f"Safety alert {inc.incident_type.value} verified and acknowledged by {current_user.full_name}.",
        source="FACULTY"
    )
    db.add(log)

    await db.commit()

    # WebSocket broadcast
    await manager.broadcast_global(
        "INCIDENT_STATUS_CHANGED",
        {"incident_id": inc.id, "status": inc.status.value, "updated_by": current_user.full_name}
    )

    return {"message": "Incident acknowledged successfully", "status": inc.status.value}


@router.post("/dismiss")
async def dismiss_incident(
    req: IncidentDismissRequest,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    inc = await db.get(IncidentRecord, req.incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = IncidentStatus.DISMISSED_FACULTY
    inc.faculty_notes = req.reason

    action = ReviewAction(
        incident_id=inc.id,
        reviewer_id=current_user.id,
        action="DISMISS",
        reason=req.reason
    )
    db.add(action)
    await db.commit()

    return {"message": "Incident dismissed as false positive / non-critical", "status": inc.status.value}


@router.post("/escalate")
async def escalate_incident(
    req: IncidentEscalateRequest,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    inc = await db.get(IncidentRecord, req.incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = IncidentStatus.ESCALATED_TO_HOD
    inc.faculty_notes = f"Escalated by {current_user.full_name}: {req.escalation_reason}"

    action = ReviewAction(
        incident_id=inc.id,
        reviewer_id=current_user.id,
        action="ESCALATE",
        reason=req.escalation_reason
    )
    db.add(action)

    # Add audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="INCIDENT_ESCALATED",
        resource="SAFETY",
        details=f"Incident {inc.id} escalated to HOD. Reason: {req.escalation_reason}"
    )
    db.add(audit)

    await db.commit()

    # WebSocket broadcast to HOD
    await manager.broadcast_global(
        "INCIDENT_ESCALATED",
        {"incident_id": inc.id, "reason": req.escalation_reason, "escalated_by": current_user.full_name}
    )

    return {"message": "Incident escalated to HOD for executive review", "status": inc.status.value}


@router.post("/resolve")
async def resolve_incident_hod(
    req: IncidentHODResolveRequest,
    current_user: User = Depends(require_hod),
    db: AsyncSession = Depends(get_db)
):
    inc = await db.get(IncidentRecord, req.incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = IncidentStatus(req.status)
    inc.hod_decision = req.decision
    inc.resolved_by_hod_id = current_user.id

    action = ReviewAction(
        incident_id=inc.id,
        reviewer_id=current_user.id,
        action="HOD_RESOLVE",
        reason=req.decision
    )
    db.add(action)

    audit = AuditLog(
        user_id=current_user.id,
        action="HOD_INCIDENT_RESOLVED",
        resource="SAFETY",
        details=f"HOD {current_user.full_name} set decision on Incident {inc.id}: {req.decision}"
    )
    db.add(audit)

    await db.commit()

    await manager.broadcast_global(
        "INCIDENT_STATUS_CHANGED",
        {"incident_id": inc.id, "status": inc.status.value, "decision": req.decision}
    )

    return {"message": "Incident resolution recorded by HOD", "status": inc.status.value}
