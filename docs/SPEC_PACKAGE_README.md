# Personal AI Workspace — arkitekturpakke for utvikling

Dette er en **byggespesifikasjon og kodeagent-prompt**, ikke et ferdig program eller en kjørbar Docker-installasjon.

Pakken beskriver et oppdaterbart, lett, selvhostet ChatGPT-lignende produkt for Lenovo Legion 5 (Ryzen 5 4600H, 16 GB RAM, RTX 2060 6 GB VRAM), med alle viktige funksjonsområder og samme grensesnitt i PC-nettleser og en egen Android-app.

## Filer

| Fil | Formål |
|---|---|
| `ARCHITECTURE.md` | Full teknisk og funksjonell målarkitektur, sikkerhet, lagring, API, UI og repo-struktur |
| `FEATURE_MATRIX.md` | 33 funksjoner/krav + testbare brukerreiser og akseptansekriterier |
| `IMPLEMENTATION_PLAN.md` | Milepæler 0–8 for faktisk bygging og verifisering |
| `UPDATE_POLICY.md` | Pinned versions, dependency PR, staging, backup, restore og rollback |
| `MASTER_BUILD_PROMPT.md` | Full prompt for koding, tester, Android-app og GitHub-publisering |

## Slik brukes pakken

1. Lag nytt kodeprosjekt eller åpne AI-kodeagent med Git-/terminaltilgang.
2. Legg ved `ARCHITECTURE.md`, `FEATURE_MATRIX.md`, `IMPLEMENTATION_PLAN.md`, `UPDATE_POLICY.md`.
3. Kopier hele teksten fra `PROMPT START` til `PROMPT SLUTT` i `MASTER_BUILD_PROMPT.md`.
4. La agenten implementere milepæl 0 og 1 først, kjøre tester og commite kode. Følg status i `PROGRESS.md`/`NEXT_STEPS.md`.
5. Når du er fornøyd, gi godkjenning for GitHub repo/opplasting. Ingen kommando eller prompt kan gi tilgang uten nødvendig konto og tillatelse.

## Viktig

- En full ChatGPT-klone med Work, Voice, Image Editing, Deep Research og generativ UI er et betydelig utviklingsprosjekt selv om mye funksjonalitet finnes i Open WebUI.
- Open WebUI sitt API kan endres. Oppdateringssystemet kan forhindre utestet deploy og legge til rette for rollback, men **kan ikke love null feil for alle fremtidige GitHub-releaser**.
- Upstream-lisenser er viktige, spesielt Open WebUI-branding og Conduit GPL hvis den brukes.
- Android PWA virker uten signert APK; verifisert TWA krever kontroll over HTTPS-domene og korrekt Android Digital Asset Links.
- Bildegenerering, spesielt moderne bildegenerering lokalt, krever kompatible modeller og kan koste penger via API. RTX 2060 har 6 GB VRAM.
- Denne pakken inkluderer ikke ferdig kjørbar kode; det er kodeagentens oppgave å implementere og teste.
