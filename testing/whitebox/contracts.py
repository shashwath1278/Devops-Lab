"""White-box contracts for Student Hub document matching.

CrossHair tries to break each postcondition. Every function calls the
real helpers in backend/app/api/chat.py.
"""
from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
load_dotenv(ROOT / "backend" / ".env")

from app.api.chat import (  # noqa: E402
    _keywords,
    _pick_matching_document,
    _unit_numbers,
)


def unit_two_is_extracted() -> str:
    """The phrase 'unit 2' yields the digit 2 and nothing else.

    post: _ == "2"
    """
    found = _unit_numbers("explain unit 2")
    return min(found) if found else ""


def different_units_do_not_match() -> bool:
    """A question about unit 2 must not select a unit 3 file.

    post: _ == False
    """
    picked = _pick_matching_document(
        "explain unit 2",
        [{"title": "Physics unit 3 notes", "subject": "", "tags": []}],
    )
    return picked is not None


def empty_library_matches(message: str) -> bool:
    """An empty library never selects a document.

    post: _ == False
    """
    return _pick_matching_document(message, []) is not None


def same_single_digit_unit(unit_a: int, unit_b: int) -> bool:
    """'unit N' matches a title with the same digit, and no other digit.

    pre: 0 <= unit_a <= 9 and 0 <= unit_b <= 9
    post: _ == (unit_a == unit_b)
    """
    message = f"explain unit {unit_a}"
    title = f"Physics unit {unit_b} notes"
    picked = _pick_matching_document(
        message, [{"title": title, "subject": "", "tags": []}]
    )
    return picked is not None


def bare_unit_is_a_keyword() -> bool:
    """The word 'unit' is ignored so it cannot fake a keyword match.

    post: _ == False
    """
    return "unit" in _keywords("unit")


def one_content_word_does_not_match(index: int) -> bool:
    """A single shared content word is below the overlap threshold of 2.

    pre: 0 <= index <= 2
    post: _ == False
    """
    word = ("photosynthesis", "mitosis", "algebra")[index]
    picked = _pick_matching_document(
        f"about {word}",
        [{"title": f"{word} handbook", "subject": "", "tags": []}],
    )
    return picked is not None


def two_content_words_match(index: int) -> bool:
    """Two shared content words are enough to select the document.

    pre: 0 <= index <= 1
    post: _ == True
    """
    pairs = (("photosynthesis", "mitosis"), ("algebra", "calculus"))
    first, second = pairs[index]
    picked = _pick_matching_document(
        f"tell me about {first} {second}",
        [{"title": f"{first} {second} notes", "subject": "", "tags": []}],
    )
    return picked is not None
