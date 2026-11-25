# API test results

**Tool:** Schemathesis 4.34.2  
**Spec:** `http://127.0.0.1:8000/openapi.json`  
**Phase:** coverage. The examples phase skipped all 9 operations because the schema has no sample payloads.  
**Checks:** `not_a_server_error`, `status_code_conformance`, `response_schema_conformance`  
**Seed:** 117845207217683626339176708915470989617  
**JSON:** `testing/results/schemathesis/json-20261125T192608Z.json`  
**Duration:** 29 seconds, 17 generated cases across 9 operations

The status-code check is a specification oracle. A handler that correctly returns 401 still fails when `/openapi.json` does not list 401.

## Operations

| ID | Operation | Class of input | HTTP result | Pass/Fail | Why |
|---|---|---|---|---|---|
| API-01 | `GET /` | Valid, no body | 200 | Pass | Body matched the spec |
| API-02 | `GET /api/documents/` | Empty `subject` and `search` | 500 | Fail | `getaddrinfo` 11001. Supabase host did not resolve |
| API-03 | `POST /api/chat/` | `{"message":"","history":[]}` | 500 | Fail | Same DNS failure. 500 is also absent from this operation's spec |
| API-04 | `POST /api/flashcards/generate` | `{"document_id":""}` | 500 | Fail | Same DNS failure. The empty id never reached id validation |
| API-05 | `POST /api/quiz/generate` | `{"document_id":""}` | 500 | Fail | Same DNS failure |
| API-06 | `POST /api/auth/login` | Empty username and password | 401 | Fail | Handler rejected the login. Spec lists 200 and 422 only |
| API-07 | `POST /api/auth/register` | Empty email | 400 | Fail | "Valid email is required". Spec lists 200 and 422 only |
| API-08 | `POST /api/documents/upload` | No bearer token | 401 | Fail | Handler refused the upload. Spec lists 200, 422, and 500 |
| API-09 | `DELETE /api/documents/0` | No bearer token, id 0 | 401 | Fail | Refused before any delete. Spec lists 200 and 422 |

## How to read the eight failures

| Failure kind | Cases | Product behavior |
|---|---|---|
| Specification gap | API-06, API-07, API-08, API-09 | The status code is the one the handler raises. The OpenAPI responses omit it |
| Environment | API-02, API-03, API-04, API-05 | The process is configured with a Supabase URL, and this machine could not resolve the host |

API-01 is the only operation that passed both the behavior and the spec.

## Load on the API

Vegeta 12.13.0. Reports: `testing/results/vegeta-root.txt`, `testing/results/vegeta-documents.txt`.

| ID | Target | Rate | Requests | Success | Latency | Pass/Fail |
|---|---|---|---|---|---|---|
| PF-01 | `GET http://127.0.0.1:8000/` | 20/s for 20 s | 400 | 100% were 200 | mean 3.98 ms, p95 8.01 ms, p99 26.3 ms, max 72.2 ms | Pass |
| PF-02 | `GET http://127.0.0.1:8000/api/documents` | 10/s for 15 s | 150 | 0% | 4 responses were 500, 146 hit the 30 s client timeout | Fail |

PF-02 also followed FastAPI's 307 redirect from `/api/documents` to `/api/documents/`.

## Rerun

```powershell
testing\.venv\Scripts\schemathesis.exe run http://127.0.0.1:8000/openapi.json --phases coverage --max-examples 2 --workers 1 --request-timeout 8 --max-time 80 --checks not_a_server_error,status_code_conformance,response_schema_conformance
```
