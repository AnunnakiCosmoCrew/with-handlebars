import { Note } from 'tonal'
import type { SpellingMode } from './types.js'
import { degreeToIntervalName } from './intervals.js'

/**
 * Spell the note a given degree above a root, preserving theoretical spelling:
 * spellDegree("E", "#9") → "F##". This is what makes Strict mode show F𝄪
 * instead of G.
 */
export function spellDegree(root: string, token: string): string {
  const note = Note.transpose(root, degreeToIntervalName(token))
  if (!note) throw new Error(`cannot spell ${token} of ${root}`)
  return Note.pitchClass(note)
}

/** Reduce a strict spelling to at most one accidental: "F##" → "G", "E#" → "F". */
export function simplifyNote(note: string): string {
  const s = Note.simplify(note)
  return s || note
}

export function spellNote(root: string, token: string, mode: SpellingMode): string {
  const strict = spellDegree(root, token)
  return mode === 'strict' ? strict : simplifyNote(strict)
}

/**
 * ASCII spelling → display glyphs, matching the reference notation:
 * "F#" → "F♯", "Bb" → "B♭", "F##" → "Fx", "Dbb" → "D♭♭".
 */
export function formatNote(note: string): string {
  return note
    .replace(/##$/, 'x')
    .replace(/#/g, '♯')
    .replace(/b/g, '♭')
}

/** Degree token → display form: "b3" → "♭3", "#11" → "♯11". */
export function formatDegree(token: string): string {
  return token.replace(/#/g, '♯').replace(/b/g, '♭')
}
