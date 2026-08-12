# Pending local worktree reconciliation

Date: 2026-08-12 (Central Time)

Status: remote feature content is complete; local checkout maintenance remains pending.

## Verified state

- At the start of this audit, the canonical local worktree at `Z:\GitHub\zoolandingpage\drafts\grupoastralegal.com` was on local `dev` commit `ad535255c83f661be7384da002c4226e3c317883` and, after fetch, was 0 commits ahead and 39 commits behind `origin/dev` at `e3e4ce29216ef2533920e5a5ebbec4d1202c0be6`. This maintenance commit advances remote `dev` one additional commit, so the local branch will be 40 commits behind until reconciled.
- Its meaningful diff is limited to these five paths:
  - `recuperacion-impuestos-inmobiliarios/components.json`
  - `recuperacion-impuestos-inmobiliarios/i18n/en.json`
  - `recuperacion-impuestos-inmobiliarios/i18n/es.json`
  - `recuperacion-impuestos-inmobiliarios/i18n/zh.json`
  - `recuperacion-impuestos-inmobiliarios/page-config.json`
- Before this maintenance commit, the first four working-tree blobs exactly matched the then-current `origin/dev`. The `page-config.json` content also matched except for one additional blank line at EOF; `git diff --check` identified only that blank line.
- The intended feature content was committed as `09234cb043b10f1e15bcadbc251e8b56ccd78cb0` (`feat: implement Recupera ISAI QA`) and is already integrated into `origin/dev`. No duplicate feature merge or cherry-pick is needed.
- The repository contract test exposed that the feature commit had reintroduced `detailTrust` and `detailServiceModule` into the public root despite QA-008/010, and that QA-002 still required superseded exact copy. This maintenance commit removes only those two root references and updates QA-002 to verify the newer qualified claims without reverting QA-015/016 content.
- The initial dirty local package passed validation for 147 deployable JSON files; the current remote-based branch passes for its 140 deployable JSON files. The affected page has valid JSON, unique component IDs, complete component references, matching `en`/`es`/`zh` dictionary shapes, 40 resolved i18n references, valid `/recuperacion-impuestos-inmobiliarios` routing/canonical metadata, supported calculator interaction instructions, and a passing QA contract suite.
- The public-safety audit found no blocked paths and no current or historical secret findings.
- Local browser QA passed all 19 routes in desktop and mobile viewports. On the affected route, the calculator returned the correct Los Cabos range for a $5,000,000 input, the removed QA-008/010 sections were absent, horizontal overflow was zero, and no browser errors occurred.

## Preservation and safe remediation

Do not pull, merge, reset, restore, or bulk-stage the dirty local worktree until its five-path patch has been backed up and rechecked. To reconcile it later:

1. Fetch `origin` and confirm the commit IDs and 0-ahead/39-behind relationship above.
2. Save a binary patch of the five explicit paths outside the repository and verify that the backup is readable.
3. Re-run `git diff --ignore-space-at-eol` and blob-hash comparisons against the pre-maintenance commit `e3e4ce29216ef2533920e5a5ebbec4d1202c0be6`. Proceed only if the first four files still match exactly and the fifth still differs only by the extra blank line.
4. With explicit human approval, restore only those five paths to the old local `HEAD`; then fast-forward local `dev` to current `origin/dev` with `git merge --ff-only origin/dev`. The remote history will reintroduce the intended feature content plus the QA-008/010 repair without duplication. Keep the external patch until final validation passes.
5. Run `node --test tests/qa-contract.test.mjs` and `node tools/deploy-draft.mjs --domain=grupoastralegal.com --environment=test --draft-root=<worktree> --validate-only=true` from a current clean checkout.

## Line-ending policy follow-up

The machine-level Git configuration has `core.autocrlf=true`, while this repository has no `.gitattributes`. This combination previously made about 143 otherwise unchanged paths appear modified until Git refreshed the index. No line-ending policy or mass renormalization is included with this content reconciliation.

If the repository owners want deterministic cross-platform endings, handle that separately on a clean maintenance branch: add a reviewed `.gitattributes` policy such as `* text=auto`, with explicit `eol=lf` rules for JSON, Markdown, JavaScript modules, and YAML; renormalize only an explicit reviewed path list; inspect the entire resulting diff; and commit the normalization independently. Do not mix that change with draft content.
