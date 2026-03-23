"""CSV import service logic."""
from __future__ import annotations

import csv
import io
import logging

from core.supabase import get_schema_table

logger = logging.getLogger("sma.import_data.service")

_SCHEMA = "sma_relance"


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


def import_organizations_csv(content: str) -> dict:
    """Import organizations from CSV.

    Expected columns: name, type_name, total_employees
    """
    stats = {"total_rows": 0, "imported": 0, "skipped": 0, "errors": []}
    reader = csv.DictReader(io.StringIO(content))

    # Pre-load org types mapping
    types_resp = _table("organization_types").select("id, name").is_("archived_at", "null").execute()
    type_map = {t["name"].lower().strip(): t["id"] for t in (types_resp.data or [])}

    for row_num, row in enumerate(reader, start=2):
        stats["total_rows"] += 1
        try:
            name = row.get("name", "").strip()
            if not name:
                stats["errors"].append(f"Ligne {row_num}: nom vide")
                stats["skipped"] += 1
                continue

            type_name = row.get("type_name", "").strip().lower()
            type_id = type_map.get(type_name) if type_name else None

            total_emp = row.get("total_employees", "").strip()
            total_employees = int(total_emp) if total_emp else None

            data = {"name": name, "total_employees": total_employees}
            if type_id:
                data["organization_type_id"] = type_id

            _table("organizations").insert(data).execute()
            stats["imported"] += 1

        except Exception as exc:
            stats["errors"].append(f"Ligne {row_num}: {exc}")
            stats["skipped"] += 1

    return stats


def import_sessions_csv(content: str) -> dict:
    """Import training sessions from CSV.

    Expected columns: organization_name, course_code, session_date, status
    """
    stats = {"total_rows": 0, "imported": 0, "skipped": 0, "errors": []}
    reader = csv.DictReader(io.StringIO(content))

    # Pre-load organizations mapping
    orgs_resp = _table("organizations").select("id, normalized_name").is_("archived_at", "null").execute()
    org_map = {o["normalized_name"]: o["id"] for o in (orgs_resp.data or []) if o.get("normalized_name")}

    # Pre-load courses mapping
    courses_resp = _table("training_courses").select("id, code").is_("archived_at", "null").execute()
    course_map = {c["code"].lower().strip(): c["id"] for c in (courses_resp.data or [])}

    for row_num, row in enumerate(reader, start=2):
        stats["total_rows"] += 1
        try:
            org_name = row.get("organization_name", "").strip().lower()
            course_code = row.get("course_code", "").strip().lower()
            session_date = row.get("session_date", "").strip()
            session_status = row.get("status", "completed").strip()

            org_id = org_map.get(org_name)
            if not org_id:
                stats["errors"].append(f"Ligne {row_num}: organisation '{row.get('organization_name', '')}' non trouvee")
                stats["skipped"] += 1
                continue

            course_id = course_map.get(course_code)
            if not course_id:
                stats["errors"].append(f"Ligne {row_num}: formation '{row.get('course_code', '')}' non trouvee")
                stats["skipped"] += 1
                continue

            if not session_date:
                stats["errors"].append(f"Ligne {row_num}: date de session vide")
                stats["skipped"] += 1
                continue

            _table("training_sessions").insert({
                "organization_id": org_id,
                "course_id": course_id,
                "session_date": session_date,
                "status": session_status if session_status in ("planned", "completed", "cancelled") else "completed",
                "source": "import",
            }).execute()
            stats["imported"] += 1

        except Exception as exc:
            stats["errors"].append(f"Ligne {row_num}: {exc}")
            stats["skipped"] += 1

    return stats
