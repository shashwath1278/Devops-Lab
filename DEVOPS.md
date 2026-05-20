# Student Hub — DevOps / CI-CD Guide

This document explains the complete CI/CD pipeline across **GitHub, Jenkins, Azure DevOps,
Docker, SonarQube, and Vercel**. Use it as the reference for the lab demo.

## Architecture

```
GitHub (main)  ── push ──┬──> Jenkins pipeline (primary CI/CD)
                         │      Checkout → Dependency-Check → SonarQube
                         │      → Docker Build → Docker Push (Docker Hub)
                         │
                         ├──> Azure DevOps pipeline (azure-pipelines.yml)
                         │      Checkout → install Node → npm install/test
                         │      runs on self-hosted agent 'shashwath' in pool 'shashwath'
                         │
                         └──> Vercel (auto-deploy frontend on push)

Docker Hub images ──> Azure Container Instances (live backend) <── Vercel frontend calls /api/*
```

## What each platform does

| Platform | Role |
|----------|------|
| **GitHub** | Single source of truth. Both pipelines trigger on push to `main`. |
| **Jenkins** | Primary CI/CD: checkout → dependency check → security scan → build → push images. |
| **Azure DevOps** | Second pipeline (`azure-pipelines.yml`) — build/test on a self-hosted agent. |
| **Docker / Docker Hub** | Builds the frontend + backend images; Docker Hub is the registry. |
| **SonarQube** | Static security/vulnerability scan (SAST) — the **Vulnerability Check**. |
| **OWASP Dependency-Check** | Scans dependencies for known CVEs — the **Dependency Check**. |
| **Vercel** | Hosts the Next.js frontend; auto-deploys on every push. |
| **Azure Container Instances** | Runs the live FastAPI backend container. |

## Repository artifacts

| File | Purpose |
|------|---------|
| `Jenkinsfile` | 5-stage declarative Jenkins pipeline. |
| `sonar-project.properties` | SonarQube project + source/exclusion config. |
| `azure-pipelines.yml` | Azure DevOps pipeline (pool `shashwath`, agent `shashwath`). |
| `tools/Dockerfile.jenkins` | Jenkins LTS image with the Docker CLI added. |
| `tools/docker-compose.tools.yml` | Runs Jenkins + SonarQube locally. |
| `backend/Dockerfile`, `frontend/Dockerfile` | Service images. |
| `docker-compose.yml` | Runs the full app (frontend + backend) locally. |

## Jenkins pipeline stages

1. **Checkout** — pulls the repo from GitHub.
2. **Dependency Check** — OWASP Dependency-Check scans for vulnerable dependencies; HTML + XML
   report published in Jenkins.
3. **SonarQube Analysis** — `sonar-scanner` sends code to SonarQube for the security scan.
4. **Docker Build** — builds `studenthub-backend` and `studenthub-frontend` images.
5. **Docker Push** — logs in and pushes both images to Docker Hub.

> A SonarQube Quality Gate stage was intentionally left out: it needs a SonarQube → Jenkins
> webhook, and SonarQube blocks webhooks to local/private IPs. The SonarQube **analysis** still
> runs in stage 3 — results appear on the SonarQube dashboard, which is the security-check
> deliverable.

## Setup (run once, the night before)

### 1. Docker + Docker Hub
```bash
# repo root — create backend/.env from backend/.env.example first
docker compose build
docker compose up -d            # frontend :3000, backend :8000
```

### 2. Jenkins + SonarQube
The `Jenkinsfile` is written for a **Jenkins controller installed natively on Windows**
(uses `bat` steps). SonarQube also runs natively on `http://localhost:9000`.

In Jenkins:
- Install plugins: **OWASP Dependency-Check**, **SonarQube Scanner**, **Docker Pipeline**.
- *Manage Jenkins → Tools*: add a Dependency-Check installation named `dependency-check`
  and a SonarQube Scanner named `sonar-scanner` (both "install automatically").
- *Manage Jenkins → System → SonarQube servers*: add server `MySonarQube`,
  URL `http://localhost:9000`, with the SonarQube token credential.
- *Manage Jenkins → Credentials* — three credentials:
  - `dockerhub` — Username/password (Docker Hub username + Read/Write access token).
    **ID must be exactly `dockerhub`.**
  - `nvd-api-key` — Secret text (free key from nvd.nist.gov). **ID must be exactly `nvd-api-key`.**
  - SonarQube token — Secret text; any ID, selected in the SonarQube server config above.
- Docker Desktop must be running, with `docker` on PATH for the Jenkins service account.
- Create a Pipeline job → *Pipeline script from SCM* → this repo → `Jenkinsfile`.

> The first Dependency-Check run downloads the full NVD database (~5–10 min even with the API
> key). Run one build early so it caches; later runs are fast incremental updates.

### 3. Azure DevOps
- Sign in (use college ID credentials if the normal login fails).
- Create a project; connect this GitHub repo.
- *Project settings → Agent pools* → create pool `shashwath`.
- Register a self-hosted agent named `shashwath` in that pool (download agent, `./config`, `./run`).
- New pipeline → use the existing `azure-pipelines.yml`.

### 4. Vercel (frontend)
- Import the GitHub repo; set **Root Directory = `frontend`**.
- Env vars (then **redeploy** so rewrites pick up `BACKEND_URL`):
  - `BACKEND_URL` — e.g. `http://studenthub-api-sh1278.centralindia.azurecontainer.io:8000`
  - `NEXTAUTH_URL` — your Vercel app URL, e.g. `https://your-app.vercel.app`
  - `NEXTAUTH_SECRET` — long random string (not the backend `SECRET_KEY`)
  - Optional: `NEXTAUTH_BACKEND_URL` — same as `{BACKEND_URL}/api/auth/login` if login fails
- On Azure backend, set `CORS_ORIGINS` to include your Vercel URL if the browser calls the API directly.

### 5. Azure Container Instances (live backend)
```bash
az group create -n studenthub-rg -l centralindia
az container create -g studenthub-rg -n studenthub-backend \
  --image shash1278/studenthub-backend:latest \
  --dns-name-label studenthub-api --ports 8000 \
  --secure-environment-variables SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
       GROQ_API_KEY=... SECRET_KEY=... \
  --environment-variables CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

Use the **same** `SECRET_KEY` value in Azure and in local `backend/.env` so issued JWTs stay valid. After code changes, rebuild and push the Docker image, then recreate the container.

## Demo runbook ("explain the pipeline")

- **Open Jenkins** → show the pipeline job → walk the 5 stages → open the Dependency-Check HTML
  report and the SonarQube link → show the pushed image on Docker Hub.
- **Open Azure DevOps** → show the pipeline run → `azure-pipelines.yml` → the `shashwath` pool with
  agent `shashwath` online → the green run logs.
- **Open Vercel** → show the deployment list → the live URL → that a Git push triggers a redeploy.
- **One-line summary:** "A push to GitHub `main` triggers both Jenkins (build → dependency &
  security scan → push image to Docker Hub) and Azure DevOps (build/test on our self-hosted
  agent); Vercel hosts the frontend and Azure Container Instances runs the backend."

## Supabase (new project)

If the old Supabase project was paused, create a new project and follow **`SUPABASE-SETUP.md`** (SQL, `textbooks` bucket, new API keys in Azure + `backend/.env`).

## Known limitations (do not demo)

- **Podcast feature** (`backend/app/api/podcast.py`) is incomplete and not wired into the app.
- **Auth** uses a local in-memory store on the backend (no Supabase signup emails). Users reset
  when the Azure container restarts — register again after redeploy.
