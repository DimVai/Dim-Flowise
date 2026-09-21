# Configuration

This is the configuration reference for the community fork. Set server variables in the process environment or in `packages/server/.env`. The [server example](packages/server/.env.example) provides a starting point. Restart the relevant process after changing configuration.

Keep actual passwords, tokens, and keys out of Git. The examples below contain placeholders; replace them before starting the application.

## Authentication

| Variable | Required | Default | Meaning |
| --- | --- | --- | --- |
| `FLOWISE_USERNAME` | Yes | None | Username for the single owner account. |
| `FLOWISE_PASSWORD` | Yes | None | Password for that account. |
| `FLOWISE_SECRET` | Yes | None | Authentication-token signing secret; at least 32 characters. Use a randomly generated value. |
| `FLOWISE_JTW_DURATION` | No | `24h` | Lifetime of newly issued tokens and their cookies. Examples: `30m`, `24h`, `3d`. |
| `SECURE_COOKIES` | No | `false` | Set to `true` when the browser accesses the application over HTTPS. Leave unset or `false` for local HTTP. |

Minimal local configuration:

```dotenv
PORT=3000
FLOWISE_USERNAME=owner
FLOWISE_PASSWORD="replace-with-your-own-password"
FLOWISE_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
FLOWISE_JTW_DURATION=24h
```

For example, generate a secret locally with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The application refuses to start if a required value is missing or blank, the signing secret is shorter than 32 characters, or the configured duration is invalid, non-positive, or shorter than one second. **`FLOWISE_JTW_DURATION` is the exact implemented name**, including `JTW`; `FLOWISE_JWT_DURATION` is not an alias.

Login creates a signed token in the `flowise_auth` cookie, with `HttpOnly`, `SameSite=Lax`, and the configured lifetime. Logout clears the browser cookie. There is no commercial identity service, account registration, password-reset email, or refresh-token flow. Login is limited to 10 requests per IP in a 15-minute window.

Changing `FLOWISE_SECRET` invalidates previously signed tokens. Changing only the password does not revoke existing tokens; rotate the signing secret as well when existing sessions need to be invalidated. Changing the duration affects newly issued tokens.

### Authentication and encryption are separate

`FLOWISE_SECRET` signs login tokens. `FLOWISE_SECRETKEY_OVERWRITE` and `SECRETKEY_PATH` concern encryption of stored integration credentials. They have different purposes; changing one does not replace the other.

Community API keys remain separate from browser authentication. External API clients use API keys on routes that allow them; a login token is not a substitute for an API key. **Current limitation:** permissions are still displayed and stored for each key, but the community route permission middleware does not enforce them. Do not rely on a key marked read-only to prevent write or delete operations. Key validity checks, route exclusions, and flow-specific key checks are separate mechanisms. Review and restoration of API-key permission enforcement are pending; the authenticated owner retains full access to the available community features.

## Proxy trust

| Variable | Default | Meaning |
| --- | --- | --- |
| `TRUST_PROXY` | `false` locally; `1` on Railway | Express proxy trust configuration, used when resolving client IPs and forwarded request information. |
| `RAILWAY_ENVIRONMENT_ID` | Provided by Railway | Its presence selects the one-hop default when `TRUST_PROXY` is unset. Do not invent this value in a local configuration. |

Supported overrides are `false`, a non-negative proxy hop count, or trusted Express proxy names, IPs, or subnets. Examples include `loopback`, `linklocal`, `uniquelocal`, and `10.0.0.0/8`.

`TRUST_PROXY=true` is rejected because unrestricted trust lets clients manipulate the forwarded-IP chain used by login rate limiting. Select a hop count or address range that matches the actual deployment. This setting does not automatically enable secure cookies; use `SECURE_COOKIES=true` for HTTPS.

## General server variables

The following reference preserves the general configuration options previously documented in `CONTRIBUTING.md`. A blank default means no value is specified in this table; it does not make the setting required for every deployment. Provider-specific variables apply only when that provider is selected.

| Variable | Description | Type | Default |
| --- | --- | --- | --- |
| PORT | The HTTP port Flowise runs on | Number | 3000 |
| CORS_ALLOW_CREDENTIALS | Enables CORS `Access-Control-Allow-Credentials` when `true` | Boolean | false |
| CORS_ORIGINS | The allowed origins for all cross-origin HTTP calls | String | |
| MCP_CORS_ORIGINS | The allowed origins for MCP endpoint cross-origin calls. If unset, only non-browser (no Origin header) requests are allowed. Set to `*` to allow all origins. | String | |
| IFRAME_ORIGINS | The allowed origins for iframe src embedding | String | |
| FLOWISE_FILE_SIZE_LIMIT | Upload File Size Limit | String | 50mb |
| CUSTOM_MCP_TOOLS_MAX_BYTES | Maximum byte size of the JSON tools payload stored per Custom MCP Server row (after stringify). Rejects oversized payloads returned by remote MCP servers. Set to `0` to disable the check. | Number | 524288 (512 KB) |
| CUSTOM_MCP_AUTHORIZE_TIMEOUT_MS | Maximum time in milliseconds to wait for the MCP server handshake during authorize. Bounds the request so a slow/tarpit upstream cannot tie up the HTTP worker indefinitely. Minimum 1000. | Number | 15000 |
| DEBUG | Print logs from components | Boolean | |
| LOG_PATH | Location where log files are stored | String | `packages/server/logs` |
| LOG_LEVEL | Different levels of logs | Enum String: `error`, `info`, `verbose`, `debug` | `info` |
| LOG_JSON_SPACES | Spaces to beautify JSON logs | | 2 |
| TOOL_FUNCTION_BUILTIN_DEP | NodeJS built-in modules to be used for Custom Tool or Function | String | |
| TOOL_FUNCTION_EXTERNAL_DEP | External modules to be used for Custom Tool or Function | String | |
| ALLOW_BUILTIN_DEP | Allow project dependencies to be used for Custom Tool or Function | Boolean | false |
| DATABASE_TYPE | Type of database to store the flowise data | Enum String: `sqlite`, `mysql`, `mariadb`, `postgres` | `sqlite` |
| DATABASE_PATH | Location where database is saved (When DATABASE_TYPE is sqlite) | String | `your-home-dir/.flowise` |
| DATABASE_HOST | Host URL or IP address (When DATABASE_TYPE is not sqlite) | String | |
| DATABASE_PORT | Database port (When DATABASE_TYPE is not sqlite) | String | |
| DATABASE_USER | Database username (When DATABASE_TYPE is not sqlite) | String | |
| DATABASE_PASSWORD | Database password (When DATABASE_TYPE is not sqlite) | String | |
| DATABASE_NAME | Database name (When DATABASE_TYPE is not sqlite) | String | |
| DATABASE_SSL_KEY_BASE64 | Base64-encoded CA certificate; takes priority over DATABASE_SSL | String | |
| DATABASE_SSL | Enable TLS for an external database | Boolean | false |
| SECRETKEY_PATH | Location where encryption key (used to encrypt/decrypt credentials) is saved | String | `your-home-dir/.flowise` |
| FLOWISE_SECRETKEY_OVERWRITE | Encryption key to be used instead of the key stored in SECRETKEY_PATH | String | |
| MODEL_LIST_CONFIG_JSON | File path to load list of models from your local config file | String | |
| STORAGE_TYPE | Type of storage for uploaded files. default is `local` | Enum String: `s3`, `local`, `gcs` ,`azure` | `local` |
| BLOB_STORAGE_PATH | Local folder path where uploaded files are stored when `STORAGE_TYPE` is `local` | String | `your-home-dir/.flowise/storage` |
| S3_STORAGE_BUCKET_NAME | Bucket name to hold the uploaded files when `STORAGE_TYPE` is `s3` | String | |
| S3_STORAGE_ACCESS_KEY_ID | AWS Access Key | String | |
| S3_STORAGE_SECRET_ACCESS_KEY | AWS Secret Key | String | |
| S3_STORAGE_REGION | Region for S3 bucket | String | |
| S3_ENDPOINT_URL | Custom Endpoint for S3 | String | |
| S3_FORCE_PATH_STYLE | Set this to true to force the request to use path-style addressing | Boolean | false |
| GOOGLE_CLOUD_STORAGE_PROJ_ID | The GCP project id for cloud storage & logging when `STORAGE_TYPE` is `gcs` | String | |
| GOOGLE_CLOUD_STORAGE_CREDENTIAL | The credential key file path when `STORAGE_TYPE` is `gcs` | String | |
| GOOGLE_CLOUD_STORAGE_BUCKET_NAME | Bucket name to hold the uploaded files when `STORAGE_TYPE` is `gcs` | String | |
| GOOGLE_CLOUD_UNIFORM_BUCKET_ACCESS | Enable uniform bucket level access when `STORAGE_TYPE` is `gcs` | Boolean | true |
| AZURE_BLOB_STORAGE_CONNECTION_STRING | Azure Blob Storage connection string when `STORAGE_TYPE` is `azure`. Either this or account name + key is required | String | |
| AZURE_BLOB_STORAGE_ACCOUNT_NAME | Azure storage account name when `STORAGE_TYPE` is `azure`. Required if connection string is not provided | String | |
| AZURE_BLOB_STORAGE_ACCOUNT_KEY | Azure storage account key when `STORAGE_TYPE` is `azure`. Required if connection string is not provided | String | |
| AZURE_BLOB_STORAGE_CONTAINER_NAME | Container name to hold the uploaded files when `STORAGE_TYPE` is `azure` | String | |
| SHOW_COMMUNITY_NODES | Show nodes created by community | Boolean | |
| DISABLED_NODES | Hide nodes from UI (comma separated list of node names) | String | |

Additional database setting: `DATABASE_REJECT_UNAUTHORIZED=true` enables certificate verification when `DATABASE_SSL_KEY_BASE64` is used; the implementation checks explicitly for the string `true`.

`APP_URL` is the application base URL used by server-side features such as scheduled executions, and its origin participates in the login endpoint's CORS allowlist. `CORS_ORIGINS` accepts an explicit comma-separated origin list. When cross-origin cookies are needed, also set `CORS_ALLOW_CREDENTIALS=true`; a wildcard origin does not enable credentialed requests. The login cookie remains `SameSite=Lax`, so using unrelated sites for the UI and API is not the standard supported setup.

The [server example](packages/server/.env.example) also lists advanced settings for secret-key storage, queue workers and Redis, metrics, telemetry, MCP restrictions, document loaders, and schedules. These inherited settings are not all required for a normal local installation. The [upstream documentation](https://docs.flowiseai.com/) can supplement shared feature settings, but this fork's authentication and deployment instructions take precedence.

Commercial license keys, organization invitations, SMTP-based account management, and the old JWT/session settings do not configure this fork's authentication.

## Persistence

For SQLite, `DATABASE_PATH` is the directory containing `database.sqlite`, rather than the filename itself. Its default is `.flowise` under the runtime user's home directory.

Preserve the database, the stored-credential encryption key, and uploaded files together. For local storage, the relevant settings are `DATABASE_PATH`, `SECRETKEY_PATH` (or a securely retained `FLOWISE_SECRETKEY_OVERWRITE`), and `BLOB_STORAGE_PATH`. Database backups alone are not enough to restore encrypted integration credentials if the encryption key is lost.

The community migrations normalize existing workspace-scoped records to workspace `"0"` and remove foreign keys to the removed workspace model. Back up an existing installation before using its database with this fork. This is a conversion to a single workspace, not preservation of tenant separation.

Railway volume paths, backup procedures, and the final choice of production database are not yet finalized. The automatic Railway proxy default is not evidence that deployment, persistence, or serverless sleep/wake behavior has been verified.

## Development UI

Configure the UI through `packages/ui/.env`, starting from the [UI example](packages/ui/.env.example).

| Variable | Default behavior | Meaning |
| --- | --- | --- |
| `VITE_PORT` | `8080` | Development UI port. |
| `VITE_API_BASE_URL` | Same-origin API requests | Optional API origin override. |
| `VITE_UI_BASE_URL` | Application default | Optional UI base URL override. |

In development, Vite reads the server host/port from `packages/server/.env` and proxies `/api` requests to that server. The standard setup lets browser authentication use the same UI origin. Never place `FLOWISE_PASSWORD` or `FLOWISE_SECRET` in a `VITE_*` variable: those variables are exposed to browser code.
