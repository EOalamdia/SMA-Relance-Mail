"""Schemas for items feature (demo CRUD).

PLACEHOLDER: Renommer ces schemas et adapter les champs au domaine metier
de la nouvelle app lors du clonage du starter.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class ItemOut(BaseModel):
    """Representation complete d'un item retourne par l'API."""

    id: UUID
    name: str
    description: str | None = None
    # PLACEHOLDER: type a affiner selon le domaine metier (ex: class ItemMetadata(BaseModel): ...)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItemsListResponse(BaseModel):
    """Reponse de la liste des items."""

    items: list[ItemOut]
    count: int


# ---------------------------------------------------------------------------
# Input — creation
# ---------------------------------------------------------------------------

class ItemCreate(BaseModel):
    """Payload de creation d'un item. PLACEHOLDER: adapter les champs au besoin."""

    name: str = Field(..., min_length=1, max_length=255, description="Nom de l'item (obligatoire).")
    description: str | None = Field(None, max_length=2000, description="Description libre.")
    # PLACEHOLDER: remplacer par un modele structure si le schema metadata est connu
    metadata: dict[str, Any] = Field(default_factory=dict, description="Donnees JSON libres.")


# ---------------------------------------------------------------------------
# Input — mise a jour partielle
# ---------------------------------------------------------------------------

class ItemUpdate(BaseModel):
    """Payload de mise a jour partielle (PATCH). Tous les champs sont optionnels."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    metadata: dict[str, Any] | None = None
