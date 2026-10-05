import { date, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

// Every table carries user_id so multiple users / share links can be added later.
// Times of day are stored as minutes since midnight; dates as YYYY-MM-DD.

const userId = () => text("user_id").notNull();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: userId(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const templateBlocks = pgTable("template_blocks", {
  id: serial("id").primaryKey(),
  userId: userId(),
  weekday: integer("weekday").notNull(), // 0 = Monday … 6 = Sunday
  startMin: integer("start_min").notNull(),
  endMin: integer("end_min").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  tags: text("tags").array().notNull().default([]),
  rotationKey: text("rotation_key"), // e.g. "thursday"
  rotationOption: text("rotation_option"), // e.g. "guys-night"
});

/** Records which weeks have been generated from the template, so edits are never overwritten. */
export const weeks = pgTable(
  "weeks",
  {
    userId: userId(),
    weekStart: date("week_start", { mode: "string" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weekStart] })],
);

export const weekBlocks = pgTable("week_blocks", {
  id: serial("id").primaryKey(),
  userId: userId(),
  date: date("date", { mode: "string" }).notNull(),
  startMin: integer("start_min").notNull(),
  endMin: integer("end_min").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  tags: text("tags").array().notNull().default([]),
  source: text("source").notNull().default("manual"), // template | manual | agent | google | teams
  templateBlockId: integer("template_block_id"),
  percent: integer("percent"), // null until marked
  markedAt: timestamp("marked_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: userId(),
  title: text("title").notNull(),
  month: integer("month").notNull(), // 1–12
  exactDate: date("exact_date", { mode: "string" }),
  windowStart: date("window_start", { mode: "string" }),
  windowEnd: date("window_end", { mode: "string" }),
  link: text("link"),
  notes: text("notes"),
  lastSurfacedAt: timestamp("last_surfaced_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: userId(),
  title: text("title").notNull(),
  link: text("link"),
  ingredients: text("ingredients"),
  lastCooked: date("last_cooked", { mode: "string" }),
  createdAt: createdAt(),
});

export const agentMemory = pgTable("agent_memory", {
  id: serial("id").primaryKey(),
  userId: userId(),
  content: text("content").notNull(),
  kind: text("kind"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const debriefs = pgTable("debriefs", {
  id: serial("id").primaryKey(),
  userId: userId(),
  weekStart: date("week_start", { mode: "string" }).notNull(),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  decisions: jsonb("decisions"),
  createdAt: createdAt(),
});

export type Project = typeof projects.$inferSelect;
export type WeekBlock = typeof weekBlocks.$inferSelect;
