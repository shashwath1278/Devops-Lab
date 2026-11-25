# Final test execution report

**Application:** Student Hub  
**Period:** 25 November 2026  
**Team:** Shashwath Prabhu (1MS23IS113), Roshan Sharma (1MS23IS104), Saravanan S (1MS23IS112)  
**Processes:** Next.js `127.0.0.1:3000`, FastAPI `127.0.0.1:8000`

## 1. Result

| | Count |
|---|---|
| Cases | 23 |
| Passed | 13 |
| Failed | 9 |
| Inconclusive | 1 |

| Technique | Cases | Passed | Failed | Inconclusive | Not run, but identified |
|---|---|---|---|---|---|
| Equivalence class | API-01, API-06, API-07, UI-01, UI-02, UI-03, WB-01, WB-05 | 6 | 2 | 0 | Valid login, valid email |
| Boundary value | WB-03, WB-04, WB-06, WB-07 | 3 | 0 | 1 | Overlap 3 |
| Decision table | UI-04 | 1 | 0 | 0 | Equal passwords |
| State transition | UI-05 | 1 | 0 | 0 | Valid login into the study desk |
| Adversarial | API-08, API-09, WB-02 | 1 | 2 | 0 | — |
| Error guessing | API-02, API-03, API-04, API-05 | 0 | 4 | 0 | — |
| Load | PF-01, PF-02 | 1 | 1 | 0 | — |

The two equivalence-class failures and the two adversarial API failures are the same kind of finding: the handler returned 400 or 401, and the OpenAPI file does not list that code. The four error-guessing failures are HTTP 500 from `getaddrinfo` 11001.

## 2. Environment

| Component | Detail |
|---|---|
| OS | Windows, PowerShell |
| API | FastAPI via uvicorn, Python 3.11 in `testing/.venv` |
| UI | Next.js 16 dev server |
| Browser | System Chrome through Taiko. `TAIKO_BROWSER_PATH` set |
| Database | Supabase configured. Hostname did not resolve from this PC |
| Model | Not reached. Chat, flashcards, and quiz failed before Groq |

## 3. Black box

Equivalence classes, boundaries, the decision table, and the state transition are written up under `03_Black_Box_Testing/`. UI-01 through UI-05 passed. API-06 and API-07 failed the spec check and rejected the invalid class, which is what the handler is written to do.

## 4. White box

`_pick_matching_document` has 13 predicates, so V(G) = 14. CrossHair confirmed 6 contracts and left the digit-domain contract inconclusive. Seven independent paths have no contract. Detail is in `04_White_Box_Testing/`. Confirmed path coverage of the basis is 6/14. No statement-coverage percentage was measured.

## 5. API and load

Schemathesis coverage: 1 of 9 operations passed. Vegeta: `GET /` at 20 requests/second passed (400/400, mean 3.98 ms). The document list at 10 requests/second failed (0% success). Detail is in `05_API_Testing/API_Test_Results.md`.

## 6. Automation

Five Taiko scenarios, five passes, each in a fresh browser window. The Gauge runner was not reliable on the second attempt. The passing run is `node testing/ui/rerun-scenarios.js`.

## 7. Defects

Six defects, all still open. Four are missing status codes in the OpenAPI file. One is the Supabase hostname failure, including the load timeouts. One is the trailing-slash redirect on the document list. See `07_Defect_Reports/Bug_Report.md`.

## 8. What a demonstrator should be shown

1. `GET /` returning 200, and the Vegeta line for 100% success.
2. Login with an empty password returning 401, then the OpenAPI entry that does not mention 401.
3. The sign-in page showing "Invalid username or password" after `st-student` / `wrong-password`.
4. CrossHair output: six confirmed contracts, and one unfinished search for digits 0–9.
5. A document request whose body contains `getaddrinfo` 11001.

## 9. Evidence

Text and JSON reports are in `testing/results/`. Screenshots were not captured. `09_Evidence/screenshots/README.md` lists the files that do exist.
