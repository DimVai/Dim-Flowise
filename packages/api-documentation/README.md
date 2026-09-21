# Flowise API reference viewer

This package serves the bundled API reference for the community fork. First install and build the monorepo and start the application using the root [Quick start](../../README.md#quick-start).

In a separate terminal, start the reference viewer from the repository root:

```sh
pnpm --filter flowise-api start
```

The viewer is served at [http://localhost:6655/api-docs](http://localhost:6655/api-docs).

## Authentication and scope

Use the fork's [authentication reference](../../CONFIGURATION.md#authentication) for the current login and API-key model. Browser authentication uses a cookie; external API clients use API keys on routes that support them.

The bundled API definitions are inherited from upstream and are not a complete specification of this fork's custom authentication. The available routes are those registered by the community server; commercial routes removed by this fork are not available. See [Differences from upstream](../../README.md#differences-from-upstream).

## License

[Apache License, Version 2.0](../../LICENSE.md). Based on the [original Flowise project](https://github.com/flowiseai/flowise).
