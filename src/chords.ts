import type { ChordType } from './types.js'

/**
 * The 58 chord qualities, in reference order. Interval formulas verified
 * against the reference tool's info panel (see test/fixtures/observed-chords.json).
 * "(x)" marks an optional tone. Symbols/aliases are ASCII; display formatting
 * (♯/♭ glyphs) is applied by formatDegree at render time.
 */
export const CHORD_TYPES: ChordType[] = [
  { id: 'major', symbol: '', name: 'Major', aliases: ['Maj', 'M'], intervals: ['1', '3', '5'] },
  { id: 'minor', symbol: 'm', name: 'Minor', aliases: ['min', '-'], intervals: ['1', 'b3', '5'] },
  { id: '5', symbol: '5', name: 'Power Chord', aliases: [], intervals: ['1', '5'] },
  { id: '7', symbol: '7', name: 'Dominant Seventh', aliases: ['dom'], intervals: ['1', '3', '5', 'b7'] },
  { id: 'maj7', symbol: 'maj7', name: 'Major Seventh', aliases: ['Maj7', 'M7'], intervals: ['1', '3', '5', '7'] },
  { id: 'm7', symbol: 'm7', name: 'Minor Seventh', aliases: ['min7', '-7'], intervals: ['1', 'b3', '5', 'b7'] },
  { id: 'mmaj7', symbol: 'mmaj7', name: 'Minor Major Seventh', aliases: ['min/maj7', 'mM7', 'm(addM7)', 'm(+7)', '-(M7)'], intervals: ['1', 'b3', '5', '7'] },
  { id: '6', symbol: '6', name: 'Sixth', aliases: ['Maj6', 'M6'], intervals: ['1', '3', '5', '6'] },
  { id: 'm6', symbol: 'm6', name: 'Minor Sixth', aliases: ['min6'], intervals: ['1', 'b3', '5', '6'] },
  { id: 'add9', symbol: 'add9', name: 'Added Ninth', aliases: [], intervals: ['1', '3', '5', '9'] },
  { id: '2', symbol: '2', name: 'Added Second', aliases: [], intervals: ['1', '2', '3', '5'] },
  { id: '6-9', symbol: '6/9', name: 'Six Nine', aliases: ['6add9', '6(add9)', 'Maj6(add9)', 'M6(add9)'], intervals: ['1', '3', '(5)', '6', '9'] },
  { id: 'm6-9', symbol: 'm6/9', name: 'Minor Six Nine', aliases: [], intervals: ['1', 'b3', '(5)', '6', '9'] },
  { id: 'madd9', symbol: 'madd9', name: 'Minor Added Ninth', aliases: ['minor(add9)', '-(add9)'], intervals: ['1', 'b3', '(5)', '9'] },
  { id: 'add9no3', symbol: 'add9(no3)', name: 'Added Ninth (no 3rd)', aliases: ['add9no3'], intervals: ['1', '5', '9'] },
  { id: 'sus4', symbol: 'sus4', name: 'Suspended Fourth', aliases: ['sus', '(sus4)'], intervals: ['1', '4', '5'] },
  { id: 'sus2', symbol: 'sus2', name: 'Suspended Second', aliases: [], intervals: ['1', '2', '5'] },
  { id: '7sus4', symbol: '7sus4', name: 'Dominant Seventh Suspended Fourth', aliases: ['7sus', '7sus11'], intervals: ['1', '4', '5', 'b7'] },
  { id: '9', symbol: '9', name: 'Ninth', aliases: ['7(add9)'], intervals: ['1', '3', '(5)', 'b7', '9'] },
  { id: 'maj9', symbol: 'maj9', name: 'Major Ninth', aliases: ['Maj7(add9)', 'M7(add9)'], intervals: ['1', '3', '(5)', '7', '9'] },
  { id: 'm9', symbol: 'm9', name: 'Minor Ninth', aliases: ['min9'], intervals: ['1', 'b3', '(5)', 'b7', '9'] },
  { id: 'mmaj9', symbol: 'mmaj9', name: 'Minor Major Ninth', aliases: ['min/maj9', 'mM9', 'm(addM9)', 'm(+9)', '-(M9)'], intervals: ['1', 'b3', '(5)', '7', '9'] },
  { id: '11', symbol: '11', name: 'Eleventh', aliases: ['7(add11)'], intervals: ['1', '(3)', '5', 'b7', '(9)', '11'] },
  { id: 'maj11', symbol: 'maj11', name: 'Major Eleventh', aliases: ['Maj7(add11)', 'M7(add11)'], intervals: ['1', '(3)', '5', '7', '(9)', '11'] },
  { id: 'm11', symbol: 'm11', name: 'Minor Eleventh', aliases: ['min11', '-11'], intervals: ['1', 'b3', '(5)', 'b7', '(9)', '11'] },
  { id: '13', symbol: '13', name: 'Thirteenth', aliases: ['7(add13)'], intervals: ['1', '(3)', '5', 'b7', '(9)', '(11)', '13'] },
  { id: 'maj13', symbol: 'maj13', name: 'Major Thirteenth', aliases: ['Maj7(add13)', 'M7(add13)'], intervals: ['1', '3', '(5)', '7', '(9)', '(11)', '13'] },
  { id: 'm13', symbol: 'm13', name: 'Minor Thirteenth', aliases: ['min13', '-13'], intervals: ['1', 'b3', '(5)', 'b7', '(9)', '(11)', '13'] },
  { id: '7s9', symbol: '7#9', name: 'Dominant Seventh Sharp Nine', aliases: ['7(add#9)'], intervals: ['1', '3', '(5)', 'b7', '#9'] },
  { id: '7b9', symbol: '7b9', name: 'Dominant Seventh Flat Nine', aliases: ['7b9', '7(add b9)'], intervals: ['1', '3', '(5)', 'b7', 'b9'] },
  { id: '7s5', symbol: '7#5', name: 'Dominant Seventh Sharp Five', aliases: ['7+', '7#5'], intervals: ['1', '3', '#5', 'b7'] },
  { id: '7b5', symbol: '7b5', name: 'Dominant Seventh Flat Five', aliases: ['7b5'], intervals: ['1', '3', 'b5', 'b7'] },
  { id: '9b5', symbol: '9b5', name: 'Ninth Flat Five', aliases: ['9b5'], intervals: ['1', '(3)', 'b5', 'b7', '9'] },
  { id: '9s5', symbol: '9#5', name: 'Ninth Sharp Five', aliases: ['9#5'], intervals: ['1', '(3)', '#5', 'b7', '9'] },
  { id: '9s11', symbol: '9#11', name: 'Ninth Sharp Eleven', aliases: ['9aug11'], intervals: ['1', '3', '(5)', 'b7', '9', '#11'] },
  { id: '7-6', symbol: '7/6', name: 'Dominant Seventh Add Six', aliases: [], intervals: ['1', '3', '(5)', '6', 'b7'] },
  { id: '9-6', symbol: '9/6', name: 'Ninth Add Six', aliases: [], intervals: ['1', '(3)', '(5)', '6', 'b7', '9'] },
  { id: '7-13', symbol: '7/13', name: 'Dominant Seventh Add Thirteen', aliases: [], intervals: ['1', '3', '(5)', 'b7', '13'] },
  { id: '11b9', symbol: '11b9', name: 'Eleventh Flat Nine', aliases: ['11(b9)'], intervals: ['1', '(3)', '(5)', 'b7', 'b9', '11'] },
  { id: '13b9', symbol: '13b9', name: 'Thirteenth Flat Nine', aliases: ['13b9'], intervals: ['1', '(3)', '(5)', 'b7', 'b9', '(11)', '13'] },
  { id: '13s11', symbol: '13#11', name: 'Thirteenth Sharp Eleven', aliases: [], intervals: ['1', '(3)', '(5)', 'b7', '(9)', '#11', '13'] },
  { id: '13b9b5', symbol: '13b9b5', name: 'Thirteenth Flat Nine Flat Five', aliases: ['13b9b5'], intervals: ['(1)', '(3)', 'b5', 'b7', 'b9', '(11)', '13'] },
  { id: '13b9s11', symbol: '13b9#11', name: 'Thirteenth Flat Nine Sharp Eleven', aliases: ['13b9#11'], intervals: ['(1)', '(3)', '(5)', 'b7', 'b9', '#11', '13'] },
  { id: 'b9', symbol: 'b9', name: 'Seventh Flat Nine', aliases: ['b9'], intervals: ['1', '3', '(5)', 'b7', 'b9'] },
  { id: 'b9s5', symbol: 'b9#5', name: 'Seventh Flat Nine Sharp Five', aliases: ['b9#5'], intervals: ['1', '(3)', '#5', 'b7', 'b9'] },
  { id: 'b9s11', symbol: 'b9#11', name: 'Seventh Flat Nine Sharp Eleven', aliases: ['b9#11'], intervals: ['1', '(3)', '(5)', 'b7', 'b9', '#11'] },
  { id: 'b9b5', symbol: 'b9b5', name: 'Seventh Flat Nine Flat Five', aliases: ['b9b5'], intervals: ['1', '(3)', 'b5', 'b7', 'b9'] },
  { id: 's9', symbol: '#9', name: 'Seventh Sharp Nine', aliases: ['aug9'], intervals: ['1', '3', '(5)', 'b7', '#9'] },
  { id: 's11', symbol: '#11', name: 'Augmented Eleventh', aliases: ['aug11'], intervals: ['1', '(3)', '(5)', 'b7', '9', '#11'] },
  { id: 'maj7s5', symbol: 'maj7#5', name: 'Major Seventh Sharp Five', aliases: ['Maj7#5', 'M7+5'], intervals: ['1', '3', '#5', '7'] },
  { id: 'maj7b5', symbol: 'maj7b5', name: 'Major Seventh Flat Five', aliases: ['Maj7b5', 'M7b5'], intervals: ['1', '3', 'b5', '7'] },
  { id: 'b5', symbol: 'b5', name: 'Major Flat Five', aliases: ['(b5)'], intervals: ['1', '3', 'b5'] },
  { id: 'dim', symbol: 'dim', name: 'Diminished', aliases: ['°'], intervals: ['1', 'b3', 'b5'] },
  { id: 'dim7', symbol: 'dim7', name: 'Diminished Seventh', aliases: ['°7'], intervals: ['1', 'b3', 'b5', 'bb7'] },
  { id: 'mb5', symbol: 'mb5', name: 'Minor Flat Five', aliases: ['m(b5)'], intervals: ['1', 'b3', 'b5'] },
  { id: 'm7b5', symbol: 'm7b5', name: 'Half Diminished', aliases: ['ø7', '½dim', '½dim7', 'm(b7)', 'minor7b5'], intervals: ['1', 'b3', 'b5', 'b7'] },
  { id: 'aug', symbol: 'aug', name: 'Augmented', aliases: ['+', '(#5)'], intervals: ['1', '3', '#5'] },
  { id: 's5', symbol: '#5', name: 'Augmented Fifth', aliases: ['aug5'], intervals: ['1', '3', '#5'] },
]

const byId = new Map(CHORD_TYPES.map(c => [c.id, c]))

export function getChordType(id: string): ChordType {
  const c = byId.get(id)
  if (!c) throw new Error(`unknown chord type: ${id}`)
  return c
}
