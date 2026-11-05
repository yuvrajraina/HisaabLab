import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    readingMinutes: z.number(),
    relatedCalculators: z.array(z.string())
  })
});

export const collections = { blog };
