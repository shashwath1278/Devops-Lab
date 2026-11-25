# Decision table testing

Registration compares two conditions before it calls the API: the password, and the confirmation. The page is `frontend` register. The check is client-side, so the unequal column must not send `POST /api/auth/register`.

| Rule | Password filled | Confirmation equals password | Expected action |
|---|---|---|---|
| R1 | No | — | Stay on the form. Not run as its own case. UI-02 covers an empty sign-in submit, which is a different form |
| R2 | Yes | No | Show "Passwords do not match". Do not register |
| R3 | Yes | Yes | Submit registration |

## Executed column

| ID | Password | Confirmation | Expected | Actual | Pass/Fail |
|---|---|---|---|---|---|
| UI-04 | `secret-pass` | `other-pass` | "Passwords do not match", no register request | The page showed "Passwords do not match" | Pass |
| — | `secret-pass` | `secret-pass` | Registration is attempted | — | Not run |

R2 is the column that protects the API from a mismatched pair. R3 remains an open column. It was left unrun so the report would not claim a successful account creation that this session did not perform.
