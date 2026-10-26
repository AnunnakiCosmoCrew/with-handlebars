/**
 * A degree token names a chord/scale tone relative to the root: "1", "b3",
 * "#11", "bb7"… Optional tones are wrapped in parens: "(5)". Tokens are the
 * authoring format for all chord/scale data and the display format for the
 * Intervals label mode.
 */
export type DegreeToken = string

export type Instrument = 'guitar' | 'bass' | 'ukulele'

export type Tuning = {
  id: string
  name: string
  /** Instrument family for UI grouping; absent means 'guitar'. */
  instrument?: Instrument
  /** MIDI note numbers, LOW string to HIGH string. Length = string count. */
  strings: number[]
  /** Spelled open-string names, low to high (display spelling, e.g. "A#"). */
  letters: string[]
}

export type ChordType = {
  id: string
  /** Symbol as shown after the root, e.g. "m7b5" (display glyphs applied later). */
  symbol: string
  name: string
  /** Alternate symbols, root-less, e.g. ["Maj7", "M7"]. */
  aliases: string[]
  /** Degree tokens; "(x)" marks an optional tone. */
  intervals: DegreeToken[]
}

export type ScaleType = {
  id: string
  name: string
  intervals: DegreeToken[]
}

export type Selection = {
  mode: 'chord' | 'scale'
  /** Spelling-significant root, e.g. "C#" or "Db" — never a pitch-class number. */
  root: string
  typeId: string
}

export type SpellingMode = 'strict' | 'simple'

/**
 * A tone's harmonic role relative to the selection's root, by diatonic degree
 * class: 1 → root, 3 → third, 5 → fifth, 7 → seventh, 2/4/6 (and their
 * compound forms 9/11/13) → extension. Alterations never change the class —
 * a ♭5 is still the fifth.
 */
export type ToneRole = 'root' | 'third' | 'fifth' | 'seventh' | 'extension'

export type FretDot = {
  /** Index into tuning.strings (0 = lowest string). */
  string: number
  /** 0 = open string. */
  fret: number
  /** Sounding MIDI note: tuning.strings[string] + fret. */
  midi: number
  /** Spelled note per the spelling mode, ASCII accidentals ("F##", "Ab"). */
  note: string
  /** Degree token without optional parens, e.g. "b3", "#11". */
  degree: DegreeToken
  isRoot: boolean
  isOptional: boolean
  /** Harmonic role of the dot's degree — see ToneRole. */
  role: ToneRole
}
