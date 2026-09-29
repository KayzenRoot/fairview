# FairView development and future deployment

The development foundation requires only a local Git checkout, Git/Node 22+/npm and pinned GEF submodule. On Windows use scripts/local/setup-windows.ps1 in Doctor mode (read-only) or Install mode (initialize pinned submodule and npm ci for GEF only). No Docker, Python, local database, embedding model or additional service must be installed for source development. Never uninstall or change tools belonging to other projects.

Keep the repository PUBLIC only for non-secret development; the source scanner and protected main are mandatory. No .env, .env.example, secrets, wallet keys, real client records or raw protected paid ticks belong in the repository or hosted CI. Actual financial production is a separate PRIVATE, externally managed-secrets and independently audited release.

Future permitted runtime topology will be selected under separate ADR and per-module WOs after actual venue/account/chain/legal entitlements. Do not mistake a credential-free hosted CI job, local Doctor or synthetic replay for real financial hosting approval.
