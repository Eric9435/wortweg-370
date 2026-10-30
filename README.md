# WortWeg 370 — German Vocabulary

German–English–Myanmar vocabulary practice with multiple-choice quizzes, pronunciation, wrong-answer review, and learning progress across the web and an Android preview app.

[Open the web app](https://eric9435.github.io/wortweg-370/) · [Android releases](https://github.com/Eric9435/wortweg-370/releases)

## A1–A2 Dialog Studio

The standalone **Dialog** menu is independent of Vocabulary, Reading, Grammar and quizzes. Select **A1** (46 everyday conversations, 874 source-linked word drills) or **A2** (59 authored real-life conversations, 1,175 source-linked word drills). Counts include original Word Bank records and noun-expansion records, including any overlapping headwords; they are not counts of unique words or official CEFR inventories. Each level includes full German/English turns, local German speech, a slower playback option, role-play response masking, optional Myanmar word meanings, and independently saved completion progress. The original A1 completion storage remains intact. No quiz marks or cloud-account study progress are overwritten.\n\n## Features

- A 370-topic roadmap and an A1–C2 vocabulary bank with 10,876 entries.
- The full Word Bank is browsable with page navigation (100, 250, or 500 entries per page), page jumping, and an **All words · continuous scroll** mode that loads more entries on demand; searches apply to the complete bank, never just the first 70.
- 41 curated personal-identity entries for Topic 1; other topic-specific sets are not yet fully curated.
- Quizzes, spaced review, and previously missed words.
- All-word flashcards (Word Bank, Topic 1, downloaded lessons), German↔English/Myanmar reveal, audio, CEFR filters and device-local per-profile review scheduling.
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

A distinct grammar study interface has been added with 200 searchable and accessible grammar topics (40 each in A1, A2, B1, B2 and C1), **78 authored interactive lessons** and responsive controls. Each authored lesson has a rule explanation, pattern, German example, English and Myanmar translations, pronunciation using the system speech engine where available, a multiple-choice check, retry, and locally saved progress. The 122 index topics that are not fully authored open honest, interactive study-guide pages with a learning objective and writing exercise; they are not represented as finished lessons or automatically graded.

Open the app and select **Grammar A1–C1**. The grammar interface loads through `ios-polish.js`; the native packaging script includes `grammar.js` and `grammar.css` in future builds. The service worker caches the resources for offline use. Grammar progress is stored separately from all existing vocabulary records and **does not yet synchronize through Firebase**. Existing installed Android APKs do not gain the JavaScript module until a newly built APK is released.

The grammar module is an incremental content foundation, **not yet a 200-lesson completed textbook**. Expand and pedagogically review the 122 remaining interactive lessons, add more exercise types and robust authenticated progress synchronization, then verify Android build and existing login/progress regression checks before merging and releasing.

### Complete A1–C1 interactive topic coverage

Each of the 200 CEFR-organized grammar topics now has a short authored explanation, German example, English/Myanmar meaning and interactive multiple-choice question. The lesson collection is a first pass requiring further language-pedagogy review and deeper exercises; it is **not yet a professional multi-exercise textbook**. Grammar progress is device-local; publishing this website change does not issue an Android APK.

### Textbook-inspired deep grammar references
14 original enhanced chapters introduce carefully explained rules, reference tables, worked German–English–Myanmar examples, common errors and free-writing challenges. The chapter structure was informed by the publicly described teaching approaches of Cornelsen *Grammatik aktiv* and Schubert *Begegnungen*; no textbook text is copied. Other grammar lessons remain concise first-pass lessons and should not be advertised as fully textbook-depth. The CEFR grammatical-accuracy descriptors are proficiency criteria, not a mandated list of grammatical chapters.

## Special Vocabulary — six categories

The **Special Vocabulary** launcher on Home opens one independent collection with **347 German–English–Myanmar entries**, organized by category:

| Category | Entries |
| --- | ---: |
| Conjunctions & Connectors | 46 |
| Prepositions | 56 |
| Interjections | 45 |
| Directions | 59 |
| Numbers | 74 |
| Clock & Time | 67 |

The collection supports category filtering, search across the three languages, German pronunciation, case/grammar notes, learned-word marking, 15-question multiple-choice sessions, mistake review, and progress saved separately per local guest or signed-in profile. **This module's progress is device-local, not yet Firestore-synchronized.** It does not alter the original 10,876-word bank, quiz attempts, or CEFR progress totals. Main menu and other learning modules remain unchanged.

Assets: `special-vocabulary.js` and `special-vocabulary.css`, cached by the web service worker and bundled in new native builds through `mobile/scripts/prepare.mjs`. Existing installed APKs will not get the new JavaScript module until a new signed APK is built and installed. Run `node test-special-vocabulary.cjs` (requires jsdom) for category, translation, quiz, audio, review, isolation and cache checks.

## Flashcard review

Open **Flashcards** from the Home learning tools or Main menu. The deck includes all 10,876 embedded Word Bank entries, 41 curated Topic 1 entries, and downloaded lessons. Choose a CEFR level, search for a specific word, study 20/50/100 cards or all matching cards, and flip between German and English/Myanmar. Rate cards **Again** or **I knew it**; reviewed cards are scheduled again in an independently saved, account-separated local flashcard record. No existing quiz or writing records are changed. These flashcard ratings do not currently synchronize through Google/Firebase; back up device data before clearing app storage. The website gains the feature after deployment; the previously installed Android APK needs a new build to include UI code.

## Flashcards in My seen words

When you flip a flashcard and select **I knew it** or **Again**, that vocabulary entry is added to **My seen words** and the Home learning progress view. Opening or skipping a card does not count. Existing quiz history is preserved and entries practiced in both modes count once. The Seen Words table labels entries **Quiz**, **Flashcards** or **Quiz + Flashcards**, and its **Practice** filter can isolate card reviews. A subsequent rating updates the current remembered/review state, while historic mistakes remain visible. Flashcard data is kept separately per guest/Google profile on the current device and does not yet sync through Firebase.

## Lifetime Grammar A1–C2 (separate workspace)

Choose **Lifetime Grammar A1–C2** in Home, or open [Lifetime Grammar](lifetime-grammar.html). This is a separate reference workspace from the existing Grammar Academy and the vocabulary bank. The web version has:

- **36 numbered chapters** and **288 stable bilingual table IDs (T001–T288)**, with English and Myanmar headings and 288 authored topic-focus rules.
- Responsive chapter browsing, English/Myanmar text search, approximate level filters, contextual Back/Close and direct `#T145`-style table links.
- Reviewed core reference grids for the most important article/case/pronoun/conjugation/preposition structures. All 288 topics include individually selected, topic-specific German–English examples with corresponding Myanmar meanings; 48 priority topics additionally include reviewed multi-row paradigms. Related readings from the 200 existing A1–C1 Grammar Academy records are clearly labeled and cannot award Lifetime table mastery unless the lesson title matches exactly.
- German pronunciation via a system speech voice where available, independent writing notes, device-local reviewed/practice-pass tracking, JSON backup and print.
- Offline PWA precache and bundled assets in **future** Android/iOS native builds. Existing installed APKs require a new signed release to receive changes.

**Coverage boundary:** All 288 topics have a unique rule, bilingual English/Myanmar index entry, and a specifically curated German–English–Myanmar example. Other than the 48 priority multi-row matrices, the remaining tables are compact focused references rather than exhaustive inflection charts. Not all 288 have a separately authored, topic-exact, automatically graded exercise. These are explicitly labeled when absent; related grammar examples are not represented as exact-match lessons. Progress is local to this browser/device and is not yet connected to Firebase account sync. Grammar structure alone does not certify a CEFR level.

### Memorization Tables — compact declension/conjugation reference

The standalone Lifetime Grammar workspace now has an **independent “Memorize 48”** chart library (`lifetime-grammar.html#memorize`), distinct from the numbered 288 topic reference tables and existing Grammar Academy. It includes **48 full chart references** grouped under articles/cases, pronouns, adjective endings, noun declensions/plurals, verb conjugations/tenses, prepositions, and sentence patterns. In particular the definite-article case rows read **der/die/das/die → den/die/das/die → dem/der/dem/den → des/der/des/der** for nominative, accusative, dative and genitive.

Searchable chart menu; responsive horizontal scrolling with sticky first column; Hide Answers, tap-to-reveal cells, German speech when supported, Next Table, related T-numbered lesson links, manually marked study completion and JSON progress export. Study completion is device-local and self-reported, not exam certification. Files are precached for PWA use and will be bundled into future native builds. The 48 charts are an authored study curriculum, not an official CEFR table count.
