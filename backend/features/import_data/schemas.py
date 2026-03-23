"""Schemas for CSV import."""
from __future__ import annotations

from pydantic import BaseModel


class ImportResult(BaseModel):
    total_rows: int
    imported: int
    skipped: int
    errors: list[str]
