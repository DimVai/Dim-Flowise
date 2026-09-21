# Flowise community server

The backend for this community fork: HTTP APIs, authentication, database access, and flow execution. Start with the root [Quick start](../../README.md#quick-start) to install and run this repository's source.

## Configuration

Use [CONFIGURATION.md](../../CONFIGURATION.md) and the local [.env.example](.env.example). The required login settings are documented there; upstream account setup and commercial identity instructions do not apply.

The server uses a fixed single-user/single-workspace context. External API keys remain distinct from browser login and enforce their selected management permissions. Empty permissions grant no management access; flow execution has separate key checks. See [API keys and permissions](../../CONFIGURATION.md#api-keys-and-permissions) for the access rules and existing-key behavior.

## Development and manual tests

The [root development guide](../../README.md#development) explains the full application setup. To run server tests manually from the repository root:

```sh
pnpm --filter "./packages/server" test
```

The path filter is intentional: the root and server packages share the name `flowise`. Unit tests are co-located with their source files as `*.test.ts`. Authentication and single-workspace tests are under `src/community-auth/`.

## Adding or modifying credential definitions

Credential definitions live in `packages/components/credentials/`. Each input field has a `type` that controls both UI rendering and how the value is handled on the server.

**Security rule: any field that contains a secret must use `type: 'url'` or `type: 'password'` — never `type: 'string'`.**

The server redacts both `url` and `password` fields before returning credential data to the client. Fields typed `string` are returned in plaintext, rather than being treated as secret fields by the credentials API.

Use `type: 'url'` for connection strings with embedded credentials:

-   Connection URLs that embed a username/password (e.g. `mongodb+srv://user:pass@host/db`, `redis://:pass@host`, `postgresql://user:pass@host/db`)
-   Displayed with the password portion masked (e.g. `mongodb+srv://user:••••••@host/db`); the edit UI can reveal the full URL

Use `type: 'password'` for opaque secrets with no meaningful preview:

-   API keys, access keys, secret keys, tokens
-   JSON blobs containing private keys or certificates (e.g. Google service account JSON)
-   Fully redacted in the UI; users must replace the entire value to update them

Fields that are safe as `type: 'string'`:

-   Usernames / account names (when the password is a separate field)
-   Region, host, port, database name, project ID
-   Non-secret identifiers and configuration values

If in doubt, use `type: 'password'`. The only cost is that the field must be re-entered on edit; the cost of using `type: 'string'` for a secret is that it is exposed via the API.


## API reference

See the [API documentation package](../api-documentation/README.md). General node and flow concepts are also covered in the [upstream Flowise docs](https://docs.flowiseai.com/); follow this fork's local documentation for authentication and deployment.

## License

[Apache License, Version 2.0](../../LICENSE.md). Based on the [original Flowise project](https://github.com/flowiseai/flowise).
