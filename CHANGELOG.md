# Changelog

This file records changes made by this fork relative to the upstream baseline, `flowise@3.1.4` at commit [`a65f81bb43ef66d3ce734bf0dff4223ae8041c95`](https://github.com/flowiseai/flowise/commit/a65f81bb43ef66d3ce734bf0dff4223ae8041c95). Earlier upstream history remains in Git and the original project's release history.

Changes are collected under **Unreleased** until this fork adopts its own release versioning. Entries describe user-visible behavior, operational impact, and required action; configuration details live in [CONFIGURATION.md](CONFIGURATION.md). Imported fixes should identify the source commit and any adaptations.

## Unreleased

### Added

- Single-user authentication using required `FLOWISE_USERNAME`, `FLOWISE_PASSWORD`, and `FLOWISE_SECRET` environment variables, with a signed `HttpOnly` login cookie and login rate limiting.
- Configurable token and cookie lifetime through `FLOWISE_JTW_DURATION` (default `24h`).
- Community migrations that normalize workspace-scoped records to workspace `"0"` and remove dependencies on commercial workspace entities.
- English documentation for this fork, including a configuration reference, explicit contribution policy, and acknowledgment of the original Flowise project.

### Changed

- Community operations use a fixed single-user/single-workspace context instead of commercial organization and workspace records.
- Proxy trust defaults to `false` locally and `1` when Railway provides `RAILWAY_ENVIRONMENT_ID`. `TRUST_PROXY=true` is rejected; explicit proxy hop counts or trusted addresses can be configured.
- The server error UI no longer prompts users to create an issue in the upstream repository.
- Installation documentation now uses this repository's source and its pinned pnpm version. Upstream npm packages and deployment templates are not presented as installations of this fork.

### Documentation corrections

- Corrected the claim that API-key permissions are enforced. They remain stored and displayed, but the community route permission middleware currently bypasses these checks. This documents an existing limitation; it does not change runtime behavior. Permission enforcement remains pending.

### Removed

- The 125 commercial-licensed files under `packages/server/src/enterprise/` and `packages/server/src/IdentityManager.ts`, together with dependent imports, routes, UI entries, license flags, and unused dependencies.
- Commercial account management, users, roles, organizations, workspaces, SSO, MFA, login activity, logs, datasets, evaluators, and evaluations functionality. Community execution views and ordinary application logging are retained.
- Obsolete translated documentation and upstream promotional, contribution, and support links that represented this fork as the original project.
- Obsolete commercial authentication, email, session, and license settings from the public server `.env.example`; required community authentication settings remain documented there.

### Operator action

- Configure the three required authentication variables before starting the fork; there is no organization/account setup flow. See [Authentication](CONFIGURATION.md#authentication).
- Back up existing databases before first startup. Community migrations consolidate workspace data into workspace `"0"`; multi-tenant separation is not preserved.
- Keep the authentication secret separate from the stored-credential encryption key, and preserve the latter along with the database and uploaded files. See [Persistence](CONFIGURATION.md#persistence).
- Review proxy trust and set `SECURE_COOKIES=true` when serving the application over HTTPS.

The documentation update was prepared on 2026-09-21. Railway deployment and serverless behavior remain pending; this entry is not a deployment verification report.
