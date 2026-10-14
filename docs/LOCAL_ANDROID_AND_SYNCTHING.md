# Arkitektur: Helt Lokal Android-App & P2P-Synkronisering med Syncthing

Dette dokumentet beskriver hvordan **Personal AI Workspace (PAW)** kan kjøres som en **100 % lokal Android-applikasjon**, og hvordan **Syncthing** gir sømløs, privat, peer-to-peer synkronisering mellom din Android-telefon og din hjemmeserver (Lenovo Legion 5).

---

## 1. Konseptet: To driftsmoduser for Android

```
                     ┌───────────────────────────────────────────────┐
                     │          Android Smarttelefon                 │
                     │                                               │
                     │  ┌─────────────────────────────────────────┐  │
                     │  │    Personal AI Workspace (Lokal App)    │  │
                     │  │  - Frakoblet brukergrensesnitt (PWA)    │  │
                     │  │  - Lokal SQLite / IndexedDB             │  │
                     │  │  - WebLLM / Llama-3.2-1B / Gemma-2-2B   │  │
                     │  │  - Direkte filtilgang (/sdcard/PAW/)   │  │
                     │  └────────────────────┬────────────────────┘  │
                     │                       │                       │
                     │  ┌────────────────────▼────────────────────┐  │
                     │  │        Syncthing (Android-tjeneste)     │  │
                     │  │   Mapper: inbox/, notes/, library/      │  │
                     │  └────────────────────┬────────────────────┘  │
                     └───────────────────────┼───────────────────────┘
                                             │
                             TLS-kryptert P2P (Wi-Fi / Tailscale)
                                             │
                     ┌───────────────────────▼───────────────────────┐
                     │     Lenovo Legion 5 (PAW Hjemmeserver)        │
                     │                                               │
                     │  ┌─────────────────────────────────────────┐  │
                     │  │      Syncthing Container (port 22000)   │  │
                     │  │   Volum: data/paw/sync/                 │  │
                     │  └────────────────────┬────────────────────┘  │
                     │                       │                       │
                     │  ┌────────────────────▼────────────────────┐  │
                     │  │   SyncBridge & PAW API (BFF)            │  │
                     │  │  - Automatisk innboks-ingestion         │  │
                     │  │  - Tunge modeller (DeepSeek / ComfyUI)  │  │
                     │  │  - Deep Research & Web Search           │  │
                     │  └─────────────────────────────────────────┘  │
                     └───────────────────────────────────────────────┘
```

### Modus A: Hybrid / Tilkoblet (Gjeldende standard)
- Appen kobler seg mot serveren via **Tailscale** eller lokalt nettverk.
- Serveren håndterer tyngre LLM-resonnering, Deep Research, ComfyUI bildediffusjon og web-agenter.
- Klienten cacher meldinger og bibliotek lokalt for frakoblet lesing.

### Modus B: 100 % Frakoblet & Helt Lokal (Offline Autonomous)
- **Ingen serverforbindelse nødvendig for daglig bruk:**
  - **Lokal Inferens:** Lette modeller (1B–3B parametere, f.eks. Llama-3.2-1B/3B, Gemma-2-2B, Qwen-2.5-1.5B) kjører direkte på telefonens NPU/GPU via **WebGPU/WebLLM** (innebygd i WebView/PWA) eller via native **llama.cpp / MediaPipe LLM**.
  - **Lokal Lagring:** Notater, dokumenter og filer lagres direkte på telefonens filsystem (`/storage/emulated/0/PersonalAI/` eller app-private mapper).
  - **Rene Markdown-notater:** Notater lagres som standard `.md`-filer med YAML-metadata, slik at de kan åpnes og redigeres med Markor, Obsidian eller PAW-appen.

---

## 2. Hvorfor Syncthing er en ideell løsning

1. **Ingen tredjepartssky:** Ingen data sendes til Google Drive, Microsoft OneDrive eller Dropbox. Alt forblir på dine egne enheter.
2. **End-to-End TLS-kryptering:** All overføring mellom mobil og server er kryptert med unike kryptografiske enhets-ID-er.
3. **Fungerer overalt:**
   - **Hjemme:** Automatisk lynrask synkronisering over lokalt Wi-Fi (opptil 1 Gbps).
   - **På farten:** Synkroniserer sømløst over **Tailscale** VPN uten å åpne noen porter mot det åpne internett.
4. **Blokk-nivå delta-overføring:** Kun endrede deler av filer overføres, noe som sparer mobildata og batteri.

---

## 3. Mappestruktur og Konfliktfri Arkitektur

Syncthing synkroniserer mappen `data/paw/sync/` (server) med `/storage/emulated/0/PersonalAI/` (Android):

```text
PersonalAI/
├── inbox/           <-- Filer du legger til på telefonen (bilder, kvitteringer, PDF-er)
├── notes/           <-- Notater i ren Markdown (.md) redigerbare på begge sider
├── library/         <-- Skrivebeskyttet speil av serverens CAS-dokumenter og rapporter
└── ingested/        <-- Server-arkiv over behandlede innboksfiler
```

### Hvorfor oppstår det ALDRI filkonflikter i Library?
PAW benytter **Content-Addressed Storage (CAS)** med **SHA-256**:
- Filnavnet på lagret innhold er avledet av filens faktiske kryptografiske sjekksum (`<sha256[:2]>/<sha256>`).
- Innholdet er **umuterbart (immutable)**. To filer med ulikt innhold får aldri samme navn, og filer med identisk innhold dedupliseres automatisk.
- Dermed elimineres klassiske synkroniseringskonflikter fullstendig.

### Innboks-mønsteret (Inbox Pattern)
1. Du er på farten og tar et bilde av en faktura eller laster ned en forskningsartikkel på telefonen.
2. Du lagrer filen i mappen `PersonalAI/inbox/`.
3. Så snart telefonen kobler seg til Wi-Fi eller Tailscale, synkroniserer Syncthing filen til serveren i bakgrunnen.
4. PAW Server kjører `SyncBridge.scan_and_ingest_inbox()`:
   - Filen hashes og legges inn i serverens Library.
   - Serveren kan trigge OCR, oppsummering eller datakatalogisering.
   - Filen flyttes til `ingested/`, og det genererte sammendraget/PDF-en legges i `library/`, som synkroniseres tilbake til telefonen!

---

## 4. Hvordan sette opp Syncthing på Server og Android

### Steg 1: Start Syncthing på Serveren
Kjør Docker Compose med sync-profilen:
```bash
docker compose -f compose.yaml -f compose.sync.yaml up -d
```
Syncthing Web GUI er nå tilgjengelig lokalt på `http://127.0.0.1:8384` (eller via din Tailscale-adresse).

### Steg 2: Installer Syncthing på Android
1. Installer **Syncthing-Fork** (anbefalt, åpen kildekode) fra **F-Droid** eller **Google Play Store**.
2. Åpne appen og gi lagringstillatelse.
3. Opprett en delt mappe:
   - Mappenavn: `PersonalAI`
   - Mappeplassering: `/storage/emulated/0/PersonalAI`

### Steg 3: Koble sammen Server og Android
1. I Android-appen: Trykk på QR-kodeikonet for å vise din enhets-ID.
2. I Syncthing Web GUI på serveren (`http://127.0.0.1:8384`):
   - Trykk **Add Remote Device** og skriv inn ID-en fra telefonen (eller skann QR-koden).
   - Huk av for å dele mappen `Sync` (som peker på `data/paw/sync`).
3. Godkjenn delingen på telefonen.
4. Synkroniseringen er nå aktiv og kjører automatisk i bakgrunnen.

---

## 5. Kjøring av Lette Lokale Modeller på Android (Null Serveravhengighet)

For situasjoner der du er helt uten dekning og ønsker AI-assistanse:

| Løsning | Teknologi | Støttede Modeller | Minnekrav |
|---|---|---|---|
| **WebLLM / WebGPU** | Innebygd i PAW Web / PWA | Llama-3.2-1B-Instruct, Qwen-2.5-1.5B, Gemma-2-2B | 2 GB – 4 GB RAM |
| **MediaPipe LLM** | Google On-Device API | Gemma-2-2B, Falcon-1B | 1.5 GB – 3 GB RAM |
| **llama.cpp (Termux)** | Kompilert C++ CLI | Alle GGUF-modeller (f.eks. Q4_K_M) | 1 GB – 6 GB RAM |

Når serveren er tilgjengelig, ruter PAW automatisk tunge oppgaver (kildesøk, 70B-modeller, Deep Research) til Legion 5-serveren. Når du er offline, håndterer den lokale motoren dine hurtigspørsmål og notater direkte på telefonen.
