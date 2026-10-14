// Copies Diya's original photos from assets-raw/ into src/assets/images/ with
// clean names, applying the privacy crops/blurs from the brief.
// The originals are never modified. Run with: npm run images
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const RAW = 'assets-raw';
const OUT = 'src/assets/images';
const MAX_WIDTH = 2000;

// [original file, output path, optional edit function]
const jobs = [
  ['Diya Simha Headshot.jpg', 'diya-headshot.jpg'],

  // Davis
  ['DWIB.jpg', 'places/davis/dwib-blazers.jpg'],
  ['DWIB 1.jpg', 'places/davis/dwib-podium.jpg'],
  ['OWN IT 3.JPG', 'places/davis/own-it-balloon-arch.jpg'],
  // Remove the black bars above and below the photo.
  ['OWN IT.PNG', 'places/davis/own-it-team.jpg', (img) => img.extract({ left: 0, top: 177, width: 419, height: 557 })],
  ['OWN IT 4.JPG', 'places/davis/own-it-piggyback.jpg'],
  ['OWN IT Festival.JPG', 'places/davis/wellness-festival.jpg'],
  ['MGT 120.webp', 'places/davis/mgt120-team.jpg'],

  // Sacramento
  ['Gail Pellerin Image.jpg', 'places/sacramento/capitol-office.jpg'],
  ['Gail Pellerin 2.jpg', 'places/sacramento/capitol-dome.jpg'],
  ['Gail Pellerin 3.jpg', 'places/sacramento/o-street.jpg'],

  // Washington, DC
  ['Joint Center.jpg', 'places/dc/rooftop-cohort.jpg'],

  // Phoenix
  ['Wells Fargo.JPG', 'places/phoenix/under-the-sign.jpg'],
  ['Wells Fargo 3.JPG', 'places/phoenix/marquee-letters.jpg'],
  ['Wells Fargo 1.jpg', 'places/phoenix/san-francisco-arch.jpg'],
  ['Wells Fargo Panel.JPEG', 'places/phoenix/intern-panel.jpg'],
  ['Wells Fargo Team.JPG', 'places/phoenix/hilltop-sunset.jpg'],
  ['Wells Fargo Friends.JPG', 'places/phoenix/red-rock-sunset.jpg'],
  ['Wells Fargo LA.JPG', 'places/phoenix/coastal-overlook.jpg'],
  // Crop out the browser bar, then blur every name label under the video tiles.
  ['Wells Team.JPG', 'places/phoenix/capstone-video-call.jpg', blurVideoCallNames],

  // MGT 120 slides
  ...[
    'story-13-costly-journey',
    'story-12-backlogs',
    'story-21-centralized-record',
    'story-26-prototype-dashboard',
    'story-27-prototype-case-record',
    'story-29-prototype-progress',
    'story-32-execution-timeline',
    'deliverable-03-problem-statement',
    'deliverable-04-root-cause-analysis',
    'deliverable-09-capabilities-map',
    'deliverable-16-pain-points-to-capabilities',
    'deliverable-22-sipoc',
    'deliverable-66-change-curve',
  ].map((name) => [`mgt120-slides/${name}.jpg`, `projects/mgt120/${name}.jpg`]),
  // Cover the line of teammates' names on the deck cover.
  ['mgt120-slides/story-01-cover.jpg', 'projects/mgt120/story-01-cover.jpg', coverDeckNames],
];

async function blurVideoCallNames(img) {
  // Crop to the grid of video tiles (drops the browser bar and chat preview).
  const top = 238;
  const base = await img.extract({ left: 0, top, width: 1215, height: 580 }).toBuffer();
  // Name labels sit in the bottom-left corner of each tile (coords in the original photo).
  const labels = [
    [0, 418], [288, 421], [588, 424], [890, 428],
    [0, 589], [280, 592], [585, 595], [890, 600],
    [115, 767], [428, 770], [735, 773],
  ];
  const overlays = await Promise.all(
    labels.map(async ([x, y]) => {
      const left = Math.max(0, x);
      const box = { left, top: y - top, width: 125, height: 34 };
      const patch = await sharp(base).extract(box).blur(9).toBuffer();
      return { input: patch, left: box.left, top: box.top };
    }),
  );
  return sharp(base).composite(overlays);
}

async function coverDeckNames(img) {
  const { width } = await img.metadata();
  // Paper colour of the folder, sampled from an empty area of the slide.
  const { data } = await img.clone().extract({ left: 300, top: 1080, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  const patch = await sharp({
    create: { width: 1380, height: 110, channels: 3, background: { r, g, b } },
  }).png().toBuffer();
  return img.composite([{ input: patch, left: Math.round(width * 0.22), top: 960 }]);
}

for (const [src, dest, edit] of jobs) {
  const out = join(OUT, dest);
  mkdirSync(dirname(out), { recursive: true });
  let img = sharp(join(RAW, src)).rotate(); // respect phone orientation
  if (edit) img = await edit(img);
  // Re-read so edits are flattened before resizing.
  const buf = await img.jpeg({ quality: 92 }).toBuffer();
  await sharp(buf)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
  console.log('✓', dest);
}
