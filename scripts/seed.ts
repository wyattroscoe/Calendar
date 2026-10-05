import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, templateBlocks } from "@/db/schema";
import { SEED_PROJECTS, SEED_WEEK } from "@/db/template";
import { OWNER_ID } from "@/lib/owner";
import { parseTime } from "@/lib/time";

// Loads the projects and weekly template from BRIEF.md. Safe to re-run: does nothing if already seeded.
async function main() {
  const existing = await db.select({ id: projects.id }).from(projects).where(eq(projects.userId, OWNER_ID)).limit(1);
  if (existing.length > 0) {
    console.log("Already seeded — skipping.");
    return;
  }

  const ids = new Map<string, number>();
  for (const [i, p] of SEED_PROJECTS.entries()) {
    const [row] = await db
      .insert(projects)
      .values({ userId: OWNER_ID, name: p.name, color: p.color, parentId: p.parent ? ids.get(p.parent) : null, sortOrder: i })
      .returning({ id: projects.id });
    ids.set(p.key, row.id);
  }

  const rows = SEED_WEEK.flatMap((day, weekday) =>
    day.map((b) => ({
      userId: OWNER_ID,
      weekday,
      startMin: parseTime(b.start),
      endMin: parseTime(b.end),
      projectId: b.project ? ids.get(b.project)! : null,
      title: b.title,
      tags: b.tags ?? [],
      rotationKey: b.rotation?.[0] ?? null,
      rotationOption: b.rotation?.[1] ?? null,
    })),
  );
  await db.insert(templateBlocks).values(rows);
  console.log(`Seeded ${ids.size} projects and ${rows.length} template blocks.`);
}

// Exit explicitly: the database client keeps the process alive otherwise.
main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
