"""Post-processing humanizer for agent-generated chatroom messages.

Applies informal Spanish chatroom conventions to make LLM output look more
like a real user typed it: removes hashtags, drops inverted punctuation,
contracts common words, and introduces light orthographic errors.
"""
import random
import re
from typing import Optional


# ── Substitution tables ──────────────────────────────────────────────────────

# Word-level contractions/abbreviations (applied probabilistically)
_WORD_SUBS = [
    (r"\bque\b",      "q",    0.55),
    (r"\bpero\b",     "pero", 0.0),   # keep — too recognisable if changed
    (r"\btambién\b",  "tb",   0.40),
    (r"\bpara\b",     "pa",   0.35),
    (r"\bporque\b",   "xq",   0.45),
    (r"\bpor\b",      "x",    0.25),
    (r"\bcon\b",      "con",  0.0),
    (r"\bestoy\b",    "toy",  0.30),
    (r"\bno sé\b",    "ni idea", 0.25),
    (r"\bla verdad\b","la vd", 0.20),
]

# Accent removal (Spanish informal writing often drops accents)
_ACCENT_MAP = str.maketrans("áéíóúÁÉÍÓÚ", "aeiouAEIOU")


def _strip_hashtags(text: str) -> str:
    """Remove #hashtag tokens entirely."""
    return re.sub(r"\s*#\w+", "", text).strip()


def _strip_inverted_punctuation(text: str) -> str:
    """Remove opening ¿ and ¡ — informal Spanish writers skip them."""
    return text.replace("¿", "").replace("¡", "")


def _drop_spaces_after_comma(text: str, rng: random.Random) -> str:
    """Randomly remove the space after commas (informal typing)."""
    def _replace(m):
        return ",\u200b" if rng.random() < 0.50 else m.group(0)
    result = re.sub(r",\s+", _replace, text)
    return result.replace(",\u200b", ",")


def _apply_word_subs(text: str, rng: random.Random) -> str:
    """Apply informal word contractions probabilistically."""
    for pattern, replacement, prob in _WORD_SUBS:
        if prob == 0.0:
            continue
        def _sub(m, rep=replacement, p=prob):
            return rep if rng.random() < p else m.group(0)
        text = re.sub(pattern, _sub, text, flags=re.IGNORECASE)
    return text


def _drop_accents(text: str, rng: random.Random, prob: float = 0.40) -> str:
    """Randomly strip accents from the whole message."""
    if rng.random() < prob:
        return text.translate(_ACCENT_MAP)
    return text


def _strip_excess_emoji(text: str, rng: random.Random, max_emoji: int = 1) -> str:
    """Keep at most `max_emoji` emoji characters; remove the rest."""
    emoji_pattern = re.compile(
        "[\U00010000-\U0010ffff"
        "\U00002702-\U000027B0"
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "]+",
        flags=re.UNICODE,
    )
    emojis = emoji_pattern.findall(text)
    if len(emojis) <= max_emoji:
        return text
    # Keep only the first emoji occurrence
    kept = 0
    def _replacer(m):
        nonlocal kept
        if kept < max_emoji:
            kept += 1
            return m.group(0)
        return ""
    return emoji_pattern.sub(_replacer, text).strip()


def humanize(
    text: str,
    seed: Optional[int] = None,
    strip_hashtags: bool = True,
    strip_inverted_punct: bool = True,
    word_subs: bool = True,
    drop_accents: bool = True,
    comma_spacing: bool = True,
    max_emoji: int = 1,
) -> str:
    """Apply informal chatroom humanization to a Spanish message.

    All transformations are probabilistic (seeded for reproducibility if
    `seed` is provided) so each call produces slightly different output.
    """
    if not text or not text.strip():
        return text

    rng = random.Random(seed)

    if strip_hashtags:
        text = _strip_hashtags(text)
    if strip_inverted_punct:
        text = _strip_inverted_punctuation(text)
    if word_subs:
        text = _apply_word_subs(text, rng)
    if drop_accents:
        text = _drop_accents(text, rng)
    if comma_spacing:
        text = _drop_spaces_after_comma(text, rng)
    if max_emoji >= 0:
        text = _strip_excess_emoji(text, rng, max_emoji=max_emoji)

    return text.strip()
