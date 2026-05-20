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
MAX_HISTORY_TURNS = 6
MAX_HISTORY_CHARS = 400
MAX_USER_MESSAGE_CHARS = 14_000


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

def generate_flashcards(text: str) -> str:
    if not client:
        return "[]"
    
    try:
        prompt = f"""
        Generate 5 to 10 high-quality flashcards based on the following text.
        Focus on key concepts, definitions, and important details.
        
        Return the result STRICTLY as a JSON array of objects, where each object has a 'question' and an 'answer'.
        Do not include any markdown formatting (like ```json) or conversational text. Just the raw JSON string.
        Start the response with '[' and end with ']'.
        
        Example format:
        [
            {{"question": "What is the capital of France?", "answer": "Paris"}},
            {{"question": "Define photosynthesis.", "answer": "The process by which..."}}
        ]
        
        Text to process:
        {text[:15000]}... (Truncated)
        """
        
        completion = client.chat.completions.create(
            model="groq/compound",
            messages=[
                {"role": "system", "content": "You are a helpful study assistant that generates flashcards."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3 # Lower temperature for more deterministic/structured output
        )
        
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        return "[]"

def generate_quiz(text: str) -> str:
    if not client:
        return "Error: Groq client not initialized."
    
    try:
        prompt = f"""
        Generate a Multiple Choice Quiz (5 questions) from the following text.
        
        **Rules:**
        1. Create 5 challenging but fair questions.
        2. Provide 4 options for each question.
        3. Indicate the correct answer (0-3 index).
        4. Provide a brief explanation for the correct answer.
        5. Return STRICTLY a JSON array. No markdown, no "Here is the quiz".
        
        **JSON Format:**
        [
            {{
                "question": "Question text?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0, // Index of correct option
                "explanation": "Why this is correct."
            }}
        ]
        
        **Text:**
        {text[:15000]}... (Truncated)
        """
        
        completion = client.chat.completions.create(
            model="groq/compound",
            messages=[
                {"role": "system", "content": "You are a teacher creating a quiz. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error generating quiz: {str(e)}"
