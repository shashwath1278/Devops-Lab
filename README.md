# Student Hub

Full-stack learning platform for document management and AI-assisted study (chat, flashcards, quizzes).

**DevOps lab project** — frontend + backend with separate modules, Git/GitHub, Docker, and CI/CD.

## Architecture

| Layer | Path | Stack |
|-------|------|--------|
| Frontend | `frontend/` | Next.js 16, TypeScript, Tailwind |
| Backend | `backend/app/` | FastAPI, Python 3.11+ |
| Database | Supabase | PostgreSQL (via Supabase client) |
| AI | Groq / Gemini APIs | Document Q&A, quiz, flashcards |

### Backend modules

| Module | Path | Purpose |
|--------|------|---------|
| Auth | `backend/app/api/auth.py` | Register, login, JWT |
| Documents | `backend/app/api/documents.py` | Upload & list PDFs |
| Chat | `backend/app/api/chat.py` | AI chat on documents |
| Flashcards | `backend/app/api/flashcards.py` | Generate flashcards |
| Quiz | `backend/app/api/quiz.py` | Generate quizzes |

The frontend calls `/api/*`; Next.js rewrites those requests to the FastAPI server (see `frontend/next.config.mjs`).

## Prerequisites

- Node.js 20+
- Python 3.11+
- Supabase project (optional for full features)
- API keys: `GROQ_API_KEY` (and optionally `SARVAM_API_KEY`)

## Local development

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in values
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in values
npm run dev
```

App: http://localhost:3000

Without backend credentials, sign-in can use the built-in mock auth (`/api/mock-auth`).

## Docker

```bash
# From repository root
docker compose build
docker compose up -d
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:8000  

Build frontend image only:

```bash
docker build -f frontend/Dockerfile -t shash1278/react-project:latest ./frontend
```

## Repository layout

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # REST modules
│   │   ├── core/         # Supabase client
│   │   ├── models/
│   │   ├── services/     # AI & document logic
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   ├── components/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Git remote

```text
git@github.com:shashwath1278/Devops-Lab.git
```

## License

Academic / lab use.
