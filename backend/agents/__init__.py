"""Agents package with lazy exports to avoid import side effects."""

from typing import Any

__all__ = ["AgentManager", "Orchestrator"]


def __getattr__(name: str) -> Any:
    if name == "AgentManager":
        from .agent_manager import AgentManager
        return AgentManager
    if name == "Orchestrator":
        from .STAGE.orchestrator import Orchestrator
        return Orchestrator
    raise AttributeError(f"module 'agents' has no attribute '{name}'")

