# Draft Repo Memory

This repository follows the secure Zoolanding draft release workflow.

- Run `git pull --ff-only` before work when the worktree is clean.
- For multi-repo work, also pull the hub repo and every affected `draft-*` repo when clean.
- If the worktree is dirty, report it before pulling or changing files.
- Work on `dev`, promote with PR `dev -> test`, then PR `test -> main`.
- `dev` does not deploy.
- `test` deploys the test draft only after merge to `test`.
- `main` deploys production only after merge to `main`.
- Do not commit secrets, tokens, API keys, signed URLs, `.env*`, local logs, PDFs/CVs, private keys, local databases, `ai_notes/`, `findings/`, or `errors-reports/`.
- Deployment uses GitHub OIDC to assume AWS IAM roles split by repo and environment; do not add long-lived AWS access keys.
