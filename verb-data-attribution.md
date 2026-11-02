# Lifetime German Verb Dictionary — Data Attribution

The file `assets/german-verbs-lifetime.json` contains a filtered and reformatted extract of
German verb principal parts originating from **Wiktionary contributors**.

- **Original project:** https://de.wiktionary.org/
- **Intermediate source:** https://github.com/viorelsfetea/german-verbs-database
- **Source CSV:** https://github.com/viorelsfetea/german-verbs-database/blob/master/output/verbs.csv
- **Content license:** Creative Commons Attribution-ShareAlike 4.0 International
  (https://creativecommons.org/licenses/by-sa/4.0/).
- **Data transformations:** Extracted V1 (infinitive), V2 (Präteritum), V3 (Partizip II),
  and `haben`/`sein` auxiliary; excluded malformed entries and source multiword
  headwords; normalized Unicode; removed duplicate lemmas; serialized as JSON.
- **Additional material:** Sixteen manually curated entries for WortWeg course
  coverage, kept separate from the Wiktionary-derived dataset. WortWeg's
  independently authored English/Myanmar meanings and CEFR labels are looked
  up at runtime, not copied into this dataset.
- **Limitations:** Forms can have multiple accepted variants and contextual or
  regional differences. This collection is a helpful reference but not a
  fully verified or exhaustive German dictionary.

This derived lexical dataset is offered under CC BY-SA 4.0. The license is for
the dictionary content and does not by itself relicense all application code
or other WortWeg content.

For individual entries, use Wiktionary's lemma page and its history for
contributor attribution and the most recent updates.
