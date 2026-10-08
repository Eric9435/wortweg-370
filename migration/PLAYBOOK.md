# WortWeg 370 — GitHub Free private-source migration (PREPARATION ONLY)

**DO NOT change visibility, delete or rename the current repository, rotate Firebase credentials, or replace an APK until each gate below passes.**

## Verified baseline (2026-10-08)
- Existing public source + GitHub Pages: `Eric9435/wortweg-370` — `https://eric9435.github.io/wortweg-370/`
- Releases: `https://github.com/Eric9435/wortweg-370/releases`
- Latest numbered preview observed: `mobile-preview-23`; APK: `WortWeg-370-Android-preview.apk`
- Preview 23 APK SHA-256 from GitHub's Release API:
  `56d2dc9f483fd4709799234997a4948c18598eaa0c205515a30d6027242538c1`
- Firebase project: `wortweg-370`. Android package: `com.innovatex.wortweg370.preview`.
- The installed Android app contains a link to the **existing** GitHub Pages URL.
- Access to Firebase Console and Google Cloud API restrictions has **not** been verified.
- It was not possible to verify the live website's HTTP response from this environment.

## Target
1. A new private `Eric9435/wortweg-370-source` contains full editable code, development assets, tests, workflows, Git history and signing-independent mobile builds.
2. A new public `Eric9435/wortweg-370-public` contains ONLY the site runtime output and signed release files. It starts with a **fresh** history, no imported private-source commits.
3. The current `Eric9435/wortweg-370` stays PUBLIC and LIVE during staging. Nothing is removed or redirected while tests run.
4. GitHub Actions in the private repo can publish reviewed web artifacts and release binaries into the public repo using a narrowly scoped GitHub App installation token or fine-grained token stored as an encrypted **repository secret**; the private repo's ordinary `GITHUB_TOKEN` cannot automatically push to a different repo.

## Gate 1 — Safety backup
- Export the full current Git repository with all branches/tags to a secure private backup.
- Save existing release assets (at least preview 23) together with SHA-256 and signing fingerprints. Never commit a private signing keystore.
- Save a copy of Firebase project configuration and an export/backup of Firestore data through the appropriate administrative controls.
- Preserve the signing certificate used by installed APKs; do not produce a new signing identity without planning update compatibility.

## Gate 2 — Stage a PUBLIC distribution repo
- Create an EMPTY public repository `wortweg-370-public`, **without** importing the original repository or pushing the original Git history.
- Run `node migration/export-public-website.mjs`, then `node migration/check-public-website.mjs` in a trusted checkout. Upload ONLY the contents of `.migration-preview/website/` to the new repository.
- Enable GitHub Pages on its clean deployment branch, and verify `https://eric9435.github.io/wortweg-370-public/`.
- Staging on the same `eric9435.github.io` host shares the localStorage origin with the existing site. **Test staging in a fresh incognito/private browser profile and with a dedicated Firebase test account** to protect existing saved learning progress.
- Verify navigation, quizzes, German voice, offline/service worker behavior, theme, and Google login / Firestore sync. Firebase Auth authorized domains are hostname-based, but test the new path; do not change Google/Firebase settings based on assumption.
- Keep `https://eric9435.github.io/wortweg-370/` available throughout testing.

## Gate 3 — Stage PUBLIC Android downloads
- Publish an identical copy of the latest tested APK, checksum and signing fingerprints as a release in `wortweg-370-public` (do not rebuild, resign, rename the Android package, or change OAuth SHA-1).
- Verify the downloaded APK SHA-256 equals the original published checksum.
- Verify the APK installs on a device, Google account chooser and Firebase sign-in succeed, guest mode and cloud sync still work, and an installed user's data are preserved.
- Test release downloads in an incognito window **without signing into GitHub**.
- Update marketing / download links only AFTER the new public asset is verified.

## Gate 4 — Stage PRIVATE source
- Create `wortweg-370-source` as an empty private repository. Migrate source and desired branches/tags into it using a secure local clone; verify it is private before pushing any new confidential credentials.
- Leave the current public source repository unaltered during staging. Creating a private copy does NOT hide its already-public Git history.
- Restore all CI secrets as encrypted repository secrets, do not share them into the public distribution repo.
- Separate the private build workflow from the public release workflow. For publishing to another repository, use fine-grained credentials limited to that destination. Require tests and explicit approval before publishing.

## Gate 5 — Final choice (must be explicit)
### Option A — No interruption of the existing exact GitHub Pages URL
Keep `Eric9435/wortweg-370` public as a compatibility/deployment host and switch FUTURE development to the private source. **Historical source commits remain publicly available** in that old repo; this is NOT complete retroactive code secrecy. Publishing only runtime assets on a new branch does not hide the old Git history. Public web HTML/JavaScript always remains inspectable.

### Option B — Remove full original source repository from public view
After new public website and APK links are verified, rename the original repo to a private source repo (or make it private) and use the new public distribution repo for hosting. The old `github.io/wortweg-370/` link will be unpublished on GitHub Free; a renamed repository's Pages URL is not redirected. A new public repo with the original name could restore that URL, but recreation, Pages rebuilding, and old release asset URLs introduce a cutover window; strict zero-downtime at the old URL cannot be guaranteed. For a stable long-term public URL, first add and verify a **custom domain** and keep both sites live through DNS propagation, then arrange a compatibility redirect/host for installed APKs that reference the old GitHub Pages URL.

### Decision rule
If **no user-visible interruption, including existing bookmarked URLs**, is absolute, do not private/rename the current public repository. If **historical source privacy** is absolute, accept a planned URL migration / short cutover and verify external links before the change. This tradeoff requires owner approval.

## Cutover/rollback check
Before any switch, verify:
- [ ] Old website and current release downloads still work.
- [ ] New staging website loads all pages/assets in a private browser profile.
- [ ] Web Google sign-in and Firestore sync work on staging with a test user.
- [ ] Old APK's built-in website navigation is accounted for.
- [ ] APK SHA-256 and Android signing certificate match baseline.
- [ ] New public APK download works without GitHub login.
- [ ] Private source repository is confirmed private and CI is passing.
- [ ] Firebase API restrictions and per-user Firestore Rules have been reviewed.
- [ ] Automated deployment secrets have least privilege; publication requires approval.
- [ ] User approves the final URL, visibility change, and rollback plan.

**Rollback:** Keep both old site and old downloadable release files intact until the new public site and download channel are verified. If staging fails, discard the proposed deployment and continue serving the original. Do not rely on GitHub Pages recreation as an instant rollback after privatizing the original.

## Prior security work
Draft hardening PR #3 is separate and should be reviewed independently. Do not disable secret scanning for Firebase configuration files. Firebase client identifiers in public web/Android packages are expected, but Cloud API restrictions and Firestore Rules must actually enforce access controls.
