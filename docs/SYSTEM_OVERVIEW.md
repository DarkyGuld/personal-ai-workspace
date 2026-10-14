# Personal AI Workspace — Komplett System- og Funksjonsoversikt

Dette dokumentet gir en uttømmende, teknisk og funksjonell beskrivelse av hele plattformen **Personal AI Workspace**, hvordan den er bygget, dens arkitektur, komponenter og samtlige funksjoner som er realisert og verifisert.

---

## 1. Hovedmål og Arkitekturprinsipper

Personal AI Workspace er en selvhostet, sikker og ressursvennlig AI-arbeidsflate optimalisert for privat drift og små team (1–5 brukere) på standard maskinvare som **Lenovo Legion 5 15ARH05H** (AMD Ryzen 5 4600H, 16 GB RAM, NVIDIA GeForce RTX 2060 6 GB VRAM, 512 GB NVMe SSD) under Ubuntu Server 24.04 LTS, samt kompatibel med enhver Linux/Docker Compose-vert.

### Kjerne-prinsipper:
1. **Zero-Modification Upstream**: Upstream Open WebUI kjøres fra offisielle versjonslåste container-images uten monkeypatching eller skjør DOM-injeksjon. Lisens og branding respekteres fullt ut.
2. **100 % Funksjonsparitet**: Samme responsive webklient (React + TypeScript + Vite) benyttes på PC-nettlesere og som installert Android-app (PWA eller Trusted Web Activity APK/AAB). Ingen funksjoner mangler på mobil.
3. **Dataeierskap & Sentralt Bibliotek**: Genererte dokumenter, bilder, chathistorikk og oppgaver lagres lokalt med SHA-256 deduplisering og referansetelling.
4. **Sandkasse-sikkerhet**: AI-agenter og kodekjøring kjører i isolerte containere uten Docker-socket, verts-root eller tilgang til `.env`-hemmeligheter.

---

## 2. Arkitektur og Komponenter

```
                                  [ Bruker: PC Nettleser / Android App ]
                                                    │
                                                    ▼
                                  ┌───────────────────────────────────┐
                                  │      PAW Web Client (React 19)    │
                                  │   - Responsiv SPA / PWA           │
                                  │   - OpenUI Intelligent UI         │
                                  │   - Digital Asset Links (TWA)     │
                                  └─────────────────┬─────────────────┘
                                                    │
                                                    ▼
                                  ┌───────────────────────────────────┐
                                  │        PAW API / BFF (FastAPI)    │
                                  │   - Port 3000                     │
                                  │   - Sentralt Library (SQLite)     │
                                  │   - Dokumentgenerator (Word/PDF)  │
                                  │   - Bildemotor med Lineage        │
                                  │   - Agent- & Research-orkestrering│
                                  └─────────┬───────────────┬─────────┘
                                            │               │
                     ┌──────────────────────┘               └──────────────────────┐
                     ▼                                                             ▼
     ┌───────────────────────────────┐                             ┌───────────────────────────────┐
     │    Open WebUI (Kjerne v0.12)  │                             │      Tilleggsprofiler         │
     │   - Port 3001 (Intern/Admin)  │                             │   - compose.search.yaml       │
     │   - RAG / Kunnskapsbase       │                             │     (OpenSERP / SearXNG)      │
     │   - Persistent Minne          │                             │   - compose.terminal.yaml     │
     │   - Parallelle Sub-agenter    │                             │     (Open Terminal sandbox)   │
     │   - OpenAI / Skymodeller      │                             │   - compose.gpu.yaml          │
     └───────────────────────────────┘                             │     (ComfyUI / RTX 2060)      │
                                                                   └───────────────────────────────┘
```

---

## 3. Fullstendig Funksjonskatalog (Alle 33 Funksjonsområder)

### Kategori A: Samtale, Intelligens & Grensesnitt
- **F01 – Chat / New Chat**: Fullverdig chat-grensesnitt med sanntids streaming (SSE), modellvalg, regenerering av svar, chathistorikk og vedleggshåndtering.
- **F02 – History Search**: Hurtigsøk på tvers av samtaler, datoer og innhold med direkte navigasjon til meldinger.
- **F22 – Personalization**: Tilpassede systeminstruksjoner, brukerpreferanser og modellprofiler (Fast, Smart, Vision, Local).
- **F25 – Intelligent UI (OpenUI)**: Modellen svarer med ren tekst som standard, men genererer interaktive OpenUI Lang-widgets (lånekalkulator, sparekalkulator, sliders, datatabeller, quizer, forms) når oppgaven krever det. Tilstanden oppdateres lokalt i klienten uten unødvendige serverkall og bevares over sideoppdatering og mobil-omstart.
- **F27 – Cross-device Sync**: Automatisk synkronisering av samtaler, vedlegg og tilstand mellom PC og telefon via felles backend.

### Kategori B: Sentralt Library, Dokumenter & Filer
- **F03 – Central Library**: Felles filregister med faner for *Alle filer*, *Favoritter*, *Dokumenter* og *Bilder*. Søk, forhåndsvisning, nedlasting og direkte knapp for «Bruk i chat» som gjenbruker filer på tvers av samtaler uten ny opplasting.
- **F08 – Projects / Workspaces**: Prosjektrom som samler dedikerte samtaler, filer, kunnskapskilder og arbeidsrapporter under isolert tilgang.
- **F09 – Files (Opplasting & Validering)**: Støtte for PDF, DOCX, XLSX, PPTX, CSV, TXT, ZIP og bilder med MIME-verifisering og SHA-256 deduplisering.
- **F15 – Document Creation**: Ekte dokumentproduksjon direkte på serveren:
  - **PDF**: Generert via `reportlab` med overskrifter og paginering.
  - **Word (DOCX)**: Generert via `python-docx` med strukturert formatering.
  - **Excel (XLSX)**: Generert via `openpyxl` med kolonner, rader og formelstøtte.
  - **PowerPoint (PPTX)**: Generert via `python-pptx` med tittel- og kulepunktslysbilder.
  - **ZIP**: Komprimering av flere filer for samlet nedlasting.
  Alle genererte filer registreres automatisk i Library.
- **F26 – Images & Files Editing**: Mulighet for å hente en eksisterende fil eller rapport, be modellen gjøre endringer, og generere en ny versjon med bevart opprinnelig fil.

### Kategori C: Bilder, Galleri & Visuell AI
- **F10 – Image Gallery**: Eget bildegalleri i Library som samler opplastede, genererte og redigerte bilder med metadata.
- **F16 – Image Generation**: Generering av bilder basert på tekstinstruksjoner med formatkontroll (PNG/JPG/WebP). Støtter både eksterne bilde-API-er og lokal GPU.
- **F17 – Image Editing & Lineage**: Bilderedigering (f.eks. gråtoner, uskarphet, konturfremheving eller inpainting) hvor både originalbildet og det redigerte bildet lagres som separate objekter med `lineage_parent_id`-sporing.

### Kategori D: Kunnskap, Minne & Notater
- **F04 – Knowledge / RAG**: Dokumentopplasting for semantisk søk og kildebasert gjenfinning i Open WebUI Knowledge base.
- **F05 – Memory**: Modellen husker brukerpreferanser og fakta på tvers av samtaler. Brukeren kan inspisere, redigere og slette minner.
- **F06 – Notes / Writing**: Integrerte notater for kontinuerlig tekstutvikling og lagring utenfor vanlige chattråder.

### Kategori E: Agenter, Research, Søk & Kodekjøring
- **F07 – Work / Agents**: Strukturert orkestrering av flertrinns-agenter med definerte faser (planlegging, datainnhenting, dokumentproduksjon) og eksplisitt samtykkestyring før handlinger med bivirkninger utføres.
- **F11 – Web Search (Inkludert Lokalt Søk)**:
  - Støtte for eksterne søkemotorer (DuckDuckGo, Brave, etc.).
  - **100 % Lokalt Google-/Bing-søk via OpenSERP & SearXNG (`compose.search.yaml`)**: Lar systemet hente sanntidsdata og kilder direkte fra nettet uten betalte API-nøkler eller datadeling.
- **F12 – Deep Research**: Autonom dyp research-arbeidsflyt som utfører parallelle søk, validerer kilder, tildeler pålitelighetsskår og automatisk produserer en kildebelagt rapport som arkiveres i Library.
- **F13 – Data Analysis**: Analyse av tabulære data (CSV/XLSX), beregninger og interaktiv fremvisning i tabeller eller diagrammer.
- **F14 – Code Execution (Sandkasse)**: Kjøring av kode i en isolert Open Terminal-container (`compose.terminal.yaml`) med ressursgrenser (1 GB RAM, CPU-kvoter), non-root bruker og uten tilgang til vertens filsystem.
- **Sub-agents (Parallelle arbeidere)**: Open WebUI er konfigurert med `ENABLE_SUBAGENTS=true` (opptil 8 parallelle sub-agenter) som lar hovedmodellen delegere spesialiserte oppgaver til bakgrunnsagenter.

### Kategori F: Tale, Multimedia & YouTube
- **F18 – Voice STT / TTS**: Tale-til-tekst og tekst-til-tale-bro for stemmestyring på mobil og PC.
- **F19 – Realtime Voice**: Adapter for sanntidslyd og toveiskommunikasjon.
- **F24 – YouTube Summary**: Automatisk uthenting av reelle undertekster fra YouTube via `youtube-transcript-api` (norsk, engelsk, etc.) og intelligent oppsummering med tidsstempler uten å hallusinere bildeinnhold.

### Kategori G: Integrasjoner, Automasjon & Oppgaver
- **F20 – Plugins / Connectors**: Administrasjon av integrasjoner og verktøy med avgrensede rettigheter (scoped grants) og mulighet for øyeblikkelig tilbaketrekking (revoke).
- **F21 – Automations / Tasks**: Tidsplanlagte oppgaver med iCal RRULE (f.eks. daglig morgenbrifing) som kjører automatisk i bakgrunnen.

### Kategori H: Mobil, App & Plattformleveranse
- **F28 – Android App (PWA & TWA)**:
  - **PWA**: Installerbar direkte fra nettleser på Android, nettbrett og desktop med full offline-støtte for app-skallet.
  - **TWA APK/AAB**: Spesifikasjon og konfigurasjon for Google Chrome Labs Bubblewrap (`@bubblewrap/cli@1.27.0`) med Digital Asset Links (`/.well-known/assetlinks.json`) som fjerner URL-feltet og gir ekte fullskjerms native app-opplevelse.

### Kategori I: Sikkerhet, Ressurser & Drift
- **F29 – Updates & Compatibility**: Pinned versions i `versions.lock`, kompatibilitetsmatrise i `COMPATIBILITY.md`, og oppdateringsrutine via `./manage.sh check-updates` og `./manage.sh upgrade`.
- **F30 – Backup & Restore**: Atomiske, konsistente snapshots av databaser og filer med SHA-256-sjekksummer via `./manage.sh backup` og feilsikker gjenoppretting via `./manage.sh restore <snapshot_id>`.
- **F31 – Security & Least Privilege**: Alle containere kjører non-root der det er mulig, ingen Docker-socket deles med agenter, porter bindes til `127.0.0.1` som standard, og hemmeligheter lagres med `chmod 600`.
- **F32 – Cost & Resource Optimization**: Skreddersydd for å kjøre stabilt innenfor 16 GB RAM på verten med lav tomgangsbruk (< 1.5 GB RAM totalt for kjernestakken med skymodeller). Egen GPU-profil (`compose.gpu.yaml`) for RTX 2060 med minneeffektiv ComfyUI.
- **F33 – GitHub & Open Source Distribution**: Komplett kildekode lisensiert under MIT med tydelig attribusjon av tredjeparter (`THIRD_PARTY_NOTICES.md`), CI/CD via GitHub Actions (`.github/workflows/ci.yml`), installasjonsveiviser (`install.sh`) og driftsverktøy (`manage.sh`).

---

## 4. Driftskommandoer (`./manage.sh`)

| Kommando | Beskrivelse |
|---|---|
| `./manage.sh start` | Starter hele stakken i bakgrunnen via Docker Compose |
| `./manage.sh stop` | Stopper alle containere trygt |
| `./manage.sh restart` | Starter stakken på nytt |
| `./manage.sh status` | Viser containerstatus og endepunkt-helsesjekker |
| `./manage.sh doctor` | Analyserer minnebruk, ledig diskplass, Docker-tilstand og portkollisjoner |
| `./manage.sh backup` | Lager et konsistent, komprimert snapshot med SHA-256 sjekksummer |
| `./manage.sh restore <id>` | Gjenoppretter et tidligere snapshot ved migrering eller systemfeil |
| `./manage.sh check-updates` | Kontrollerer oppstrøms GitHub-releaser for nyere versjoner |
| `./manage.sh upgrade [--approve]` | Sikker oppgradering med forhåndsbackup og verifisering |

---

## 5. Valgfrie Docker Compose Profiler

- **Standard basis (Lavt ressursbruk)**:
  ```bash
  docker compose up -d
  ```
- **Med lokalt Google/Bing-søk (OpenSERP & SearXNG)**:
  ```bash
  docker compose -f compose.yaml -f compose.search.yaml up -d
  ```
- **Med isolert kodekjøringssandkasse (Open Terminal)**:
  ```bash
  docker compose -f compose.yaml -f compose.terminal.yaml up -d
  ```
- **Med lokal NVIDIA GPU-akselerasjon (Legion 5 RTX 2060)**:
  ```bash
  docker compose -f compose.yaml -f compose.gpu.yaml up -d
  ```
- **Full stakk med alle funksjoner aktivert**:
  ```bash
  docker compose -f compose.yaml -f compose.search.yaml -f compose.terminal.yaml -f compose.gpu.yaml up -d
  ```

---

## 6. Verifikasjon og Teststatus

- **Automatisert testdekning**: 17 av 17 tester passerer lokalt med 0 feil og 0 advarsler:
  - `tests/unit/test_artifacts.py` (PDF, Word, Excel, PowerPoint, ZIP)
  - `tests/unit/test_library.py` (Filregistrering, SHA-256 deduplisering, favoritter)
  - `tests/integration/test_api_endpoints.py` (Helse, kapabiliteter, artefakter, Intelligent UI)
  - `tests/integration/test_images.py` (Bildegenerering, bilderedigering, avstamningssporing)
  - `tests/integration/test_work_and_research.py` (Work-agenter, kildebelagt dyp research)
  - `tests/integration/test_audio_and_automations.py` (Transkripsjon, talesyntese, oppgaveplanlegging, scoped connectors)
- **Klient-bygg**: `apps/web` bygger statiske PWA-ressurser feilfritt via `npm run build`.
- **Skriptkontroll**: `install.sh` og `manage.sh` validert med `bash -n`.
