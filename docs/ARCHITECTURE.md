# WortWeg 370 — Repository Architecture

This repository contains the published web application and the Capacitor Android/iOS source. Its existing production file paths are intentionally preserved.

## Current layout

| Location | Purpose |
| --- | --- |
| `index.html` | Existing web entry point and embedded legacy vocabulary database |
| Root `*.js` / `*.css` | Web application feature modules loaded through existing paths |
| `content/v1/` | Public, versioned online lesson pack |
| `vendor/` | Bundled German speech engine assets for offline use |
| `mobile/` | Capacitor shell, Android/iOS projects, native build tooling |
| `tests/` | Development-only regression tests, executed from the repository root |
| `.github/workflows/` | Validation, speech and mobile CI workflows |
| `updates/` | Published Android update metadata |

## Stability rules

1. Do not rename or relocate deployed web modules without updating all references in HTML, JavaScript loaders, service-worker precache lists and native packaging.
2. The web app depends on relative URLs and its service-worker scope. Keep `index.html`, `sw.js`, and `manifest.webmanifest` at the current paths.
3. CI tests inside `tests/` still read files **relative to the repository working directory**. Invoke them from the repository root: `node tests/test-topic-reading.cjs`.
4. JavaScript/UI changes require a new mobile binary for offline-install users. Editing files on GitHub does not update an already installed APK.
5. Keep the quiz/mastery, checklist and reading-completion records logically separate; never reset or migrate existing user data merely to reorganize files.
6. Use a feature branch and a pull request; only merge once validation workflows pass. Test native app builds for any runtime change.
7. Do not add credentials, private signing keys, personal progress exports or developer environment files to Git.

## Why the root still contains modules

This site was built as a static application rather than with a build/bundling pipeline. Several production modules are intentionally in the root and loaded by explicit relative paths. Moving them as a cosmetic change would put existing website and offline functionality at risk. A future `src/` migration should be a separate project with URL-compatibility checks and a built-output strategy.
