# Your first open-source pull request

Never opened a pull request before? You can learn the process while improving [GSoC Organizations](https://gsocorganizations.xyz), an independent directory of past Google Summer of Code organizations.

You do **not** need prior GSoC participation to contribute. A good first task is to verify the official source-code location for an organization in the directory. You will learn how to find an issue, fork a repository, make a focused change, run checks, and respond to review.

> **Before you begin:** Read [CONTRIBUTING.md](../CONTRIBUTING.md). Our assignment policy is enforced automatically: claim an unassigned issue **before** opening a pull request, and link that issue in your PR description. Review the [Contributor License Agreement](../CLA.md) before signing it.

## 1. Choose and claim an available issue

1. [Find unassigned good first issues](https://github.com/rohanmalhotracodes/GSoC-Organizations/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22+no%3Aassignee), or browse the [missing repository-link initiative](https://github.com/rohanmalhotracodes/GSoC-Organizations/issues/382).
2. Read the instructions for **one** organization. Check that it is still open and unassigned.
3. Comment `/claim` on that issue and wait for the claim bot to confirm your assignment. The project allows up to two active claims per contributor.
4. If you cannot finish, comment `/unclaim` to release your assignment.

Please do not start an issue assigned to someone else. The repository's automation closes pull requests that are not associated with an issue assigned to their author.

## 2. Fork and clone the repository

1. Sign in to GitHub and open the [project repository](https://github.com/rohanmalhotracodes/GSoC-Organizations).
2. Click **Fork** in the upper-right corner to create a copy in your account.
3. Clone **your fork** in a terminal (replace `YOUR_USERNAME` with your GitHub username):

```sh
git clone https://github.com/YOUR_USERNAME/GSoC-Organizations.git
cd GSoC-Organizations
git remote add upstream https://github.com/rohanmalhotracodes/GSoC-Organizations.git
git switch -c add-repository-link
```

If you have already cloned the project, update your local copy and create a **new branch** for the issue instead of reusing a previous PR branch. Use a more descriptive branch name if you are working on a different type of change.

## 3. Verify the official source

For a repository-link issue, follow links from the organization's **official GSoC page, contribution guide, or official website** to its source-code host.

Do not use a guessed repository, an unrelated contributor fork, or a generic search results page. The [repository curation policy](./repository-curation.md) explains accepted evidence and link formats.

## 4. Make one focused change

Open `scripts/prepare-data.mjs`, find the `manualRepositories` object, and add the verified destination under the **exact** organization name shown in your issue. Then regenerate the derived data files:

```sh
npm run prepare:data
```

This updates `api/repository-links.json` and `src/data/organizations.json`. Do not edit either generated JSON file by itself because the next build will overwrite it.

Use the supported host value, a real `lastChecked` UTC date, and `verified: true` **only after verification**. Do not create duplicate entries or reformat unrelated records.

## 5. Run the project checks

Install [Node.js 20.11 or newer](https://nodejs.org/) if needed. From the repository directory, run:

```sh
npm ci
npm run validate
node scripts/validate-repository-links.mjs --network
```

Open the new URL in a browser to confirm it reaches the intended organization. If an official host rejects the automated network check, explain that limitation in your PR rather than ignoring the failure.

## 6. Commit and push your work

```sh
git add scripts/prepare-data.mjs api/repository-links.json src/data/organizations.json
git commit -m "data: verify repository link for organization"
git push -u origin add-repository-link
```

If you used a different branch name, replace `add-repository-link` in the push command. Only stage files relevant to your issue.

## 7. Open a pull request

1. Open your fork on GitHub and click **Compare & pull request** (or **Contribute → Open pull request**).
2. Select `rohanmalhotracodes/GSoC-Organizations` as the base repository and `main` as the base branch.
3. In the PR description, include:
   - `Closes #ISSUE_NUMBER` for the issue you claimed (replace the placeholder);
   - the official page proving the repository belongs to that organization;
   - what you changed;
   - which validation commands you ran and their results.
4. Submit your PR and follow the CLA check's instructions to accept the [CLA](../CLA.md) if it is your first contribution.

Your PR will run CI and receive review. If a check fails or a reviewer requests changes, make the correction on the **same branch**, commit, and push again. You do not need to open another PR for those fixes.

## What you learned

By completing one real contribution, you practice:

- choosing and claiming a scoped issue;
- checking trustworthy sources rather than guessing;
- forking, branching, committing, and pushing Git changes;
- opening and linking a pull request;
- passing CI, signing a CLA, and responding to human review.

**Need help?** Ask a focused question in your assigned issue and share what you tried. The [full contribution guide](../CONTRIBUTING.md) covers other types of changes, local development, tests, and project policies.

This project is independent and is not affiliated with or endorsed by Google.
