# With Handlebars — theory core

The pure-TypeScript music-theory engine behind
[With Handlebars](https://withhandlebars.com), a guitar fretboard explorer
([with-handlebars-web](https://github.com/AnunnakiCosmoCrew/with-handlebars-web)).

Zero UI, zero DOM, and one runtime dependency: [tonal](https://github.com/tonaljs/tonal),
for parsing note and interval names. The library computes; the app only draws what
the theory already knows.

> Naming note: unrelated to Handlebars.js, the templating library. The npm scope
> keeps them apart: `@anunnakicosmocrew/handlebars`.

Try it in the browser at [withhandlebars.com](https://withhandlebars.com): every
chord and scale the core knows has its own page, for example
[A minor 7 in standard tuning](https://withhandlebars.com/standard/a/chord/minor-7/).

## What's inside

- **58 chord qualities and 168 scales** — the 72 Melakarta ragas are generated
  from their formula, not hand-typed.
- **30 tunings for guitar, bass and ukulele** — standard, drop and open tunings,
  seven-string, baritone, four- and five-string bass, reentrant and low-G
  ukulele — plus per-string detuning, up to 24 frets.
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

## Contributing

Theory corrections are the most valuable thing you can send, and they want a
named source. See [CONTRIBUTING.md](CONTRIBUTING.md) — including the two things
that look like bugs and aren't.

## License

[MIT](LICENSE) © Anunnaki Cosmo Crew
