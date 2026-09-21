# Flowise execution worker

In queue mode, the main process sends execution jobs through Redis, and workers process those jobs and report completion. This execution model is inherited from Flowise.

## Status in this fork

The worker Docker and Compose files have not been adapted and verified for this community fork. The local `docker-compose.yml` uses the upstream `flowiseai/flowise-worker:latest` image, which does not include this fork's changes.

The parent [Docker guide](../README.md) distinguishes upstream images from source builds. Use the root [README](../../README.md) and [configuration reference](../../CONFIGURATION.md) for the current application setup.

## Source worker entry point

The repository defines `pnpm start-worker` for a source-built worker. A queue deployment must coordinate Redis settings, queue names, database access, encryption keys, and shared storage between the main process and workers. Configure `WORKER_PORT` as appropriate for worker health checks.

This overview does not confirm a working queue deployment or Railway serverless behavior.
