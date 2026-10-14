# Third-Party Notices & Attribution

This project, **Personal AI Workspace**, incorporates or interfaces with several open-source components. This document provides notice and licensing details for those components.

---

## 1. Open WebUI

- **Repository**: [https://github.com/open-webui/open-webui](https://github.com/open-webui/open-webui)
- **Version**: `v0.12.0` (Docker Image: `ghcr.io/open-webui/open-webui:v0.12.0`)
- **License**: Custom BSD-3-Clause with Open WebUI Branding Clause
- **Copyright**: (c) 2023- Open WebUI Inc. [Created by Timothy Jaeryang Baek]
- **Notice on Branding**:
  In compliance with Clause 4 of the Open WebUI License, Personal AI Workspace does NOT alter, obscure, or remove any Open WebUI branding or trademarks from the upstream distribution. When accessing the Open WebUI interface, the original branding is preserved.
  Personal AI Workspace provides an independent BFF adapter and client that interacts with Open WebUI through documented API endpoints without modifying upstream binaries or core distributions.

---

## 2. OpenUI (thesysdev)

- **Repository**: [https://github.com/thesysdev/openui](https://github.com/thesysdev/openui)
- **Packages**: `@openuidev/react-lang`, `@openuidev/react-ui`, `@openuidev/lang-core`
- **License**: MIT License
- **Copyright**: Thesys Inc.
- **Usage**: Used for client-side rendering of generative, interactive UI widgets (sliders, charts, tables, forms, quizzes, calculators).

---

## 3. Open Terminal

- **Repository**: [https://github.com/open-webui/open-terminal](https://github.com/open-webui/open-terminal)
- **Version**: `v0.14.0`
- **License**: MIT License
- **Copyright**: Open WebUI Inc.
- **Usage**: Sandboxed, ephemeral execution environment for code execution and artifact creation without host root or Docker socket access.

---

## 4. Google Chrome Labs Bubblewrap

- **Repository**: [https://github.com/GoogleChromeLabs/bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- **Version**: `@bubblewrap/cli@1.27.0`
- **License**: Apache-2.0
- **Usage**: Tooling to wrap the responsive PWA into an Android Trusted Web Activity (TWA) APK/AAB package.

---

## 5. Restic

- **Repository**: [https://github.com/restic/restic](https://github.com/restic/restic)
- **Version**: `0.19.1`
- **License**: BSD-2-Clause
- **Usage**: Encrypted, deduplicated snapshot backups and automated restore testing.

---

## 6. Python Libraries

- **FastAPI**: MIT License, (c) Sebastián Ramírez
- **Uvicorn**: BSD-3-Clause
- **Pydantic**: MIT License
- **HTTPX**: BSD-3-Clause
- **AioSQLite**: MIT License
- **python-docx**: MIT License
- **openpyxl**: MIT License
- **python-pptx**: MIT License
- **reportlab**: BSD-3-Clause
- **Pillow**: MIT-CMU
- **pandas**: BSD-3-Clause
- **youtube-transcript-api**: MIT License, (c) Jonas Depoix

---

## 7. Conduit (Optional Reference)

- **Repository**: [https://github.com/cogwheel0/conduit](https://github.com/cogwheel0/conduit)
- **License**: GPL-3.0
- **Notice**: No code from Conduit is bundled into or compiled into Personal AI Workspace. All mobile delivery is built on PWA / TWA.
