# Draft Repo Memory

This repository follows the secure Zoolanding draft release workflow.

- Run `git pull --ff-only` before work when the worktree is clean.
- For multi-repo work, also pull the hub repo and every affected `draft-*` repo when clean.
- If the worktree is dirty, report it before pulling or changing files.
- Work on `dev`, promote with PR `dev -> test`, then PR `test -> main`.
- `dev` does not deploy.
- `test` deploys the test draft only after merge to `test`.
- `main` deploys production only after merge to `main`.
- Native GitHub branch protection should protect `test` and `main` when the account plan supports it. If GitHub blocks protection for private repos, the deploy workflow still rejects push-triggered deploys unless the commit is a merge from the expected source branch, but GitHub cannot block the push itself.
- Treat this repository as public unless verified otherwise. Before making it public, before PR, and before merge, run the hub repo public-safety audit and resolve every blocking finding.
- Do not commit secrets, tokens, API keys, signed URLs, `.env*`, local logs, PDFs/CVs, private keys, certificates, local databases, credential JSON, local agent state, `ai_notes/`, `findings/`, or `errors-reports/`.
- Public contact details in draft content are allowed only when they are intentionally client-facing; personal source files, CVs, private photos, identity documents, and raw research stay local-only.
- Deployment uses GitHub OIDC to assume AWS IAM roles split by repo and environment; do not add long-lived AWS access keys.

## 2026-07-04 03:37 CT

- Visible public brand is `Astra Legal`. The canonical draft/domain is `grupoastralegal.com` because `astralegal.com` is unavailable; do not use `grupoastralegal.com` as the visible brand name.
- The public site is expected to support Spanish, English, and Chinese. Keep header, footer, service pages, contact, legal pages, and SEO metadata localized in those three languages.
- Public images must be hosted through the Zoolanding S3 asset flow. The currently used portrait asset is `https://assets.zoolandingpage.com.mx/grupoastralegal.com/shared/images/jose-luis-portrait.jpg`. As of 2026-07-04 05:53 CT, use the recreated Astra Legal PNG logo at `https://assets.zoolandingpage.com.mx/grupoastralegal.com/shared/logos/astra-legal-logo.png`; the SVG source is also uploaded at `https://assets.zoolandingpage.com.mx/grupoastralegal.com/shared/logos/astra-legal-logo.svg`.
- The GitHub repository and local origin are `https://github.com/LynxPardelle/draft-grupoastralegal-com.git`.

## 2026-07-04 04:59 CT

- Do not render a separate visible Astra Legal wordmark beside or below the logo while the logo already includes the brand name. Revisit header brand composition only if the final logo becomes icon-only.
- Footer contact controls should avoid showing the raw email address or phone number as visible text. Keep the `mailto:` and `tel:` destinations active, render the phone as an icon-only control, and render email as a neutral localized label such as `Correo` or `Email`.
- The contact page may show explicit phone/email context because it is the intentional contact route, but each contact channel should also have a clear CTA link.

## 2026-07-04 05:39 CT

- The Services dropdown should stay grouped by service family on desktop: business/Mexico entry, authority-tax-defense, intellectual property, assets/labor, and government/public projects. Group headers are disabled menu items, not navigation targets.
- Astra Legal service pages should keep a compact trust section near the first viewport and a service-specific module after the main detail grid. This avoids making every service page feel like the same template.

## 2026-07-04 05:53 CT

- The old AstraLex logo is superseded by the recreated Astra Legal transparent logo. Keep the PNG as the runtime logo for stable typography; keep the SVG as the editable source.

## 2026-06-16 22:12 CT

- Confirmed by Alec: WhatsApp `+52 1 33 1993 7983` is intentionally client-facing and can be used as the primary CTA for Astra Legal draft content.
