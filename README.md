# Student Hub

Student Hub is a study desk for course notes. A signed-in student uploads a file, browses a shared library, and asks an assistant questions about the uploaded material. The same file can be turned into flashcards or a quiz.

It is also a DevOps lab: the frontend and backend are separate apps, with Docker, Jenkins, and an Azure Pipelines file in the repo.

## What a student can do

1. Create an account and sign in.
2. Upload a PDF or text file with a title, description, subject, and comma-separated tags.
3. Search and filter the shared library.
4. Open a chat panel. The assistant answers from a matching uploaded file, and it refuses to answer course questions when no file matches.
5. Generate flashcards or a quiz from one document.

The home page (`frontend/app/page.tsx`) is the study desk. It sends unsigned visitors to `/auth/signin`. Register is `/auth/register`.

## How a request moves

```text
Browser
  -> Next.js on port 3000
       -> NextAuth for the session
       -> /api/<path> proxy
            -> FastAPI on port 8000
                 -> Supabase Postgres + Storage   (documents)
                 -> Groq                           (chat, flashcards, quiz)
```

The browser calls same-origin `/api/...` paths. Next.js forwards those to FastAPI so the browser never needs the backend URL and does not hit a mixed-content block.

| Hop | Code |
|---|---|
| Catch-all proxy | `frontend/app/api/[...path]/route.ts` |
| Proxy implementation | `frontend/lib/backend-proxy.ts` (`BACKEND_URL`, default `http://127.0.0.1:8000`) |
| Sign-in call into FastAPI | `frontend/app/auth.ts` (`NEXTAUTH_BACKEND_URL`, or `BACKEND_URL` + `/api/auth/login`) |
| API process | `backend/app/main.py` |

Interactive API docs, when the backend is running: http://localhost:8000/docs

## Stack

| Layer | Path | Technology |
|---|---|---|
| Frontend | `frontend/` | Next.js 16, React 19, TypeScript, Tailwind 4, Radix UI |
| Backend | `backend/app/` | FastAPI, Python 3.11, Uvicorn |
| Metadata | Supabase Postgres | Tables `public.users` and `public.documents` |
| Files | Supabase Storage | Bucket `textbooks` |
| Study model | Groq | Default chat model `llama-3.1-8b-instant` |
| Session | NextAuth | Credentials provider, JWT session, 30 days |

`backend/app/services/gemini.py` calls Groq. The filename is historical. `google-generativeai` is listed in `backend/requirements.txt` and is not used by that service.

## Auth

Accounts are created in the API process, not in Supabase Auth.

- `POST /api/auth/register` checks the email, hashes the password with Argon2, and keeps the user in two in-memory dictionaries (`users_by_username`, `users_by_email`).
- It also upserts `id`, `username`, and `email` into `public.users` so `documents.uploaded_by` can reference that id.
- `POST /api/auth/login` checks the in-memory record and returns a bearer JWT (`HS256`, secret `SECRET_KEY`). The default lifetime is 30 days, matching the NextAuth session.
- The JWT payload carries `sub` (username) and `id` (user id). Upload and delete read `id` via `backend/app/core/security.py`.
- NextAuth stores that access token on the session. The upload form sends it as `Authorization: Bearer ...`.

Those dictionaries live in the server process. A restart, or a second container, forgets passwords. The Supabase profile row can remain, and login still will not find the password until the person registers again on that process.

`/api/mock-auth` is a frontend fallback for sign-in when the backend login is not configured.

## Documents

Schema: `backend/setup.sql`.

`public.documents` stores `title`, `description`, `subject`, `tags`, `file_url`, `file_path`, `uploaded_by`, and `created_at`. The bytes live in the Storage bucket `textbooks`, under `{user_id}/{filename}`.

| Method | Path | Who can call it |
|---|---|---|
| `POST` | `/api/documents/upload` | Bearer token required. Multipart form: `file`, `title`, optional `description`, `subject`, `tags`. |
| `GET` | `/api/documents/` | Public. Optional query `subject` and `search` (title match). |
| `DELETE` | `/api/documents/{document_id}` | Bearer token required. Deletes the row and the storage object. A non-owner receives 403 when `uploaded_by` is set. |

`GET /api/documents` (no trailing slash) is redirected by FastAPI to `/api/documents/`.

Listing does not filter by the current user. The library is shared.

## Chat, flashcards, and quizzes

Chat (`POST /api/chat/`) loads every document row, then picks at most one file:

- If the question mentions `unit` plus a number (`unit 2` or `unit2`), only a title with that same unit number is eligible. A unit 2 question will not use a unit 3 file.
- Otherwise it scores overlap between question words and the title, subject, and tags. Stopwords and the word `unit` are ignored. Two or more shared words are required. An exact title inside the question wins immediately.
- No match returns a message that lists the library titles and says the answer will not come from other units or general knowledge.
- A match downloads the file, keeps about 4,000 characters, and sends that excerpt to Groq with a system prompt that forbids answering from outside the excerpt.

Flashcards (`POST /api/flashcards/generate`) and quizzes (`POST /api/quiz/generate`) take `{ "document_id": "..." }`, download the file, keep about 4,500 characters, and ask Groq for JSON. The handlers strip surrounding text and parse the array. These two routes do not check the caller’s token.

`backend/app/services/document_service.py` reads PDFs with `pypdf`. A scanned, image-only PDF has no text and returns an error asking for a text-based PDF. Long files are cut down before the model sees them, so a question about a later chapter can miss the passage.

`backend/app/api/podcast.py` can build a spoken script and optional Sarvam audio. It is not registered in `backend/app/main.py`, so it is not part of the running API.

## Pages and main UI pieces

| Path | Role |
|---|---|
| `/` | Study desk: upload, library, chat. Requires a session. |
| `/auth/signin` | Username and password. NextAuth credentials. |
| `/auth/register` | Username, email, password, confirm password. Posts to `/api/auth/register`. |
| `frontend/components/upload-component.tsx` | Upload form. |
| `frontend/components/document-list.tsx` | Library, including flashcard and quiz actions. |
| `frontend/components/chat-component.tsx` | Chat panel. |
| `frontend/components/ui/` | Shared Radix/shadcn controls. Most of them are not used by the study flows. |

`frontend/next.config.mjs` builds a standalone Next server for Docker (`output: 'standalone'`). TypeScript errors are ignored at build time (`typescript.ignoreBuildErrors`).

## Configuration

Copy the examples and fill them in. Do not commit the real files.

Backend, `backend/.env` from `backend/.env.example`:

| Variable | Role |
|---|---|
| `SUPABASE_URL` | Project URL. Required to import the API. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. Required to import the API. `SUPABASE_KEY` is accepted as a fallback. |
| `SECRET_KEY` | JWT signing secret. Default in code is `dev-secret-key`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional. Default is 30 days. |
| `GROQ_API_KEY` | Required for real chat, flashcard, and quiz answers. |
| `GROQ_CHAT_MODEL` | Optional. Default `llama-3.1-8b-instant`. |
| `GROQ_STUDY_MODEL` | Optional. Defaults to the chat model. |
| `SARVAM_API_KEY` | Only used by the unmounted podcast route. |
| `CORS_ORIGINS` | Comma-separated browser origins. Default `http://localhost:3000`. |

The API process raises at startup if `SUPABASE_URL` or the service role key is missing, even for routes that never touch the database.

Frontend, `frontend/.env.local` from `frontend/.env.example`:

| Variable | Role |
|---|---|
| `NEXTAUTH_URL` | Public URL of this Next app, for example `http://localhost:3000`. |
| `NEXTAUTH_SECRET` | Signs the NextAuth JWT. |
| `BACKEND_URL` | FastAPI base URL used by the proxy. |
| `NEXTAUTH_BACKEND_URL` | Optional full login URL. Default is `BACKEND_URL` + `/api/auth/login`. |

Run the SQL in `backend/setup.sql` in the Supabase SQL editor, and create a public Storage bucket named `textbooks`. `SUPABASE-SETUP.md` has the lab steps.

## Run it locally

Prerequisites: Node.js 20 or newer, Python 3.11, a Supabase project, and a Groq API key if you want model answers.

### Backend

```bash
cd backend
python -m venv venv
# Windows PowerShell: .\venv\Scripts\Activate.ps1
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
# Windows: copy .env.example .env
# macOS/Linux: cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On Windows, if `python` is not on `PATH`, use the Python 3.11 launcher path or `py -3.11`.

### Frontend

```bash
cd frontend
npm install
# Windows: copy .env.example .env.local
# macOS/Linux: cp .env.example .env.local
npm run dev
```

App: http://localhost:3000  
API: http://localhost:8000

`frontend/package.json` names the npm package `my-v0-project`. `npm test` only prints `tests passed` and exits 0. It does not execute the suite under `testing/`.

## Docker

From the repository root, with `backend/.env` present:

```bash
docker compose build
docker compose up -d
```

`docker-compose.yml` publishes frontend `3000` and backend `8000`. The frontend image is built with `BACKEND_URL=http://backend:8000` and waits until `GET /` on the backend succeeds.

Frontend image alone:

```bash
docker build -f frontend/Dockerfile -t shash1278/react-project:latest ./frontend
```

## CI

| File | What it runs |
|---|---|
| `Jenkinsfile` | Windows agent pipeline: dependency check, SonarQube, Docker images, Azure, Vercel deploy hook. Credential ids are listed at the top of the file. |
| `azure-pipelines.yml` | Self-hosted agent. Installs Node 20 and runs `npm install` and `npm test` in `frontend/`. |
| `sonar-project.properties` | Sonar scanner settings. |

`DEVOPS.md` and `SETUP-STEPS.md` are the lab notes for those pipelines.

## Software testing

`testing/` holds the runnable suite. It does not run on `npm test`. The course portfolio, with the requirements, test plan, technique write-ups, defects, and final report, is `Software-Testing-Portfolio/`.

The cases are grouped by technique in `testing/ST-TEST-REPORT.md`: equivalence class, boundary value, decision table, state transition, adversarial, error guessing, and load. The tool is only the runner.

| Tool | Techniques it executed | Entry |
|---|---|---|
| Schemathesis | Equivalence class, adversarial, error guessing, plus an OpenAPI status-code oracle | `testing/schemathesis/` |
| Gauge + Taiko | Equivalence class, decision table, state transition | `testing/ui/specs/auth.spec` |
| CrossHair | Equivalence class, boundary value, adversarial | `testing/whitebox/contracts.py` |
| Vegeta | Load | `testing/performance/` |

Results and how to repeat the run: `testing/ST-TEST-REPORT.md`.

## Repository layout

```text
.
├── backend/
│   ├── app/
│   │   ├── api/          auth, documents, chat, flashcards, quiz
│   │   ├── core/         Supabase client, JWT dependency
│   │   ├── models/
│   │   ├── services/     Groq calls, PDF text extraction
│   │   └── main.py
│   ├── setup.sql
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/              pages, NextAuth, API proxy
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── testing/              Schemathesis, Taiko, CrossHair, Vegeta
├── docker-compose.yml
├── Jenkinsfile
└── azure-pipelines.yml
```

## Limits worth knowing

- Passwords disappear when the API process restarts.
- Chat, flashcards, and quizzes read a short text slice. Scanned PDFs produce no text.
- Library listing is public. Flashcard and quiz generation do not require a token.
- Podcast generation is implemented and not mounted.
- Document, chat, flashcard, and quiz routes fail if the Supabase host cannot be reached. Register and login still work, apart from the profile upsert, which is logged and ignored.

## Git remote

```text
git@github.com:shashwath1278/Devops-Lab.git
```

## License

Academic / lab use.
