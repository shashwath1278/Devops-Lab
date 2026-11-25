# Test plan — Student Hub

**Application:** Student Hub  
**Build under test:** local processes on 25 November 2026  
**Team:** Shashwath Prabhu (1MS23IS113), Roshan Sharma (1MS23IS104), Saravanan S (1MS23IS112)

## Objective

Show that the authentication screens, the document API, and the chat matching rules behave as the code and the OpenAPI file say, and record every place they do not.

## Scope

| In scope | Out of scope |
|---|---|
| Sign-in and register pages | Visual design, colour, layout polish |
| Auth, documents, chat, flashcards, quiz HTTP contracts | Model answer quality |
| Chat matching helpers, by reading their branches | A full statement-coverage percentage |
| Fixed-rate load on `GET /` and the document list | A multi-hour soak or a distributed load |

## Environment

| Piece | Value |
|---|---|
| OS | Windows, PowerShell |
| Backend | `testing\.venv`, uvicorn `127.0.0.1:8000` |
| Frontend | Next.js dev server `127.0.0.1:3000` |
| Browser for UI | Installed Google Chrome, path set in `TAIKO_BROWSER_PATH` |
| Supabase | Values present in `backend/.env`. The hostname did not resolve (`getaddrinfo` 11001) |

Auth could still be tested because passwords live in process memory. Any route that queries Supabase could not.

## Techniques and why each one was chosen

| Technique | What it decides | Tool |
|---|---|---|
| Equivalence class partitioning | One sample stands for a class: valid call, empty field, wrong password, stopword | Schemathesis, Taiko, CrossHair |
| Boundary value analysis | Library size 0, keyword overlap 1 and 2, digits 0–9 | CrossHair |
| Decision table | Password compared with confirmation | Taiko |
| State transition | Register page, follow Sign in, land on sign-in | Taiko |
| Adversarial | No token, or a question aimed at the wrong unit | Schemathesis, CrossHair |
| Error guessing | Database host does not resolve | Schemathesis |
| Basis path | Independent paths through `_pick_matching_document` | CrossHair contracts on the paths that were encoded |
| Load | Fixed rate, success ratio, latency | Vegeta |

## Entry and exit

Testing started when both processes answered: `GET /` on port 8000 and `/auth/signin` on port 3000.

The run is complete for the 23 cases in `08_Test_Reports/Final_Test_Report.md`. It is not complete for the classes marked "Not run": valid login, matching passwords, and a reachable Supabase host.

## Risks that affected the run

| Risk | What happened |
|---|---|
| Supabase DNS | List, chat, flashcards, and quiz returned 500. Those cases never reached id validation or the model |
| OpenAPI file behind the handlers | 400 and 401 responses failed the status-code check even though the handler behaved as written |
| Gauge runner on this PC | The Gauge process became unstable after the first attempt. The five UI scenarios were re-run with `testing/ui/rerun-scenarios.js`, which uses the same Taiko steps |
| Symbolic execution of digits 0–9 | CrossHair did not finish `same_single_digit_unit`. No counterexample was found. The case stays inconclusive |

## Schedule actually followed

One session on 25 November 2026: install the four tools, start both servers, run Schemathesis coverage, Taiko UI, CrossHair, then Vegeta.
