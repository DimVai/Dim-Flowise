# Flowise community UI

The React frontend for this community fork. Use the root [Quick start](../../README.md#quick-start) to install and build the monorepo; the upstream `flowise-ui` npm package does not install this fork.

## Development

Follow the root [development guide](../../README.md#development). UI environment settings belong in `packages/ui/.env`; see [.env.example](.env.example) and [Development UI configuration](../../CONFIGURATION.md#development-ui).

The default development UI is served at [http://localhost:8080](http://localhost:8080). Its `/api` requests are proxied to the backend configured in `packages/server/.env`.

The login screen uses the single-owner credentials configured on the server. Commercial account, organization, workspace, role, SSO, and evaluation management screens are not part of this fork.

## License

[Apache License, Version 2.0](../../LICENSE.md). Based on the [original Flowise project](https://github.com/flowiseai/flowise).
