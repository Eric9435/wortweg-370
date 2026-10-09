# WortWeg 370 — German Vocabulary

German–English–Myanmar vocabulary practice with multiple-choice quizzes, pronunciation, wrong-answer review, and learning progress across the web and an Android preview app.

[Open the web app](https://eric9435.github.io/wortweg-370/) · [Android releases](https://github.com/Eric9435/wortweg-370/releases)

## Features

- A 370-topic roadmap and an A1–C2 vocabulary bank with 10,876 entries.
- 41 curated personal-identity entries for Topic 1; other topic-specific sets are not yet fully curated.
- Quizzes, spaced review, and previously missed words.
- German pronunciation with system-voice support and bundled speech fallback.
- Local learning history with JSON export/import.
- Google sign-in, profile-picture display, and account-based learning-history synchronization.
- Theme, font, profile, reminder, and support/settings interfaces.
- Capacitor Android/iOS source alongside the existing web application.

## Platform status

| Platform | Current capability |
| --- | --- |
| Web | Browser vocabulary practice and Google account sync |
| Android preview | Installable APK, bundled offline learning/speech, native Google sign-in, and reminders |
| iOS native source | Unsigned build source; installation requires Apple signing/TestFlight and native Google login needs iOS Firebase configuration |

Android preview 11 is available as an [APK download](https://github.com/Eric9435/wortweg-370/releases/download/mobile-preview-11/WortWeg-370-Android-preview.apk). It is a development preview, not a store release.

## Offline learning and account sync

Android guest study, pronunciation, and local progress work offline. Google sign-in and cloud synchronization need internet. Signed-in offline changes remain local until synchronization succeeds. Guest history stays separate from account history, and conflicting unsynced histories prompt a choice with a local backup of the other copy.

The same Google identity is used by web and Android. Profile photos fall back to initials when unavailable. Back up important local progress before clearing browser data or uninstalling a preview.

## Local web development

The web app uses static HTML, CSS, JavaScript, and bundled data. From a cloned repository:

```bash
python3 -m http.server 5500
```

Open http://localhost:5500. The published HTTPS site is the appropriate environment for deployed Google sign-in. Review Firebase authorized-domain settings when testing authentication on another host.

## Native development

Use Node.js 22 and npm for the Capacitor toolchain:

```bash
cd mobile
npm ci
npm run test:account
npm run sync
npm run icons
```

Build Android with its Android SDK/Gradle project and iOS with Xcode on macOS. See [mobile development](mobile/README.md).

## Android Google configuration

Register the final APK's actual SHA-1 certificate for package `com.innovatex.wortweg370.preview` in Firebase. For preview 11, the verified SHA-1 is:

```text
0E:94:F9:3D:86:4B:B7:81:0A:2C:9B:97:4D:31:FC:19:13:0B:6B:F3
```

The older preview-11 `signing-fingerprints.txt` asset describes a prepared keystore, not that APK. Use the correction above and [release notes](mobile/RELEASE-NOTES.md). Before a future build, download updated `google-services.json` after registering the actual certificate. The build guard verifies the final APK signer against its Android OAuth configuration.

## Repository map

- `index.html` — vocabulary data and quiz interface.
- `audio.js` and `vendor/` — pronunciation and bundled speech resources.
- `cloud.js` — web account synchronization.
- `enterprise.css` / `enterprise.js` — workspace presentation.
- `mobile/` — Capacitor shell, native projects, and account logic.
- `.github/workflows/` — web/audio validation and mobile builds.

## Verification boundaries

Mobile account tests mock Google/Firebase providers; they do not replace live account-sign-in checks. Android instrumentation checks cover offline behavior. Native iOS installation and authentication remain dependent on Apple signing and platform configuration. The vocabulary roadmap should not be interpreted as 370 fully curated lesson sets.

Developed by InnovateX.

## Maintainer

[Aung Phone Myat (Eric)](https://github.com/Eric9435)


## Automatic vocabulary updates (web and Android)

**New lessons can now update without reinstalling the APK.** The website publishes
a public, versioned, text-only JSON pack at
[`content/v1/pack.json`](content/v1/pack.json).
Both the website and Android use the same bundled `live-content.js` reader.

To publish new vocabulary:

1. Edit `content/v1/pack.json`: add/update lessons and German–English–Myanmar word entries.
2. Keep each lesson and word `id` stable, unique, and lower-case with hyphens.
3. Increase numeric `version` by one. Update `updatedAt`.
4. Commit to `main` and wait for GitHub Pages deployment. Existing APK users can refresh the **New lessons** section while online; automatic checks run on launch, reconnect and return to the foreground (throttled to 15 minutes).
5. Reopen **New lessons** offline to use the last cached pack. The APK also bundles a starter pack for first-use offline learning.

Pack files are schema-checked, bounded in size, rendered as text, and downloaded **without credentials** from the one fixed HTTPS GitHub Pages URL. There is no remote JavaScript execution or automatic installation. Quiz attempts in New lessons are stored under separate local keys per guest/Google user, distinct from existing legacy study history.

**Scope:** Changes to this JSON feed are synchronized. The original 10,876-entry embedded bank in `index.html` is not automatically rebuilt from the website; moving the legacy bank to the feed requires a separate content migration. Changes to JavaScript, UI components, app permissions or native functions still require a new Android APK. New content cannot be downloaded for the first time while offline; previously cached content remains available.

If the public lesson hosting URL changes during a future repository-privacy migration, update the fixed endpoint in `live-content.js` and ship one APK with the new endpoint before retiring the old one.

## Grammar Academy (feature branch)

A distinct grammar study interface has been added with 200 searchable and accessible grammar topics (40 each in A1, A2, B1, B2 and C1), **200 authored interactive lessons** and responsive controls. Each authored lesson has a rule explanation, pattern, German example, English and Myanmar translations, pronunciation using the system speech engine where available, a multiple-choice check, retry, and locally saved progress. The 0 index topics that are not authored open honest, interactive study-guide pages with a learning objective and writing exercise; they are not represented as finished lessons or automatically graded.

Open the app and select **Grammar A1–C1**. The grammar interface loads through `ios-polish.js`; the native packaging script includes `grammar.js` and `grammar.css` in future builds. The service worker caches the resources for offline use. Grammar progress is stored separately from all existing vocabulary records and **does not yet synchronize through Firebase**. Existing installed Android APKs do not gain the JavaScript module until a newly built APK is released.

The grammar module is an incremental content foundation, **not yet a 200-lesson completed textbook**. Expand and pedagogically review the 0 remaining roadmap-only topics, add more exercise types and robust authenticated progress synchronization, then verify Android build and existing login/progress regression checks before merging and releasing.

### Full topic coverage status

The A1–C1 curriculum now provides one individually written rule, grammar pattern, German example, English and Myanmar translation, and an MCQ per 200 indexed topics. This is a **first-pass lesson collection**, not a peer-reviewed comprehensive textbook: most lessons are still concise and require more detailed explanations, varied drills and expert review. One correct MCQ currently marks a lesson as mastered; that does not verify CEFR proficiency. Grammar progress remains local-only, and this change does not release a new Android APK.
