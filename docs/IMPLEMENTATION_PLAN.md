# Konkret implementeringsplan for AI-kodeagenten

## Arbeidsmåte

Jobb iterativt i testbare pull requests. Bruk GitHub Issues og prosjektbrett, og hold `FEATURE_MATRIX.md` med evidens for hver funksjon. Før noen kode skrives, undersøk upstream sine dokumenterte API-er, lisenser og minstekrav ved valgte versjoner; lås disse. Lag ADR-er for alle arkitekturvalg.

### Milestone 0: Bekreft arkitektur, risiko og lisenser

- Les ARCHITECTURE og opprett `docs/ADR-*.md`.
- Verifiser Open WebUI API for auth/chat/streaming/files/notes/automations/memory.
- POC for server-side tools og image generation.
- Verifiser OpenUI 'local' uten Thesys Cloud-nøkkel, på valgt leverandør.
- Verifiser at TWA fullskjerm krever offentlig/privat HTTPS-domene kontrollert av bruker + Digital Asset Links; dokumenter alternativ PWA for IP/Tailscale.
- Kartlegg open-source-lisenser og branding. Ingen fremstilling som offisiell OpenAI/ChatGPT-app.

**Exit:** dokumentert risiko-/kompatibilitetsmatrise, designbeslutninger og en stabil dependencies lock.

### Milestone 1: Enkel installasjon som fungerer

- Ubuntu/Docker Compose; official Open WebUI pinned image; persistent volume.
- `install.sh`, `manage.sh status`, `.env.example`, secrets, health, README.
- Open WebUI PWA på desktop og Android, Tailscale flow, minst én gyldig ekstern modell.
- Backup/restore og sikkerhetstester. Ingen direkte exposed sensitive port.

**Exit:** ren maskin til kjørende chat og reell restore med max ~15 min manuelt oppsett etter Docker-forutsetning. Ikke hev nøyaktig tid uten måling.

### Milestone 2: Shared frontend og adapter

- Lag minimal React/Vite webfrontend og API/BFF, Open WebUI adapter med contract tests.
- Auth/session, chat streaming, modeller, historikk, vedlegg, settings og capabilities API.
- Bygg PWA; bygg test-Android TWA når verifisert HTTPS-host og assetlinks er tilgjengelig.
- Ikke videreutvikle UI før streaming, login, app storage og refresh på mobil fungerer.

**Exit:** web og Android viser samme chat og kan åpne hverandres historikk.

### Milestone 3: Library og Projects

- Metadatafilregistry, content-addressed store, preview, mimetype, dedupe, favorites, folder, images, search og gjenbruk.
- Projekt-scope, relatert Knowledge, notes, tasks og artifacts.
- RBAC og e2e-tester for flere brukere.

**Exit:** opplastet fil gjenbrukes fra annen chat på Android uten ny opplasting.

### Milestone 4: Kunstig intelligens som lager ferdige filer/bilder

- Open Terminal sandbox med policy; Python artifact tools; filvalidering.
- Generate PDF, DOCX, XLSX, PPTX, CSV, ZIP; full redeploy + klientsynk.
- Image generation/edit provider og Images galleri; kostnadsvarsling.
- Valgfri ComfyUI profil kun etter faktisk 6 GB VRAM-test.

**Exit:** filer åpnes og lastes ned fra begge klienter, gyldig MIME og Library ID.

### Milestone 5: Intelligent UI

- React OpenUI-renderer med komponent-whitelist, streaming, history/state persistence.
- Kalkulator, tabell, graf, bildevisning, quiz, form og interaktive diagrammer; kart ved riktige datakilder.
- Host-bridget interaksjon med eksplisitt user initiation/approval for handlinger.
- Mobil e2e for alle widgettypene.

**Exit:** mobil interaktiv slider endrer verdi uten å kreve nytt LLM-kall og state overlever refresh.

### Milestone 6: Work/Research og YouTube

- Agentplan, jobs, approval workflow, cancel/pause, sandbox browser.
- Web citations, transkripsjon, videoens metadata, kildebasert research.
- Eksport resultater til dokumenter/Library.

**Exit:** full research → rapport → Library, med sammenlignbare kilder og verifisert fil.

### Milestone 7: Voice / Connectors / Automations

- Avansert STT/TTS og mulig realtime adapter, Android permissions.
- MCP/OpenAPI connectors og revocation.
- Scheduler/notification flow gjennom Open WebUI Automations; mobil push når implementert og testet.

**Exit:** autentisert bruker kan opprette automasjon og motta varsel uten at appen må være åpen (dersom push-adapter er implementert); ellers dokumentert begrensning.

### Milestone 8: Full public release

- Android APK/AAB signert, Digital Asset Links, Play Store valgfritt, GitHub Releases med checksums.
- E2E fra fresh install til full data backup/restore, upstream update rehearsal.
- Brukermanual, video/GIF-demoer produsert av prosjektet, SECURITY, LICENSE, THIRD_PARTY_NOTICES, CHANGELOG.
- Ytelsesprofiling på Legion med faktisk tall for CPU/RAM/GPU/strøm.
- Ingen hardkodede API-nøkler, signing keys eller persondata.
- Publisering til brukerens GitHub etter eksplisitt tillatelse og verifiserbar origin remote.

## Inkrementell kvalitetskontroll per PR

PR beskriver: problem, endringer, testing, aktuelle feature-ID-er, brytepunkt for API, rollback-mulighet, sikkerhetsvurdering, screenshots for web/Android, og eventuell upstream lisensendring.

En AI-agent som ikke har tilgang til Android-emulator, riktig modell-API, cloud backup eller GitHub-repo skal ikke finne på testresultater. Den må rapportere nøyaktig hva som er implementert, hva som er emulert, og hva som fortsatt må testes manuelt.
