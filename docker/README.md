# Inherited Docker configuration

These container files are inherited from the original Flowise repository. They have not been adapted and verified as a deployment path for this community fork. The intended deployment target is Railway without Docker; see the root [deployment status](../README.md#deployment-status).

For the current source installation instructions, use the root [Quick start](../README.md#quick-start).

## Which files use upstream images?

| File | Source |
| --- | --- |
| `docker-compose.yml` | Upstream `flowiseai/flowise:latest` image |
| `docker-compose-queue-prebuilt.yml` | Upstream main and worker images |
| `worker/docker-compose.yml` | Upstream `flowiseai/flowise-worker:latest` image |
| `docker-compose-queue-source.yml` | Builds the main and worker images from this checkout's Dockerfiles |

Starting an upstream image does not run this fork's community authentication or commercial-code removal.

## Building from this checkout

The source-build files are retained as a starting point. They are not a ready-to-use deployment recipe: review their environment wiring and Dockerfiles before use, including the required authentication settings in [CONFIGURATION.md](../CONFIGURATION.md#authentication). The inherited Docker environment examples can still contain obsolete commercial settings and should not be used as this fork's configuration reference.

The database, integration-credential encryption key, and uploaded files need persistent storage with permissions appropriate for the container user. See [Persistence](../CONFIGURATION.md#persistence).

## Queue mode

Queue mode uses Redis to coordinate the main process and execution workers. See the [worker overview](worker/README.md). Queue operation, container deployment, and serverless compatibility have not been confirmed for this fork.
