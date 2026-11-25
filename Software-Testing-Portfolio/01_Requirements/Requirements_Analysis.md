# Requirements analysis — Student Hub

The requirements below are the ones the tests check. They come from the running API and the pages, not from a separate specification document.

## Users and goal

A student keeps course files in one library and studies from those files. The assistant is supposed to answer from a matching upload, and to refuse when no file matches.

## Functional requirements

| ID | Requirement | Where it lives |
|---|---|---|
| FR-01 | A visitor can open the sign-in page and see the sign-in action and the link to register | `/auth/signin` |
| FR-02 | An empty sign-in submit stays on the sign-in page | `/auth/signin` |
| FR-03 | A wrong password shows "Invalid username or password" | NextAuth credentials, `POST /api/auth/login` returns 401 |
| FR-04 | Registration rejects a password that differs from the confirmation, before any API call | `/auth/register` |
| FR-05 | The register page can move the visitor to the sign-in page | Link "Sign in" |
| FR-06 | Register rejects an email that does not contain `@` with 400 "Valid email is required" | `backend/app/api/auth.py` |
| FR-07 | Login rejects an unknown user or a bad password with 401 | `backend/app/api/auth.py` |
| FR-08 | Upload and delete require a bearer token and return 401 when it is missing | `backend/app/api/documents.py` |
| FR-09 | The library list, chat, flashcards, and quiz read Supabase. If that host cannot be reached, the call fails | documents, chat, flashcards, quiz routers |
| FR-10 | A question that names `unit N` selects only a file whose title contains that same unit number | `backend/app/api/chat.py` `_pick_matching_document` |
| FR-11 | With no unit number, a document is selected only when at least two content words overlap the title, subject, or tags | same function, threshold `best_score >= 2` |
| FR-12 | An empty library selects nothing | same function, `if not documents` |
| FR-13 | `GET /` answers without a database | `backend/app/main.py` |

## Non-functional requirements used as oracles

| ID | Requirement | How it was judged |
|---|---|---|
| NFR-01 | Documented HTTP status codes match the implementation | Schemathesis check `status_code_conformance` against `/openapi.json` |
| NFR-02 | `GET /` stays successful at 20 requests/second for 20 seconds | Vegeta, 100% HTTP 200 |
| NFR-03 | The document list answers under a fixed rate of 10 requests/second | Vegeta. This did not hold on 25 November 2026 |

## Modules selected for testing

Four modules, which is the minimum the activity asks for:

1. Authentication (sign-in, register, login API, register API)
2. Documents (list, upload, delete)
3. Chat document matching (unit numbers and keyword overlap)
4. Study generation entry points (flashcards and quiz), plus the health endpoint under load

## Out of scope for the executed run

- A successful login with a password that matches the stored hash
- Registration when the password and the confirmation are equal
- A Supabase host that resolves, so no real PDF was uploaded during this run
- Groq answer quality
- The podcast route, which exists in `backend/app/api/podcast.py` and is not mounted
