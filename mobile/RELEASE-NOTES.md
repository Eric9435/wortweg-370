Updated Android OAuth configuration after Firebase SHA-1 registration. Includes a native Google retry option when the account chooser returns cancellation after account selection. Cancellation messages no longer imply that the user necessarily cancelled. Android Credential Manager dependencies use the stable versions recommended by Firebase.

The build verifies that the actual APK signing certificate matches the registered Android OAuth entry. The matching preview certificate allows updates from preview 10 without uninstalling. Google sign-in still needs a real-device test; emulator offline checks and mocked account tests cannot verify the live Google account flow.

Android preview with native Google sign-in, Google profile pictures and learning-history sync with the existing website. Guest learning and included German speech work offline. Sign-in and cloud sync require internet.

Before Google login can succeed, register this APK certificate’s SHA-1 in Firebase project wortweg-370, Android app com.innovatex.wortweg370.preview. The attached signing-fingerprints.txt contains the exact fingerprint. Real Google login remains to be tested after Firebase registration.

Different unsynced phone and cloud histories prompt a choice and preserve the other copy locally. Guest history stays separate from the signed-in account.

Preview signing is cached in CI; this is not production signing. The prior preview may use a different certificate. If Android refuses an update, preserve any important local history before uninstalling the old preview.

iOS compiles as an unsigned build. Installation needs Apple signing/TestFlight, and native Google login needs the iOS Firebase configuration. The existing website remains available.
