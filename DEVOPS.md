# Student Hub — DevOps / CI-CD Guide

This document explains the complete CI/CD pipeline across **GitHub, Jenkins, Azure DevOps,
Docker, SonarQube, and Vercel**. Use it as the reference for the lab demo.

## Architecture

```
GitHub (main)  ── push ──┬──> Jenkins pipeline (primary CI/CD)
                         │      Checkout → Dependency-Check → SonarQube
                         │      → Quality Gate → Docker Build → Docker Push (Docker Hub)
                         │
                         ├──> Azure DevOps pipeline (azure-pipelines.yml)
                         │      Checkout → install Node → npm install/test
                         │      runs on self-hosted agent 'shrutijr' in pool 'shruti'
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
| `Jenkinsfile` | 6-stage declarative Jenkins pipeline. |
| `sonar-project.properties` | SonarQube project + source/exclusion config. |
| `azure-pipelines.yml` | Azure DevOps pipeline (pool `shruti`, agent `shrutijr`). |
| `tools/Dockerfile.jenkins` | Jenkins LTS image with the Docker CLI added. |
| `tools/docker-compose.tools.yml` | Runs Jenkins + SonarQube locally. |
| `backend/Dockerfile`, `frontend/Dockerfile` | Service images. |
| `docker-compose.yml` | Runs the full app (frontend + backend) locally. |

## Jenkins pipeline stages

1. **Checkout** — pulls the repo from GitHub.
2. **Dependency Check** — OWASP Dependency-Check scans for vulnerable dependencies; HTML + XML
   report published in Jenkins.
3. **SonarQube Analysis** — `sonar-scanner` sends code to SonarQube for the security scan.
4. **Quality Gate** — waits for the SonarQube gate result (`abortPipeline: false` — never fails
   the demo build).
5. **Docker Build** — builds `studenthub-backend` and `studenthub-frontend` images.
6. **Docker Push** — logs in and pushes both images to Docker Hub.

## Setup (run once, the night before)

### 1. Docker + Docker Hub
```bash
# repo root — create backend/.env from backend/.env.example first
docker compose build
docker compose up -d            # frontend :3000, backend :8000
```

### 2. Jenkins + SonarQube
```bash
cd tools
docker compose -f docker-compose.tools.yml up -d
# Jenkins   -> http://localhost:8080  (initial password: see container logs)
# SonarQube -> http://localhost:9000  (admin / admin)
```
In Jenkins:
- Install plugins: **OWASP Dependency-Check**, **SonarQube Scanner**, **Docker Pipeline**.
- *Manage Jenkins → Tools*: add Dependency-Check installation `dependency-check`,
  SonarQube Scanner `sonar-scanner`.
- *Manage Jenkins → System → SonarQube servers*: add server `MySonarQube`,
  URL `http://sonarqube:9000`, with a SonarQube token credential.
- *Credentials*: add `dockerhub` (Docker Hub username/password).
- Create a Pipeline job → *Pipeline script from SCM* → this repo → `Jenkinsfile`.

> First Dependency-Check run downloads the NVD feed and is slow — add a free NVD API key on the
> tool, or run the stage once early so it caches.

### 3. Azure DevOps
- Sign in (use college ID credentials if the normal login fails).
- Create a project; connect this GitHub repo.
- *Project settings → Agent pools* → create pool `shruti`.
- Register a self-hosted agent named `shrutijr` in that pool (download agent, `./config`, `./run`).
- New pipeline → use the existing `azure-pipelines.yml`.

### 4. Vercel (frontend)
- Import the GitHub repo; set **Root Directory = `frontend`**.
- Env vars: `BACKEND_URL` (live backend URL), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.

### 5. Azure Container Instances (live backend)
```bash
az group create -n studenthub-rg -l centralindia
az container create -g studenthub-rg -n studenthub-backend \
  --image shash1278/studenthub-backend:latest \
  --dns-name-label studenthub-api --ports 8000 \
  --secure-environment-variables SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
       GROQ_API_KEY=... SECRET_KEY=...
```

## Demo runbook ("explain the pipeline")

- **Open Jenkins** → show the pipeline job → walk the 6 stages → open the Dependency-Check HTML
  report and the SonarQube link → show the pushed image on Docker Hub.
- **Open Azure DevOps** → show the pipeline run → `azure-pipelines.yml` → the `shruti` pool with
  agent `shrutijr` online → the green run logs.
- **Open Vercel** → show the deployment list → the live URL → that a Git push triggers a redeploy.
- **One-line summary:** "A push to GitHub `main` triggers both Jenkins (build → dependency &
  security scan → push image to Docker Hub) and Azure DevOps (build/test on our self-hosted
  agent); Vercel hosts the frontend and Azure Container Instances runs the backend."

## Known limitations (do not demo)

- **Podcast feature** (`backend/app/api/podcast.py`) is incomplete and not wired into the app.
- **Auth** uses an in-memory store — register and log in within the same session, or use the
  built-in mock login (`username` / `password`).
