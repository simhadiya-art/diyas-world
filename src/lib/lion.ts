// The lion mark ("Simha" means lion), drawn on a 100×100 grid.
// Shared by the logo, the loader, the hero dot field and the 404 page.

export const LION_CENTER = { x: 50, y: 52 };
export const PETAL_COUNT = 18;

/** One mane lock (a flame-like curl) pointing up; rotate it around the centre for the full mane. */
export const PETAL = 'M45 27 C41 19 44 10 53 3 C51 11 57 17 55 27';
/** Inner curl of each lock, like block-print linework. */
export const PETAL_VEIN = 'M50 23 C48 17 49 13 52 9';

export const FACE = [
  // head
  'M34 45 C34 35 41 30 50 30 C59 30 66 35 66 45 C66 57 60 69 50 74 C40 69 34 57 34 45Z',
  // ears
  'M36.5 37 C33 31 37.5 27 41.5 31',
  'M63.5 37 C67 31 62.5 27 58.5 31',
  // eyes
  'M39 47 Q43 44 47 47',
  'M53 47 Q57 44 61 47',
  // nose bridge + nose
  'M47.5 50 L46.5 57',
  'M52.5 50 L53.5 57',
  'M45 58 Q50 62.5 55 58 Q50 56 45 58Z',
  // mouth
  'M50 61 L50 64.5',
  'M44.5 65 Q50 70 55.5 65',
  // kolam diamond on the forehead
  'M50 35 L52.2 38.2 L50 41.4 L47.8 38.2Z',
];

export const petalAngles = Array.from({ length: PETAL_COUNT }, (_, i) => (360 / PETAL_COUNT) * i);
