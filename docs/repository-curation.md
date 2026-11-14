# Repository curation workflow

Every organization must end in one of three states: manually verified repository records, explicitly inferred repository records, or a clearly labeled search fallback. Never upgrade an inferred or search-derived record to verified without manual evidence.

## Schema

Manually verified records live in the `manualRepositories` object in
`scripts/prepare-data.mjs`, keyed by the exact organization name. The build
uses these records to generate `api/repository-links.json` and the repository
data embedded in `src/data/organizations.json`:

```json
{
  "Organization Name": {
    "repositories": [
      {
        "label": "Main repository",
        "url": "https://github.com/example/project",
        "host": "GitHub",
        "verified": true,
        "lastChecked": "2026-11-05"
      }
    ],
    "organizationProfile": "https://github.com/example",
    "source": "manual"
  }
}
```

Supported host labels are `GitHub`, `GitLab`, `Codeberg`, `SourceHut`, and `Self-hosted Git`.

Never edit either generated JSON file by itself. Run `npm run prepare:data`
after changing `manualRepositories` and commit the source plus both generated
files.

## Primary destination

The organization profile page uses `repositories[0]` for its visible
**Repository** button. Order repository records deliberately:

- For a single project, put its exact canonical source repository first.
- For an umbrella organization or a community spanning multiple projects, put
  its official organization, group, or source-collection root first.
- Never use a generic hosting-service homepage or an arbitrary umbrella
  subproject as the primary destination.
- Keep `organizationProfile` as the broader source-host profile or fallback.
  Additional repository records remain useful data, but they are not separate
  primary buttons in the current interface.

## Manual review procedure

1. Start with the organization’s official GSoC ideas URL, contribution guide, and website from the latest archive record.
2. Follow only organization-controlled navigation to a source-code host. Do not treat a generic web search result or an unrelated contributor fork as authoritative.
3. Confirm that the repository owner, project name, and linked website agree with the organization identity.
4. Apply the primary-destination rules above. For umbrella organizations, use
   an official organization/group root first and record other actively
   referenced repositories only as secondary entries. Do not imply that one
   subproject represents the umbrella.
5. Normalize the destination to the repository or organization root. Remove tracking parameters, file anchors, `blob`/`tree` paths, and `.git` suffixes.
6. Record the host precisely. A self-hosted GitLab or Gitea instance is `Self-hosted Git`, not GitHub.
7. Set `source` to `manual`, `verified` to `true`, and `lastChecked` to the actual UTC review date.
8. Run the offline validator and the opt-in network validator.
9. Open each changed link in a normal browser and confirm the final destination. Some hosts block `HEAD` requests, so a successful browser check remains necessary.

## Inferred links

The data compiler derives a candidate when an official archive URL already points to a recognizable source host. Derived records must keep:

```json
{
  "verified": false,
  "source": "derived"
}
```

An inferred link is a discovery shortcut, not a verification claim. The UI labels it accordingly.

## Search fallback

If no direct repository can be established, leave `repositories` empty and provide an `organizationProfile` search URL with `source: "search"`. The interface must say “Find repositories” rather than “Repository” or “Source.”

## Validation

Offline format and duplicate checks:

```sh
npm run prepare:data
npm run validate
```

Redirect and reachability checks:

```sh
node scripts/validate-repository-links.mjs --network
```

The network mode intentionally fails on redirects, non-success HTTP responses, and timeouts so reviewers must inspect the result rather than silently accepting a changed target.

## Full-dataset review queue

Review in this order:

1. Current-year organizations with a search fallback.
2. Current-year inferred links.
3. Current-year verified links whose `lastChecked` is older than 90 days.
4. Historical organizations, most recent participation first.
5. Entries sharing the same repository URL across different organization names; these may be legitimate renames or an identity-merge candidate.

Do not delete historical records solely because their website or repository is unavailable. Preserve the archive fact and downgrade the link state when evidence is no longer sufficient.
