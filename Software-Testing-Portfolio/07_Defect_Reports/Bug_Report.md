# Defect report

**Application:** Student Hub  
**Date:** 25 November 2026  
**Tester:** shashwath1278  
**Defects recorded:** 6  
**Source:** the Schemathesis and Vegeta runs, plus the handlers those runs called

A defect is recorded only when the run produced the response, or when the cited lines are the ones that produced it. Severity is about the user or the marker who trusts the spec. Priority is about what to change first.

## DEF-001 — Login 401 is missing from the OpenAPI file

| Field | Detail |
|---|---|
| ID | DEF-001 |
| Case | API-06 |
| Module | `POST /api/auth/login` |
| Severity | Major for the spec. The handler itself is doing the right thing |
| Priority | High |
| Status | Open |

**Steps.** Start the API. Send `POST /api/auth/login` with `{"username":"","password":""}`.

**Expected, by the handler.** 401 "Incorrect username or password". The raise is in `backend/app/api/auth.py` in `login`.

**Expected, by the spec.** `/openapi.json` lists 200 and 422 for this operation.

**Actual.** 401. Schemathesis reports a status-code conformance failure.

**Cause.** The response was implemented and not added to the declared responses.

## DEF-002 — Register 400 is missing from the OpenAPI file

| Field | Detail |
|---|---|
| ID | DEF-002 |
| Case | API-07 |
| Module | `POST /api/auth/register` |
| Severity | Major for the spec |
| Priority | High |
| Status | Open |

**Steps.** Send a register body whose email is empty.

**Expected, by the handler.** 400 "Valid email is required" when `@` is absent (`auth.py`, `register`).

**Expected, by the spec.** 200 and 422 only.

**Actual.** 400.

## DEF-003 — Upload without a token returns 401, and the spec omits 401

| Field | Detail |
|---|---|
| ID | DEF-003 |
| Case | API-08 |
| Module | `POST /api/documents/upload` |
| Severity | Major for the spec. The refusal is correct |
| Priority | High |
| Status | Open |

**Steps.** `POST /api/documents/upload` with no `Authorization` header.

**Actual.** 401 "Not authenticated". The spec lists 200, 422, and 500.

## DEF-004 — Delete without a token returns 401, and the spec omits 401

| Field | Detail |
|---|---|
| ID | DEF-004 |
| Case | API-09 |
| Module | `DELETE /api/documents/{document_id}` |
| Severity | Major for the spec |
| Priority | High |
| Status | Open |

**Steps.** `DELETE /api/documents/0` with no bearer token.

**Actual.** 401, before any delete. The spec lists 200 and 422.

## DEF-005 — Document, chat, flashcard, and quiz calls return 500 when Supabase does not resolve

| Field | Detail |
|---|---|
| ID | DEF-005 |
| Cases | API-02, API-03, API-04, API-05, and PF-02 |
| Module | Documents, chat, flashcards, quiz |
| Severity | Critical for any study feature on a machine that cannot resolve the host |
| Priority | High |
| Status | Open. The host is unreachable, and the API surfaces that as an unhandled 500 |

**Steps.** With `backend/.env` pointing at a Supabase host that does not resolve, call `GET /api/documents/`, `POST /api/chat/`, `POST /api/flashcards/generate`, or `POST /api/quiz/generate`.

**Actual.** HTTP 500. The document list body was `Failed to load documents: [Errno 11001] getaddrinfo failed`, in about 7 seconds for a single call.

**Under load.** Vegeta sent 150 requests at 10 per second. 4 came back 500. 146 waited until the 30 second client timeout. The dependency failure does not fail fast.

**Auth is unaffected.** Register and login use the in-memory user dictionaries, so DEF-001 and DEF-002 still return their 400 and 401.

## DEF-006 — Document list redirects, then fails

| Field | Detail |
|---|---|
| ID | DEF-006 |
| Case | PF-02 |
| Module | `GET /api/documents` |
| Severity | Minor beside DEF-005, because the study call would still need a reachable database |
| Priority | Medium |
| Status | Open |

**Actual.** FastAPI redirects `GET /api/documents` to `GET /api/documents/` with 307. A load target written without the slash therefore hits both URLs. The slash form is the one that queries Supabase and then hits DEF-005.

## Summary

| ID | Title | Severity | Status |
|---|---|---|---|
| DEF-001 | Login 401 omitted from OpenAPI | Major (spec) | Open |
| DEF-002 | Register 400 omitted from OpenAPI | Major (spec) | Open |
| DEF-003 | Upload 401 omitted from OpenAPI | Major (spec) | Open |
| DEF-004 | Delete 401 omitted from OpenAPI | Major (spec) | Open |
| DEF-005 | Supabase DNS failure becomes HTTP 500, and under load it hangs | Critical | Open |
| DEF-006 | `/api/documents` redirects to `/api/documents/` | Minor | Open |

Nothing in this list was marked fixed during the run. The handlers were left as they were, and the results were recorded.
