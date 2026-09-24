# Changelog

This file records changes made by this fork relative to the upstream baseline, `flowise@3.1.4` at commit [`a65f81bb43ef66d3ce734bf0dff4223ae8041c95`](https://github.com/flowiseai/flowise/commit/a65f81bb43ef66d3ce734bf0dff4223ae8041c95). Earlier upstream history remains in Git and the original project's release history.

This fork has its own version numbering, beginning with `1.0`; the current value is stored in `forkVersion` in `packages/server/package.json`. Changes not assigned to a published version are collected under **Unreleased**. Entries describe user-visible behavior, operational impact, and required action; configuration details live in [CONFIGURATION.md](CONFIGURATION.md). Imported fixes should identify the source commit and any adaptations.

## Unreleased

### Changed

-   Choose new basic OpenAI, Anthropic, and Google Gemini chat node defaults from the first catalog model whose ID contains `luna`, `haiku`, and `flash`, respectively. Models.dev lists are ordered by release date; keep manual fallbacks and original Flowise defaults when dynamic models are disabled.
-   Round Models.dev per-token input/output prices to eight decimal places before storing them in the catalog, avoiding floating-point tails in saved JSON.

-   Save accepted Models.dev catalog updates as JSON in `DATABASE_PATH` or `~/.flowise` for the next startup. Keep `MODEL_LIST_CONFIG_JSON` as an explicit higher-priority base; fall back to the saved catalog, then the bundled catalog when loading fails.
-   Wait for the startup model catalog refresh or its fallback before constructing the nodes pool and before the server starts listening, so node defaults can use the updated catalog.
-   Normalize missing or invalid dynamic model prices to zero for compatibility with existing Flowise cost calculations. Route catalog messages through the shared server/worker logger with the `[model-catalog]` prefix and combine provider counts into one startup summary.

-   Use the bundled model catalog instead of fetching the upstream catalog. Preserve `MODEL_LIST_CONFIG_JSON` file/HTTP(S) overrides.
-   Share an in-memory model catalog across model lists, region lists, and cost lookups. Initialization runs once per process; source changes require a process restart.
-   Initialize the bundled catalog at server startup, apply the saved catalog and any configured override, then refresh before the server starts listening.
-   Refresh the basic OpenAI, Anthropic, and Google Gemini chat lists from Models.dev once at server/worker startup, with per-provider fallback and `DISABLE_DYNAMIC_MODELS` opt-out. Filter unsuitable entries and order accepted models by release date without changing saved flows or the source catalog. See [Model catalog](CONFIGURATION.md#model-catalog).

### Fixed

-   Preserve HTTP error statuses from prediction execution, so missing or invalid flow API keys return 401 instead of 500.

-   Add explicit Express handler types to the API-key middleware exports to resolve TypeScript declaration build errors (TS2742).

-   Restore the `/account` page in the main layout with guidance for environment-configured owner credentials.
-   Restore the `/account` page in the main layout with guidance for environment-configured owner credentials.
-   Use the POSIX shell bundled with GitHub Desktop for the pre-push hook and enforce LF line endings.

-   Enforce API-key permissions in community middleware and cover management endpoints that previously lacked checks, including document-store upsert/refresh, messages and history deletion. Read-only management keys cannot use write/delete routes.
-   Check the actual resource category on shared flow routes and filter flow lists before pagination. Prevent delegated API keys from granting permissions they lack or taking over more privileged keys.
-   Restore the owner UI's permission catalog and allow keys with an empty permission list for flow-only use.

### Added

-   Link to the Dim-Flowise GitHub repository from the About dialog's Latest Version column.

-   Display the Dim-Flowise version below the installed Flowise version in About, sourced from `forkVersion` in `packages/server/package.json` (initial value `1.2`). Installed versions remain available if the upstream release lookup fails.

-   Single-user authentication using required `FLOWISE_USERNAME`, `FLOWISE_PASSWORD`, and `FLOWISE_SECRET` environment variables, with a signed `HttpOnly` login cookie and login rate limiting.
-   Configurable token and cookie lifetime through `FLOWISE_JWΤ_DURATION` (default `24h`).
-   Community migrations that normalize workspace-scoped records to workspace `"0"` and remove dependencies on commercial workspace entities.
-   English documentation for this fork, including a configuration reference, explicit contribution policy, and acknowledgment of the original Flowise project.

### Changed

-   Hide `DEPRECATING` chatflow node choices by default with a shared `display-none` CSS utility. Set `SHOW_DEPRECATING_NODES=true` to show them again; existing flows and node execution are preserved.

-   Hide the upstream GitHub star badge in the header while retaining its component.
-   Move the optional root Dockerfile to `.github/Dockerfile` so Railway can select Railpack for pnpm deployments, update the manual ECR workflow to use its new path, and remove the automatic Docker-build and upstream-only proprietary-path workflows.

-   The sidebar Assistants link now opens `/assistants/custom` directly. The original `/assistants` page and its route are preserved.

-   Community operations use a fixed single-user/single-workspace context instead of commercial organization and workspace records.
-   Proxy trust defaults to `false` locally and `1` when Railway provides `RAILWAY_ENVIRONMENT_ID`. `TRUST_PROXY=true` is rejected; explicit proxy hop counts or trusted addresses can be configured.
-   The server error UI no longer prompts users to create an issue in the upstream repository.
-   Installation documentation now uses this repository's source and its pinned pnpm version. Upstream npm packages and deployment templates are not presented as installations of this fork.

### Documentation corrections

-   Record the owner's successful Railway deployment with default build/start commands and observed serverless sleep/wake behavior; persistence and backups remain open.

-   Clarify that `pnpm start` serves the compiled UI and document rebuilding UI-only changes before restarting.

-   Identify the public repository as `DimVai/Dim-Flowise` and clarify that this personal fork does not accept external security or conduct reports.

-   Clarify the README's distinction between the fork's primary objectives and the supporting changes that arose during their implementation.

-   Earlier documentation identified the missing API-key permission enforcement. The runtime restoration is now included under Fixed above.

### Removed

-   The inherited Code of Conduct and its external incident-reporting process. This personal fork does not accept conduct or vulnerability reports.
-   The upstream Flowise sunset announcement banner, including its dismissal state and reserved layout space.

-   The 125 commercial-licensed files under `packages/server/src/enterprise/` and `packages/server/src/IdentityManager.ts`, together with dependent imports, routes, UI entries, license flags, and unused dependencies.
-   Commercial account management, users, roles, organizations, workspaces, SSO, MFA, login activity, logs, datasets, evaluators, and evaluations functionality. Community execution views and ordinary application logging are retained.
-   Obsolete translated documentation and upstream promotional, contribution, and support links that represented this fork as the original project.
-   Obsolete commercial authentication, email, session, and license settings from the public server `.env.example`; required community authentication settings remain documented there.

### Operator action

-   Review existing API keys: their saved permissions now apply, and empty permissions grant no management access. Previously unrestricted integrations may return `403`. See [API keys and permissions](CONFIGURATION.md#api-keys-and-permissions).
-   Feedback/lead listing, OAuth token refresh and key-based flow-definition listing now require their respective permissions. Internal prediction/upsert and direct realtime tool execution require an owner session; external flow execution retains its separate protection.

-   Configure the three required authentication variables before starting the fork; there is no organization/account setup flow. See [Authentication](CONFIGURATION.md#authentication).
-   Back up existing databases before first startup. Community migrations consolidate workspace data into workspace `"0"`; multi-tenant separation is not preserved.
-   Keep the authentication secret separate from the stored-credential encryption key, and preserve the latter along with the database and uploaded files. See [Persistence](CONFIGURATION.md#persistence).
-   Review proxy trust and set `SECURE_COOKIES=true` when serving the application over HTTPS.

The initial documentation update was prepared on 2026-09-21. Railway deployment and serverless sleep/wake behavior were subsequently confirmed by the owner; persistence and backups remain open.
