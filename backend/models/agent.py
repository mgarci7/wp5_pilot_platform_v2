from dataclasses import dataclass


@dataclass
class Agent:
    """Represents an AI agent in the simulation.

    In the STAGE framework, agent selection and behaviour are controlled
    by the Director; the Agent model carries the agent's name and persona.
    """

    name: str
    persona: str = ""  # Personality description for consistent behavior

    def __repr__(self) -> str:
        if self.persona:
            return f"Agent(name='{self.name}', persona='{self.persona[:30]}...')"
        return f"Agent(name='{self.name}')"
