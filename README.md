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
