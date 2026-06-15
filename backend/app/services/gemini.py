import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
client = None

if api_key:
    client = Groq(api_key=api_key)

SYSTEM_PROMPT = """You are an intelligent AI assistant for the Student Hub platform, acting as a "Study Partner". 
Your goal is to help students learn and understand their study materials effectively.
IMPORTANT: You must NEVER mention that you are powered by Groq, OpenAI, or any other provider. 
You are strictly the "Student Hub Bot".

BEHAVIORAL GUIDELINES (STUDY MODE):
1. **Notes-only**: If the user message includes a "Notes file:" or "notes excerpt" section, answer ONLY from that text. Never invent units, chapters, or topics that are not in the excerpt.
2. **No hallucination**: If asked about "unit 2" but the excerpt is only for another unit, say you do not have unit 2 in the provided file — do NOT describe unit 2 from general knowledge.
3. **Missing info**: If the excerpt does not contain the answer, say clearly: "This is not covered in the uploaded notes."
4. **Concise & Academic**: Keep answers focused on the excerpt. Use an encouraging tone.

When NO notes excerpt is included in the prompt, you should not answer course content questions (the app will handle that separately)."""

CHAT_MODEL = os.environ.get("GROQ_CHAT_MODEL", "llama-3.1-8b-instant")
STUDY_MODEL = os.environ.get("GROQ_STUDY_MODEL", CHAT_MODEL)
MAX_HISTORY_TURNS = 6
MAX_HISTORY_CHARS = 400
MAX_USER_MESSAGE_CHARS = 14_000
MAX_QUIZ_SOURCE_CHARS = int(os.environ.get("GROQ_QUIZ_MAX_CHARS", "4500"))
MAX_FLASHCARD_SOURCE_CHARS = int(os.environ.get("GROQ_FLASHCARD_MAX_CHARS", "4500"))


def _truncate(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n...[truncated for length]"


def get_chat_response(message: str, history: list = None):
    if not client:
        return "Groq API Key not configured."

    history = history or []

    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in history[-MAX_HISTORY_TURNS:]:
            role = msg.get("role", "user")
            if role not in ("user", "assistant"):
                role = "user"
            messages.append(
                {
                    "role": role,
                    "content": _truncate(str(msg.get("content", "")), MAX_HISTORY_CHARS),
                }
            )
        messages.append(
            {"role": "user", "content": _truncate(message, MAX_USER_MESSAGE_CHARS)}
        )

        completion = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            max_tokens=1024,
        )

        return completion.choices[0].message.content
    except Exception as e:
        err = str(e)
        if "413" in err or "request_too_large" in err.lower():
            return (
                "That question used too much document text at once. "
                "Try a shorter question or ask about one specific topic from the unit."
            )
        return f"Error communicating with Groq: {err}"

class GroqStudyError(Exception):
    """Raised when flashcard/quiz generation fails (e.g. payload too large)."""

    def __init__(self, message: str, *, too_large: bool = False):
        super().__init__(message)
        self.too_large = too_large


def _groq_study_error_message(err: str) -> GroqStudyError:
    if "413" in err or "request_too_large" in err.lower():
        return GroqStudyError(
            "This document is too large to send to the AI at once. "
            "Try a shorter PDF or split the notes into smaller files.",
            too_large=True,
        )
    return GroqStudyError(f"AI request failed: {err}")


def generate_flashcards(text: str) -> str:
    if not client:
        return "[]"

    excerpt = _truncate(text, MAX_FLASHCARD_SOURCE_CHARS)
    prompt = f"""Generate 5 to 10 flashcards from the study notes below.
Focus on key concepts and definitions.

Return ONLY a JSON array. Each item: {{"question": "...", "answer": "..."}}
No markdown, no commentary.

Notes:
{excerpt}"""

    try:
        completion = client.chat.completions.create(
            model=STUDY_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You generate flashcards. Output valid JSON array only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        raise _groq_study_error_message(str(e)) from e


def generate_quiz(text: str) -> str:
    if not client:
        raise GroqStudyError("Groq API key not configured.")

    excerpt = _truncate(text, MAX_QUIZ_SOURCE_CHARS)
    prompt = f"""Create a multiple-choice quiz with exactly 5 questions from these study notes.

Rules:
- 4 options per question (strings in "options" array)
- "answer" is the 0-based index of the correct option
- Short "explanation" for each question
- Return ONLY a JSON array, no markdown

Format:
[{{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}}]

Notes:
{excerpt}"""

    try:
        completion = client.chat.completions.create(
            model=STUDY_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You create quizzes. Output valid JSON array only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        raise _groq_study_error_message(str(e)) from e
