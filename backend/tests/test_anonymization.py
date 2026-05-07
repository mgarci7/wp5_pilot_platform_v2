"""Tests for the orchestrator name/label helpers."""

import random
from datetime import datetime, timezone

from models import Message, Agent
from agents.STAGE.orchestrator import (
    build_name_map,
    anonymize_message,
    anonymize_agents,
    deanonymize_text,
    _replace_names_in_text,
)


def _make_msg(sender: str, content: str, **kwargs) -> Message:
    return Message(
        sender=sender,
        content=content,
        timestamp=datetime.now(timezone.utc),
        message_id="msg-1",
        **kwargs,
    )


class TestBuildNameMap:
    def test_includes_all_names(self):
        nm = build_name_map(["Alice", "Bob"], "participant", random.Random(42))
        assert set(nm.keys()) == {"Alice", "Bob", "participant"}

    def test_labels_are_real_names(self):
        nm = build_name_map(["Alice", "Bob"], "participant", random.Random(42))
        assert nm == {"Alice": "Alice", "Bob": "Bob", "participant": "participant"}

    def test_shuffle_is_deterministic(self):
        nm1 = build_name_map(["A", "B", "C"], "participant", random.Random(99))
        nm2 = build_name_map(["A", "B", "C"], "participant", random.Random(99))
        assert nm1 == nm2

    def test_human_keeps_real_name(self):
        nm = build_name_map(["Alice", "Bob"], "participant", random.Random(42))
        assert nm["participant"] == "participant"


class TestAnonymizeMessage:
    def test_sender_label_is_stable(self):
        nm = {"Alice": "Alice", "participant": "participant"}
        msg = _make_msg("Alice", "hello")
        relabelled = anonymize_message(msg, nm)
        assert relabelled.sender == "Alice"

    def test_content_is_unchanged_when_labels_match_real_names(self):
        nm = {"Alice": "Alice", "Bob": "Bob", "participant": "participant"}
        msg = _make_msg("Alice", "I agree with @Bob on this")
        relabelled = anonymize_message(msg, nm)
        assert relabelled.content == "I agree with @Bob on this"

    def test_mentions_are_preserved(self):
        nm = {"Alice": "Alice", "Bob": "Bob", "participant": "participant"}
        msg = _make_msg("Alice", "@Bob hello", mentions=["Bob"])
        relabelled = anonymize_message(msg, nm)
        assert relabelled.mentions == ["Bob"]

    def test_liked_by_is_preserved(self):
        nm = {"Alice": "Alice", "participant": "participant"}
        msg = _make_msg("Alice", "hello", liked_by={"participant"})
        relabelled = anonymize_message(msg, nm)
        assert relabelled.liked_by == {"participant"}

    def test_quoted_text_is_preserved(self):
        nm = {"Alice": "Alice", "Bob": "Bob", "participant": "participant"}
        msg = _make_msg("Alice", "I agree", quoted_text="Bob said something")
        relabelled = anonymize_message(msg, nm)
        assert relabelled.quoted_text == "Bob said something"

    def test_original_message_unchanged(self):
        nm = {"Alice": "Alice", "participant": "participant"}
        msg = _make_msg("Alice", "hello @Alice")
        anonymize_message(msg, nm)
        assert msg.sender == "Alice"
        assert msg.content == "hello @Alice"

    def test_unknown_sender_preserved(self):
        nm = {"Alice": "Alice"}
        msg = _make_msg("[system]", "welcome")
        relabelled = anonymize_message(msg, nm)
        assert relabelled.sender == "[system]"


class TestAnonymizeAgents:
    def test_agent_names_are_preserved(self):
        nm = {"Alice": "Alice", "Bob": "Bob", "participant": "participant"}
        agents = [Agent(name="Alice"), Agent(name="Bob")]
        relabelled = anonymize_agents(agents, nm)
        assert [a.name for a in relabelled] == ["Alice", "Bob"]


class TestDeanonymizeText:
    def test_basic_replacement(self):
        reverse = {"Alice": "Alice", "Bob": "Bob"}
        assert deanonymize_text("Alice says hi to Bob", reverse) == "Alice says hi to Bob"

    def test_no_match_unchanged(self):
        reverse = {"Alice": "Alice"}
        assert deanonymize_text("hello world", reverse) == "hello world"

    def test_at_mention_deanonymized(self):
        reverse = {"Alice": "Alice"}
        assert deanonymize_text("@Alice great point!", reverse) == "@Alice great point!"


class TestReplaceNames:
    def test_longer_names_replaced_first(self):
        nm = {"Performer 1": "A", "Performer 10": "B"}
        result = _replace_names_in_text("Performer 10 and Performer 1", nm)
        assert result == "B and A"

    def test_empty_text(self):
        assert _replace_names_in_text("", {"A": "B"}) == ""

    def test_none_text(self):
        assert _replace_names_in_text(None, {"A": "B"}) is None
