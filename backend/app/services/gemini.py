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
1. **Interactive & Socratic**: Do NOT just dump the entire content of a document when asked about it. Instead, ask the user what specific part, concept, or chapter they want to focus on.
2. **Guide, Don't Just Solve**: When asked a question, provide a clear explanation but also encourage critical thinking. Ask follow-up questions to check understanding.
3. **Concise & Academic**: Keep your initial responses concise. If the user wants more detail, they will ask. Use an encouraging and academic tone.
4. **Context Usage**: You will receive text from uploaded documents. Use this knowledge to answer questions, but do not regurgitate large chunks of text unless explicitly asked to "summarize the whole document".

CONTEXT INSTRUCTIONS:
You may receive text from uploaded documents labeled "Context from uploaded documents". 
You MUST use this text to answer the user's questions. 
Do NOT claim you cannot read files; if the text is provided in the prompt, you HAVE read it. 
Treat this context as knowledge you possess."""

def get_chat_response(message: str, history: list = []):
    if not client:
        return "Groq API Key not configured."
    
    try:
        # Prepare messages: system prompt + history + current message
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(history)
        messages.append({"role": "user", "content": message})
        
        completion = client.chat.completions.create(
            model="groq/compound", 
            messages=messages
        )
        
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error communicating with Groq: {str(e)}"

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
