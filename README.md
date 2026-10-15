<div align="center">
  <a href="https://www.telerik.com/kendo-angular-ui/"><img src="https://d585tldpucybw.cloudfront.net/sfimages/default-source/productsimages/kendo-ui-for-angular/kendoka_with_logo-min.png?sfvrsn=568f4b7c_1" height="60" alt="Kendo UI for Angular" /></a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://angular.io/"><img src="https://www.vectorlogo.zone/logos/angular/angular-icon.svg" height="60" alt="Angular" /></a>
</div>

<h1 align="center">Healthcare Application — Kendo UI for Angular</h1>

<p align="center">
  A full-featured healthcare dashboard built with <a href="https://www.telerik.com/kendo-angular-ui/components">Kendo UI for Angular</a>, designed to demonstrate how clinical workflows can be modeled in a modern Angular application — and to serve as a hands-on playground for the <a href="https://github.com/telerik/project-nia">Nia</a> agentic SDLC CLI.
  <br />
  <a href="https://telerik.github.io/kendo-angular/healthcare-app"><strong>View Live Demo »</strong></a>
  &nbsp;·&nbsp;
  <a href="#experiment-with-the-nia-cli"><strong>Experiment with Nia »</strong></a>
</p>

<p align="center">
  The app is organized into four main views:
</p>

<ul>
  <li><strong>Home</strong> — Personalized dashboard for a physician, featuring quick-action cards (add clinical notes, request lab tests), upcoming appointments, and an at-a-glance patient summary.</li>
  <li><strong>Patients</strong> — A searchable, sortable, and filterable grid of patients with vitals, risk levels, and lab results. Includes an AI Assistance panel and Excel export.</li>
  <li><strong>Patient Profile</strong> — Detailed view of an individual patient showing basic information, recent vitals (heart rate, blood pressure, O2 saturation, temperature), and medical history.</li>
  <li><strong>Schedule</strong> — A multi-view scheduler (day, week, month, agenda) for managing appointments, paired with a daily task list that supports search and inline task creation.</li>
  <li><strong>Clinical Analytics</strong> — Charts tracking patient vitals over time (systolic/diastolic BP, heart rate, SpO2, temperature) and a risk assessment overview with export support.</li>
</ul>
               |

---

### Actionable Daily Alerts

Each alert in the Home dashboard's **Daily Alerts** list exposes three call-to-action buttons —
**Review**, **Add note** and **Request test** — available both on the list row (revealed on hover
or keyboard focus) and in the Alert Details Dialog. The dialog additionally shows a **Suggested
Next Action**: a short, directive recommendation distinct from the longer *Recommended Actions*
list.

Alert state is held by `AlertsService` (`src/app/services/alerts.service.ts`), which tracks each
alert's status (`New` / `Reviewed`) and records the notes and lab-test requests created from an
alert, linked by both `alertId` and `patientId`.

**Known limitation:** the application has no backend. Reviewed status, notes and test requests are
stored in memory only and reset on page reload.

---

## Getting Started

This is a standalone repository — run it on its own, then layer in the [Nia CLI](#experiment-with-the-nia-cli) to experiment with AI-assisted workflows.

> The sample project runs with the [currently supported Angular version](https://www.telerik.com/kendo-angular-ui/components/installation/requirements/#toc-angular).

### 1. Get the code

```bash
# Fork + clone (recommended — lets you open pull requests with Nia)
gh repo fork telerik/healthcare-app-angular --clone
cd healthcare-app-angular

# ...or clone directly
# git clone https://github.com/telerik/healthcare-app-angular.git
# cd healthcare-app-angular
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm start          # or: ng serve
```

Navigate to `http://localhost:4200/`. The app reloads automatically when source files change.

### Build

```bash
npm run build      # or: ng build
```

Build artifacts are stored in the `dist/` directory.

---

## Experiment with the Nia CLI

This repository is a ready-made playground for **[Nia](https://github.com/telerik/project-nia)** — Progress's agentic SDLC CLI. Use it to drive AI-assisted workflows against a realistic Angular codebase: plan an issue, implement it, review the code, and draft a pull request.

Nia authenticates through the AI coding agent you configure (GitHub Copilot CLI, Claude Code, or OpenCode) — **there is no separate Nia API key**.

### Option A — Install locally (recommended)

Complete [Getting Started](#getting-started) first, then run the steps below from the project root.

**1. Install prerequisites**

- **Node.js 18+** (`node --version`) — required for the coding agents. Get it from [nodejs.org](https://nodejs.org).
- **GitHub CLI** (`gh --version`) — installs Nia and authenticates GitHub workflows. Install with `brew install gh`, `winget install --id GitHub.cli`, or `sudo apt install gh`, then run `gh auth login`.

**2. Install an AI coding agent and sign in**

Pick one:

```bash
# GitHub Copilot CLI — reuses your existing gh authentication (shortest path)
npm install -g @github/copilot && copilot --version

# Claude Code — run `claude` once to sign in
npm install -g @anthropic-ai/claude-code && claude

# OpenCode
npm install -g opencode-ai && opencode auth login
```

**3. Install the Nia CLI**

```bash
# Linux / macOS
gh release download --repo telerik/project-nia --pattern 'install.sh'
sh install.sh
```

```powershell
# Windows (PowerShell 6+)
gh release download --repo telerik/project-nia --pattern 'install.ps1'
.\install.ps1
```

Open a new terminal so the updated `PATH` takes effect, then verify:

```bash
nia --version
```

**4. Initialize Nia in this project**

```bash
# GitHub Issues + GitHub as the code platform. Swap --agent to match step 2
# (github_copilot | claude_code | opencode).
nia config init --issues github_issues --code github --agent github_copilot --models stable
```

Prefer to stay offline? Use a local-only setup instead:

```bash
nia config init --issues local --code local --agent github_copilot --models stable
```

**5. Run your first workflow**

```bash
nia config set-issue <issue-number>   # e.g. an issue in your fork
nia issue plan                        # generate an implementation plan
nia code create                       # implement the approved plan
nia code review                       # review the result
```

For the complete walkthrough — including build, test, and pull request steps — follow the **[Nia Quick Start](https://telerik.github.io/project-nia/quick-start.html)**.

---

### Option B — Dev Container / Codespaces (optional accelerator)

This repository ships a [Dev Container](.devcontainer) that provisions everything in Option A automatically: Node.js, the GitHub CLI, the three AI coding agents, and the **Nia CLI** — plus it runs `npm install`. It's the fastest way to reach a working environment, and it runs identically in **GitHub Codespaces** and in a local VS Code Dev Container.

#### What's included

| Component                          | Details                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js 24 + npm**               | Runs the Angular app and the npm-based agents                                                                                               |
| **GitHub CLI (`gh`)**              | Used by Nia workflows and for authentication                                                                                                |
| **GitHub Copilot CLI** (`copilot`) | AI coding agent (installed via npm)                                                                                                         |
| **OpenCode** (`opencode`)          | AI coding agent (installed via npm)                                                                                                         |
| **Claude Code** (`claude`)         | AI coding agent (installed via npm)                                                                                                         |
| **Nia CLI** (`nia`)                | Installed from the public `telerik/project-nia` repo — latest GitHub release, falling back to the latest pre-release; OS/arch auto-detected |
| **Angular dependencies**           | `npm install` runs automatically on create                                                                                                  |
| **Port 4200**                      | Forwarded for `ng serve`                                                                                                                    |

#### Prerequisites

- [Docker](https://www.docker.com/) running locally
- One of:
  - [VS Code](https://code.visualstudio.com/) + the **Dev Containers** extension (`ms-vscode-remote.remote-containers`), or
  - the [Dev Containers CLI](https://github.com/devcontainers/cli) (`npm install -g @devcontainers/cli`)

> Using **GitHub Codespaces**? None of the above is required — open the repo on GitHub and choose **Code → Codespaces → Create codespace**. The container builds in the cloud.

#### Open the container

**VS Code:** open the folder, then run **Dev Containers: Reopen in Container** from the Command Palette (`Cmd/Ctrl+Shift+P`).

**CLI:**

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . bash
```

On first create, the container runs [`.devcontainer/setup.sh`](.devcontainer/setup.sh), which installs the agents, installs the Nia CLI, runs `npm install`, and prints a version summary plus the manual next steps below.

#### Finalize your setup (manual, one-time)

Authentication is intentionally left to you (credentials are user/org-specific):

```bash
# 1. Authenticate the GitHub CLI (used by Nia workflows)
gh auth login

# 2. Authenticate the AI coding agent you plan to use
copilot                 # GitHub Copilot CLI — sign in when prompted
claude                  # Claude Code — sign in when prompted
opencode auth login     # OpenCode
```

#### Start using the Nia CLI

```bash
nia --version           # confirm the CLI is installed
nia config init --issues github_issues --code github --agent github_copilot --models stable
nia --help              # explore available commands
```

Then run the app as usual:

```bash
npm start               # serves on http://localhost:4200
```

#### Using a private/internal npm registry

If your environment requires a custom npm registry or auth token, place an `.npmrc` at `.devcontainer/.npmrc`. It is **gitignored** and copied into the container's home directory early in setup, so both the agent installs and `npm install` use it. If the file is absent, the default npm configuration is used.

#### Notes

- Agents are installed at their **latest** versions on each fresh create.
- The Nia repo currently publishes **pre-releases** only, so the CLI resolves to the latest pre-release automatically; once a stable release exists, it will be preferred.
- Re-run setup any time with: `bash .devcontainer/setup.sh`.
