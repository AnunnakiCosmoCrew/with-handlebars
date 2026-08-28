/**
 * Selectable roots. Enharmonic pairs are individually selectable because the
 * chosen spelling drives every downstream note name (C# major spells E#,
 * Db major spells F).
 */
export type RootOption = {
  /** Spelling-significant note, ASCII accidental: "C#", "Db". */
  root: string
  /** The other half of the enharmonic pair, if any. */
  enharmonic?: string
}

export const ROOTS: RootOption[] = [
  { root: 'C' },
  { root: 'C#', enharmonic: 'Db' },
  { root: 'Db', enharmonic: 'C#' },
  { root: 'D' },
  { root: 'D#', enharmonic: 'Eb' },
  { root: 'Eb', enharmonic: 'D#' },
  { root: 'E' },
  { root: 'F' },
  { root: 'F#', enharmonic: 'Gb' },
  { root: 'Gb', enharmonic: 'F#' },
  { root: 'G' },
  { root: 'G#', enharmonic: 'Ab' },
  { root: 'Ab', enharmonic: 'G#' },
  { root: 'A' },
  { root: 'A#', enharmonic: 'Bb' },
  { root: 'Bb', enharmonic: 'A#' },
  { root: 'B' },
]
