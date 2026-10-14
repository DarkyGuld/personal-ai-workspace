# Upstream Compatibility & API Contracts Matrix

This matrix tracks the compatibility between Personal AI Workspace components and verified upstream versions of **Open WebUI (v0.12.0)**.

> **Viktig differensiering:**
> - `Official & Stable`: Dokumentert av Open WebUI med stabile parametere og versjonerte ruter.
> - `Experimental / Internal`: Eksisterer i Open WebUI FastAPI backend (`open_webui/routers/`), men er merket som eksperimentelt eller uoffisielt av upstream. Kan endre signatur mellom mindre oppgraderinger.
> - `Simulated / Mock in CI`: Evalueres mot syntetiske mocks eller offline fixtures under CI-kjøringer når oppstrøms Docker-tjeneste ikke er aktiv.

---

## 1. Open WebUI Endpoint Contracts Matrix

| Path | Method | Upstream Status | PAW Adapter Strategy | Test / Kontrakt |
|---|---|---|---|---|
| `/health` | GET | Official & Stable | Direkte passthrough / Healthcheck | Kontrakt-testet (`test_health_endpoint`) |
| `/api/models` | GET | Official & Stable | Modell-oppdagelse & kapabilitets-kartlegging | Adapter implementert (`get_models`) |
| `/api/chat/completions` | POST | Official & Stable | OpenAI-kompatibel SSE-stream & verktøykall | Upstream kjernefunksjon |
| `/api/v1/auths/signin` | POST | Experimental / Internal | Sesjonsutveksling og tokenvalidering | Adapter implementert (`signin`) |
| `/api/v1/auths/signup` | POST | Experimental / Internal | Kontrollert brukerregistrering | Upstream rute |
| `/api/v1/files/` | POST | Official & Stable | Filopplasting og parsing | Upstream rute |
| `/api/v1/files/{id}/content` | GET | Official & Stable | Rå fil-streaming | Upstream rute |
| `/api/v1/memories/` | GET | Experimental / Internal | Henting av minne og preferanser | Adapter implementert (`get_memories`) |
| `/api/v1/memories/add` | POST | Experimental / Internal | Opprettelse av minne | Adapter implementert (`add_memory`) |
| `/api/v1/memories/{id}` | DELETE | Experimental / Internal | Sletting av minne | Adapter implementert (`delete_memory`) |
| `/api/v1/notes/` | GET | Experimental / Internal | Notatliste og innhold | Upstream rute |
| `/api/v1/automations/list` | GET | Experimental / Internal | Inspeksjon av planlagte oppgaver | Adapter implementert (`list_automations`) |
| `/api/v1/automations/create` | POST | Experimental / Internal | Registrering av automatiserte kjøringer | Upstream rute |
| `/api/v1/images/generations` | POST | Official & Stable | Bildegenerering via konfigurert motor | Upstream rute |
| `/api/v1/images/edit` | POST | Experimental / Internal | Bilderedigering / inpainting | Upstream rute |
| `/api/v1/retrieval/process/youtube` | POST | Experimental / Internal | Uthenting av YouTube-undertekster | PAW har fallback til direkte `youtube-transcript-api` |

---

## 2. Innebygde Upstream-funksjoner vs. PAW-utvidelser

For å forhindre unødvendig duplisering av oppstrømskode gjelder følgende arbeidsdeling:

| Funksjon | Upstream Open WebUI Håndterer | PAW (Personal AI Workspace) Håndterer |
|---|---|---|
| **Sub-agents** | Kjører sub-agenter i parallelle workers (`ENABLE_SUBAGENTS=true`, max 8 concurrent) | Eksponerer status og delegering i det samlede grensesnittet |
| **Realtime Voice** | WebRTC / Audio streaming via `/api/v1/audio/` | Klient-mikrofon og lydavspilling på mobil og desktop |
| **Memory** | Vektor- og kontekstminne (`ENABLE_MEMORIES=true`) | UI-oversikt og eksportmulighet i sidepanelet |
| **Automations** | Tidsplanlagte oppgaver og kjørehistorikk | Visning, opprettelse og mobilvarslings-bridge |
| **Sentralt Library** | Lagrer kun filer knyttet til enkeltsamtaler | **Eies av PAW:** SHA-256 deduplisering, gjenbruk i nye chatter, mapper og favoritter |
| **Intelligent UI** | Støtter kun standard markdown | **Eies av PAW:** Generative interaktive widgets via OpenUI |
| **Dokumentgenerering** | Ingen innebygd eksport til XLSX/PPTX/Word | **Eies av PAW:** Komplett generator for XLSX, DOCX, PPTX, PDF og ZIP |

---

## 3. Breaking Change & Rollback Protokoll

Ved oppdatering av Open WebUI container-image:
1. `manage.sh upgrade --dry-run` sjekker nye versjonsmerker.
2. `manage.sh upgrade --approve` tar automatisk et fullstendig atomisk snapshot av både SQLite-databaser og filarkiv (`backups/snapshot_...`).
3. Dersom en ny oppstrømsversjon endrer databasestruktur som ikke er bakoverkompatibel:
   - Kjør `./manage.sh restore <snapshot_id>`
   - Både databaser, filer og image-konfigurasjon rulles tilbake til samme tidspunkt.
