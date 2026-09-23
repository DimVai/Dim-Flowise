# Dim-Flowise

Build AI agents and workflows visually, using the community core of Flowise.

## About this fork

This is an independent personal fork of the original [Flowise project](https://github.com/flowiseai/flowise), maintained for the owner's own installations. It preserves the community core, removes the commercial stack, and adds the changes described below.

Flowise has been an exceptionally useful project: it made building AI workflows, connecting models and tools, and experimenting with agents accessible through a practical visual interface. This fork exists because of the substantial work of the Flowise team and its contributors. Their contribution remains the foundation of this project, and deserves clear recognition and thanks.

The upstream baseline is **`flowise@3.1.4`**, commit [`a65f81bb43ef66d3ce734bf0dff4223ae8041c95`](https://github.com/flowiseai/flowise/commit/a65f81bb43ef66d3ce734bf0dff4223ae8041c95). This fork is maintained independently of FlowiseAI and is not an official Flowise release.

## Differences from upstream

### Major differences

These are the primary changes this fork introduces.

| Change                              | What it means                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upstream sunset banner removed      | The application no longer displays the upstream Flowise sunset announcement or its link.                                                                                                                                                                                                                                                                                                                                                                |
| Dynamic chat models                 | OpenAI, Anthropic, and Google Gemini chat model lists are kept up to date by asynchronously refreshing them from Models.dev at startup. Other integrations retain their base lists. Set `DISABLE_DYNAMIC_MODELS=true` to disable the refresh. See [Model catalog](CONFIGURATION.md#model-catalog) for configuration, filtering, and compatibility details.                                                                                              |
| Deprecating nodes hidden            | Chatflow node choices marked `DEPRECATING` are hidden by default while existing flows remain usable. Set `SHOW_DEPRECATING_NODES=true` to show them again. See [Chatflow node visibility](CONFIGURATION.md#chatflow-node-visibility).                                                                                                                                                                                                                   |
| Direct Custom Assistants navigation | The sidebar Assistants link opens `/assistants/custom` directly, bypassing the intermediate `/assistants` page. The original `/assistants` page remains accessible by URL for compatibility.                                                                                                                                                                                                                                                            |
| Commercial stack removed            | Code covered by the FlowiseAI Commercial License and the features that depend on it have been removed. The fork retains the community code available under the **Apache License, Version 2.0**. <br> Removed features include login activity, commercial logs, datasets, evaluators, and evaluations, along with their UI and server routes. Community flows, agents, integrations, execution views, and ordinary application logging remain available. |
| Single-user authentication          | As a result of the removal above, an independent single-user authentication mechanism replaces the commercial identity stack. Sign in as the installation owner with the username and password configured through environment variables. There is no account registration, organization setup, or commercial identity service.                                                                                                                          |

### Minor or technical differences

These changes arose from implementing the major differences above. They adapt the data model, configuration, and access controls to support those goals; they were not independent objectives of the fork.

| Change                                     | What it means                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single workspace                           | Community data uses one fixed workspace. Organizations, multiple workspaces, user/role administration, SSO, MFA, and the enterprise RBAC model are not available. Existing workspace-scoped records are normalized to workspace `"0"` by the community migrations. Back up an existing database before first starting this fork against it: the conversion consolidates workspace data and does not preserve tenant separation. See [Persistence](CONFIGURATION.md#persistence). |
| Configurable authentication lifetime       | A signed token is stored in an `HttpOnly` cookie. `FLOWISE_JWΤ_DURATION` controls the token and cookie lifetime, with a default of `24h`.                                                                                                                                                                                                                                                                                                                                        |
| Account settings page                      | The `/account` page remains available in the main layout and explains that the owner's sign-in details are configured through environment variables. The commercial profile, billing, and subscription controls are not used.                                                                                                                                                                                                                                                    |
| Explicit proxy trust                       | Proxy trust defaults to `false` locally and one proxy hop when Railway provides `RAILWAY_ENVIRONMENT_ID`. Overrides can disable proxy trust or specify trusted hop counts or addresses; unrestricted `TRUST_PROXY=true` is rejected.                                                                                                                                                                                                                                             |
| Independent API-key permission enforcement | A community implementation replaces the removed commercial permission checks, preserving per-key restrictions on management API requests. See [API keys and permissions](CONFIGURATION.md#api-keys-and-permissions) for details, including keys used only to protect flow execution.                                                                                                                                                                                             |

### Bug fixes

These fixes correct unintended behavior inherited from the upstream baseline.

| Fix                         | What it means                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Prediction API error status | Non-streaming prediction requests with missing or invalid flow API keys correctly return HTTP 401 instead of HTTP 500. |

See [Configuration](CONFIGURATION.md) for detailed settings and [Changelog](CHANGELOG.md) for the history of this fork's changes.

## Quick start

In About, the Dim-Flowise Latest Version column links to the GitHub repository. No remote fork version or publication date is fetched.

Use a checkout of **[DimVai/Dim-Flowise](https://github.com/DimVai/Dim-Flowise)**. The upstream npm package `flowise`, upstream container images, and upstream deployment templates do not include this fork's changes.

### Requirements

-   Node.js **24.x**, as declared in the root `package.json`.
-   Corepack configured to use the project's pinned **pnpm 10.26.0**.

From the repository root, enable the Corepack shims if needed and install dependencies:

```sh
corepack enable
pnpm install --frozen-lockfile
```

### Configure the server

Copy `packages/server/.env.example` to `packages/server/.env` if you do not already have a local configuration.

On macOS/Linux:

```sh
cp packages/server/.env.example packages/server/.env
```

On Windows PowerShell:

```powershell
Copy-Item packages/server/.env.example packages/server/.env
```

In that file, set `FLOWISE_USERNAME`, `FLOWISE_PASSWORD`, and `FLOWISE_SECRET`. These three settings are required; the server refuses to start without them. Follow the [authentication configuration](CONFIGURATION.md#authentication) for an example and secret requirements.

### Build and start

```sh
pnpm build
pnpm start
```

For Railway deployment without a Dockerfile build, the optional Dockerfile is kept at `.github/Dockerfile` so Railpack can detect the root pnpm workspace. The root `packageManager` field pins pnpm 10.26.0. The deployment is done with Railway's automatically detected install, build, and start commands; no custom build or start command is needed.

Open [http://localhost:3000](http://localhost:3000), or the port selected by `PORT`, and sign in using your configured credentials.

If a build runs out of JavaScript heap memory, set `NODE_OPTIONS=--max-old-space-size=4096` in the current shell before running `pnpm build` again:

```sh
# macOS / Linux / Git Bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

```powershell
# Windows PowerShell
$env:NODE_OPTIONS="--max-old-space-size=4096"
```

The root `pnpm start` command serves the existing compiled UI from `packages/ui/build`; it does not rebuild source changes. For changes confined to `packages/ui/src`, stop the server, run `corepack pnpm --filter flowise-ui build` from the repository root, then run `corepack pnpm start`. For changes across packages, use the full `corepack pnpm build` before starting. Stop a foreground server with `Ctrl+C`.

## Development

After installing dependencies, configuring the server, and building the packages, copy `packages/ui/.env.example` to `packages/ui/.env` if needed. The default development UI port is `8080`.

```sh
pnpm dev
```

The development UI proxies `/api` requests to the server host and port configured in `packages/server/.env`. Keep the default same-origin API setup unless you specifically need a separate API origin; this also allows the login cookie to work through the development proxy.

The monorepo contains these packages:

| Package                                                   | Purpose                                                   |
| --------------------------------------------------------- | --------------------------------------------------------- |
| [server](packages/server/README.md)                       | HTTP API, authentication, persistence, and flow execution |
| [ui](packages/ui/README.md)                               | Main React application                                    |
| [components](packages/components/README.md)               | Integration nodes and credential definitions              |
| [api-documentation](packages/api-documentation/README.md) | API reference viewer                                      |
| [agentflow](packages/agentflow/README.md)                 | Embeddable agentflow editor                               |
| [observe](packages/observe/README.md)                     | Embeddable execution viewer                               |

For manual verification, `pnpm test` runs the workspace test tasks. Package guides describe more focused commands. Rebuild after changes to packages whose compiled output is consumed by the server.

## Configuration and documentation

-   [Configuration](CONFIGURATION.md): environment variables, authentication, proxy trust, and persistence.
-   [Changelog](CHANGELOG.md): changes introduced by this fork.
-   [Security note](SECURITY.md): maintenance scope and reporting policy.
-   [Contribution policy](CONTRIBUTING.md): external contributions are not currently accepted.

The [upstream Flowise documentation](https://docs.flowiseai.com/) remains a useful reference for shared community features and integrations. Authentication, commercial features, installation, and deployment can differ; follow this repository's instructions for those areas. Public documentation for this fork is maintained in English.

## Deployment status

A successful Railway deployment without Docker was verified using the default build and start commands. With Railway Serverless enabled, the service slept when idle and started again successfully on a later request. This reports the observed deployment behavior; persistent storage, backups, and the long-term database choice remain to be finalized.

The [Docker documentation](docker/README.md) describes the inherited container files and their current limitations. They are not a verified deployment path for this fork.

## License and attribution

The source code in this fork is provided under the [Apache License, Version 2.0](LICENSE.md). The original FlowiseAI copyright and license text are retained. Third-party dependencies remain subject to their own licenses.

The original project and its contributors can be found at [github.com/flowiseai/flowise](https://github.com/flowiseai/flowise).
