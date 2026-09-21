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
| Commercial stack removed            | Code covered by the FlowiseAI Commercial License and the features that depend on it have been removed. The fork retains the community code available under the **Apache License, Version 2.0**. <br> Removed features include login activity, commercial logs, datasets, evaluators, and evaluations, along with their UI and server routes. Community flows, agents, integrations, execution views, and ordinary application logging remain available. |
| Single-user authentication          | An independent single-user authentication mechanism replaces the commercial identity stack. Sign in as the installation owner with the username and password configured through environment variables. There is no account registration, organization setup, or commercial identity service.                                                                                                                                                            |
| Upstream sunset banner removed      | The application no longer displays the upstream Flowise sunset announcement or its link.                                                                                                                                                                                                                                                                                                                                                                |
| Direct Custom Assistants navigation | The sidebar Assistants link opens `/assistants/custom` directly. The original `/assistants` page remains accessible by URL.                                                                                                                                                                                                                                                                                                                             |

### Minor or technical differences

These changes arose from implementing the major differences above. They adapt the data model, configuration, and access controls to support those goals; they were not independent objectives of the fork.

| Change                               | What it means                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single workspace                     | Community data uses one fixed workspace. Organizations, multiple workspaces, user/role administration, SSO, MFA, and the enterprise RBAC model are not available. Existing workspace-scoped records are normalized to workspace `"0"` by the community migrations. Back up an existing database before first starting this fork against it: the conversion consolidates workspace data and does not preserve tenant separation. See [Persistence](CONFIGURATION.md#persistence). |
| Configurable authentication lifetime | A signed token is stored in an `HttpOnly` cookie. `FLOWISE_JTW_DURATION` controls the token and cookie lifetime, with a default of `24h`.                                                                                                                                                                                                                                                                                                                                        |
| Explicit proxy trust                 | Proxy trust defaults to `false` locally and one proxy hop when Railway provides `RAILWAY_ENVIRONMENT_ID`. Overrides can disable proxy trust or specify trusted hop counts or addresses; unrestricted `TRUST_PROXY=true` is rejected.                                                                                                                                                                                                                                             |
| API-key permissions                  | External management requests enforce the permissions selected for each API key. The authenticated owner retains full access. Keys with no permissions grant no management access but can still authorize execution of flows they protect. See [API keys and permissions](CONFIGURATION.md#api-keys-and-permissions) for existing-key behavior and integration changes.                                                                                                           |

See [Configuration](CONFIGURATION.md) for detailed settings and [Changelog](CHANGELOG.md) for the history of this fork's changes.

## Quick start

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
-   [Security policy](SECURITY.md): scope and reporting status.
-   [Contribution policy](CONTRIBUTING.md): external contributions are not currently accepted.
-   [Code of conduct](CODE_OF_CONDUCT.md).

The [upstream Flowise documentation](https://docs.flowiseai.com/) remains a useful reference for shared community features and integrations. Authentication, commercial features, installation, and deployment can differ; follow this repository's instructions for those areas. Public documentation for this fork is maintained in English.

## Deployment status

The intended deployment target is Railway without Docker. The final build/start configuration, persistent storage, backups, and serverless sleep/wake behavior have not yet been confirmed for this fork.

The [Docker documentation](docker/README.md) describes the inherited container files and their current limitations. They are not a verified deployment path for this fork.

## License and attribution

The source code in this fork is provided under the [Apache License, Version 2.0](LICENSE.md). The original FlowiseAI copyright and license text are retained. Third-party dependencies remain subject to their own licenses.

The original project and its contributors can be found at [github.com/flowiseai/flowise](https://github.com/flowiseai/flowise).
