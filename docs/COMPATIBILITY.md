# Upstream Compatibility & API Contracts Matrix

This matrix tracks the compatibility between Personal AI Workspace components and verified upstream versions.
All contract test suites in `tests/contract/` validate against these specific endpoints and data contracts.

**Current Target Release:** `v0.12.0` (Date: 2026-10-10)

---

## 1. Open WebUI Endpoint Contracts

| Path | Method | Upstream Status | PAW Adapter Strategy | Contract Test |
|---|---|---|---|---|
| `/health` | GET | Stable | Direct passthrough / Healthcheck | `test_health_contract` |
| `/api/v1/auths/signin` | POST | Stable | Session exchange & cookie generation | `test_auth_signin_contract` |
| `/api/v1/auths/signup` | POST | Stable | Controlled user registration | `test_auth_signup_contract` |
| `/api/v1/auths/` | GET | Stable | Profile verification | `test_auth_profile_contract` |
| `/api/models` | GET | Stable | Model discovery & capability mapping | `test_models_contract` |
| `/api/chat/completions` | POST | Stable | OpenAI-compatible SSE stream & tool calling | `test_chat_stream_contract` |
| `/api/v1/chats/` | GET | Stable | Chat history listing | `test_chat_list_contract` |
| `/api/v1/chats/new` | POST | Stable | Conversation creation | `test_chat_create_contract` |
| `/api/v1/chats/{id}` | GET | Stable | Conversation retrieval | `test_chat_get_contract` |
| `/api/v1/files/` | POST | Stable | Upstream file ingest & parsing | `test_files_upload_contract` |
| `/api/v1/files/{id}` | GET | Stable | File metadata lookup | `test_files_metadata_contract` |
| `/api/v1/files/{id}/content` | GET | Stable | Raw file streaming | `test_files_download_contract` |
| `/api/v1/memories/` | GET | Stable | Memory retrieval & listing | `test_memories_list_contract` |
| `/api/v1/memories/add` | POST | Stable | Memory creation | `test_memories_add_contract` |
| `/api/v1/memories/{id}` | DELETE | Stable | Memory removal | `test_memories_delete_contract` |
| `/api/v1/notes/` | GET | Stable | Notes listing | `test_notes_list_contract` |
| `/api/v1/notes/create` | POST | Stable | Note creation | `test_notes_create_contract` |
| `/api/v1/automations/list` | GET | Semi-stable | Automation scheduling inspection | `test_automations_list_contract` |
| `/api/v1/automations/create` | POST | Semi-stable | Scheduled automation registration | `test_automations_create_contract` |
| `/api/v1/images/generations` | POST | Stable | Image generation dispatch | `test_images_generate_contract` |
| `/api/v1/images/edit` | POST | Semi-stable | Image edit / inpainting dispatch | `test_images_edit_contract` |
| `/api/v1/retrieval/process/youtube` | POST | Semi-stable | Upstream YouTube ingestion | `test_retrieval_youtube_contract` |

---

## 2. Breaking Change Handling & Rollback Protocol

When Dependabot or Renovate proposes an Open WebUI version bump:
1. CI spins up the proposed Docker image against `tests/contract/`.
2. If any contract test fails or endpoint schema changes:
   - The PR is flagged as breaking.
   - Production remains on the existing locked version (`v0.12.0`).
   - An adapter patch is created in `packages/openwebui-adapter/`.
3. If an upgraded database schema cannot be downgraded by image reversal alone:
   - `./manage.sh upgrade` automatically creates a point-in-time snapshot before running migrations.
   - Rollback executes `./manage.sh restore --snapshot <id>` to guarantee both database state and file storage are restored in lockstep.
