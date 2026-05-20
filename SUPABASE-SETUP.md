# New Supabase project setup

Use this after your old project was paused (90+ days). The backend uses **Supabase Auth**, **Postgres** (`users`, `documents`), and **Storage** (`textbooks` bucket).

---

## 1. Create the project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. **New project** → pick org, name (e.g. `studenthub`), database password, region.
3. Wait until the project status is **Active**.

---

## 2. Auth settings (required for login)

1. **Authentication** → **Providers** → **Email** → ensure Email is enabled.
2. For a college/lab demo, turn **off** “Confirm email” (or users must click the confirmation link before login works).
3. **Authentication** → **URL configuration** — you can leave Site URL as localhost for now; the app talks to Supabase from the **backend** using the service role key.

---

## 3. Run database SQL

1. **SQL Editor** → **New query**.
2. Paste the full contents of `backend/setup.sql` from this repo.
3. **Run**.

You should see tables `public.users` and `public.documents` under **Table Editor**.

---

## 4. Create Storage bucket

1. **Storage** → **New bucket**.
2. Name: **`textbooks`** (must match the code).
3. Enable **Public bucket** (the app uses public URLs for uploaded files).
4. Create.

No extra policies are required if the backend uses the **service role** key (it bypasses RLS).

---

## 5. Copy API keys into the backend

1. **Project Settings** → **API**.
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`  
     Never put the service role key in the frontend or commit it to Git.

Update local env:

```env
# backend/.env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Keep your existing `SECRET_KEY`, `GROQ_API_KEY`, etc.

---

## 6. Update Azure Container Instance

Recreate or update the container with the **new** Supabase values:

```powershell
az container delete -g studenthub-rg -n studenthub-backend --yes

az container create -g studenthub-rg -n studenthub-backend `
  --image shash1278/studenthub-backend:latest `
  --os-type Linux --cpu 1 --memory 1.5 `
  --dns-name-label studenthub-api-sh1278 --ports 8000 `
  --secure-environment-variables `
    "SUPABASE_URL=https://YOUR-NEW-PROJECT.supabase.co" `
    "SUPABASE_SERVICE_ROLE_KEY=YOUR-NEW-SERVICE-ROLE-KEY" `
    "GROQ_API_KEY=..." `
    "SECRET_KEY=..." `
  --environment-variables `
    "CORS_ORIGINS=https://YOUR-APP.vercel.app,http://localhost:3000"
```

Rebuild and push the Docker image first if you changed backend code since the last push.

---

## 7. Test locally (optional)

```bash
docker compose up -d --build
```

1. Open `http://localhost:3000/auth/register` — use a **real email** and username.
2. Sign in at `/auth/signin`.
3. Upload a PDF — check **Storage** → `textbooks` and **Table Editor** → `documents`.

---

## 8. Re-register users

Old accounts lived in the **paused** project. Everyone must **register again** on the new Supabase project.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Login fails after register | Turn off email confirmation, or confirm email in inbox |
| `Incorrect username or password` | Check `public.users` has a row with your username (trigger ran) |
| Upload fails / bucket error | Bucket must be named exactly `textbooks` and exist |
| `Failed to save metadata` | Run `setup.sql` so `documents` table exists |
| 401 on upload | Sign in again; backend needs a valid JWT |

---

## Checklist

- [ ] New Supabase project active
- [ ] Email auth on; confirm email off (for demo)
- [ ] `backend/setup.sql` executed
- [ ] Storage bucket `textbooks` (public)
- [ ] `backend/.env` updated
- [ ] Azure env vars updated
- [ ] Docker image rebuilt if code changed
- [ ] New user registered and tested upload
