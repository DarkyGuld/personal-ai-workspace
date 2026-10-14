# ADR 0001: System Architecture, Technology Stack, and Integration Strategy

- **Status**: Accepted
- **Date**: 2026-10-14
- **Deciders**: AI Fullstack & DevOps Architecture Lead, User

---

## 1. Context and Problem Statement

The goal is to build **Personal AI Workspace**, a self-hosted, resource-efficient ChatGPT-like platform with 33 feature areas, complete web and Android app parity, self-contained file/artifact handling, intelligent generative UI, and robust backup/restore mechanisms.

The hardware target is a **Lenovo Legion 5 15ARH05H** (AMD Ryzen 5 4600H, 16 GB RAM, NVIDIA GeForce RTX 2060 6 GB VRAM, 512 GB NVMe SSD) running Ubuntu Server 24.04 LTS, while also remaining simple to install for other users via Docker Compose.

Key challenges include:
1. Ensuring long-term maintainability without getting broken by upstream Open WebUI releases.
2. Avoiding fragile DOM-injection or monkeypatching of upstream UI.
3. Enabling full generative UI with interactive widgets without vendor lock-in to commercial gateways.
4. Delivering 100% feature parity between Desktop Web and Android.
5. Operating strictly within 16 GB host RAM and 6 GB VRAM limits.

---

## 2. Decision Drivers

- **Zero-Modification Upstream**: Upstream Open WebUI core code must never be forked or patched in-place.
- **Single Responsive Frontend**: Desktop web, PWA, and Android TWA (Trusted Web Activity) must share 100% of the UI code.
- **Strict Data Ownership**: Library files, artifacts, and project metadata are stored locally and accessible via standardized APIs.
- **Sandboxed Agent Execution**: AI code execution must run without Docker socket, host filesystem root, or administrative credentials.
- **Strict License Compliance**: Retain Open WebUI branding under its custom BSD-3-Clause license; release our original code under MIT.

---

## 3. Considered Options

1. **Direct Fork of Open WebUI**:
   - *Pros*: Quick immediate customization of UI.
   - *Cons*: Impossible upstream rebasing, maintenance nightmare, high probability of regressions on every release. **Rejected.**
2. **Dual Clients (Separate Web and Flutter/Conduit Mobile Client)**:
   - *Pros*: Native mobile UI elements.
   - *Cons*: Double development effort, feature drift between desktop and mobile, GPL-3.0 compliance burdens from Conduit. **Rejected.**
3. **BFF (Backend-For-Frontend) + Shared React PWA / TWA Client + Upstream API Adapter**:
   - *Pros*: Clean separation of concerns, 100% desktop/mobile UI parity, resilient to upstream internal refactors via versioned contract adapters, simple single-command deployment. **Selected.**

---

## 4. Key Architectural Decisions

### 4.1. Core AI Backend: Pinned Open WebUI
- We deploy official Docker images (`ghcr.io/open-webui/open-webui:v0.12.0`) pinned with exact versions.
- Open WebUI serves as the AI engine, managing OpenAI-compatible external model connections, conversation storage, knowledge bases (RAG), and memory.
- Upstream branding is fully respected and preserved.

### 4.2. Personal AI API (BFF): Python FastAPI
- A lightweight, async FastAPI service runs alongside Open WebUI.
- Acts as a reverse proxy and adapter to Open WebUI's REST endpoints (`/api/v1/auths`, `/api/chat/completions`, `/api/v1/files`, `/api/v1/memories`, `/api/v1/automations`).
- Manages:
  - Extended **Library** metadata and storage registry (`data/paw/library`).
  - **Artifacts & Document Generation** (`docx`, `xlsx`, `pptx`, `pdf`, `zip`) via isolated worker tasks.
  - **YouTube Transcripts** via `youtube-transcript-api` without visual frame hallucination.
  - **Work & Deep Research** state machines and explicit user consent workflows.
  - **Generative UI contracts** for OpenUI lang parsing and rendering.

### 4.3. Intelligent UI: OpenUI (`@openuidev/react-lang` & `@openuidev/react-ui`)
- OpenUI generates declarative, streamable, and stateful widgets (calculators, sliders, charts, tables, forms, quizzes).
- Parsing runs locally without requiring a paid Thesys Cloud key.
- A strict whitelist of safe UI components is enforced to guarantee security against arbitrary script injection.
- Interactive widget states persist across device reloads.

### 4.4. Unified Client & Mobile Delivery: React + Vite + PWA + Bubblewrap (TWA)
- Single responsive SPA built with React 19 / TypeScript / Vite / Tailwind CSS.
- Service Worker enables offline app shell caching and PWA installation.
- Bubblewrap packages the verified HTTPS webapp into an Android Trusted Web Activity (TWA) APK/AAB with Digital Asset Links (`.well-known/assetlinks.json`).
- If domain verification / assetlinks is not yet configured, the user installs via PWA seamlessly.

### 4.5. Sandboxed Execution: Open Terminal on Demand
- Code execution and automated analysis run in sandboxed Docker containers (`openwebui/open-terminal:v0.14.0`).
- Strict resource bounds: 1 GB RAM, non-root user (UID 10001), no Docker socket, egress filtering, and read-only root filesystems where possible.

### 4.6. Backup and Recovery: Restic & Consistent Snapshots
- Automated atomic backup of SQLite databases and library file storage using Restic (`restic:0.19.1`).
- Verified rollback mechanism restores database snapshots, files, and container digests together.

---

## 5. Consequences

### Positive
- Total independence from upstream UI breaking changes.
- Seamless multi-device experience across desktop browsers, Android tablets, and Android phones.
- Low idle footprint (< 1.5 GB RAM total with cloud models), fitting easily in 16 GB hardware budget.
- Clean open-source distribution on GitHub with clear license boundaries.

### Negative / Trade-offs
- Writing our own adapter for Open WebUI requires thorough contract tests for each upstream release.
- Android TWA full-screen mode requires an active HTTPS domain with Digital Asset Links.
