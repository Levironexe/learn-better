import { z } from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const SectionWriteSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().regex(slugPattern, 'slug must be lowercase alphanumeric with hyphens').optional(),
  content_markdown: z.string().optional(),
  display_order: z.number().int().positive().optional(),
})

export const SectionPatchSchema = SectionWriteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
)

export const ItemWriteSchema = z.object({
  title: z.string().min(1).max(255),
  anchor_id: z.string().regex(slugPattern, 'anchor_id must be lowercase alphanumeric with hyphens').optional(),
  display_order: z.number().int().positive().optional(),
})

export const ItemPatchSchema = ItemWriteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
)

export type SectionWrite = z.infer<typeof SectionWriteSchema>
export type ItemWrite = z.infer<typeof ItemWriteSchema>
