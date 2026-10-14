# Fullstendig funksjonsmatrise og akseptansetester

Hver rad representerer et funksjonsområde som MÅ være tilgjengelig i både **desktop web** og **Android-applikasjonen** i sluttproduktet. Rekkefølgen er prioritert, men en funksjon har ikke status `verified` før reelle tester er kjørt. Ikke påstå at upstream automatiserer alle kravene: konkrete gaps må implementeres.

Statusverdier: `planned`, `in_progress`, `implemented`, `verified`, `blocked`. Ved prosjektstart er alt `planned`, selv når Open WebUI teoretisk har funksjonen; installasjon og test gjenstår.

| ID | Område | Brukerkrav | Løsning | Test/akseptansekriterium |
|---|---|---|---|---|
| F01 | Chat / New Chat | Opprett/rediger/slett chatter, streaming, regenerering, modellbytte, multimodale vedlegg, kode og sitater | Open WebUI + web/BFF-adapter | Lagre 2 chatter, bytt modell, last opp PDF, refresh Android, begge bevarer data |
| F02 | History Search | Søk på tittel/innhold/dato, filter og direkte åpning | Open WebUI + adapter | Finn gammel setning fra en chat og åpne riktig melding fra Android |
| F03 | Library | All/Suggested/Favorites/Folders/Images, metadata, preview, eksport, gjenbruk i nye chatter | Egen metadata-/file registry over upstream-filene | Fil i chat A vises i Library og kan velges i chat B uten ny opplasting |
| F04 | Knowledge / RAG | Kunnskapsbase, versjoner, kildevisning, filindeksering | Open WebUI Knowledge | Last opp PDF, still spørsmål med korrekt sitert avsnitt og sidereferanse hvis tilgjengelig |
| F05 | Memory | På tvers av samtaler; vis/endre/slett/eksporter; sensitivt innhold etter samtykke | Open WebUI Memory | Lagre preferanse, hent i ny chat, slett og bekreft at den ikke gjentas som minne |
| F06 | Notes / Writing | Vedvarende tekster og AI-redigering, versjoner, eksport | Open WebUI Notes + editor | Opprett og rediger notat på Android, se endring i web |
| F07 | Work/Agents | Agentplan, jobbsteg, pause/stop, godkjenning, resultater og artefakter | Open Terminal + kontrollert Browser worker | Kjør flertrinnsoppgave som produserer en rapport, stopp jobben, test permissions |
| F08 | Projects/Workspaces | Prosjektstyrte chatter, filer, instruksjoner, memory scope, oppgaver | Open WebUI folders + egen prosjektmetadata | Prosjekt A-fil er ikke tilgjengelig i prosjekt B uten eksplisitt autorisasjon |
| F09 | Files | PDF, DOCX, XLSX, PPTX, ZIP, tekst, bilder, kode; upload/download/versjoner | Storage API + Library | Test PDF/Word/Excel/ZIP opplasting og integritet ved nedlasting |
| F10 | Image Gallery | Bla/søk/merk/last ned opplastede og genererte bilder | Library Images-oversikt | Bildet finnes fra begge klienter etter nytt login |
| F11 | Web Search | Kilder, titler, URL, hentetid, pålitelighet/feil | Open WebUI web search | Spør om fersk hendelse og sjekk at kildene faktisk ble brukt |
| F12 | Deep Research | Flere søk, kildeutvelgelse, faktasjekk, oppsummering, rapport | Budsjettert research workflow | Produser kildebelagt rapport med 5 ulike kilder og tydelig usikkerhet |
| F13 | Data Analysis | Analyse av CSV/XLSX, statistikk, graf, tabeller og eksport | Sandboxed Python via Open Terminal | Last opp CSV, generer korrekt diagram og gjenåpnbar XLSX |
| F14 | Code Execution | Python/JS/kommandolinje med CPU/RAM tidsgrenser | Sandboxed Open Terminal | Program kjøres, stopper på timeout; har ikke tilgang til host home eller Docker socket |
| F15 | Document Creation | Rediger/lag PDF, DOCX, XLSX, PPTX, ZIP og kode | `artifact-tools` i sandkasse | Lag ett eksempel per format, pars og åpne etterpå; registrer i Library |
| F16 | Image Generation | Fra tekst til PNG/JPG/WebP, størrelse/stil/kostnad | Open WebUI image engine | Bilde genereres via konfigurert provider og lagres med korrekt opprinnelse |
| F17 | Image Editing | Masking/inpainting, objektfjerning, bakgrunn, bildemiks | Kompatibel image edit provider | Gjør redigering av inputbilde, bevar original og output i Library |
| F18 | Voice STT/TTS | Snakk og lytt, mikrofon, avspilling, transkripsjon | Open WebUI audio + Android permission | Fullfør norsk lydforespørsel i Chrome og Android |
| F19 | Realtime Voice | Avbrytbar, lavlatens toveis samtale (best effort) | Valgfri voice API-adapter | Avbrudd i avspilling og fortsatt samtale, målt latens og fallback |
| F20 | Plugins/Connectors | MCP/OpenAPI, scopes, consent, auth, remove access | Open WebUI tools + policy | Koble testplugin, gi avgrenset tilgang, trekk tilbake, verifiser avslag |
| F21 | Automations/Tasks | Påminnelser, gjentakende jobber, historie, pauser, varsler | Open WebUI Automations/Calendar, mobilnotif-adapter | Kjører planlagt oppgave i korrekt tidssone, varsel etter betingelse |
| F22 | Personalization | Preferanser, instruksjoner, språk/utseende, prosjektprofiler | Open WebUI + client settings | Endre stil, ny chat bruker riktig setting, synkes til Android |
| F23 | Settings/Account | Modellvalg, privatliv, provider/nøkler, tilgang, backup | Open WebUI + egen settings | Bruker får ikke adminfunksjoner, token forblir serverside |
| F24 | YouTube Summary | Oppsummer lenke med captions/transkripsjon, tidsstempler når mulig | YouTube metadata/transcript tool, STT fallback | Tekstbasert sammendrag uten hallusinerte tidsstempler |
| F25 | Intelligent UI | Inline graf, kalkulator, form, quiz, tabell, kart og interaksjon | OpenUI-renderer med whitelisted components | Juster slider på Android, se reaktiv resultatoppdatering etter refresh |
| F26 | Images & Files Editing | Rediger genererte dokumenter i ny versjon, preview/diff | Artifact versioning | Original bevares, ny versjon kan åpnes og eksporteres |
| F27 | Cross-device Sync | All serverlagret kontekst likt på web og Android | Én API/back-end | Opprett favoritt på telefon, se på PC, test offline begrensninger |
| F28 | App | Egen Android APK/AAB og PWA, deep links, share, kamera, mic, filvalg | TWA + native integration when necessary | Installer APK og kjør ALLE F01–F27 i app uten eksternt browserhopp for basisfunksjoner |
| F29 | Updates | Automatisk overvåkning/PR, staging, migrering/rollback | Renovate/Dependabot + GitHub Actions | Simulert breaking API-endring stoppes; restore tilbake til gammel versjon |
| F30 | Backup | Kryptert ekstern backup, restore, eksport, retention | Restic + SQLite-consistent snapshot | Full restore til tom mappe/host gjenoppretter filer/chatter/Library |
| F31 | Security | Beskyttet auth, isolerte verktøy, SSRF/Prompt injection controls | Policy/permissions | Bevis at verktøy ikke leser NAS-root og ikke kan hente localhost admin tokens |
| F32 | Cost / Resource | Mål RAM/CPU/GPU/strøm, brukskvoter og modellkostnad | Observability-lite | Vis nøyaktig målt idle RAM og begrenset browser/terminal samtidig |
| F33 | GitHub/public release | Ren installasjon, dokumentasjon, lisens, releases, Android build | Repo + CI + release workflow | Installer på ny host, last ned signed APK, verifiser ingen secrets i artifact |

## Brukerflyter som skal verifiseres ende-til-ende

**U1: Filgenerering**: Fra Android: «Lag budsjett i Excel og en PDF-oppsummering» → Work job → verifiserbare XLSX/PDF → inline nedlastning → begge filer i Library → velg XLSX i ny desktop-chat.

**U2: Bildegenerering**: På Android: last opp bilde → «endre bakgrunn» → skill input/output → last ned resultat → bilde synlig i Images-fanen på desktop.

**U3: Intelligent UI**: Spør «lag en sparekalkulator» → slider, graf og resultat i chat → interaksjon uten ekstra API-call ved lokal beregning → bevaring av state på refresh/Android.

**U4: Research/YouTube**: Lim inn video-URL → captions-tekst → sammendrag med tidsstempler hvis dokumenterbart → referanse i prosjekt → eksport som DOCX.

**U5: Oppdatering**: Siste testede Open WebUI-versjon er X; Renovate foreslår Y → testdata-kopi og kjøre API-kontrakter → oppdage en breaking change → produksjon forblir X → patch adapter og grønn test → oppgrader med backup.

**U6: Innlogget mobil**: Android TWA via HTTPS kontrollert domene → session → kamera/mikrofon/filepicker → Library, Memory, Notes, Tasks, Work, Bilder, Settings → ingen funksjon savnes vs web.

**U7: Sikkerhet**: Agent spør om å sende e-post/slette filer eller kjøre kommando på host → godkjenningspanel → nektet handling gjør ingen endring; tilgjengelige resurser er bare sandbox.

**U8: Recovery**: Slett staging-databasen, restore siste backup → chat + fil + generert bilde + OpenUI interaktivt state gjenopprettet.

## Målekrav

Performance og målbare krav er *mål*, ikke nåværende påstander: Start basisinstallasjon uten GPU; UI skal være responsivt på mellomklasse Android; maks 1 aktiv browser-agent og 1 aktiv bildejobb i standardprofil; ressursnivå og API-kostnad rapporteres etter faktisk test. Sett målverdier i ADR etter første måling, ikke oppfinn tall før profiling.
