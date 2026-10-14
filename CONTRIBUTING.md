# Contributing to Personal AI Workspace

We welcome contributions to Personal AI Workspace! Please review these guidelines before submitting pull requests.

## Development Principles

1. **Upstream First**: Do not fork or modify upstream code (`open-webui`, `open-terminal`, `openui`) in place. Extend functionality via versioned adapters in `packages/openwebui-adapter` or server-side tools.
2. **Parity**: Any user-facing feature implemented on Desktop Web MUST also work seamlessly on Android (PWA / TWA).
3. **No Unverified Claims**: A feature cannot be marked as `verified` in `docs/FEATURE_MATRIX.md` without automated tests and verified execution evidence.
4. **Security & Privacy**: Never commit secrets, credentials, or personal telemetry. Verify test fixtures do not contain private tokens.

## Pull Request Process

1. Fork the repo and create your feature branch: `git checkout -b feat/feature-name`
2. Run test suites locally:
   ```bash
   pytest tests/
   npm test
   ```
3. Ensure linters and typecheckers pass:
   ```bash
   ruff check .
   mypy packages/ apps/
   ```
4. Update `CHANGELOG.md` and `docs/FEATURE_MATRIX.md` if adding or fixing features.
5. Submit the pull request against `main`. All CI checks must pass.
