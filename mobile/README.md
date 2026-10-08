# WortWeg 370 mobile

Native Android and iOS shells using Capacitor 8.5.3. No remote `server.url`: all learning assets and the 3 MB German speech pack ship inside the application. The website in the repository root remains independently deployed on GitHub Pages.

## Rebuild

Use Node 22+, Java 21 and Android SDK 36 for Android; macOS with Xcode for iOS.

```sh
cd mobile
npm ci
npm run sync
npm run icons
bash android/gradlew -p android assembleDebug
npx cap open ios
```

`scripts/prepare.mjs` creates a native bundle from root sources without changing those sources. It excludes the web service worker and Firebase popup login; native WebViews must not run Google's browser popup OAuth flow. Speech reads the packaged files rather than depending on browser Cache Storage, including on iOS. Appearance and profile settings retain their device storage; reminders use Capacitor Local Notifications.

The mobile workflow compiles both platforms, tests Android in an emulator with Wi-Fi/data disabled, and publishes the debug APK only after both jobs pass. The iPhone build is unsigned and cannot be installed directly. Debug signing is for previews only; use a durable private release signing key before production Android distribution.

## Finish store distribution

1. Register production Android/iOS app identities in Firebase project `wortweg-370`; obtain Android `google-services.json` and iOS `GoogleService-Info.plist`. Register the Android signing SHA fingerprints and iOS OAuth URL scheme. Implement native Google authentication with a native provider and use its ID token with Firebase; do not substitute an embedded web popup. The shared web profile-photo/cloud logic can then be reused after Firebase JS auth is initialized with the native credential.
2. Choose a durable production Android signing identity, configure it through CI secrets, and create a release AAB for Play Console or signed APK for direct distribution. Do not commit private keys.
3. Configure Apple Developer team, signing certificates and provisioning; archive with Xcode and upload to App Store Connect for TestFlight. Configure the final account/sign-in options, privacy disclosures and support metadata for store review.

Offline progress in the preview is separate from existing website progress. No migration or cloud synchronization is claimed. Notification delivery follows phone permission and OS scheduling rules. Clear/uninstall removes local data. No physical-device testing has been performed by this workflow.
