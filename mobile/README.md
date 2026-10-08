# WortWeg 370 — Mobile Development

Capacitor Android/iOS shell with bundled vocabulary and German speech. The existing web application remains available.

## Prepare native projects

Use Node.js 22 and npm. From this directory:

```bash
npm ci
npm run test:account
npm run sync
npm run icons
```

Build Android with the included Gradle project and a compatible Android SDK; build iOS with Xcode on macOS.

## Account and offline behavior

Android uses the native Google chooser and authenticates its credential with bundled Firebase JS. Web and Android use the same Google UID and Firestore document (`users/{uid}/state/progress`). Profile photos fall back to initials.

Guest study, included German speech, and local learning history work offline. Sign-in and cloud sync require internet. Signed-in changes remain on the phone until sync succeeds. Guest history stays separate. Conflicting unsynced phone/cloud histories prompt a choice and preserve the other copy locally.

## Android Google sign-in configuration

Register the **actual final APK** SHA-1 in Firebase for package `com.innovatex.wortweg370.preview`, then download an updated `google-services.json` into `android/app/`.

Preview 11 was directly verified with SHA-1:

```text
0E:94:F9:3D:86:4B:B7:81:0A:2C:9B:97:4D:31:FC:19:13:0B:6B:F3
```

The old preview-11 `signing-fingerprints.txt` release asset describes a prepared keystore rather than the final APK. Use this correction and [release notes](RELEASE-NOTES.md). Future CI builds verify the final APK with `apksigner` and reject a signer absent from the Android OAuth configuration.

A prepared or cached keystore does not by itself establish the APK's signing identity. Production requires a durable private signing key. Preserve important local history before uninstalling a preview with an incompatible certificate. Firebase client configuration is public; service-account credentials and private signing keys are not.

## Verification

Account tests mock Google/Firebase providers and cover credential handling, synchronization, offline retention, conflict handling, profile separation, and stale responses. They do not replace real-device Google sign-in verification. Android CI also includes offline instrumentation checks.

## iOS status

Native source and an unsigned build are available. Installation requires Apple signing/TestFlight; native Google login requires the iOS Firebase configuration. Until configured, iOS remains guest-only.

See the [repository README](../README.md) for product features and downloads.


## Android app update notifications

The Android app checks the **fixed public HTTPS** update manifest at
`https://eric9435.github.io/wortweg-370/updates/android.json`.
It checks on launch, reconnect, and foreground return (no more often than once
every 30 minutes), provided **Settings → App updates → Check automatically** is
enabled. Users may click **Check now** at any time. Checks do not send Google
login credentials. On failure, lessons and quiz history continue offline.

An available update appears as a compact main-menu banner and a dismissible
welcome-style dialog **after** the login/onboarding screens. **View update**
opens the official GitHub release page; Android requires the user to download
and authorize installation. The app never downloads APKs in the background,
requests all-files access, silently installs packages, or erases local data.
**Later** snoozes that version's automatic popup for 24 hours. Automatic checks
can be turned off independently of lesson synchronization.

**Publishing a new version safely:**

1. Build/test a new APK with an *increased* Android `versionCode` and identical
   code/name in `mobile/src/build-info.json` and `mobile/android/app/build.gradle`.
2. Verify the final APK with `apksigner`, including its Firebase-registered
   SHA-1, and keep the signing certificate compatible with previous installs.
3. Publish the tested APK as a **public** GitHub release named
   `mobile-preview-N`, with an asset named `WortWeg-370-Android-preview.apk`.
4. **After** the public APK exists, change `updates/android.json`: set the
   *actual APK's* `versionCode` / `versionName`, the matching release tag,
   and release notes. Deploy the public website. Never advertise an unpublished
   APK or a different package name. The current manifest intentionally points to
   the known public preview 29 (Android versionCode 3) until a replacement APK
   is actually available.
5. Verify the APK updates an existing install **without uninstalling** and that
   Google login plus locally stored lesson progress work on a real phone.

The GitHub Actions release stage has previously returned HTTP 403
(`Resource not accessible by integration`) although Android tests/build
succeeded. The repository owner must grant GitHub Actions the appropriate
**Contents: write** permission or publish a release manually. Successful build
artifacts alone are not a publicly downloadable GitHub release. Do not update
the public manifest until public distribution is verified.

The app validates the manifest schema, Android package, monotonically
increasing versionCode, release-tag consistency, and fixed GitHub release
URL patterns; it renders release notes as text, not HTML. Android enforces
the actual APK signing certificate on in-place installation. Public GitHub
Pages and APK release downloads must remain reachable even if application
source moves to a private repository.
