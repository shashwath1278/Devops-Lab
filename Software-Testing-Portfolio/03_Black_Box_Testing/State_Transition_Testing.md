# State transition testing

The state is the screen a signed-out visitor is on. The only executed transition is the link from registration back to sign-in.

```text
(signed out, register page)
        | follow "Sign in"
        v
(signed out, sign-in page)
```

| ID | Start | Action | End | Oracle | Actual | Pass/Fail |
|---|---|---|---|---|---|---|
| UI-05 | `/auth/register` | Follow "Sign in" | Sign-in page | Subtitle "Access your library and study tools." | That subtitle was present | Pass |

Transitions that were drawn and not executed:

| Start | Action | End | Status |
|---|---|---|---|
| Sign-in page | Valid username and password | Study desk `/` | Not run |
| Sign-in page | Wrong password | Same sign-in page, error visible | Covered as equivalence class UI-03, not as a second state-machine case |
| Register page | Matching passwords | Account created, then a session state | Not run |
