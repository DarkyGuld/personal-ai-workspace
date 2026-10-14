# Upstream Oppdateringer og garantert gjenoppretting

## Realistisk garanti

Systemet kan ikke **garantere** at alle utestede nye upstream-versjoner er kompatible. Det vi kan garantere gjennom testet design er: produksjon blir ikke oppgradert ved kjente kontraktbrudd, data er sikret før migrering, og det finnes en kontrollert vei tilbake til sist fungerende snapshot. Automatisk oppdatering betyr **automatisk oppdagelse, PR, testing og valgfri godkjent deploy**, ikke blind auto-update.

## Kontroller

- Alle produksjonsimages låses til tag + digest, alle kodeavhengigheter låses.
- `versions.lock` beskriver Open WebUI, OpenUI, terminal, browser-worker, frontend, Android wrapper og adapter-kompatibilitet.
- Renovate/Dependabot oppretter separate PR-er ved nye versjoner.
- CI kjører typecheck, unit, integrasjon, kontrakter, frontend- og mobile-UI-tester og sikkerhetsskanning.
- Staging lages med anonymiserte eller syntetiske data og separat lagring. Bruk bare reelle brukerdata dersom eksplisitt autorisert og sikkert isolert.
- Før oppgraderingen tas konsistent backup, inkludert Open WebUI databasen og eventuell WAL, vår metadata-DB, Library, konfig og skjemaversjon.
- Migrering kjøres på kopi først. En eldre Docker-image alene regnes IKKE som rollback hvis database er migrert.
- Versjoner som ikke kan nedgraderes håndteres med restore av gammel DB + filer + image, og dokumentert datavindu.
- E2E-smoke: login, chat, streaming, upload, Memory, imagegen/edit, generer PDF+XLSX, Library, Intelligent UI, automasjon, Android UI, backup.
- Ved feil slås kun relevant feature flag av der dette er trygt; aldri skjul systematiske dataproblemer.
- Ved sikkerhetsoppdatering med høy prioritet: rask CI + manuelt kontrollert produksjonsdeploy; ingen omgåelse av backup.

## GitHub Actions (mål)

`ci.yml`: PR -> lint/typecheck/unit/API-contract/e2e/licenses/secrets/SBOM/build.

`upstream-check.yml`: schedule -> les GitHub release feeds -> oppdater versions.lock i PR -> dokumenter breaking changes -> kjør staging.

`release.yml`: versjonstag -> build, sign/attestér ved konfigurert nøkkel, checksums, docker image, changelog/release notes.

`android.yml`: låst Bubblewrap/Android toolchain -> verify asset links & web parity -> debug APK i PR, signert release APK/AAB fra encrypted secrets bare ved maintainer godkjenning.

## Operasjonelt grensesnitt

```text
./manage.sh status
./manage.sh doctor
./manage.sh backup --verify
./manage.sh check-updates
./manage.sh upgrade --dry-run
./manage.sh upgrade --approve
./manage.sh restore --snapshot <id>
./manage.sh diagnostics --redact
```

**NB:** Dette er kommandokontrakten som kodeagenten skal implementere og teste; kommandoene finnes ikke før implementasjonen er bygget.

## Open WebUI kompatibilitet

Alt mot eksperimentelle/upubliserte API-er skal ligge i ett adapterlag med contract fixtures og versionsmatrise. Stabilt server-side tool calling/OpenAPI/MCP brukes der de dekker funksjonaliteten. Det er ikke akseptabelt å endre Open WebUI SQL direkte, parse HTML for skjulte API-er, eller lage runtime monkeypatch av frontend uten å registrere det som teknisk gjeld og krevende unntak.

## Backup og restore-prosedyre

1. Lås ned nye jobber og skrivende requests.
2. Sikre konsistente DB snapshots (online backup API eller kontrollert stopp).
3. Ta kryptert backup av alle relevante filer og metadata + gjeldende version lock.
4. Kjør en restore-test i separat mappe og verifiser checksums.
5. Test migreringen der, og kjør contract/E2E.
6. Ved grønt og godkjenning, oppgrader produktet.
7. Ved alvorlig feil, vedlikeholdsmodus og restore av gammel konsistent snapshot + gammel digest; kjør funksjonstester før åpning.
