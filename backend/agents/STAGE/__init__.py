"""STAGE pipeline package with lazy exports."""

from typing import Any

__all__ = ["Orchestrator", "TurnResult"]


def __getattr__(name: str) -> Any:
    if name in {"Orchestrator", "TurnResult"}:
        from .orchestrator import Orchestrator, TurnResult
        return {"Orchestrator": Orchestrator, "TurnResult": TurnResult}[name]
    raise AttributeError(f"module 'agents.STAGE' has no attribute '{name}'")

