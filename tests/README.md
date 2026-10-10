# Automated tests

All root-level `test-*.cjs` development checks were moved here without editing their contents.

Run tests from the **repository root**, because the existing test code reads runtime files using working-directory-relative paths:

```bash
npm install --no-save --no-package-lock jsdom@26
node tests/test-topic-lessons.cjs
node tests/test-topic-reading.cjs
node tests/test-memory.cjs
```

GitHub Actions runs the complete suite defined in `.github/workflows/validate.yml`; audio checks run in `.github/workflows/audio.yml`; mobile-specific checks are in `.github/workflows/mobile.yml`. Moving test source files does not change production paths or the saved progress schema.
