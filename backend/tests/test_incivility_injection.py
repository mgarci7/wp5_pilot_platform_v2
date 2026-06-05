import random
from agents.STAGE.orchestrator import select_incivility_dimensions


def test_select_incivility_dimensions_probabilities():
    """Verify that select_incivility_dimensions has the correct probabilities over 10000 trials."""
    rng = random.Random(42)  # Seed for reproducibility
    
    trials = 10000
    impoliteness_count = 0
    hate_speech_count = 0
    democratic_threats_count = 0
    empty_runs = 0
    
    for _ in range(trials):
        selected = select_incivility_dimensions(rng)
        if not selected:
            empty_runs += 1
            
        if "impoliteness" in selected:
            impoliteness_count += 1
        if "hate_speech" in selected:
            hate_speech_count += 1
        if "democratic_threats" in selected:
            democratic_threats_count += 1
            
    # No empty runs should happen because of fallback
    assert empty_runs == 0
    
    # Expected probabilities including fallback:
    # impoliteness: ~84.3%
    # hate_speech: ~52.7%
    # democratic_threats: ~21.1%
    
    impoliteness_rate = impoliteness_count / trials
    hate_speech_rate = hate_speech_count / trials
    democratic_threats_rate = democratic_threats_count / trials
    
    assert 0.82 <= impoliteness_rate <= 0.87
    assert 0.50 <= hate_speech_rate <= 0.55
    assert 0.18 <= democratic_threats_rate <= 0.24


def test_uncivil_agent_ideology_balancing():
    """Verify that _filter_candidate_agents_for_targets balances ideology for uncivil turns."""
    from unittest.mock import AsyncMock, MagicMock
    from models.message import Message
    from models.agent import Agent
    from models.session import SessionState
    from agents.STAGE.orchestrator import Orchestrator

    agents = [
        Agent(name="LeftUncivil1"),
        Agent(name="LeftUncivil2"),
        Agent(name="RightUncivil1"),
        Agent(name="RightUncivil2"),
        Agent(name="CenterCivil"),
    ]
    agent_traits = {
        "LeftUncivil1": {"incivility": "uncivil", "ideology": "left"},
        "LeftUncivil2": {"incivility": "uncivil", "ideology": "left"},
        "RightUncivil1": {"incivility": "uncivil", "ideology": "right"},
        "RightUncivil2": {"incivility": "uncivil", "ideology": "right"},
        "CenterCivil": {"incivility": "civil", "ideology": "center"},
    }

    state = SessionState(
        session_id="test-session",
        agents=agents,
        duration_minutes=30,
        experimental_config={},
        treatment_group="control",
        simulation_config={},
        user_name="participant",
    )

    logger = MagicMock()
    orch = Orchestrator(
        director_llm=AsyncMock(),
        performer_llm=AsyncMock(),
        moderator_llm=AsyncMock(),
        classifier_llm=AsyncMock(),
        state=state,
        logger=logger,
        agent_traits=agent_traits,
        rng=random.Random(42),
    )

    # Initially, no messages. If we evaluate, counts are 0/0.
    # Simulate a history of messages:
    # Let's say LeftUncivil1 has sent an uncivil message.
    # So left=1, right=0. Preferred ideology should be 'right'.
    state.add_message(Message.create(sender="LeftUncivil1", content="Left Uncivil Msg", is_incivil=True))

    filtered = orch._filter_candidate_agents_for_targets(
        "INCIVILITY_TARGET = 50",
        {"LeftUncivil1", "LeftUncivil2", "RightUncivil1", "RightUncivil2", "CenterCivil"}
    )
    # RightUncivil1 and RightUncivil2 should be prioritized over LeftUncivil1 (who has spoken and is wrong ideology)
    # and CenterCivil (who is civil).
    # Since we select top 4 out of 5:
    assert "RightUncivil1" in filtered
    assert "RightUncivil2" in filtered
    assert "LeftUncivil2" in filtered
    # "LeftUncivil1" (the wrong ideology who already spoke) is the one filtered out.
    assert "LeftUncivil1" not in filtered

    # Now let's simulate RightUncivil1 sending an uncivil message.
    # Now left=1, right=1. Balance is equal.
    # Let's add another uncivil message from RightUncivil2.
    # Now left=1, right=2. Preferred ideology should be 'left'.
    state.add_message(Message.create(sender="RightUncivil1", content="Right Uncivil Msg 1", is_incivil=True))
    state.add_message(Message.create(sender="RightUncivil2", content="Right Uncivil Msg 2", is_incivil=True))

    filtered = orch._filter_candidate_agents_for_targets(
        "INCIVILITY_TARGET = 50",
        {"LeftUncivil1", "LeftUncivil2", "RightUncivil1", "RightUncivil2", "CenterCivil"}
    )
    # LeftUncivil2 (left, hasn't spoken yet) and LeftUncivil1 (left, spoke) should be prioritized
    # because preferred ideology is left.
    # RightUncivil1 and RightUncivil2 are the wrong ideology and have spoken.
    # Let's make sure LeftUncivil2 and LeftUncivil1 are in filtered.
    assert "LeftUncivil2" in filtered
    assert "LeftUncivil1" in filtered


