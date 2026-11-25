# Automation

UI automation is Taiko 1.5.2, driven by the five scenarios in `testing/ui/specs/auth.spec`. On this machine the Gauge runner (1.6.44) did not stay up for a second full run, so the executed suite is `testing/ui/rerun-scenarios.js`, which opens a fresh Chrome window per scenario.

API generation is Schemathesis (`../05_API_Testing/API_Test_Results.md`). Path checking is CrossHair (`../04_White_Box_Testing/`). Load is Vegeta.

## Scenarios and results

| ID | Scenario in `auth.spec` | Technique | Result |
|---|---|---|---|
| UI-01 | Sign-in page shows "Sign in", "Continue", "Create an account" | Equivalence class, valid screen | Pass |
| UI-02 | Empty submit stays on `/auth/signin` | Equivalence class, empty credentials | Pass |
| UI-03 | `st-student` / `wrong-password` shows "Invalid username or password" | Equivalence class, wrong secret | Pass |
| UI-04 | `secret-pass` vs `other-pass` shows "Passwords do not match" | Decision table, unequal column | Pass |
| UI-05 | Register page, follow "Sign in" | State transition | Pass |

UI-03 failed a first assertion that did not wait. The message is rendered after the 401, about four seconds later. The rerun waits up to 15 seconds. With that wait, UI-03 passed. The backend log showed `POST /api/auth/login` 401.

## How to run

Backend on port 8000, frontend on port 3000, then:

```powershell
$env:TAIKO_BROWSER_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node testing\ui\rerun-scenarios.js
```

Taiko uses the installed Chrome because the bundled Chromium download stalled. `testing/ui/package.json` depends on Taiko 1.5.2. Install with `TAIKO_SKIP_CHROMIUM_DOWNLOAD=true` if the download locks.

## What this automation does not cover

- A password that matches the stored hash
- A confirmation that matches the password
- Upload, library, or chat screens. Those pages need a session and a reachable Supabase host, which this run did not have
