# Student Hub — software testing report

Date: 25 November 2026  
System under test: Student Hub (Next.js on port 3000, FastAPI on port 8000)  
Tools: Schemathesis 4.34.2, Gauge 1.6.44 with Taiko 1.5.2, CrossHair 0.0.114, Vegeta 12.13.0  
All four tools are free. They were run from Windows PowerShell.

## 1. Techniques

Each case sits in one technique: the rule that chose the input. The tool is only how it was run. Schemathesis also checked every API response against the OpenAPI status list, so a sensible 401 can still fail that specification oracle.

| Technique | Definition used in this run | Tool |
|---|---|---|
| Equivalence class partitioning | Inputs in one class should behave the same. One representative stands for the class: valid request, empty required field, wrong secret, stopword. | Schemathesis, Taiko, CrossHair |
| Boundary value analysis | Values on the edge of a class: collection size 0, keyword overlap 1 and 2, digits 0–9. | CrossHair |
| Decision table | Two conditions combine. Here, password against confirmation. | Taiko |
| State transition | An action either stays in the current screen or moves to the next one. | Taiko |
| Adversarial | A hostile but still well-formed input: no token, a made-up id, a question aimed at the wrong unit. | Schemathesis, CrossHair |
| Error guessing | A failure mode chosen from experience: the database host cannot be resolved. | Schemathesis |
| Load | A fixed request rate, scored on success ratio and latency. | Vegeta |

## 2. How this run was set up

- Backend: `testing\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000` from `backend\`
- Frontend: `npx next dev --hostname 127.0.0.1 --port 3000`
- Taiko used the installed Chrome via `TAIKO_BROWSER_PATH`, because the bundled Chromium download stalled
- Supabase was configured in `backend\.env`, but the hostname did not resolve from this machine (`getaddrinfo` error 11001). Auth still works, because passwords are stored in memory. Document, chat, flashcard, and quiz calls need Supabase and failed.

## 3. Test cases and results

Schemathesis coverage produced 17 cases across 9 operations in 29 seconds. The examples-only phase skipped all 9 operations because the OpenAPI file has no sample payloads. Taiko ran each UI scenario in a fresh Chrome window. CrossHair exit code 0 means it found no counterexample. "Confirmed" means every explored path kept the property.

### Equivalence class partitioning

One input stands for a whole set of inputs that should get the same outcome.

| ID | Class | Representative | Expected | Result |
|---|---|---|---|---|
| API-01 | Valid: route with no body and no database | `GET /` | 200, body matches the spec | Pass |
| API-06 | Invalid: login with an empty password | `{"username":"","password":""}` | Rejected. Handler returns 401. Spec lists only 200 and 422 | Fail. 401 is correct behavior and is missing from the spec |
| API-07 | Invalid: register with an empty email | `{"username":"","email":"","password":"..."}` | Rejected. Handler returns 400 "Valid email is required". Spec lists only 200 and 422 | Fail. 400 is missing from the spec |
| UI-01 | Valid: signed-out sign-in screen | Open `/auth/signin` | Shows "Sign in", "Continue", and "Create an account" | Pass |
| UI-02 | Invalid: both credential fields empty | Submit the sign-in form with no typing | Stays on `/auth/signin` | Pass |
| UI-03 | Invalid: username with a password that is not the stored one | `st-student` / `wrong-password` | "Invalid username or password" after the 401 | Pass |
| WB-01 | Valid: a question in the "unit plus a number" class | `"explain unit 2"` | Extracted id is `"2"` | Pass |
| WB-05 | Invalid keyword: the token is exactly `unit` | `_keywords("unit")` | `unit` is not treated as a content word | Pass |

The valid login class (a password that matches the hash) and the valid email class (a string containing `@`) were not given their own cases.

### Boundary value analysis

The edges of a numeric rule, rather than a typical member of the class.

| ID | Boundary | Input | Expected | Result |
|---|---|---|---|---|
| WB-03 | Library size 0, the bottom of "how many documents" | Any message, document list `[]` | No document selected | Pass |
| WB-06 | Overlap 1, one below the accept threshold of 2 | One shared content word, title also contains "handbook" | No document selected | Pass |
| WB-07 | Overlap 2, the smallest count that must match | Two shared content words | That document is selected | Pass |
| WB-04 | Single digits, including the ends 0 and 9 | Question `unit N` and title `unit M` for N, M in 0..9 | Match only when N = M | Inconclusive. No counterexample. The search did not finish |

### Decision table

Password and confirmation are two conditions. Only the unequal column was executed.

| ID | Password | Confirmation | Expected | Result |
|---|---|---|---|---|
| UI-04 | `secret-pass` | `other-pass` | "Passwords do not match", and no register request | Pass |
| — | `secret-pass` | `secret-pass` | Registration is attempted | Not run |

### State transition

| ID | Start state | Action | End state | Result |
|---|---|---|---|---|
| UI-05 | Register page, signed out | Follow "Sign in" | Sign-in page, subtitle "Access your library and study tools." | Pass |

### Adversarial

The input is legal HTTP or a legal string, and it is chosen to take a protected or wrong path.

| ID | Attack | Input | Expected | Result |
|---|---|---|---|---|
| API-08 | Missing credential on a protected write | `POST /api/documents/upload` with no bearer token | 401 | Fail as a spec check. The handler did return 401. The spec lists 200, 422, and 500 |
| API-09 | Missing credential, id that is not a real document | `DELETE /api/documents/0` with no bearer token | 401 before any delete | Fail as a spec check. The handler returned 401. The spec lists 200 and 422 |
| WB-02 | Ask for unit 2 while the only file is unit 3 | Message `"explain unit 2"`, title `"Physics unit 3 notes"` | Nothing selected | Pass |

### Error guessing

The guessed fault is "the Supabase hostname does not resolve." These calls never reached id checks or the model. Each one returned 500 with `getaddrinfo` error 11001.

| ID | Operation | Representative body or query | Result |
|---|---|---|---|
| API-02 | `GET /api/documents/` | `subject` and `search` empty | Fail |
| API-03 | `POST /api/chat/` | `{"message":"","history":[]}` | Fail. 500 is also absent from that operation's spec |
| API-04 | `POST /api/flashcards/generate` | `{"document_id":""}` | Fail |
| API-05 | `POST /api/quiz/generate` | `{"document_id":""}` | Fail |

### Load

| ID | Profile | What "pass" means | Result |
|---|---|---|---|
| PF-01 | `GET /`, 20 requests/second for 20 seconds, 400 requests | Every response is HTTP 200, latency stays in the tens of milliseconds | Pass. 100% success. Mean 3.98 ms. p95 8.01 ms. p99 26.3 ms. Max 72.2 ms |
| PF-02 | `GET /api/documents`, 10 requests/second for 15 seconds, 150 requests | The list answers under the same kind of fixed rate | Fail. 0% success. 4 responses were HTTP 500. 146 hit the 30 second client timeout. `/api/documents` is redirected to `/api/documents/` with 307 |

## 4. Findings to explain in the viva

1. **Spec is incomplete.** Login, register, upload, and delete return 400 or 401 for bad input, and those codes are missing from the OpenAPI responses. Schemathesis flags this as ST103. The behavior is reasonable. The documentation is not.
2. **Study features depend on a reachable Supabase host.** From this PC the host did not resolve, so list, chat, flashcards, and quiz returned 500. Under load, most of those calls waited until the client gave up instead of failing quickly.
3. **Wrong-password copy does appear.** After the `401`, the sign-in page shows "Invalid username or password". A check that does not wait for that text reports a false failure.
4. **Document matching holds for the contracts that finished.** CrossHair confirmed unit extraction, unit mismatch, the empty library, the ignored word "unit", and the one-word versus two-word overlap rule. The 0–9 digit search did not finish and did not find a breaking input.
5. **The health endpoint is fast.** Four hundred requests at 20 per second all succeeded, with mean latency under 4 ms.

## 5. Rerun commands

From the project root, with the backend on port 8000 and the frontend on port 3000:

```powershell
testing\.venv\Scripts\schemathesis.exe run http://127.0.0.1:8000/openapi.json --phases coverage --max-examples 2 --workers 1 --request-timeout 8

$env:TAIKO_BROWSER_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node testing\ui\rerun-scenarios.js

testing\.venv\Scripts\crosshair.exe check --report_all --per_condition_timeout 12 testing\whitebox\contracts.py

testing\performance\vegeta.exe attack -duration=20s -rate=20 -targets=testing\performance\targets-root.txt -output=testing\results\vegeta-root.bin
testing\performance\vegeta.exe report testing\results\vegeta-root.bin
```

Raw logs are in `testing/results/`.
