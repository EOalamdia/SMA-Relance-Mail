"""Endpoints for reminder_jobs — list, generate, trigger, cancel, send-pending."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import GenerateResponse, ReminderJobListResponse, ReminderJobOut
from .service import generate_reminder_jobs, send_pending_jobs

router = APIRouter(prefix="/v1/reminder-jobs", tags=["Reminder Jobs"])

_SCHEMA = "sma_relance"
_TABLE = "reminder_jobs"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=ReminderJobListResponse)
def list_reminder_jobs(
    job_status: str | None = Query(None, alias="status"),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*")
    if job_status:
        query = query.eq("status", job_status)
    response = query.order("scheduled_for", desc=True).execute()
    rows = response.data or []
    return ReminderJobListResponse(items=[ReminderJobOut(**r) for r in rows], count=len(rows))


@router.get("/{item_id}", response_model=ReminderJobOut)
def get_reminder_job(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job de relance non trouve.")
    return ReminderJobOut(**response.data[0])


@router.post("/generate", response_model=GenerateResponse)
def generate_jobs(_user: UserContext = Depends(get_current_user)):
    """Generation batch de tous les reminder_jobs (idempotent)."""
    result = generate_reminder_jobs()
    return GenerateResponse(**result)


@router.post("/send-pending")
def send_pending(_user: UserContext = Depends(get_current_user)):
    """Envoyer les jobs pending dont scheduled_for <= now."""
    result = send_pending_jobs()
    return result


@router.post("/{item_id}/trigger", response_model=ReminderJobOut)
def trigger_reminder_job(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    """Declenchement manuel d'un job de relance."""
    from core.email_sender import send_reminder_email

    job_resp = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not job_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job de relance non trouve.")
    job = job_resp.data[0]
    if job["status"] in ("sent", "cancelled"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Job en statut {job['status']}, envoi impossible.")

    now_ts = datetime.now(timezone.utc).isoformat()
    try:
        success = send_reminder_email(job)
        new_status = "sent" if success else "failed"
        error_msg = None if success else "Email sending failed"
    except Exception as exc:
        new_status = "failed"
        error_msg = str(exc)[:500]

    updated = _table().update({
        "status": new_status,
        "attempt_count": job["attempt_count"] + 1,
        "last_attempt_at": now_ts,
        "error_message": error_msg,
    }).eq("id", str(item_id)).execute()

    if not updated.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return ReminderJobOut(**updated.data[0])


@router.post("/{item_id}/cancel", response_model=ReminderJobOut)
def cancel_reminder_job(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    """Annuler un job de relance."""
    exists = _table().select("id, status").eq("id", str(item_id)).limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job de relance non trouve.")
    if exists.data[0]["status"] in ("sent", "cancelled"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Job en statut {exists.data[0]['status']}, annulation impossible.")

    response = _table().update({"status": "cancelled"}).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de l'annulation.")
    return ReminderJobOut(**response.data[0])
