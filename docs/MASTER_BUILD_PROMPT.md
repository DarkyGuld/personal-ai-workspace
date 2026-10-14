# MASTERPROMPT — Bygg Personal AI Workspace fra spesifikasjonen

> **Bruk:** Kopier hele teksten under `PROMPT START` til en AI-kodeagent med tilgang til Git, terminal, nett og testverktøy. Legg ved `ARCHITECTURE.md`, `FEATURE_MATRIX.md`, `IMPLEMENTATION_PLAN.md` og `UPDATE_POLICY.md`. Denne prompten bestiller faktisk implementasjon, ikke bare en ny plan. AI-en må kjøre testene og være transparent om mangler. En eneste prompt kan ikke garantere full implementasjon i én kjøring: agenten skal bruke milepæler, commits og gjenopptakbar status.

---

## PROMPT START

Du er en **senior fullstack staff engineer, DevOps/SRE, Android engineer, AI-agent architect, security engineer og UX-designer**. Du skal REALISERE et komplett, self-hosted, åpent GitHub-prosjekt kalt **Personal AI Workspace** basert på vedlagte spesifikasjoner:

- `ARCHITECTURE.md` — fasit for valg og krav
- `FEATURE_MATRIX.md` — komplett funksjonsdekning og akseptansetester
- `IMPLEMENTATION_PLAN.md` — gjennomføringsrekkefølge
- `UPDATE_POLICY.md` — oppdatering/rollback

Du må bruke spesifikasjonen som **produktkontrakt**. Hvis en teknisk påstand eller tredjepartsintegrasjon er feil, utdatert, inkompatibel, ulisensiert eller overkomplisert, verifiser aktuell upstream-dokumentasjon/kildekode og gjør en begrunnet ADR-endring før implementering. Ikke lat som en funksjon er ferdig uten fungerende kode og tester.

### 1. Min maskin, rammer og hovedmål

Målvert: Lenovo Legion 5 15ARH05H, Ryzen 5 4600H, 16 GB RAM, NVIDIA RTX 2060 6 GB VRAM, 512 GB SSD, Ubuntu Server 24.04 LTS. Systemet skal også kunne installeres av andre på vanlige Linux-maskiner via Docker Compose, med og uten NVIDIA-GPU.

Jeg vil ha en **ChatGPT-lignende plattform med alle funksjonsområdene i vedlagte matrise**, felles for desktop web og Android app: chat, search, permanent Library med Suggested/Favorites/Folders/Images, Knowledge/RAG, Memory, Notes/Writing, Work og research-agenter, Projects, filopplasting og -generering, bildegenerering/-redigering, voice, plugins/connectors, automations/tasks, Intelligent UI med interaktive svar og YouTube-oppsummering. Systemet skal kunne lage og redigere PDF/DOCX/XLSX/PPTX/CSV/ZIP/bilder og levere ekte nedlastbare filer som registreres i Library.

Det skal være **ressursvennlig, enkelt å installere, oppdaterbart og stabilt**. Prioriter ett hovedsystem og minst mulig runtimekompleksitet. Ikke bygg 15 mikrotjenester. Ikke bruk Kubernetes. Ikke krev betalt VPS. Bruk skybaserte AI-modeller når ønskelig; lokale modeller er valgfrie og må passe maskinens RAM/VRAM. Bilde-API og andre betalte leverandører skal være valgfrie med kostnadsgrenser.

### 2. Dette er de bindende arkitekturvalgene

1. **Upstream Open WebUI som eksisterende AI-kjerne**, ikke kopier/fork kjernen som standard. Hold alt upstream-relatert under én versjonert `openwebui-adapter`. Bruk dokumenterte server-side tools, MCP, OpenAPI og REST der det er hensiktsmessig. Merk eksperimentelle API-er og test dem eksplisitt. Ikke les/skriv Open WebUI sin interne database direkte.
2. **OpenUI fra thesysdev** til generativ Intelligent UI, med React-renderer, sikre komponenter og streaming. Default må kunne bygges uten obligatorisk Thesys Cloud-konto; et kompatibelt API kan konfigureres. Ikke legg CopilotKit/A2UI i runtime bare fordi de finnes. Bruk dem som inspirasjon eller isolerte adaptere hvis begrunnet.
3. **Én frontend-kodebase**, React/TypeScript/Vite/PWA, og **Android APK/AAB basert på samme webapp** via Trusted Web Activity/Bubblewrap der praktisk. Native bridging kan lages for Android-funksjoner som faktisk krever det; all funksjonalitet må ha en testet mobilflyt. Ikke vedlikehold en separat full Flutter-klient i tillegg. Hvis TWA ikke kan verifiseres uten domene, gi PWA-fallback og dokumentert domene-/Asset Links-oppsett i stedet for å jukse.
4. **Egen BFF/utvidelses-API** med auth, policy, adaptere, Library, project metadata, artifact APIs, jobkontroll og egne UI endpoints. Velg FastAPI eller TypeScript-backend etter konkret integrasjonsbehov; kun én BFF-runtime. Ingen ekstra database hvis SQLite holder.
5. Open WebUI sine egne Memory/Knowledge/Notes/automations brukes først. Egen modul bare når funksjonsgap er bevist. Egen Library skal ha en filindeks, ikke duplisere alle filer ukritisk.
6. Open Terminal og browser-arbeid i sandboxede containere med minst privilegier og CPU/RAM/diskgrenser. Ingen Docker socket i agent-container, ingen tilgang til host home, NAS-root, secrets eller personlige kataloger.
7. Bildegenerering/-redigering via eksisterende Open WebUI-provider; lokal ComfyUI **kun valgfri** profil når testet med 6 GB VRAM.
8. **Kontrollerte GitHub-oppdateringer:** offisielle pinned images/digests, Renovate/Dependabot PR-er, kontrakttester, backup, isolert staging og restorebasert rollback. Aldri auto-deploy direkte fra `latest`.
9. Offentlig GitHub-distribusjon med riktig OSS-lisens på egen kode, upstream-attribusjon, SBOM, ingen secrets og ingen ubegrunnet branding/endring av Open WebUI (les deres egne brandingvilkår).
10. Brukerens tekstdata og API-nøkler forblir private på serveren. Ingen skjult telemetri, betalings-API eller automatisk tredjepartsdeling uten samtykke.

### 3. Dine første konkrete handlinger — gjør dette før stor koding

A. Undersøk **faktiske** aktuelle GitHub-repoer, dokumenterte API-er, lisensfilene, Docker-image-tags og programmeringsstakk. Sjekk særlig:
- https://github.com/open-webui/open-webui
- https://docs.openwebui.com/reference/api-endpoints/
- https://docs.openwebui.com/reference/server-side-tool-calling/
- https://docs.openwebui.com/license/
- https://github.com/thesysdev/openui
- https://github.com/thesysdev/open-intelligent-ui
- https://github.com/CopilotKit/OpenIntelligentUI
- https://github.com/cogwheel0/conduit (kun referanse for mobil/kompatibilitet; GPL-3.0)
- https://docs.openwebui.com/features/open-terminal/
- https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2

B. Lag `docs/ADR/0001-system-architecture.md` med alle tradeoffs og risikoer. Opprett `docs/COMPATIBILITY.md` med reelle versjoner og kontraktstatus. Ikke lås `versions.lock` til fantasiversjoner.

C. Opprett et Git-repository med hele anbefalt katalogstruktur, `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `SECURITY.md`, `.gitignore`, `.env.example`, `CHANGELOG.md`, `CONTRIBUTING.md` og GitHub Actions. Koden skal ikke inneholde data fra min PC.

D. Implementer **milepæl 1** først: fungerende Docker Compose for Open WebUI, persistent storage, installasjonsveiviser, sikker remote tilgang, modellkonfigurasjon, healthchecks, `status/backup/restore` og basistester. Demonstrer at systemet faktisk starter før du går videre.

### 4. Feature-first utviklingskrav

Bygg videre i milepælene 2–8 fra `IMPLEMENTATION_PLAN.md`. For hver funksjon:

- Vis implementasjonssted, API-kontrakt, tillatelser, datalagring og frontend på desktop og Android.
- Lag unit + integration + ende-til-ende test med realistisk input.
- Sjekk at funksjonen er tilgjengelig **i Android-appen**. Ikke vurder det som ferdig bare fordi Open WebUI tilbyr funksjonen i desktop UI.
- Installerer/kjører kun ekstra containere dersom tjenesten er nødvendig. Tunge tjenester skal avsluttes når de er idle og policy tillater det.
- Dokumenter 'implemented / tested / blocked' i `FEATURE_MATRIX.md` med lenke til testfil, skjermdump og commit.
- Hvis ekte ekstern API/service ikke er tilgjengelig under byggingen: implementer adapter og en korrekt mock til CI, men merk funksjonen som **unverified for real provider**, beskriv nøyaktig hvordan et ekte kall skal testes. Ikke oppgi mock som ekte verifisering.

### 5. Strenge brukeropplevelseskrav

Design en moderne, rask og ryddig ChatGPT-lignende UI (men ikke kopier varemerker eller proprietære ressurser). Bruk samme design tokens, typografi, layout og responsive navigasjon for hele appen.

Sidebar og navigasjon skal minst ha: New Chat, Search, Library, Knowledge, Memory, Notes, Projects, Work, Tasks, Images, Settings. På Android: plassbesparende nav, sidepanel, touch, fullskjerm Intelligent UI, sikker login, korrekt Android tilbakeknapp, native share/deep links/kamera/mikrofon når teknisk mulig, og web-fallback når en native-funksjon ikke finnes.

**Intelligent UI:** modellen skal som standard gi vanlig tekst, og velge interaktiv UI når den forbedrer oppgaven. OpenUI-komponenter må inkludere grafer, tabeller, kalkulatorer, sliders, forms, quiz, kort, bilder, diagrammer og kart med kildebaserte data. UI-data lagres sammen med chaten og kan åpnes igjen på Android. Sandbox alt modellgenerert kjørbart innhold. En enkel lokal slider skal ikke kreve nytt LLM-kall.

**Library:** alle filer fra chatter og genererte dokumenter skal registreres én gang, kunne søkes opp, filtreres, favorittmerkes, organiseres i mapper, åpnes/forhåndsvises, gjenbrukes i ny chat og eksporteres.

**Images:** bildeskaperen støtter prompt, relevant størrelse/format og provider; bildeditoren tar eksisterende bilde og prompt, bevarer original. `Images`-visningen viser genererte, redigerte og opplastede bilder.

**Work:** agenten viser plan, fremdrift, referanser, kilder, sandbox-aktivitet, godkjenning, avbryt og nedlastbare resultatfiler. Handlinger med sideeffekter må kreve eksplisitt brukerinitiert godkjenning.

### 6. Tekniske API-kontrakter (intern standard)

Implementer en dokumentert og versjonert BFF API minst:

```text
GET  /healthz
GET  /api/v1/capabilities
GET  /api/v1/models
GET  /api/v1/chats
POST /api/v1/chats
POST /api/v1/chat/stream
GET  /api/v1/library/items
POST /api/v1/library/uploads
GET  /api/v1/library/items/{id}
POST /api/v1/library/items/{id}/attach
POST /api/v1/library/items/{id}/favorite
GET  /api/v1/projects
POST /api/v1/projects
GET  /api/v1/artifacts/{id}
POST /api/v1/artifacts/generate
POST /api/v1/images/generate
POST /api/v1/images/edit
POST /api/v1/work/runs
GET  /api/v1/work/runs/{id}
POST /api/v1/work/runs/{id}/approve
POST /api/v1/work/runs/{id}/cancel
POST /api/v1/intelligent-ui/generate
POST /api/v1/intelligent-ui/interact
GET  /api/v1/usage
GET  /api/v1/feature-flags
```

Disse er våre egendefinerte endepunkter, **ikke en påstand om at Open WebUI allerede eksponerer dem**. De må implementeres med OpenAPI-skjema, autentisering, RBAC, audit log og kontrakttester. Hvis et endpoint er upraktisk bør det endres gjennom ADR og samtidig oppdatere klienttyper/testrammer.

### 7. Oppsettet må være lett for vanlige mennesker

Bygg følgende brukersynlige kommandogrensesnitt og verifiser at det virker på fersk installasjon:

```bash
./install.sh
./manage.sh status
./manage.sh doctor
./manage.sh backup --verify
./manage.sh check-updates
./manage.sh upgrade --dry-run
./manage.sh upgrade --approve
./manage.sh restore --snapshot SNAPSHOT_ID
```

`install.sh` sjekker Docker/Compose, minne, disk, porter, GPU-støtte, nettilgang, HTTPS/Tailscale, oppretter lokale secrets, lager persistent volume og veileder første admin bruker. Hvis prerequisites mangler må scriptet gi en direkte feil med løsning, ikke feile halvveis. `.env.example` viser alle konfigurasjonsvalg uten hemmeligheter.

Lag GitHub `README.md` med 5-min quick start (ikke garanter fem minutter før testet), screenshots, features, sikkerhetsråd, mobilinstallasjon, hvordan få Android APK, backup/restore, feilsøking, maskinvareprofil og kostnadsnotat.

### 8. Resource efficiency – hard constraints

- Basisinstallasjon skal kjøre uten GPU og uten betalte tjenester bortsett fra valgfri modell-API.
- Følg containerstatistikk. Lag en fast benchmark for idle, normal chat, dokumentgenerering, research og imagegen.
- Ingen kontinuerlig browser automation eller lokal modellserver som beslaglegger flere GB RAM når idle.
- Start med SQLite for egen metadata og Open WebUI sin støttede standardkonfigurasjon; ikke innfør Postgres/Qdrant/Redis uten ytelsesbevis.
- Begrens samtidige Work/Browser/ComfyUI jobber, memory, CPU, walltime, tempdisk, max tokens og API-budsjett.
- På RTX 2060 6 GB: dokumenter hvilke lokale modeller/workflows som faktisk fungerer etter test; bruk ekstern bilde-API som robust default.

### 9. Sikkerhet og personvern – release blocker

- Sandkasse agentkode og nettleser med begrensede rettigheter.
- Ikke monter `/var/run/docker.sock`, `/`, `~`, NAS-root, `.env` eller private API-nøkler inn i agent-container.
- Ingen bruk av eval eller usikret modellgenerert JS i autentisert origin.
- Anti-SSRF, path traversal, XSS, MIME validation, zip bomb guard, rate limits, quotas, CORS/CSRF, session management.
- RBAC på alle API-endepunkter og filer; test at én bruker ikke leser annen brukers Library eller prosjekter.
- Integrasjoner har minste nødvendige OAuth scopes/token grants og revoke.
- API-nøkler på serveren, signing keys bare i sikre lokale/CI secrets, aldri GitHub repo eller APK.
- Sikker backup med restic og velprøvd restore; ikke markér release ferdig uten utført recovery-test.

### 10. GitHub update-policy — strengt krav

- Ikke rediger upstream-kode som permanent strategi. Hvis ingen stabil frontend extension API finnes og egen UI er påkrevd, bruk isolert versjonert klient + adapter. Dokumenter hvilke upstream API-er som er eksperimentelle.
- Bruk pinned images (inkl. digest for produksjon), lockfiles og `versions.lock`.
- Renovate/Dependabot skal opprette PR ved nye Github-/pakkeversjoner.
- CI utfører kontrakttester mot aktuell og ny upstream-versjon og sikrer at funksjonene fortsatt fungerer på Android/web.
- Ved inkompatibilitet: PR skal feile, produksjon skal bli på eksisterende versjon, og issue/rapport opprettes.
- Krev konsistent backup av database og objekter før migrasjon. For rollback skal **database+filer+image** gjenopprettes sammen; bare image rollback er ikke nok.
- Ingen automatisk oppdatering av produksjon før godkjente tester og eksplisitt releasepolicy.

### 11. Test og demonstrasjon

For hver milestone må du **kjøre** relevante tester og legge ved følgende i rapport:

```text
- implemented features IDs:
- files changed:
- commit hashes:
- commands executed:
- tests passed:
- tests failed/skipped + why:
- verified API calls vs mocks:
- screenshots (web/Android if available):
- measured RAM/CPU/GPU usage:
- security/license concerns:
- next prioritized task:
```

Test faktisk gjenåpning av generert PDF, DOCX, XLSX, PPTX, ZIP og PNG; verifiser filtype, ikke bare at det eksisterer en fil. Test Library ↔ Chat, Projects, Memory, Search, Intelligent UI state, Research citations, Voice, Automations, image-editing og mobile parity etter refresh/restart. Ingen dummy buttons, tomme sider, test-only resultat eller TODO-markeringer som utgir seg for fungerende features.

### 12. GitHub og Android release

Når alle milesteiner er ferdige og verifiserte:

1. Kjør final code audit, license report, dependency scan, secrets scan, all feature smoke tests, performancebenchmark og restoretest.
2. Oppdater README, deployment docs, API/compatibility matrix, license notices, screenshot-galleri og release notes.
3. Be meg om tillatelse før første publisering til min GitHub-konto, valg av repo-navn og public/private. Bruk eksisterende GitHub-connector/gh CLI med nødvendig godkjenning; ikke be om personlig access token i klartekst i chatten.
4. Opprett repo/push kun etter godkjenning og verifiser remote, commit og release på GitHub.
5. CI bygger web/Docker-images og Android debug APK. Produksjons APK/AAB signeres med beskyttet nøkkel i CI. Digital Asset Links må samsvare med app signing certificate og min faktiske URL. Hvis dette mangler, stopp Android public release med konkret TODO; ikke publiser ubrukelig APK.
6. Opprett GitHub Releases med arkiver, checksums og dokumenterte installasjonstester.
7. Lever en enkel `UPGRADE.md` og 'How to fork/rebrand legally' for andre brukere.

### 13. Avsluttingskrav / Definition of Done

Prosjektet regnes ikke som komplett før alle `F01–F33` enten er verifisert med bevis på både web og Android, eller har eksplisitt avtalt scope-endring godkjent av meg. En funksjon som krever betalt API eller fysisk telefon testes reelt når credentials/enhet er tilgjengelig, ellers rapporteres `blocked/unverified`, ikke `done`.

**Bygg nå.** Start med Discovery + Milepæl 1 og implementer faktisk kode, ikke bare spesifikasjonsfiler. Fortsett gjennom milepæler i kontrollert rekkefølge. Stopp bare for vesentlig blokkering som krever brukervalg/innlogging/tillatelse. Hvis en tids-/kontekstgrense oppstår, oppdater `PROGRESS.md` og `NEXT_STEPS.md` med presis tilstand, committér arbeidet og gjør prosjektet lett å fortsette for neste agentøkt. Ikke utgi noe som ferdig uten at testene er kjørt. Bruk norsk i dokumentasjon for sluttbruker, engelsk i kode, API-navn og tekniske kommentarer der det passer best.

## PROMPT SLUTT
