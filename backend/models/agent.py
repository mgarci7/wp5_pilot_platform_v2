from dataclasses import dataclass


@dataclass
class Agent:
    """Represents an AI agent in the simulation.

    In the STAGE framework, agent selection and behaviour are controlled
    by the Director; the Agent model carries the visible name and an optional
    persona used to keep behaviour consistent.
    """

    name: str
    persona: str = ""

    def __repr__(self) -> str:
        return f"Agent(name='{self.name}', persona='{self.persona}')"
