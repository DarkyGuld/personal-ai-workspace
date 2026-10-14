# Personal AI Workspace (PAW)

[![CI](https://github.com/PersonalAIWorkspace/personal-ai-workspace/actions/workflows/ci.yml/badge.svg)](https://github.com/PersonalAIWorkspace/personal-ai-workspace/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Linux / Docker / Android](https://img.shields.io/badge/Platform-Ubuntu%20%7C%20Docker%20%7C%20Android-green.svg)]()

> **En selvhostet, ressursvennlig og oppdaterbar ChatGPT-lignende plattform med full web- og Android-paritet.**

Personal AI Workspace kombinerer det beste fra **Open WebUI** (som robust AI-kjerne) med en egen responsiv **React/TypeScript PWA & Android TWA**, et sentralt **Library** for gjenbruk av genererte dokumenter og bilder, **Intelligent UI** (OpenUI-baserte interaktive widgets), sikker sandkasset kodekjøring og kildebelagt dyp research.

---

## Nøkkelfunksjoner

- **100 % Funksjonsparitet**: Samme grensesnitt og funksjoner i nettleser på PC og installert Android-app (PWA / TWA).
- **Intelligent UI**: Modellen svarer med vanlige tekster som standard, men genererer interaktive grafer, tabeller, forms, quizer og kalkulatorer via OpenUI Lang når relevant. Tilstand bevares på tvers av enheter.
- **Sentralt Library**: Alle filer (opplastede og genererte) lagres én gang med SHA-256 deduplisering, metadata, favoritter og mapper, og kan gjenbrukes direkte i nye chatter.
- **Dokument- og Bildeproduksjon**: Lag og rediger ekte PDF, DOCX, XLSX, PPTX, CSV og ZIP-filer samt bilder med opprinnelsessporing.
- **Sikker Sandkasse**: Verktøykjøring og nettleseragenter kjører i isolerte Docker-containere uten tilgang til Docker-socket, vertsmaskinens rot eller private hemmeligheter.
- **YouTube-oppsummering**: Henter reelle undertekster via offisielle API-er med tidsstempler uten å hallusinere bildeinnhold.
- **Ressursvennlig**: Optimalisert for Lenovo Legion 5 (Ryzen 5 4600H, 16 GB RAM, RTX 2060 6 GB VRAM) på Ubuntu Server 24.04 LTS. Kjører lett på 16 GB RAM med skymodeller.
- **Trygg Oppdateringspolicy**: Pinned container-versjoner, kontrakttester og helautomatisert backup/restore hindrer nedetid og datatap ved upstream-oppgraderinger.

---

## 5-Minutters Hurtigstart (Ubuntu Server / Linux)

### Forutsetninger
- Linux (Ubuntu 24.04 LTS eller nyere anbefalt)
- Docker Engine & Docker Compose v2 (`docker compose`)
- Minimum 4 GB RAM (16 GB for lokale modeller)

### Installasjon

```bash
# 1. Klon prosjektet
git clone https://github.com/PersonalAIWorkspace/personal-ai-workspace.git
cd personal-ai-workspace

# 2. Kjør installasjonsveiviseren
chmod +x install.sh manage.sh
./install.sh

# 3. Legg til din AI-modellnøkkel i .env (f.eks. OpenAI, OpenRouter el.l.)
nano .env

# 4. Start systemet
./manage.sh start

# 5. Sjekk status
./manage.sh status
```

Systemet er nå tilgjengelig:
- **Personal AI Workspace (BFF + UI)**: `http://localhost:3000`
- **Open WebUI (Admin konsoll & bootstrap PWA)**: `http://localhost:3001`

---

## Driftskommandoer (`./manage.sh`)

| Kommando | Beskrivelse |
|---|---|
| `./manage.sh start` | Starter hele container-stakken i bakgrunnen |
| `./manage.sh stop` | Stopper alle containere |
| `./manage.sh status` | Viser containerstatus og endepunkt-helsesjekker |
| `./manage.sh doctor` | Kjører systemdiagnostikk, minnebruk og disksjekk |
| `./manage.sh backup` | Oppretter konsistent atomisk snapshot av databaser og Library |
| `./manage.sh restore <id>` | Gjenoppretter et tidligere snapshot ved feil |
| `./manage.sh check-updates` | Sjekker etter nye upstream-releaser på GitHub |
| `./manage.sh upgrade --approve` | Tar backup og gjennomfører oppdatering med rollback-sikring |

---

## Android Applikasjon (PWA / TWA)

1. **PWA (Enkel installasjon)**: Åpne URL-en på din Android-enhet i Google Chrome eller Brave, trykk menyen `...` og velg **Installer app**.
2. **APK (Trusted Web Activity)**: Se `apps/android/README.md` for bygging av signert APK via Bubblewrap med Digital Asset Links.

---

## Lisens og Attribusjon

- Original kode i dette prosjektet er lisensiert under **MIT License** (se [LICENSE](LICENSE)).
- Upstream-programvare (inkludert Open WebUI under BSD-3-Clause med Branding-klausul) forblir underlagt sine respektive lisenser. Se [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for fullstendige attribusjoner.
