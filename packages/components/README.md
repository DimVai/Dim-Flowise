# Flowise community components

Integration nodes and credential definitions used by this community fork.

Install and build this package as part of the monorepo using the root [Quick start](../../README.md#quick-start). The upstream `flowise-components` npm package does not contain this fork's changes.

## Development

Nodes are under `nodes/`; credential definitions are under `credentials/`. Preserve the [credential field rules](../server/README.md#adding-or-modifying-credential-definitions) when adding or editing a definition.

From the repository root, rebuild this package when its compiled output is needed:

```sh
pnpm --filter flowise-components build
```

For manual tests:

```sh
pnpm --filter flowise-components test
```

Node-specific README files remain alongside their integrations. General server and custom-tool environment settings are documented in [CONFIGURATION.md](../../CONFIGURATION.md).

## License

[Apache License, Version 2.0](../../LICENSE.md). Based on the [original Flowise project](https://github.com/flowiseai/flowise).
