# Maintainer automation

## Pull-request auto-merge

The `Prepare pull request for review` workflow waits for CI, the CLA, and the
issue-assignment guard to pass for the current commit. It then records an
automated checks approval and requests review from the maintainer. That bot
approval confirms only that automation passed; it does not replace human
review.

The `Auto-merge approved pull requests` workflow enables a squash auto-merge
only after a separate approval from a repository member with `write`,
`maintain`, or `admin` permission. It pins the operation to the reviewed head
commit so that a later push cannot be merged under an older approval.

Complete this one-time GitHub configuration:

1. Open **Settings → Actions → General → Workflow permissions**. Keep the
   default permission at **Read repository contents and packages**, and enable
   **Allow GitHub Actions to create and approve pull requests**. Each workflow
   declares its own narrower permissions.
2. Open **Settings → General → Pull Requests** and enable **Allow auto-merge**
   and **Allow squash merging**.
3. Protect `main` with a branch protection rule or ruleset that requires:
   - a pull request before merging;
   - at least one approval;
   - dismissal of stale approvals after new commits;
   - the `Quality checks` and `CLA / signed` status checks.
4. Do not allow required checks or reviews to be bypassed by the automation.

GitHub then holds a maintainer-approved pull request until every required check
passes and squash-merges it automatically. A bot or contributor approval does
not trigger this workflow; only an approval from a maintainer-level account
enables auto-merge.

Review events from forked pull requests receive a read-only token. The
`Record maintainer approval` workflow therefore records the event without
making changes, and `Auto-merge approved pull requests` handles it through a
trusted `workflow_run`. The trusted workflow re-fetches the pull request,
review, reviewer permission, and reviewed commit before it receives scoped
merge permission.

## Weekly production deployment

The Cloudflare Pages project is a Direct Upload project and has no Git provider,
so pushes and pull-request merges do not deploy automatically.

The `Weekly production deployment` workflow checks out the latest `main`,
validates the data, runs unit tests, builds all static pages, and deploys the
result every Sunday at 09:00 Asia/Kolkata. Maintainers can also run it manually
from the Actions tab when an urgent release is required.

Create a scoped Cloudflare API token with **Account → Cloudflare Pages → Edit**,
then add it at **GitHub Settings → Secrets and variables → Actions** as the
repository secret `CLOUDFLARE_API_TOKEN`. Never commit the token.

The token must belong to the Cloudflare account that owns the
`gsoc-organizations` Pages project. The account ID is not secret and is already
configured in the workflow.

If the secret is missing or invalid, the deployment fails without changing the
currently live production site.
