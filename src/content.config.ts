// The shape of every content file. Adding a city, experience or project means
// adding a Markdown file in src/content/... that follows one of these schemas.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const photo = (image: any) =>
  z.object({
    src: image(),
    alt: z.string(), // describe the scene, never name anyone but Diya
    caption: z.string().optional(),
  });

const places = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/places' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(), // "Phoenix"
      region: z.string(), // "Arizona" or "Karnataka, India"
      order: z.number(), // position on the journey line (1 = first)
      years: z.string(), // "Summer 2026"
      summary: z.string(), // one line, shown on the map postcard
      tagline: z.string(), // big line at the top of the place page
      threeWords: z.tuple([z.string(), z.string(), z.string()]).optional(),
      coords: z.object({ lat: z.number(), lon: z.number() }),
      map: z.enum(['us', 'india']).default('us'),
      cluster: z.string().optional(), // places sharing a cluster share one map pin
      signature: z.enum(['chalkboard', 'bike', 'dome', 'capitol', 'card', 'none']).default('none'),
      accent: z.enum(['saffron', 'magenta', 'teal']).default('saffron'),
      gallery: z.array(photo(image)).default([]),
    }),
});

const experiences = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experiences' }),
  schema: ({ image }) =>
    z.object({
      place: reference('places'),
      org: z.string(),
      role: z.string(),
      dates: z.string(), // shown as written, e.g. "Summer 2025"
      start: z.string(), // "2025-06", only used for sorting
      summary: z.string(),
      highlights: z.array(z.string()).default([]),
      images: z.array(photo(image)).default([]),
      // The Markdown body below the frontmatter is the reflection.
      // Leave it empty and the page shows a "reflection coming soon" note.
      reflectionPrompts: z.array(z.string()).default([]),
      tbd: z.array(z.string()).default([]), // details still to confirm, shown as handwritten notes
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      kicker: z.string(),
      place: reference('places'),
      experience: reference('experiences').optional(),
      summary: z.string(),
      cover: photo(image),
      stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      slides: z.array(photo(image).extend({ zoom: z.boolean().default(false) })).default([]),
      order: z.number().default(0),
      stamp: z.string().optional(), // rubber stamp on the case file, e.g. "#2 IN CLASS"
      note: z.string().optional(), // short handwritten note from Diya
    }),
});

export const collections = { places, experiences, projects };
