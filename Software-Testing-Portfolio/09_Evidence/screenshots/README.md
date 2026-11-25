# Screenshots

This run did not save PNG files. The evidence is the tool output written during the execution on 25 November 2026.

| File | What it shows |
|---|---|
| `testing/results/schemathesis/json-20261125T192608Z.json` | Coverage phase. The examples-only file beside it shows all 9 operations skipped |
| `testing/results/crosshair.txt` | Six confirmed contracts and one unfinished digit search |
| `testing/results/vegeta-root.txt` | 400 requests, 100% HTTP 200, mean 3.98 ms |
| `testing/results/vegeta-documents.txt` | 150 requests, 0% success |
| `testing/results/gauge.txt` | A later Gauge attempt that died with "Runner is not Alive". This is not the passing UI run |
| `testing/ui/specs/auth.spec` | The five scenarios the passing Taiko rerun executed |
| `testing/ST-TEST-REPORT.md` | The same 23 cases, grouped by technique |

A screenshot of the sign-in error would repeat UI-03. The assertion that passed waited until the page text contained "Invalid username or password".
