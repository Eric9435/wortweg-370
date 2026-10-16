## WortWeg 370 — Flashcards and Seen Words update (October 2026)

- **All-word flashcards:** Study the full embedded Word Bank (10,876 entries), curated Topic 1, and downloaded New Lessons with German/English/Myanmar translations, pronunciation, CEFR filters, search, shuffle, and spaced-review ratings.
- **Connected Seen Words:** Rating **I knew it** or **Again** counts the word as seen immediately, including mistakes and successful recall. Cards merely opened, flipped, or skipped are not counted.
- **Unified word history:** Quiz attempts and flashcard reviews show together without duplicate word counts. The **Practice** filter isolates flashcard-only, quiz-only, or combined entries. CEFR progress and the Home dashboard now reflect rated cards.
- **Existing study history preserved:** The feature reads separate flashcard records instead of modifying quiz or writing history. Flashcard progress is per-profile and device-local, and is **not yet synced to Firebase**.
- The new Android preview bundles Flashcards and Seen Words for offline use. A new APK is needed; simply refreshing lessons cannot install new application code. Existing Android users should safeguard local progress before reinstalling or clearing app data.

---

Correction for preview 11: direct verification of the released APK with Android apksig found signer SHA-1 0E:94:F9:3D:86:4B:B7:81:0A:2C:9B:97:4D:31:FC:19:13:0B:6B:F3. The earlier CA:DF fingerprint came from the prepared keystore and did not describe the final APK. Register the actual APK fingerprint in Firebase for com.innovatex.wortweg370.preview. The existing APK can be tested after registration without reinstalling.

Future releases are blocked unless apksigner verifies the final APK and its signer matches a registered Android OAuth entry in google-services.json. Published signing-fingerprints.txt will be generated from the final APK instead of the prepared keystore.

Updated Android OAuth configuration after Firebase SHA-1 registration. Includes a native Google retry option when the account chooser returns cancellation after account selection. Cancellation messages no longer imply that the user necessarily cancelled. Android Credential Manager dependencies use the stable versions recommended by Firebase.

The build verifies that the actual APK signing certificate matches the registered Android OAuth entry. The matching preview certificate allows updates from preview 10 without uninstalling. Google sign-in still needs a real-device test; emulator offline checks and mocked account tests cannot verify the live Google account flow.

Android preview with native Google sign-in, Google profile pictures and learning-history sync with the existing website. Guest learning and included German speech work offline. Sign-in and cloud sync require internet.

Before Google login can succeed, register this APK certificate’s SHA-1 in Firebase project wortweg-370, Android app com.innovatex.wortweg370.preview. The attached signing-fingerprints.txt contains the exact fingerprint. Real Google login remains to be tested after Firebase registration.

Different unsynced phone and cloud histories prompt a choice and preserve the other copy locally. Guest history stays separate from the signed-in account.

Preview signing is cached in CI; this is not production signing. The prior preview may use a different certificate. If Android refuses an update, preserve any important local history before uninstalling the old preview.

iOS compiles as an unsigned build. Installation needs Apple signing/TestFlight, and native Google login needs the iOS Firebase configuration. The existing website remains available.
