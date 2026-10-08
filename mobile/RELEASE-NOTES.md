Android preview with native Google sign-in, Google profile pictures and learning-history sync with the existing website. Guest learning and included German speech work offline. Sign-in and cloud sync require internet.

Before Google login can succeed, register this APK certificate’s SHA-1 in Firebase project wortweg-370, Android app com.innovatex.wortweg370.preview. The attached signing-fingerprints.txt contains the exact fingerprint. Real Google login remains to be tested after Firebase registration.

Different unsynced phone and cloud histories prompt a choice and preserve the other copy locally. Guest history stays separate from the signed-in account.

Preview signing is cached in CI; this is not production signing. The prior preview may use a different certificate. If Android refuses an update, preserve any important local history before uninstalling the old preview.

iOS compiles as an unsigned build. Installation needs Apple signing/TestFlight, and native Google login needs the iOS Firebase configuration. The existing website remains available.
