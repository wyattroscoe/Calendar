import { and, asc, between, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, templateBlocks, weekBlocks, weeks } from "@/db/schema";
import { generateWeek } from "./generate-week";
import { addDays, type ISODate } from "./time";

/**
 * Creates a week's blocks from the template the first time it's opened.
 * After that the week is its own copy, so edits only ever affect that week.
 */
async function ensureWeek(userId: string, weekStart: ISODate): Promise<void> {
  const created = await db
    .insert(weeks)
    .values({ userId, weekStart })
    .onConflictDoNothing()
    .returning({ weekStart: weeks.weekStart });
  if (created.length === 0) return;

  const template = await db.select().from(templateBlocks).where(eq(templateBlocks.userId, userId));
  const blocks = generateWeek(template, weekStart).map((b) => ({ ...b, userId }));
  if (blocks.length > 0) await db.insert(weekBlocks).values(blocks);
}

export async function loadWeek(userId: string, weekStart: ISODate) {
  await ensureWeek(userId, weekStart);
  const [blocks, projectRows] = await Promise.all([
    db
      .select()
      .from(weekBlocks)
      .where(and(eq(weekBlocks.userId, userId), between(weekBlocks.date, weekStart, addDays(weekStart, 6))))
      .orderBy(asc(weekBlocks.date), asc(weekBlocks.startMin)),
    loadProjects(userId),
  ]);
  return { blocks, projects: projectRows };
}

export async function loadProjects(userId: string) {
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(asc(projects.sortOrder));
}
