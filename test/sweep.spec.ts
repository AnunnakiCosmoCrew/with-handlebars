import { describe, expect, it } from 'vitest'
import { Note } from 'tonal'
import {
  CHORD_TYPES,
  OVERLAY_CHORD_TYPE_IDS,
  ROOTS,
  SCALE_TYPES,
  STANDARD_TUNING,
  describeSelection,
  diatonicChords,
  formatDegree,
  getChordType,
  getFretboardDots,
  getSelectionInfo,
  identifyPosition,
  parseDegreeList,
  romanNumeral,
  spellDegree,
  spellNote,
  type ScaleSelection,
  type Selection,
  type SpellingMode,
} from '../src/index.js'

// Every root × every chord and scale × both spelling modes, no fixtures:
// invariants that must hold for any input, so a silent spelling bug anywhere
// in the grid fails here.

const MODES: SpellingMode[] = ['strict', 'simple']

const selections: Selection[] = ROOTS.flatMap(({ root }) => [
  ...CHORD_TYPES.map(t => ({ mode: 'chord' as const, root, typeId: t.id })),
  ...SCALE_TYPES.map(t => ({ mode: 'scale' as const, root, typeId: t.id })),
])

const typeOf = (s: Selection) =>
  (s.mode === 'chord' ? CHORD_TYPES : SCALE_TYPES).find(t => t.id === s.typeId)!

const label = (s: Selection, mode: SpellingMode) => `${s.mode} ${s.root} ${s.typeId} (${mode})`

const LETTERS = 'CDEFGAB'

const HEPTATONIC_SCALES = SCALE_TYPES.filter(t => {
  const ds = parseDegreeList(t.intervals)
  return ds.length === 7 && ds.every((d, i) => d.degree === i + 1)
}).length

const pc = (n: number) => ((n % 12) + 12) % 12

describe('all-roots sweep', { timeout: 30_000 }, () => {
  it('covers every root, chord and scale', () => {
    expect(ROOTS).toHaveLength(17)
    expect(CHORD_TYPES).toHaveLength(58)
    expect(SCALE_TYPES).toHaveLength(168)
    expect(selections).toHaveLength(17 * (58 + 168))
  })

  it('spells every tone at its pitch class (root + semitones)', () => {
    const bad: string[] = []
    for (const s of selections) {
      const rootChroma = Note.chroma(s.root)!
      const degrees = parseDegreeList(typeOf(s).intervals)
      for (const mode of MODES) {
        for (const d of degrees) {
          const note = spellNote(s.root, d.token, mode)
          if (Note.chroma(note) !== pc(rootChroma + d.semitones)) {
            bad.push(`${label(s, mode)} ${d.token} → ${note}`)
          }
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('simple mode never uses a double accidental and keeps the strict pitch class', () => {
    const bad: string[] = []
    for (const s of selections) {
      for (const d of parseDegreeList(typeOf(s).intervals)) {
        const strict = spellNote(s.root, d.token, 'strict')
        const simple = spellNote(s.root, d.token, 'simple')
        if (/(##|bb)/.test(simple)) {
          bad.push(`${label(s, 'simple')} ${d.token} → ${simple}`)
        }
        if (Note.chroma(strict) !== Note.chroma(simple)) {
          bad.push(`${label(s, 'simple')} ${d.token}: ${strict} vs ${simple}`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('strict heptatonic scales use each letter exactly once', () => {
    const bad: string[] = []
    let checked = 0
    for (const s of selections) {
      if (s.mode !== 'scale') continue
      const degrees = parseDegreeList(typeOf(s).intervals)
      const heptatonic =
        degrees.length === 7 && degrees.every((d, i) => d.degree === i + 1)
      if (!heptatonic) continue
      checked++
      const rootAt = LETTERS.indexOf(s.root[0]!)
      const letters = degrees.map(d => spellDegree(s.root, d.token)[0]!)
      const expected = degrees.map((_, i) => LETTERS[(rootAt + i) % 7]!)
      if (letters.join('') !== expected.join('')) {
        bad.push(`${s.root} ${s.typeId}: ${letters.join('')} ≠ ${expected.join('')}`)
      }
    }
    expect(checked).toBe(ROOTS.length * HEPTATONIC_SCALES)
    expect(bad).toEqual([])
  })

  it('never returns an empty or undefined degree or note label', () => {
    const bad: string[] = []
    for (const s of selections) {
      for (const d of parseDegreeList(typeOf(s).intervals)) {
        const shown = formatDegree(d.token)
        if (!shown) bad.push(`${s.typeId} ${d.token}: empty degree label`)
        for (const mode of MODES) {
          const note = spellNote(s.root, d.token, mode)
          if (typeof note !== 'string' || note.length === 0) {
            bad.push(`${label(s, mode)} ${d.token}: empty note`)
          }
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('getSelectionInfo and describeSelection are complete and do not throw', () => {
    for (const s of selections) {
      const n = parseDegreeList(typeOf(s).intervals).length
      for (const mode of MODES) {
        const info = getSelectionInfo(s, mode)
        expect(info.notes, label(s, mode)).toHaveLength(n)
        expect(info.title, label(s, mode)).toBeTruthy()
        for (const note of info.notes) expect(note.replace(/[()]/g, '')).toMatch(/^[A-G](#|b)*$/)
        const anatomy = describeSelection(s, mode)
        expect(anatomy.tones, label(s, mode)).toHaveLength(n)
        expect(anatomy.summary).toBeTruthy()
        for (const tone of anatomy.tones) {
          expect(tone.note).toBeTruthy()
          expect(tone.intervalWords).toBeTruthy()
        }
      }
    }
  })

  it('diatonicChords and romanNumeral work for every scale and root', () => {
    for (const s of selections) {
      if (s.mode !== 'scale') continue
      const scale = s as ScaleSelection
      const degrees = parseDegreeList(typeOf(s).intervals)
      const rootChroma = Note.chroma(s.root)!
      const scaleChromas = new Set(degrees.map(d => pc(rootChroma + d.semitones)))
      for (const mode of MODES) {
        const chords = diatonicChords(scale, mode)
        // A seven-letter scale always has at least one overlay chord.
        if (degrees.length === 7 && degrees.every((d, i) => d.degree === i + 1)) {
          expect(chords.length, label(s, mode)).toBeGreaterThan(0)
        }
        for (const c of chords) {
          expect(OVERLAY_CHORD_TYPE_IDS as readonly string[]).toContain(c.typeId)
          expect(c.root, label(s, mode)).toMatch(/^[A-G](#|b)*$/)
          const rootDegree = degrees[c.degreeIndex - 1]!
          expect(Note.chroma(c.root), label(s, mode)).toBe(pc(rootChroma + rootDegree.semitones))
          const chordRoot = Note.chroma(c.root)!
          for (const t of parseDegreeList(getChordType(c.typeId).intervals)) {
            expect(scaleChromas.has(pc(chordRoot + t.semitones)), `${label(s, mode)} ${c.label}`).toBe(true)
          }
          expect(romanNumeral(c, scale), label(s, mode)).toBeTruthy()
        }
      }
    }
  })

  it('identifyPosition agrees with getFretboardDots on every dot', () => {
    const bad: string[] = []
    for (const s of selections) {
      for (const mode of MODES) {
        for (const dot of getFretboardDots(STANDARD_TUNING, s, mode)) {
          const id = identifyPosition(STANDARD_TUNING, dot.string, dot.fret, s, mode)
          if (!id.inSelection || id.name !== dot.note || id.midi !== dot.midi) {
            bad.push(`${label(s, mode)} s${dot.string}f${dot.fret}: ${id.name} vs ${dot.note}`)
          }
        }
      }
    }
    expect(bad).toEqual([])
  })
})
