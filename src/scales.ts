import type { ScaleType } from './types.js'

/**
 * Scale catalog. Interval formulas verified against the reference tool
 * (test/fixtures/observed-scales.json), with seven deliberate corrections where
 * the reference data is broken: melas 14, 15, 19, 39, 44, 47 and 54 — see the
 * fixture's knownBadEntries. Reference-name typos ("Javaneese", "Neopolitan")
 * are corrected here; the parity tests carry the mapping.
 */

const kebab = (name: string): string =>
  name
    .toLowerCase()
    .replace(/#/g, 'sharp')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const scale = (name: string, intervals: string): ScaleType => ({
  id: kebab(name),
  name,
  intervals: intervals.split(' '),
})

const GENERAL_SCALES: ScaleType[] = [
  scale('Major', '1 2 3 4 5 6 7'),
  scale('Harmonic Major', '1 2 3 4 5 b6 7'),
  scale('Harmonic Minor', '1 2 b3 4 5 b6 7'),
  scale('Melodic Minor (Ascending)', '1 2 b3 4 5 6 7'),
  scale('Melodic Minor (Descending)', '1 2 b3 4 5 b6 b7'),
  scale('Chromatic', '1 b2 2 b3 3 4 b5 5 #5 6 b7 7'),
  scale('Whole Tone', '1 2 3 #4 #5 b7'),
  scale('Pentatonic Major', '1 2 3 5 6'),
  scale('Pentatonic Minor', '1 b3 4 5 b7'),
  scale('Pentatonic Blues', '1 b3 4 b5 5 b7'),
  scale('Pentatonic Neutral', '1 2 4 5 b7'),
  scale('Octatonic (H-W)', '1 b2 b3 3 b5 5 6 b7'),
  scale('Octatonic (W-H)', '1 2 b3 4 b5 b6 6 7'),
  scale('Ionian', '1 2 3 4 5 6 7'),
  scale('Dorian', '1 2 b3 4 5 6 b7'),
  scale('Phrygian', '1 b2 b3 4 5 b6 b7'),
  scale('Lydian', '1 2 3 #4 5 6 7'),
  scale('Mixolydian', '1 2 3 4 5 6 b7'),
  scale('Aeolian', '1 2 b3 4 5 b6 b7'),
  scale('Locrian', '1 b2 b3 4 b5 b6 b7'),
  scale('Algerian', '1 2 b3 4 #4 5 b6 7'),
  scale('Arabian (a)', '1 2 b3 4 #4 #5 6 7'),
  scale('Arabian (b)', '1 2 3 4 #4 #5 b7'),
  scale('Augmented', '1 #2 3 #4 #5 7'),
  scale('Auxiliary Diminished', '1 2 b3 4 #4 #5 6 7'),
  scale('Auxiliary Augmented', '1 2 3 #4 #5 #6'),
  scale('Auxiliary Diminished Blues', '1 b2 b3 3 b5 5 6 b7'),
  scale('Balinese', '1 b2 b3 5 b6'),
  scale('Blues', '1 b3 4 #4 5 b7'),
  scale('Byzantine', '1 b2 3 4 5 b6 7'),
  scale('Chinese', '1 3 #4 5 7'),
  scale('Chinese Mongolian', '1 2 3 5 6'),
  scale('Diatonic', '1 2 3 5 6'),
  scale('Diminished', '1 2 b3 4 b5 b6 6 7'),
  scale('Diminished, Half', '1 b2 b3 3 b5 5 6 b7'),
  scale('Diminished, Whole', '1 2 b3 4 b5 b6 6 7'),
  scale('Diminished Whole Tone', '1 b2 b3 3 b5 b6 b7'),
  scale('Dominant 7th', '1 2 3 4 5 6 b7'),
  scale('Double Harmonic', '1 b2 3 4 5 b6 7'),
  scale('Egyptian', '1 2 4 5 b7'),
  scale('Eight Tone Spanish', '1 b2 #2 3 4 b5 b6 b7'),
  scale('Enigmatic', '1 b2 3 #4 #5 #6 7'),
  scale('Ethiopian (A raray)', '1 2 3 4 5 6 7'),
  scale('Ethiopian (Geez & Ezel)', '1 2 b3 4 5 b6 b7'),
  scale('Half Diminished (Locrian)', '1 b2 b3 4 b5 b6 b7'),
  scale('Half Diminished #2 (Locrian #2)', '1 2 b3 4 b5 b6 b7'),
  scale('Hawaiian', '1 2 b3 4 5 6 7'),
  scale('Hindu', '1 2 3 4 5 b6 b7'),
  scale('Hindustan', '1 2 3 4 5 b6 b7'),
  scale('Hirajoshi', '1 2 b3 5 b6'),
  scale('Hungarian Major', '1 #2 3 #4 5 6 b7'),
  scale('Hungarian Gypsy', '1 2 b3 #4 5 b6 7'),
  scale('Hungarian Gypsy Persian', '1 b2 3 4 5 b6 7'),
  scale('Hungarian Minor', '1 2 b3 #4 5 b6 7'),
  scale('Japanese (A)', '1 b2 4 5 b6'),
  scale('Japanese (B)', '1 2 4 5 b6'),
  scale('Japanese (Ichikosucho)', '1 2 3 4 #4 5 6 7'),
  scale('Japanese (Taishikicho)', '1 2 3 4 #4 5 6 #6 7'),
  scale('Javanese', '1 b2 b3 4 5 6 b7'),
  scale('Jewish (Adonai Malakh)', '1 b2 2 b3 4 5 6 b7'),
  scale('Jewish (Ahaba Rabba)', '1 b2 3 4 5 b6 b7'),
  scale('Jewish (Magen Abot)', '1 b2 #2 3 #4 #5 #6 7'),
  scale('Kumoi', '1 2 b3 5 6'),
  scale('Leading Whole Tone', '1 2 3 #4 #5 #6 7'),
  scale('Lydian Augmented', '1 2 3 #4 #5 6 7'),
  scale('Lydian Minor', '1 2 3 #4 5 b6 b7'),
  scale('Lydian Diminished', '1 2 b3 #4 5 6 7'),
  scale('Major Locrian', '1 2 3 4 b5 b6 b7'),
  scale('Mohammedan', '1 2 b3 4 5 b6 7'),
  scale('Neapolitan', '1 b2 b3 4 5 b6 7'),
  scale('Neapolitan Major', '1 b2 b3 4 5 6 7'),
  scale('Neapolitan Minor', '1 b2 b3 4 5 b6 b7'),
  scale('Nine Tone Scale', '1 2 #2 3 #4 5 #5 6 7'),
  scale('Oriental (a)', '1 b2 3 4 b5 b6 b7'),
  scale('Oriental (b)', '1 b2 3 4 b5 6 b7'),
  scale('Overtone', '1 2 3 #4 5 6 b7'),
  scale('Overtone Dominant', '1 2 3 #4 5 6 b7'),
  scale('Pelog', '1 b2 b3 5 b6'),
  scale('Persian', '1 b2 3 4 b5 b6 7'),
  scale('Prometheus', '1 2 3 b5 6 b7'),
  scale('Prometheus Neapolitan', '1 b2 3 b5 6 b7'),
  scale('Pure Minor', '1 2 b3 4 5 b6 b7'),
  scale('Roumanian Minor', '1 2 b3 #4 5 6 b7'),
  scale('Six Tone Symmetrical', '1 b2 3 4 #5 6'),
  scale('Spanish Gypsy', '1 b2 3 4 5 b6 b7'),
  scale('Super Locrian', '1 b2 #2 3 #4 #5 b7'),
]

/**
 * The 72 Melakarta ragas are fully formulaic, so they are generated, never
 * hand-typed. Melas 1–36 use shuddha madhyama (4), 37–72 prati madhyama (#4).
 * Within each half, six chakras of six ragas walk the Ri/Ga pairs (outer) and
 * Da/Ni pairs (inner) through the same six combinations.
 *
 * Degree spelling matches the reference tool's convention: adjacent swaras
 * sharing a diatonic slot are spelled apart (D1+N1 → #5+6, R3+G3 → #2+3).
 */
const RI_GA_PAIRS: [string, string][] = [
  ['b2', '2'], ['b2', 'b3'], ['b2', '3'], ['2', 'b3'], ['2', '3'], ['#2', '3'],
]
const DA_NI_PAIRS: [string, string][] = [
  ['#5', '6'], ['b6', 'b7'], ['b6', '7'], ['6', 'b7'], ['6', '7'], ['#6', '7'],
]

const MELAKARTA_NAMES = [
  'Kanakangi', 'Ratnangi', 'Ganamurti', 'Vanaspati', 'Manavati', 'Tanarupi',
  'Senavati', 'Hanumattodi', 'Dhenuka', 'Natakapriya', 'Kokilapriya', 'Rupavati',
  'Gayakapriya', 'Vakulabharanam', 'Mayamalavagaula', 'Chakravakam', 'Suryakantam', 'Hatakambari',
  'Jhankaradhvani', 'Natabhairavi', 'Kiravani', 'Kharaharapriya', 'Gaurimanohari', 'Varunapriya',
  'Mararanjani', 'Charukesi', 'Sarasangi', 'Harikambhoji', 'Dhirasankarabharana', 'Naganandini',
  'Yagapriya', 'Ragavardhani', 'Gangeyabhusani', 'Vagadhisvari', 'Sulini', 'Chalanata',
  'Salagam', 'Jalarnavam', 'Jhalavarali', 'Navanitam', 'Pavani', 'Raghupriya',
  'Gavambodhi', 'Bhavapriya', 'Subhapantuvarali', 'Sadvidhamargini', 'Suvarnangi', 'Divyamani',
  'Dhavalambari', 'Namanarayani', 'Kamavardhani', 'Ramapriya', 'Gamanasrama', 'Visvambari',
  'Syamalangi', 'Sanmukhapriya', 'Simhendramadhyama', 'Hemavati', 'Dharmavati', 'Nitimati',
  'Kantamani', 'Risabhapriya', 'Latangi', 'Vaschaspati', 'Mechakalyani', 'Chitrambari',
  'Sucharitra', 'Jyotisvarupini', 'Dhatuvardhani', 'Nasikabhusani', 'Kosalam', 'Rasikapriya',
]

export function generateMelakartaScales(): ScaleType[] {
  return MELAKARTA_NAMES.map((name, k) => {
    const n = k + 1
    const ma = k < 36 ? '4' : '#4'
    const [ri, ga] = RI_GA_PAIRS[Math.floor((k % 36) / 6)]!
    const [da, ni] = DA_NI_PAIRS[k % 6]!
    return {
      id: `mela-${kebab(name)}-${n}`,
      name: `Mela ${name} (${n})`,
      intervals: ['1', ri, ga, ma, '5', da, ni],
    }
  })
}

/**
 * The ten Hindustani parent scales (thaats, Bhatkhande's system). These were
 * named "<name> Theta" until HB-174; LEGACY_SCALE_IDS keeps the old ids working.
 */
const THAAT_SCALES: ScaleType[] = [
  scale('Asavari Thaat', '1 2 b3 4 5 b6 b7'),
  scale('Bilaval Thaat', '1 2 3 4 5 6 7'),
  scale('Bhairav Thaat', '1 b2 3 4 5 b6 7'),
  scale('Bhairavi Thaat', '1 b2 b3 4 5 b6 b7'),
  scale('Kafi Thaat', '1 2 b3 4 5 6 b7'),
  scale('Kalyan Thaat', '1 2 3 #4 5 6 7'),
  scale('Khamaj Thaat', '1 2 3 4 5 6 b7'),
  scale('Marva Thaat', '1 b2 3 #4 5 6 7'),
  scale('Purvi Thaat', '1 b2 3 #4 5 b6 7'),
  scale('Todi Thaat', '1 b2 b3 #4 5 b6 7'),
]

export const SCALE_TYPES: ScaleType[] = [
  ...GENERAL_SCALES,
  ...generateMelakartaScales(),
  ...THAAT_SCALES,
]

const byId = new Map(SCALE_TYPES.map(s => [s.id, s]))

/**
 * Retired scale id → current id. Ids live in shared links and saved boards, so
 * a rename must never drop one: add the old id here instead.
 */
export const LEGACY_SCALE_IDS: ReadonlyMap<string, string> = new Map(
  THAAT_SCALES.map(s => [s.id.replace(/-thaat$/, '-theta'), s.id]),
)

/** The current id for a scale id, old or new; undefined if it names no scale. */
export function resolveScaleId(id: string): string | undefined {
  if (byId.has(id)) return id
  return LEGACY_SCALE_IDS.get(id)
}

export function getScaleType(id: string): ScaleType {
  const s = byId.get(resolveScaleId(id) ?? id)
  if (!s) throw new Error(`unknown scale type: ${id}`)
  return s
}
