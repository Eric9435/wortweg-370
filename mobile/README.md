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
