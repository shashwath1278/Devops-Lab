# DevOps Lab — CI/CD Setup Guide

A reusable, step-by-step guide to building a full CI/CD pipeline across **GitHub,
Jenkins, SonarQube, OWASP Dependency-Check, Docker, Azure DevOps, and Vercel**.

> **Replace every `<placeholder>` with your own values** (your repo, your Docker Hub
> username, your Azure org, etc.). The steps assume a **Windows** machine.

| Platform | Role |
|----------|------|
| GitHub | Source of truth — pipelines trigger from `main` |
| Jenkins | Primary CI/CD pipeline (build → scan → push) |
| SonarQube | Security / vulnerability scan (SAST) |
| OWASP Dependency-Check | Dependency vulnerability scan |
| Docker / Docker Hub | Image build + registry |
| Azure DevOps | Second pipeline on a self-hosted agent |
| Vercel | Frontend hosting |

---

## Prerequisites

- A full-stack project pushed to a **GitHub** repo, with a `Dockerfile` for each service.
- **Docker Desktop** installed and running.
- Accounts: **GitHub**, **Docker Hub**, **Azure DevOps**, **Vercel**.
- The CI/CD files in the repo: `Jenkinsfile`, `sonar-project.properties`,
  `azure-pipelines.yml`.

---

## 0. Customise the repo files first

Before anything else, edit these committed files for your project:

- **`Jenkinsfile`** → set `IMAGE_BACKEND` / `IMAGE_FRONTEND` to `<your-dockerhub-username>/<image>`.
- **`azure-pipelines.yml`** → set the pool `name` and the `Agent.Name` demand to your chosen
  agent/pool name.
- **`sonar-project.properties`** → set `sonar.projectKey` and `sonar.projectName`.

Commit and push these changes.

---

## 1. GitHub

1. Push your project (including the CI/CD files above) to a GitHub repo.
2. Both pipelines (Jenkins and Azure DevOps) will pull from the `main` branch.

---

## 2. Docker

1. Make sure Docker Desktop is running.
2. On **Docker Hub** → *Account Settings → Security → New Access Token* → create a
   **Read/Write** token. Save it — you'll give it to Jenkins.
3. Image building and pushing are done **by the Jenkins pipeline** (stages 4–5), so no
   manual `docker build` is needed — but you can test locally with `docker compose build`.

---

## 3. Jenkins

Install Jenkins **natively on Windows** → it runs at `http://localhost:8080`
(or the port you chose).

1. Install Jenkins and finish the first-run setup wizard.
2. **Manage Jenkins → Plugins** — install: **OWASP Dependency-Check**,
   **SonarQube Scanner**, **Docker Pipeline**.
3. **Manage Jenkins → Tools** — add installations (tick "Install automatically"):
   - Dependency-Check, named `dependency-check`
   - SonarQube Scanner, named `sonar-scanner`
4. **Manage Jenkins → System → SonarQube servers** — add a server:
   - Name: `MySonarQube`  ·  URL: `http://localhost:9000`
   - Server authentication token: the SonarQube token credential (created in step 5)
5. **Manage Jenkins → Credentials → (global) → Add Credentials** — create three:
   - **`dockerhub`** — *Username with password*: Docker Hub username + the access token.
     The ID **must be exactly `dockerhub`**.
   - **`nvd-api-key`** — *Secret text*: a free NVD API key (see §5). ID **`nvd-api-key`**.
   - **SonarQube token** — *Secret text*: the token from SonarQube (see §4). Any ID.
6. **Create the Pipeline job:**
   - *New Item* → enter a name → **Pipeline** → OK
   - Definition: **Pipeline script from SCM** → SCM: **Git**
   - Repository URL: `https://github.com/<your-username>/<your-repo>.git`
   - Branch: `*/main`  ·  Script Path: `Jenkinsfile`  ·  Save
7. Make sure **Docker Desktop is running** so the build stages can reach the Docker daemon.
8. Click **Build Now**. Pipeline stages:
   1. **Checkout** — pull repo from GitHub
   2. **Dependency Check** — OWASP Dependency-Check scan (HTML + XML report)
   3. **SonarQube Analysis** — `sonar-scanner` runs the SAST scan
   4. **Docker Build** — build backend + frontend images
   5. **Docker Push** — push both images to Docker Hub

---

## 4. SonarQube

Install SonarQube **natively on Windows** → it runs at `http://localhost:9000`.

1. Download SonarQube Community, start it, open `http://localhost:9000`.
2. Log in as `admin` / `admin` and change the password.
3. Generate a token: **My Account → Security → Generate Token** → type
   **Global Analysis Token** → copy it.
4. Put that token into Jenkins as the *Secret text* credential, and select it in the
   SonarQube server config (§3.4–3.5).
5. The analysis is driven by `sonar-project.properties` in the repo:
   - `sonar.sources` points at your code folders
   - `sonar.exclusions` skips `node_modules`, `.next`, `venv`, generated UI, lock files
6. After the Jenkins SonarQube stage runs, open `http://localhost:9000` → your project
   shows the analysis results (security / reliability / maintainability issues).

> The SonarQube → Jenkins webhook (for a hard "Quality Gate" stage) is **optional** and
> often blocked because SonarQube rejects loopback/private IP webhook URLs. The analysis
> runs fine without it — only the optional gate-enforcement stage needs it.

---

## 5. OWASP Dependency-Check

- Runs **inside the Jenkins pipeline** via the Dependency-Check plugin + the
  `dependency-check` tool (§3.2–3.3).
- Get a **free NVD API key**: request one at
  `https://nvd.nist.gov/developers/request-an-api-key` (emailed instantly).
- Store it as the Jenkins *Secret text* credential **`nvd-api-key`** — the pipeline injects
  it into the scan so it isn't hardcoded in the repo.
- The first scan downloads the full NVD database (~5–10 min); later runs are fast.

---

## 6. Azure DevOps — GUI walkthrough

### 6.1 Create organization & project
1. Go to **https://dev.azure.com** and sign in.
2. If you have no organization, click **New organization** and follow the prompts.
3. Inside the org, click **+ New project** → name it `<your-project>` → **Create**.

### 6.2 Create a self-hosted agent pool
1. Bottom-left → **Project settings** → **Agent pools** (under Pipelines).
2. Click **Add pool** → Pool type: **Self-hosted**.
3. Name it `<pool-name>` (this must match the `pool: name:` in `azure-pipelines.yml`).
4. Tick **Grant access permission to all pipelines** → **Create**.

### 6.3 Generate a Personal Access Token (PAT)
1. Top-right **user-settings icon** → **Personal access tokens** → **+ New Token**.
2. Set a name, choose the organization, set an expiration.
3. Scopes: **Full access** (simplest) — or *Custom defined* → **Agent Pools → Read & manage**.
4. **Create** → **copy the token now** (it's shown only once).

### 6.4 Register the self-hosted agent
1. Open **Agent pools → `<pool-name>` → New agent** → choose **Windows / x64**.
2. The dialog shows download + extract commands. In **Windows PowerShell**:
   - Create a folder, e.g. `mkdir C:\agents\<pool-name>` then `cd` into it.
   - Run the `Invoke-WebRequest` download line shown in the dialog.
   - Extract the zip (`Expand-Archive agent.zip -DestinationPath .`).
3. Run `.\config.cmd` and answer the prompts:
   - **Server URL** → `https://dev.azure.com/<your-org>` (organization URL only)
   - **Authentication type** → `PAT` → paste the token
   - **Agent pool** → `<pool-name>`
   - **Agent name** → `<agent-name>` (must match the `Agent.Name` demand in the YAML)
   - **Work folder** → press Enter for the default
   - **Run as service?** → `Y` or `N`
4. Start it: `.\run.cmd` → it prints **"Listening for Jobs"**, and the agent shows
   **Online** in the portal. Leave this window open.

### 6.5 Create the pipeline
1. Left menu → **Pipelines** → **Create Pipeline**.
2. **Where is your code?** → choose **GitHub** (authorize Azure Pipelines) — or
   **Azure Repos Git** if you imported the repo into Azure Repos.
3. Select your repository.
4. Azure detects the existing **`azure-pipelines.yml`** → choose
   **"Existing Azure Pipelines YAML file"**.
5. Click **Run** (Save and run).

### 6.6 Monitor the run
- **Pipelines** → click the run → watch each step go green:
  **Checkout → Install Node.js → npm install & npm test**, running on your self-hosted agent.

> The "No hosted parallelism" error affects **Microsoft-hosted** agents on new orgs. You're
> using a **self-hosted** agent, which has its own free parallel job — so it shouldn't apply.

---

## 7. Vercel

1. Go to **vercel.com** → **Add New → Project** → import your GitHub repo.
2. Set **Root Directory** to your frontend folder (e.g. `frontend`).
3. Add any environment variables your frontend needs.
4. **Deploy** → Vercel gives you a live URL and auto-redeploys on every push to `main`.

---

## 8. Common problems & fixes

| Problem | Fix |
|---------|-----|
| Jenkinsfile uses `sh` but Jenkins runs on Windows | Use `bat` steps instead of `sh` |
| `credentials('id')` in the global `environment` block fails the build early | Use `withCredentials` inside the specific stage that needs it |
| `No installation <name> found` | Add the tool under *Manage Jenkins → Tools* with the exact name |
| First NVD download is slow / rate-limited | Add a free NVD API key as a Jenkins secret |
| SonarQube rejects the webhook URL (loopback/private IP) | Skip the Quality Gate stage — the analysis still runs |
| `sonar.sources` points at a folder the scanner can't resolve | Use parent folders (e.g. `backend/app,frontend`) + exclusions |
| Azure agent: `VS30063: not authorized` | The PAT lacks the *Agent Pools* scope — recreate it with Full access |
| Pipeline queues forever, never picks an agent | Agent name/pool must exactly match the `azure-pipelines.yml` demands |
| Docker Build fails: cannot reach the Docker daemon | Ensure Docker Desktop runs as a user the Jenkins service can access |

---

## 9. Optional — host the backend on Azure

To make a deployed frontend talk to a live backend (instead of mock data), deploy the
backend image to **Azure Container Instances** and point the frontend's `BACKEND_URL`
environment variable at the resulting public URL. Not required for the core lab.
