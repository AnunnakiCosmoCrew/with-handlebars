import type { DegreeToken, Selection, Tuning } from './types.js'
import { DEFAULT_FRET_COUNT, selectionChromaMap } from './fretboard.js'

/**
 * A position box: an algorithmic playing position for the current selection.
 * Named "box" because "position" already means other things in this library
 * (SelectionPitch.positions, identifyPosition) — UI copy still says "Position".
 */
export type Box = {
  /** 1-based position number, ascending up the neck. */
  index: number
  /** Degree token of the anchor tone at minFret, e.g. "b3" — for UI captions. */
  anchorDegree: DegreeToken
  /** First fret of the box: where its anchor tone sits on the lowest-pitched string. */
  minFret: number
  /** Last fret of the box, inclusive; clipped to the neck end. */
  maxFret: number
}

/**
 * Open pitch of the lowest-sounding string. Usually strings[0], but a
 * reentrant tuning (ukulele G4 C4 E4 A4) has a first string above the second,
 * so boxes anchor on the lowest-pitched string instead.
 */
function lowestOpen(tuning: Tuning): number | undefined {
  return tuning.strings.length ? Math.min(...tuning.strings) : undefined
}

/**
 * String indices in ascending open-pitch order (ties keep string order). The
 * walks visit strings in this order and report the original index, so a
 * reentrant tuning climbs from its lowest string; for ordinary tunings it is
 * simply 0..n-1.
 */
function ascendingStrings(tuning: Tuning): number[] {
  return tuning.strings
    .map((_, i) => i)
    .sort((a, b) => tuning.strings[a]! - tuning.strings[b]! || a - b)
}

/** Frets a box extends beyond its anchor: 5-fret inclusive hand span. */
const BOX_SPAN = 4

/**
 * One box per occurrence of a selection tone on the lowest string, all the
 * way up the neck — so longer necks offer more positions, each a place the
 * hand can sit. Chroma-driven: works for any selection (a chord's boxes are
 * its arpeggio boxes), any tuning, any string count. In a reentrant tuning
 * (string 0 is not the lowest pitch) a box's minFret refers to the
 * lowest-pitched string, and the pattern walks visit strings from lowest to
 * highest pitch while reporting the original string index.
 */
export function selectionBoxes(
  tuning: Tuning,
  selection: Selection,
  fretCount: number = DEFAULT_FRET_COUNT,
): Box[] {
  // Anchors below fretCount keep every box at least two frets wide; shorter
  // necks than the 12-fret default would break the "every tone anchors a
  // box" promise, so refuse them.
  if (fretCount < DEFAULT_FRET_COUNT)
    throw new Error(`fretCount must be at least ${DEFAULT_FRET_COUNT}, got ${fretCount}`)
  const open = lowestOpen(tuning)
  if (open === undefined) throw new Error('tuning has no strings')
  const byChroma = selectionChromaMap(selection)
  const boxes: Box[] = []
  for (let anchor = 0; anchor < fretCount; anchor++) {
    const d = byChroma.get((open + anchor) % 12)
    if (!d) continue
    boxes.push({
      index: boxes.length + 1,
      anchorDegree: d.token,
      minFret: anchor,
      maxFret: Math.min(anchor + BOX_SPAN, fretCount),
    })
  }
  return boxes
}

/**
 * Whether a fretted position falls inside a box. Open strings belong only to
 * the box anchored at fret 0.
 */
export function dotInBox(dot: { fret: number }, box: Box): boolean {
  return dot.fret >= box.minFret && dot.fret <= box.maxFret
}

/** One note of a connected fingering pattern. */
export type PatternNote = { string: number; fret: number; midi: number }

/**
 * The connected fingering pattern of a box: walk the selection's tones in
 * ascending order from the box's anchor, string by string. Each string takes
 * the consecutive tones that fit a hand-sized span (BOX_SPAN frets above its
 * first note), then the next string continues from the following tone — so
 * the shape drifts left or right the way printed fingering charts do,
 * instead of staying inside the box rectangle. Tone counts per string fall
 * out of the scale itself: three per string for diatonic scales, two to
 * three for pentatonics.
 */
export function boxPattern(
  tuning: Tuning,
  selection: Selection,
  box: Box,
  fretCount: number = DEFAULT_FRET_COUNT,
): PatternNote[] {
  const { nextTone, start } = walkSetup(tuning, selection, box, fretCount)
  const notes: PatternNote[] = []
  let tone = start
  for (const s of ascendingStrings(tuning)) {
    const open = tuning.strings[s]!
    // The walk continues on this string where the previous one left off;
    // tones that would land below the nut here are unreachable and skipped.
    while (tone - open < 0) tone = nextTone(tone)
    const f0 = tone - open
    if (f0 > fretCount) continue // out of reach here; higher strings sit lower
    while (tone - open <= Math.min(f0 + BOX_SPAN, fretCount)) {
      notes.push({ string: s, fret: tone - open, midi: tone })
      tone = nextTone(tone)
    }
  }
  return notes
}

/**
 * Shared validation and tone-walk setup for the pattern-family lenses. A box
 * from selectionBoxes with the same fretCount always passes; one built by
 * hand — or for a longer neck — must fail loudly, not walk wrong notes.
 */
function walkSetup(
  tuning: Tuning,
  selection: Selection,
  box: Box,
  fretCount: number,
): { chromas: Set<number>; nextTone: (midi: number) => number; start: number } {
  if (fretCount < DEFAULT_FRET_COUNT)
    throw new Error(`fretCount must be at least ${DEFAULT_FRET_COUNT}, got ${fretCount}`)
  const open0 = lowestOpen(tuning)
  if (open0 === undefined) throw new Error('tuning has no strings')
  if (box.minFret < 0 || box.maxFret > fretCount || box.minFret > box.maxFret)
    throw new Error(
      `box frets [${box.minFret}, ${box.maxFret}] do not fit a ${fretCount}-fret neck`,
    )
  const chromas = new Set(selectionChromaMap(selection).keys())
  const nextTone = (midi: number): number => {
    for (let m = midi + 1; ; m++) if (chromas.has(m % 12)) return m
  }
  const start = open0 + box.minFret
  if (!chromas.has(start % 12))
    throw new Error(`box at fret ${box.minFret} does not anchor a tone of this selection`)
  return { chromas, nextTone, start }
}

/**
 * The diagonal (climbing) pattern of a box: each string pair carries one
 * octave of the walk — the pair of lowest strings takes [anchor, anchor+12),
 * the next pair [anchor+12, anchor+24), and so on — so the shape climbs the
 * neck deterministically, bridging adjacent positions. Within a pair the
 * octave splits at the fifth, tetrachord-style: tones below it sit on the
 * first string, the rest on the second — which is exactly the classic
 * pentatonic diagonal and never drops a scale tone. An odd last string takes
 * its octave alone; tones off the neck (below the nut in odd tunings, or past
 * the last fret) are skipped.
 */
export function diagonalPattern(
  tuning: Tuning,
  selection: Selection,
  box: Box,
  fretCount: number = DEFAULT_FRET_COUNT,
): PatternNote[] {
  const { nextTone, start } = walkSetup(tuning, selection, box, fretCount)
  const notes: PatternNote[] = []
  const order = ascendingStrings(tuning)
  const strings = order.length
  for (let pair = 0; pair * 2 < strings; pair++) {
    const octaveStart = start + 12 * pair
    const split = octaveStart + 7
    const hasSecond = pair * 2 + 1 < strings
    for (let tone = octaveStart; tone < octaveStart + 12; tone = nextTone(tone)) {
      const s = order[hasSecond && tone >= split ? pair * 2 + 1 : pair * 2]!
      const fret = tone - tuning.strings[s]!
      if (fret < 0 || fret > fretCount) continue
      notes.push({ string: s, fret, midi: tone })
    }
  }
  return notes
}

/**
 * The classical full-range run of a box: identical to boxPattern until the
 * last string, where instead of stopping at the span limit the hand SHIFTS —
 * the span re-anchors at the next tone and the run continues up the string to
 * the end of the neck. The move classical shifted-scale studies teach,
 * derived for any selection and tuning rather than read from an edition.
 */
export function runPattern(
  tuning: Tuning,
  selection: Selection,
  box: Box,
  fretCount: number = DEFAULT_FRET_COUNT,
): PatternNote[] {
  const { nextTone, start } = walkSetup(tuning, selection, box, fretCount)
  const notes: PatternNote[] = []
  const order = ascendingStrings(tuning)
  const lastString = order[order.length - 1]!
  let tone = start
  for (const s of order) {
    const open = tuning.strings[s]!
    while (tone - open < 0) tone = nextTone(tone)
    let f0 = tone - open
    if (f0 > fretCount) continue
    while (tone - open <= fretCount) {
      if (tone - open > f0 + BOX_SPAN) {
        if (s < lastString) break
        f0 = tone - open // the shift: re-anchor the hand, keep climbing
      }
      notes.push({ string: s, fret: tone - open, midi: tone })
      tone = nextTone(tone)
    }
  }
  return notes
}

/**
 * The sweep-picking path through a box: exactly one selection tone per
 * string, strictly ascending, all inside the box's fret window. Strings with
 * no reachable tone in the window are skipped. Meant for arpeggio boxes
 * (chord selections), though it works for any selection.
 */
export function sweepPath(
  tuning: Tuning,
  selection: Selection,
  box: Box,
  fretCount: number = DEFAULT_FRET_COUNT,
): PatternNote[] {
  const { chromas, start } = walkSetup(tuning, selection, box, fretCount)
  const notes: PatternNote[] = []
  let lastMidi = start - 1
  for (const s of ascendingStrings(tuning)) {
    const open = tuning.strings[s]!
    const hi = open + box.maxFret
    let m = Math.max(open + box.minFret, lastMidi + 1)
    while (m <= hi && !chromas.has(m % 12)) m++
    if (m > hi) continue // no ascending tone in the window on this string
    notes.push({ string: s, fret: m - open, midi: m })
    lastMidi = m
  }
  return notes
}

/** One connector of the octave map: a root and its octave up the neck. */
export type OctaveLink = { from: PatternNote; to: PatternNote }

/**
 * The root's octave geometry: every root occurrence links to the spot where
 * the same pitch an octave up sits on a higher string — the one with minimal
 * fret displacement (lower string on ties), which in standard tuning lands on
 * the classic two-strings-over octave shapes. Roots near the neck end with no
 * reachable octave get no link.
 */
export function rootOctaveLinks(
  tuning: Tuning,
  selection: Selection,
  fretCount: number = DEFAULT_FRET_COUNT,
): OctaveLink[] {
  const root = [...selectionChromaMap(selection)].find(([, d]) => d.degree === 1)
  if (!root) throw new Error('selection has no root degree')
  const chroma = root[0]
  const links: OctaveLink[] = []
  for (let s = 0; s < tuning.strings.length; s++) {
    const open = tuning.strings[s]!
    for (let fret = 0; fret <= fretCount; fret++) {
      if ((open + fret) % 12 !== chroma) continue
      const midi = open + fret
      let to: PatternNote | null = null
      for (let t = s + 1; t < tuning.strings.length; t++) {
        const f = midi + 12 - tuning.strings[t]!
        if (f < 0 || f > fretCount) continue
        if (!to || Math.abs(f - fret) < Math.abs(to.fret - fret))
          to = { string: t, fret: f, midi: midi + 12 }
      }
      if (to) links.push({ from: { string: s, fret, midi }, to })
    }
  }
  return links
}
