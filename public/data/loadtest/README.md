# Load-test pack (not government data)

Empty by design. To check that the interface holds up at full catalogue scale:

```bash
npm run loadtest:generate            # writes 4,700 synthetic placeholder records here
VITE_LOADTEST=1 npm run dev          # loads them deliberately
```

Every generated record is named `SYNTHETIC LOAD TEST RECORD n — NOT GOVERNMENT DATA`,
carries no factual field, and is never registered in `manifest.json`. It exists to
measure rendering and search performance, nothing else. Delete the generated file
when you're done.
