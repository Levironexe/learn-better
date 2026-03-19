import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// profiles mirrors auth.users (1-to-1)
// FK to auth.users is defined in the SQL migration as a raw constraint
// because Drizzle cannot reference the auth schema
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  display_name: text('display_name').notNull(),
  avatar_url: text('avatar_url'),
  theme_preference: text('theme_preference').notNull().default('light'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const lesson_plans = pgTable('lesson_plans', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const lesson_sections = pgTable(
  'lesson_sections',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    lesson_plan_id: uuid('lesson_plan_id')
      .notNull()
      .references(() => lesson_plans.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content_markdown: text('content_markdown').notNull().default(''),
    display_order: integer('display_order').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_section_slug').on(table.lesson_plan_id, table.slug),
  ]
)

export const lesson_items = pgTable(
  'lesson_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    section_id: uuid('section_id')
      .notNull()
      .references(() => lesson_sections.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    anchor_id: text('anchor_id').notNull(),
    body_markdown: text('body_markdown').notNull().default(''),
    display_order: integer('display_order').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_item_anchor').on(table.section_id, table.anchor_id),
  ]
)

export const chat_messages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    lesson_plan_id: uuid('lesson_plan_id')
      .notNull()
      .references(() => lesson_plans.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('role_check', sql`${table.role} IN ('user', 'assistant')`)]
)

// Relations for db.query relational API
export const lessonPlansRelations = relations(lesson_plans, ({ many }) => ({
  sections: many(lesson_sections),
}))

export const lessonSectionsRelations = relations(lesson_sections, ({ one, many }) => ({
  lessonPlan: one(lesson_plans, {
    fields: [lesson_sections.lesson_plan_id],
    references: [lesson_plans.id],
  }),
  items: many(lesson_items),
}))

export const lessonItemsRelations = relations(lesson_items, ({ one }) => ({
  section: one(lesson_sections, {
    fields: [lesson_items.section_id],
    references: [lesson_sections.id],
  }),
}))

export type Profile = typeof profiles.$inferSelect
export type LessonPlan = typeof lesson_plans.$inferSelect
export type LessonSection = typeof lesson_sections.$inferSelect
export type LessonItem = typeof lesson_items.$inferSelect
export type ChatMessage = typeof chat_messages.$inferSelect
