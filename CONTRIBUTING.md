# Contributing

Thanks for looking. A short note on how this repo works before you spend your
time on it.

## This repo is a mirror

Development happens in a private repo; this one receives squashed **sync
release** commits, one per release. So **pull requests can't be merged here** —
they're still welcome as the clearest way to show what you mean, and accepted
changes are re-applied upstream with your authorship preserved, landing here on
the next sync. The commit history is release-shaped, not development-shaped.

Issues are open; Discussions are deliberately off, so questions and half-formed
ideas belong in issues too.

## What belongs here

This repo is the theory: chords, scales, tunings, enharmonic spelling, fretboard
math, roman numerals, harmonic function, voice leading. Zero UI, zero DOM, and one
runtime dependency (tonal, for parsing note and interval names) — and that's a
constraint, not an accident.

Anything you can *see* — the board, the lenses, the staff, the circle, practice,
audio, layout — belongs in
[with-handlebars-web](https://github.com/AnunnakiCosmoCrew/with-handlebars-web).
File it there, or file it wherever and it'll get moved.

## Reporting a theory bug

Give the exact input and the exact expected output:

> `getFretboardDots(TUNINGS[0], { kind: 'scale', root: 'Gb', typeId: 'major' })`
> labels degree 4 as `B`; strict spelling should give `Cb`, because the fourth
> degree of Gb major has to be some kind of C.

**Corrections need a source.** Name the tradition, book or convention you're
citing. "That's not how I learned it" is a real data point but it isn't
resolvable on its own; a named convention is.

Two things that look like bugs and aren't:

- **Enharmonic spelling is deliberate.** Strict mode carries double sharps and
  double flats so every degree keeps its own letter. A `B#` where you expected a
  `C` is usually the library being right.
- **The Melakarta ragas are generated from their formula**, not typed in by hand.
  If one disagrees with a table you have, say which table — some published ones
  contain errors, and that's exactly the kind of issue worth opening.

## Sending a patch

```bash
npm ci
npm test        # must pass
npm run build   # must pass
```

The suite is table-driven: new theory arrives as data plus its expected output,
not as a bespoke test per case. Anything derivable from a formula gets generated
rather than enumerated — that rule is why the raga set is trustworthy.

Don't add runtime dependencies: tonal stays the only one.

## Conduct

Be decent to people. Assume the person you're replying to loves this instrument
as much as you do. That's the whole policy.

## License

By contributing you agree your work ships under the [MIT License](LICENSE).
There's no CLA.
