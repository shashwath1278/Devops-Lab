# Equivalence class partitioning

One input stands for a set of inputs that should get the same outcome. The class is the set. The representative is the single value that was sent.

## Classes

| Class | Rule that defines it | Representative that was sent | Case |
|---|---|---|---|
| Valid call, no body, no database | `GET /` | no body | API-01 |
| Invalid login, empty secret | password missing or blank | `{"username":"","password":""}` | API-06 |
| Invalid register, email not an address | email missing `@` | `{"username":"","email":"","password":"..."}` | API-07 |
| Valid signed-out screen | sign-in page renders its labels | open `/auth/signin` | UI-01 |
| Invalid sign-in, both fields empty | submit with no typing | empty form | UI-02 |
| Invalid sign-in, password is not the stored one | any wrong password | `st-student` / `wrong-password` | UI-03 |
| Valid unit phrase | text matches `unit` plus a number | `"explain unit 2"` | WB-01 |
| Stopword token | the token is exactly `unit` | `_keywords("unit")` | WB-05 |

These two classes were identified and not executed:

| Class | Representative that would belong | Status |
|---|---|---|
| Valid login, password matches the hash | a user created in this process, then the same password | Not run |
| Valid register email | a string that contains `@` and is not already stored | Not run |

## Results

| ID | Expected | Actual | Pass/Fail |
|---|---|---|---|
| API-01 | 200, body matches the spec | 200 | Pass |
| API-06 | Rejected. Handler returns 401. Spec lists only 200 and 422 | 401 "Incorrect username or password" | Fail. Behavior matches the handler. The spec omits 401 |
| API-07 | Rejected. Handler returns 400. Spec lists only 200 and 422 | 400 "Valid email is required" | Fail. Behavior matches the handler. The spec omits 400 |
| UI-01 | Page shows "Sign in", "Continue", "Create an account" | Those strings were present | Pass |
| UI-02 | Address stays on `/auth/signin` | Stayed | Pass |
| UI-03 | Page shows "Invalid username or password" | Shown after the 401, once the check waited | Pass |
| WB-01 | Extracted unit id is `"2"` | CrossHair confirmed `_ == "2"` | Pass |
| WB-05 | `"unit"` is not a content keyword | CrossHair confirmed the token is absent | Pass |

API-06 and API-07 are equivalence-class failures of the **specification oracle**, not of the rejection itself. The handler put the request in the invalid class and refused it.
