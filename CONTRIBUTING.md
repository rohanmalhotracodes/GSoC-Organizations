# Contributing to GSoC Organizations

Thank you for helping improve GSoC Organizations. Contributions from first-time
and experienced open-source contributors are welcome.

## Start here

1. Read this guide before opening a pull request.
2. Choose an existing issue and check that nobody else is working on it.
3. Comment `/claim` on the issue. The bot will assign it to you immediately if
   it is available and you have fewer than two active assignments.
4. Keep each pull request focused on one issue.
5. Link the issue in the pull-request description with `Closes #ISSUE_NUMBER`.

Each contributor may hold at most two open issue assignments at once. Finish an
assigned issue or comment `/unclaim` to release it before claiming a third. Do
not work on an issue assigned to someone else.

The claim bot checks activity daily. After seven days without an update from
the assignee, it posts a reminder. After fourteen days without progress, it
automatically unassigns the issue and makes it available again. A meaningful
comment from the assignee or activity on their pull request linked to the issue
resets the inactivity period. Bot comments do not count as progress.

Pull requests opened by someone who is not assigned to the linked issue are
closed automatically. Pull requests without a linked issue are also closed.
Claim the issue first, then reopen the pull request after correcting its
description; the assignment guard will check it again.

For a beginner-friendly contribution, start with the pinned
[repository-link initiative](https://github.com/rohanmalhotracodes/GSoC-Organizations/issues/382).
Each organization has a separate `good first issue` with exact instructions and
acceptance criteria.

If you have **never opened a GitHub pull request before**, follow the
[step-by-step first-PR walkthrough](./docs/first-pull-request.md) to learn how
to fork, clone, create a branch, verify a source, run checks, and open a PR.

## Local setup

GSoC Organizations requires Node.js 20.11 or newer.

```sh
git clone git@github.com:YOUR_USERNAME/GSoC-Organizations.git
cd GSoC-Organizations
npm ci
npm run dev
```

The local website is available at the address printed by Astro, usually
`http://localhost:4321`.

## Finding an organization repository

Repository-link issues are intentionally scoped to one organization so they
can be completed as focused contributions.

### 1. Claim an issue

Open the pinned initiative, expand one of its four batch trackers, and choose an
unassigned organization. Comment `/claim` and wait for the bot's confirmation
before starting work. The bot supports self-assignment and allows no more than
two active issue claims per contributor. If you can no longer work on an issue,
comment `/unclaim` so someone else can contribute.

Keep the issue updated while you work. If research takes longer than expected,
post a short progress comment before the seven-day reminder. Claims are released
after fourteen days without an assignee comment or activity on a linked pull
request.

### 2. Verify the destination

Start from an official GSoC page, ideas page, contribution guide, or organization
website. Follow organization-controlled navigation to the source-code host.

Do not submit:

- a Google-search result;
- an unrelated contributor fork;
- a repository selected only because its name looks similar; or
- an inferred link without evidence from an official source.

Read [the repository curation policy](./docs/repository-curation.md) for the
complete verification rules.

### 3. Add the verified source record

Add the organization's exact name and verified destination to the
`manualRepositories` object in
[`scripts/prepare-data.mjs`](./scripts/prepare-data.mjs). Do not edit
`api/repository-links.json` or `src/data/organizations.json` by itself; both
are generated and will be overwritten by the next build.

```json
"Organization Name": {
  "repositories": [
    {
      "label": "Official repositories",
      "url": "https://github.com/example",
      "host": "GitHub",
      "verified": true,
      "lastChecked": "YYYY-MM-DD"
    }
  ],
  "organizationProfile": "https://github.com/example",
  "source": "manual"
}
```

Supported host values are `GitHub`, `GitLab`, `Codeberg`, `SourceHut`, and
`Self-hosted Git`. Use the actual UTC review date for `lastChecked`. Umbrella
organizations may require multiple repository entries.

Regenerate the derived files after editing the source record:

```sh
npm run prepare:data
```

### 4. Validate the change

```sh
npm run prepare:data
npm run validate
node scripts/validate-repository-links.mjs --network
```

Open every changed link in a browser as well. Some legitimate hosts reject
automated `HEAD` requests; explain any host-specific network-check failure in
the pull request instead of silently ignoring it.

### 5. Open a focused pull request

Include:

- the organization issue number;
- the official page that proves the source-code destination belongs to the
  organization;
- a short description of what changed; and
- the validation commands you ran.

Do not include unrelated formatting, generated-data, or dependency changes.

## Other contributions

For interface, accessibility, data, or documentation changes:

1. Search existing issues before opening a new one.
2. Discuss large behavioral or design changes in an issue first.
3. Match the existing visual system and responsive behavior.
4. Add or update tests when behavior changes.
5. Run the relevant checks before opening a pull request.

Useful commands include:

```sh
npm run format:check
npm run validate
npm test
npm run build
```

Run `npm run test:e2e` when a change affects interactive browser behavior.

## Pull-request checklist

- [ ] The pull request addresses one issue or one clearly defined change.
- [ ] The issue is linked with `Closes #ISSUE_NUMBER` when appropriate.
- [ ] Only relevant files are changed.
- [ ] Data sources and externally supplied links are documented.
- [ ] Formatting, validation, and relevant tests pass.
- [ ] The change works on both desktop and mobile when it affects the interface.
- [ ] No secrets, tokens, private information, or unrelated generated files are
      committed.

## Automated review process

Every pull request goes through the same first review before the maintainer is
requested:

1. The CLA check confirms that every contributor has accepted the current
   agreement.
2. CI checks formatting, curated data, repository links, unit tests, and the
   production build.
3. After all automated checks pass for the current commit, the bot records an
   automated checks approval and requests the maintainer for human review.
4. A separate maintainer approval enables squash auto-merge. GitHub waits until
   every protected-branch requirement, including CI and the CLA check, passes.

Automated checks are a first pass, not a guarantee that a change will be
merged. Fix any failures and keep the pull request focused while it is under
review.

Merging into `main` does not publish the change immediately. Production is
deployed from the latest `main` branch once a week, on Sunday at 09:00
Asia/Kolkata. Maintainers may run the production workflow manually for urgent
releases.

## Licensing and contribution rights

The original source code in this repository is licensed under the
[GNU Affero General Public License v3.0](./LICENSE) (`AGPL-3.0-only`). The
project's branding and third-party materials are separately addressed in the
[brand and data notice](./BRAND_AND_DATA.md).

Only submit work you have the right to contribute. By opening a pull request,
you confirm that the contribution is your own or that you have permission to
submit it, and that it may be incorporated into this project under the
project's AGPL license and the terms of the Contributor License Agreement.

Before a first pull request can be merged, read [the Contributor License
Agreement](./CLA.md) and post the exact acceptance statement requested by the
CLA check. First-time contributors receive an automatic welcome comment with
the agreement link and signing instructions. The signature applies to future
contributions under that GitHub account until the agreement is materially
changed.

## Contributor milestones

The project posts a thank-you message after a contributor's first merged pull
request. After five meaningful merged pull requests, the contributor is invited
to apply to the [collaborator program](./COLLABORATOR_PROGRAM.md).

Five merged pull requests establish eligibility; they do not automatically
grant repository or write access. Applications are reviewed for contribution
quality, reliability, community conduct, review experience, and current project
needs. Accepted applicants begin in the moderation stage. Write access requires
a separate request and explicit approval from the Project Owner.

## Getting help

Ask a focused question on the issue you are working on. Include what you tried,
the result you expected, and any relevant error output. Maintainers and other
contributors can then help without duplicating investigation.
