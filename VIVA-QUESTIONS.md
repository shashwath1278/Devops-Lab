# DevOps Lab — Viva Questions & Answers

Likely viva questions grouped by topic, with short answers. Covers **CI/CD, Git, Docker,
Jenkins, SonarQube, OWASP Dependency-Check, Azure DevOps, Vercel**, plus a final section
on explaining **your own pipeline**.

---

## 1. DevOps & CI/CD Fundamentals

**Q1. What is DevOps?**
A culture and set of practices that combine software **Dev**elopment and IT **Op**erations to
deliver software faster and more reliably through automation and collaboration.

**Q2. What is CI (Continuous Integration)?**
Developers frequently merge code into a shared branch; each merge automatically triggers a
build and tests, so integration problems are caught early.

**Q3. What is CD?**
**Continuous Delivery** — code is always kept in a deployable state, with the final release
done manually. **Continuous Deployment** — every passing change is released to production
automatically.

**Q4. What is a CI/CD pipeline?**
An automated sequence of stages (build → test → scan → deploy) that code passes through from
commit to release.

**Q5. What are the benefits of CI/CD?**
Faster delivery, early bug detection, fewer manual errors, repeatable builds, and quick
feedback to developers.

**Q6. What is a pipeline stage / step?**
A **stage** is a logical phase (e.g. Build, Test); a **step** is a single command within it.

**Q7. What is an artifact?**
A file produced by a build — e.g. a Docker image, a `.jar`, or a report.

**Q8. What is a build trigger?**
The event that starts a pipeline — a code push, a webhook, a schedule, or a manual click.

**Q9. What is "shift left" in DevOps?**
Moving testing and security checks earlier in the pipeline so issues are caught sooner.

**Q10. What is a Quality Gate?**
A pass/fail checkpoint based on defined criteria (e.g. no critical vulnerabilities) that a
build must meet to continue.

**Q11. What is SAST, DAST, and SCA?**
**SAST** — static analysis of source code (SonarQube). **DAST** — testing a running app.
**SCA** — scanning third-party dependencies (OWASP Dependency-Check).

**Q12. What is Infrastructure as Code (IaC)?**
Managing infrastructure through code/config files (e.g. Dockerfiles, YAML) instead of manual
setup.

**Q13. What is "pipeline as code"?**
Defining the pipeline in a file stored in the repo (`Jenkinsfile`, `azure-pipelines.yml`) so
it is version-controlled.

**Q14. What is an agent / runner / executor?**
The machine or process that actually runs the pipeline's jobs.

**Q15. What is a rollback?**
Reverting to a previous working version when a deployment fails.

**Q16. What is blue-green deployment?**
Running two environments — one live (blue), one updated (green) — and switching traffic over
once green is verified.

**Q17. What is canary deployment?**
Releasing a change to a small subset of users first, then gradually to everyone.

**Q18. Why automate a pipeline instead of doing it manually?**
Automation is faster, repeatable, less error-prone, and gives consistent results every time.

**Q19. What is the role of version control in CI/CD?**
It is the trigger and single source of truth — pipelines run on commits to the repo.

**Q20. What is monolithic vs microservices architecture?**
A **monolith** is one large deployable unit; **microservices** split the app into small,
independently deployable services (e.g. separate frontend and backend).

---

## 2. Git & GitHub

**Q1. What is Git?**
A distributed version control system that tracks changes to source code.

**Q2. Git vs GitHub?**
Git is the version-control tool; GitHub is a cloud platform that hosts Git repositories.

**Q3. What does `git clone` do?**
Creates a local copy of a remote repository.

**Q4. Difference between `git fetch` and `git pull`?**
`fetch` downloads remote changes without merging; `pull` = `fetch` + `merge`.

**Q5. What is `git add` / the staging area?**
`git add` moves changes into the staging area — the set of changes that the next commit will
include.

**Q6. What is a commit?**
A saved snapshot of staged changes, identified by a unique hash.

**Q7. What is `git push`?**
Uploads local commits to the remote repository.

**Q8. What is a branch?**
An independent line of development; `main` is the default/production branch.

**Q9. What is a merge conflict?**
When Git can't auto-combine changes to the same lines and a human must resolve it.

**Q10. What is `.gitignore`?**
A file listing paths Git should not track (e.g. `node_modules`, `.env`).

**Q11. What is a pull request?**
A request to review and merge changes from one branch into another.

**Q12. What is `origin`?**
The default name for the remote repository a local repo was cloned from.

**Q13. What is `HEAD`?**
A pointer to the current commit/branch you're working on.

**Q14. How does a CI tool get your code?**
Via an **SCM checkout** — it clones/pulls the repo at the start of the pipeline.

**Q15. What is a webhook?**
An automatic HTTP notification (e.g. GitHub → Jenkins) that triggers a pipeline on a push.

**Q16. Why should secrets never be committed to Git?**
They become visible to anyone with repo access and remain in history even after deletion;
they must be rotated if leaked.

**Q17. What does `git status` show?**
The current branch, staged/unstaged changes, and untracked files.

**Q18. What is a commit hash?**
A unique SHA identifier for each commit.

**Q19. What is `git log`?**
Shows the commit history.

**Q20. What is a remote?**
A version of the repository hosted elsewhere (e.g. on GitHub).

---

## 3. Docker

**Q1. What is Docker?**
A platform for building, shipping, and running applications inside containers.

**Q2. What is containerization?**
Packaging an app with all its dependencies so it runs consistently on any environment.

**Q3. Container vs Virtual Machine?**
A VM virtualizes hardware and includes a full OS; a container shares the host OS kernel,
making it lighter and faster.

**Q4. What is a Docker image?**
A read-only template containing the app and its dependencies.

**Q5. What is a Docker container?**
A running instance of an image.

**Q6. What is a Dockerfile?**
A text file with instructions to build a Docker image.

**Q7. What does `docker build` do?**
Builds an image from a Dockerfile.

**Q8. What does `docker run` do?**
Creates and starts a container from an image.

**Q9. What is Docker Hub?**
A cloud registry for storing and sharing Docker images.

**Q10. What are image layers?**
Each Dockerfile instruction creates a layer; layers are cached to speed up rebuilds.

**Q11. What is a multi-stage build?**
Using multiple `FROM` stages in one Dockerfile — e.g. build in one stage, copy only the
output into a small final image, reducing image size.

**Q12. Explain `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `CMD`.**
`FROM` — base image; `WORKDIR` — working directory; `COPY` — copy files in; `RUN` — execute
a command at build time; `EXPOSE` — document a port; `CMD` — default command at run time.

**Q13. Difference between `CMD` and `ENTRYPOINT`?**
`CMD` sets a default command/arguments that can be overridden; `ENTRYPOINT` sets the main
executable that always runs.

**Q14. Difference between `ARG` and `ENV`?**
`ARG` is a build-time variable; `ENV` sets an environment variable available at run time.

**Q15. What is Docker Compose?**
A tool to define and run multi-container applications using a YAML file.

**Q16. What is port mapping?**
Linking a host port to a container port (e.g. `-p 3000:3000`).

**Q17. What is a Docker volume?**
A mechanism to persist container data outside the container's lifecycle.

**Q18. What is `.dockerignore`?**
Lists files/folders to exclude from the build context (e.g. `node_modules`).

**Q19. What is an image tag?**
A label for an image version (e.g. `:latest`, `:4`).

**Q20. What is the Docker daemon?**
The background service that builds, runs, and manages Docker objects.

**Q21. What is a healthcheck in Docker?**
A command Docker runs periodically to verify a container is working correctly.

**Q22. Why use Docker in CI/CD?**
It guarantees the same environment in build, test, and production — "works on my machine"
problems disappear.

---

## 4. Jenkins

**Q1. What is Jenkins?**
An open-source automation server used to build, test, and deploy software (CI/CD).

**Q2. What is a Jenkins pipeline?**
A suite of plugins that defines the build process as code, in stages.

**Q3. Declarative vs Scripted pipeline?**
**Declarative** uses a structured, simpler syntax (`pipeline { }`); **Scripted** uses full
Groovy and is more flexible but complex.

**Q4. What is a Jenkinsfile?**
A text file in the repo that defines the pipeline as code (pipeline as code).

**Q5. What are `stages`, `steps`, and `post`?**
`stages` group the work, `steps` are commands inside a stage, `post` runs actions after
(always/success/failure).

**Q6. What is an `agent` in Jenkins?**
The machine/node where the pipeline runs; `agent any` uses any available node.

**Q7. What is a Jenkins job?**
A configured task/project in Jenkins (e.g. a Pipeline job).

**Q8. What is "Pipeline script from SCM"?**
Jenkins reads the `Jenkinsfile` from your Git repo instead of storing the script in the UI.

**Q9. What are Jenkins plugins? Which did you use?**
Add-ons that extend Jenkins. This project used **OWASP Dependency-Check**, **SonarQube
Scanner**, and **Docker Pipeline**.

**Q10. How are credentials handled in Jenkins?**
Stored securely in the Credentials store and referenced by ID; values are masked in logs.

**Q11. What is `withCredentials`?**
A block that injects a stored credential into specific steps as an environment variable.

**Q12. What is the difference between `sh` and `bat`?**
`sh` runs shell commands on Linux/macOS; `bat` runs batch commands on Windows.

**Q13. What is the `environment` block?**
Defines environment variables available to the pipeline or a stage.

**Q14. What is a Jenkins workspace?**
The directory on the agent where the job checks out code and runs.

**Q15. What is the `tool` directive?**
References a tool installation configured in *Manage Jenkins → Tools* (e.g. `sonar-scanner`).

**Q16. How does Jenkins trigger a build?**
Manually, on an SCM poll, on a webhook from GitHub, or on a schedule.

**Q17. Controller (master) vs agent in Jenkins?**
The controller schedules and coordinates jobs; agents execute the work.

**Q18. What does the `post` section do?**
Runs steps after a stage/pipeline based on outcome — `always`, `success`, `failure`.

**Q19. What is a build number?**
A unique incrementing ID for each run of a job (used here to tag Docker images).

**Q20. How does your pipeline push to Docker Hub?**
It logs in with the `dockerhub` credential via `withCredentials`, then runs `docker push`.

**Q21. What is a Quality Gate stage (`waitForQualityGate`)?**
A step that waits for SonarQube's pass/fail result before continuing.

**Q22. What is Blue Ocean?**
A Jenkins plugin that provides a modern, visual pipeline UI.

---

## 5. SonarQube

**Q1. What is SonarQube?**
An open-source platform for continuous inspection of code quality and security.

**Q2. What is static code analysis (SAST)?**
Analyzing source code without running it, to find bugs, vulnerabilities, and bad practices.

**Q3. What does SonarQube detect?**
**Bugs**, **vulnerabilities**, **code smells**, **security hotspots**, duplications, and
coverage gaps.

**Q4. Bug vs Vulnerability vs Code Smell?**
A **bug** is a coding error; a **vulnerability** is a security weakness; a **code smell** is
a maintainability issue.

**Q5. What is a security hotspot?**
A piece of security-sensitive code that needs manual review (may or may not be a real risk).

**Q6. What is a Quality Gate in SonarQube?**
A set of conditions a project must meet to be marked "Passed".

**Q7. What is technical debt?**
The estimated effort to fix all maintainability issues in the code.

**Q8. What is code coverage?**
The percentage of code executed by automated tests.

**Q9. What is the sonar-scanner?**
The client tool that analyzes the code and sends results to the SonarQube server.

**Q10. What is `sonar-project.properties`?**
The config file defining the project key, source folders, and exclusions.

**Q11. What do `sonar.sources` and `sonar.exclusions` do?**
`sonar.sources` lists folders to analyze; `sonar.exclusions` lists paths to skip.

**Q12. What is the project key?**
A unique identifier for the project in SonarQube.

**Q13. What are the A–E ratings?**
Letter grades for Security, Reliability, and Maintainability — A is best, E is worst.

**Q14. What edition did you use?**
SonarQube **Community** edition.

**Q15. What is the analysis token?**
A secret token used by the scanner to authenticate to the SonarQube server.

**Q16. How does Jenkins integrate with SonarQube?**
Via the SonarQube Scanner plugin and `withSonarQubeEnv`, which inject the server URL and
token into the scan.

**Q17. What is the SonarQube webhook for?**
It notifies Jenkins of the Quality Gate result so the pipeline can react to it.

**Q18. SonarQube vs SonarCloud?**
SonarQube is self-hosted; SonarCloud is the cloud-hosted SaaS version.

**Q19. New code vs Overall code?**
"New code" measures only recently changed code; "Overall" measures the whole codebase.

**Q20. What did SonarQube find in your project?**
It analyzed ~2.6k lines and reported security, reliability, and maintainability issues;
the Quality Gate Passed.

**Q21. Where does SonarQube store its data?**
In a database (an embedded DB for evaluation, or PostgreSQL for production).

---

## 6. OWASP Dependency-Check

**Q1. What is OWASP?**
The Open Worldwide Application Security Project — a nonprofit focused on software security.

**Q2. What is OWASP Dependency-Check?**
A tool that scans a project's third-party dependencies for known security vulnerabilities.

**Q3. What is SCA (Software Composition Analysis)?**
Analyzing the open-source/third-party components an app uses to find known risks.

**Q4. What is a CVE?**
**Common Vulnerabilities and Exposures** — a publicly catalogued security flaw with a unique
ID.

**Q5. What is the NVD?**
The **National Vulnerability Database** — the US database of CVEs that Dependency-Check uses.

**Q6. What is a CVSS score?**
The **Common Vulnerability Scoring System** — a 0–10 severity rating for a vulnerability.

**Q7. Why scan dependencies?**
Most application code is third-party libraries; a vulnerable library puts the whole app at
risk.

**Q8. What is a transitive dependency?**
A dependency pulled in indirectly by another dependency.

**Q9. What is a false positive in this context?**
The tool flags a vulnerability that doesn't actually apply; it can be suppressed.

**Q10. How is Dependency-Check integrated here?**
It runs as a stage in the Jenkins pipeline via the Dependency-Check plugin and tool.

**Q11. What is the NVD API key for?**
It speeds up and removes rate limits when downloading the NVD vulnerability data.

**Q12. What report formats does it produce?**
HTML (human-readable) and XML (machine-readable, parsed by Jenkins).

**Q13. Dependency-Check vs SonarQube?**
Dependency-Check scans **third-party dependencies** for known CVEs; SonarQube scans **your
own source code** for quality and security issues.

**Q14. What is supply chain security?**
Securing all the external components and tools your software depends on.

**Q15. What is CPE?**
**Common Platform Enumeration** — a naming scheme Dependency-Check uses to match a
dependency to known CVEs.

**Q16. Why is the first scan slow?**
It downloads the entire NVD database; later scans only do incremental updates.

**Q17. What does a "Critical/High/Medium/Low" finding mean?**
The severity of the vulnerability, based on its CVSS score.

**Q18. Is finding vulnerabilities a pipeline failure?**
Not necessarily — the deliverable is performing the scan; the report informs what to fix.

---

## 7. Azure DevOps

**Q1. What is Azure DevOps?**
A Microsoft platform providing tools for the full software lifecycle — repos, pipelines,
boards, artifacts, and test plans.

**Q2. Azure DevOps vs Azure (cloud)?**
Azure DevOps is the DevOps tooling/SaaS; Azure is Microsoft's cloud computing platform.

**Q3. What are the five Azure DevOps services?**
**Repos**, **Pipelines**, **Boards**, **Artifacts**, **Test Plans**.

**Q4. What is `azure-pipelines.yml`?**
The YAML file that defines an Azure DevOps pipeline as code.

**Q5. What is the `trigger` in the YAML?**
Defines which branch pushes start the pipeline (here, `main`).

**Q6. What is an agent and an agent pool?**
An **agent** runs the pipeline jobs; an **agent pool** is a group of agents.

**Q7. Self-hosted vs Microsoft-hosted agent?**
A **self-hosted** agent runs on your own machine; a **Microsoft-hosted** agent runs on
Microsoft's cloud VMs.

**Q8. Why did you use a self-hosted agent?**
It runs on our own machine, avoids the Microsoft-hosted parallelism grant, and lets us
control the environment.

**Q9. What is a `demand`?**
A capability requirement an agent must satisfy to run the job (e.g. `Agent.Name -equals ...`).

**Q10. Difference between a `task` and a `script` step?**
A `task` is a prebuilt reusable action (e.g. `NodeTool@0`); a `script` runs raw shell
commands.

**Q11. What is a PAT (Personal Access Token)?**
A token used to authenticate to Azure DevOps instead of a password — e.g. to register an
agent.

**Q12. What is a service connection?**
A stored, secure connection to an external service (e.g. GitHub) used by pipelines.

**Q13. What is an organization and a project?**
An **organization** is the top-level account; a **project** groups repos, pipelines, and
boards within it.

**Q14. How did you register the self-hosted agent?**
Downloaded the agent, ran `config.cmd` with the server URL, PAT, pool name, and agent name,
then started it with `run.cmd`.

**Q15. What does the `checkout` step do?**
Clones the repository onto the agent.

**Q16. What does the `NodeTool` task do?**
Installs the specified Node.js version on the agent.

**Q17. Classic vs YAML pipelines?**
**Classic** pipelines are built in the UI; **YAML** pipelines are defined as code in the repo.

**Q18. What is "hosted parallelism"?**
The number of pipeline jobs that can run at once; new orgs may need to request a free grant.

**Q19. What are stages, jobs, and steps in Azure Pipelines?**
A **stage** contains **jobs**, and each job contains **steps** — the same hierarchy as other
CI tools.

**Q20. How does Azure DevOps compare to Jenkins?**
Both do CI/CD; Azure DevOps is an integrated Microsoft SaaS suite, while Jenkins is a
self-hosted, plugin-driven open-source server.

**Q21. What triggers your Azure pipeline?**
A commit to the `main` branch.

**Q22. Where does your Azure pipeline run?**
On the self-hosted agent in the agent pool you created.

---

## 8. Vercel & Deployment

**Q1. What is Vercel?**
A cloud platform for deploying and hosting frontend applications, optimized for Next.js.

**Q2. What is deployment?**
Making an application available for users to access on a server or platform.

**Q3. How does Vercel deploy your app?**
It connects to the GitHub repo and automatically builds and deploys on every push.

**Q4. What is continuous deployment in Vercel?**
Every push to the main branch is automatically built and released — no manual step.

**Q5. What is a preview deployment?**
A temporary deployment Vercel creates for each branch/PR to test changes before merging.

**Q6. What is the "Root Directory" setting?**
Tells Vercel which subfolder contains the app to build (here, `frontend`).

**Q7. What is Next.js?**
A React framework for building full-stack web apps with server-side rendering and routing.

**Q8. Why host the frontend and backend separately?**
They have different runtimes and scaling needs; Vercel suits the Next.js frontend, while the
backend runs elsewhere (e.g. a container host).

**Q9. What are environment variables in deployment?**
Configuration values (URLs, secrets) set per environment instead of hardcoded in code.

**Q10. What is a CDN?**
A **Content Delivery Network** — geographically distributed servers that serve content
quickly to users.

**Q11. What is a build on Vercel?**
The step where Vercel compiles the source into static/optimized output before serving it.

**Q12. How does the deployed frontend reach the backend?**
Via a configured backend URL (an environment variable / proxy rewrite).

**Q13. Why is Vercel good for Next.js?**
Vercel created Next.js, so it offers first-class, zero-config support for it.

---

## 9. Explaining YOUR Project (be ready for these)

**Q1. Explain your complete CI/CD pipeline.**
Code is hosted on GitHub. A push to `main` triggers two pipelines: **Jenkins** (checkout →
OWASP Dependency-Check → SonarQube scan → Docker build → push to Docker Hub) and **Azure
DevOps** (checkout → install Node → npm install/test on a self-hosted agent). The frontend
is hosted on **Vercel**.

**Q2. What happens when you push to `main`?**
GitHub holds the new commit; Jenkins and Azure DevOps pick it up and run their pipelines,
and Vercel auto-redeploys the frontend.

**Q3. Which platforms are integrated, and how?**
GitHub (source), Jenkins (CI/CD + scans), Azure DevOps (second pipeline), Docker/Docker Hub
(images), SonarQube (security scan), Vercel (hosting).

**Q4. Walk through your Jenkins pipeline stages.**
Checkout → Dependency Check → SonarQube Analysis → Docker Build → Docker Push.

**Q5. What does your Azure DevOps pipeline do?**
Checks out the repo, installs Node.js, and runs `npm install` and `npm test` on a
self-hosted agent.

**Q6. Where are your Docker images stored?**
On Docker Hub, under your account, tagged with the build number and `latest`.

**Q7. How is the security check performed?**
SonarQube performs static analysis (SAST) of the source code during the Jenkins pipeline.

**Q8. How is the dependency check performed?**
OWASP Dependency-Check scans the project's dependencies against the NVD during the Jenkins
pipeline.

**Q9. Why two pipelines (Jenkins and Azure DevOps)?**
To demonstrate CI/CD on both platforms — Jenkins runs the full build/scan/push pipeline;
Azure DevOps runs a build/test pipeline on a self-hosted agent.

**Q10. What is your single source of truth?**
The GitHub repository — both pipelines trigger from it.

**Q11. What problems did you face and how did you solve them?**
Examples: the Jenkinsfile needed `bat` instead of `sh` for Windows; the Docker Hub
credential had to be created in Jenkins; the OWASP tool had to be configured; an NVD API key
was added; `sonar.sources` was corrected to valid folders; the Azure PAT needed the Agent
Pools scope. (See `SETUP-STEPS.md` §8.)

**Q12. How would you improve this project?**
Add automated tests, enforce a strict Quality Gate, deploy the backend to a live host, pin
dependency versions, and add webhook-based triggers.

**Q13. What is the difference between your Jenkins and Azure pipelines?**
Jenkins is the full CI/CD pipeline (build, scan, push); Azure DevOps is a simpler
build/test pipeline running on a self-hosted agent.

**Q14. Why use Docker in this project?**
So the frontend and backend run identically everywhere, and images can be built once and
deployed anywhere.

**Q15. How does the user reach your application?**
Through the Vercel-hosted frontend URL.
