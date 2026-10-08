# WortWeg 370 mobile

Capacitor Android/iOS shell with bundled vocabulary and German speech. The existing web app remains available. Run `npm ci`, `npm run test:account`, `npm run sync`, and `npm run icons` before native builds.

Android uses the native Google chooser and authenticates its credential with bundled Firebase JS. The same Google UID and Firestore document (`users/{uid}/state/progress`) are used by the website. Profile photos fall back to initials. Learning works offline; signed-in changes remain on the phone until sync succeeds. Guest history remains separate. Conflicting unsynced phone/cloud histories prompt a choice and back up the other copy locally.

Register the exact APK SHA-1 in Firebase project wortweg-370 for package com.innovatex.wortweg370.preview. Download `signing-fingerprints.txt` from the matching release. Native Google login needs real-device verification after registration. Firebase client configuration is public; never commit service-account credentials or private signing keys.

CI builds and tests Android offline first launch, persistence and German speech. Account tests use mocked Google/Firebase providers to verify chooser credentials, sync, offline retention, conflict handling, profile separation and stale-response guards. Those tests do not replace a real Google login test.

The preview signing certificate is cached while the CI cache exists. Production needs a durable private signing key. Older previews may use a different certificate and refuse an in-place update; preserve important local history before uninstalling.

iOS remains guest-only until its Firebase configuration is supplied. The unsigned build needs Apple signing/TestFlight for installation.
