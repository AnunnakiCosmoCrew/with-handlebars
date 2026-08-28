# With Handlebars — theory core

The pure-TypeScript music-theory engine behind
[With Handlebars](https://withhandlebars.pages.dev), a guitar fretboard explorer
([with-handlebars-web](https://github.com/AnunnakiCosmoCrew/with-handlebars-web)).

Zero UI, zero DOM, zero runtime dependencies. The library computes; the app only
draws what the theory already knows.

> Naming note: unrelated to Handlebars.js, the templating library. The npm scope
> keeps them apart: `@anunnakicosmocrew/handlebars`.

## What's inside

- **58 chord qualities and 168 scales** — the 72 Melakarta ragas are generated
  from their formula, not hand-typed.
- **23 guitar tunings** plus per-string detuning, up to 24 frets.
- **Enharmonic spelling that tells the truth** — strict mode carries double
  sharps and double flats so every degree keeps its letter; simple mode folds
  them for casual reading.
- **Full-fretboard mapping** — every occurrence of a selection's tones across
  the neck (`getFretboardDots`), with tone roles (root / third / fifth /
  seventh / extension) on every dot.
- **Theory that explains itself** — interval names and plain-language anatomy
  (`describeSelection`), diatonic chords with roman numerals and harmonic
  function, and voice-led chord progressions (`progressionSteps`).

## Use

```bash
npm ci
npm test        # table-driven test suite
npm run build   # emits dist/ (ESM + d.ts)
```

The web app consumes this repo as a `file:` dependency from a sibling checkout —
see [with-handlebars-web](https://github.com/AnunnakiCosmoCrew/with-handlebars-web)
for the layout.

## License

[MIT](LICENSE) © Anunnaki Cosmo Crew
