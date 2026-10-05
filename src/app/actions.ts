"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { projects, weekBlocks, type WeekBlock } from "@/db/schema";
import { endSession, passwordMatches, requireUser, startSession } from "@/lib/auth";
import { DAY_END, DAY_START, isISODate, SLOT } from "@/lib/time";

// Every action checks the session itself: server actions are reachable by direct POST.

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 750)); // slow down guessing
    return "That password didn't match.";
  }
  await startSession();
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export interface BlockInput {
  date: string;
  startMin: number;
  endMin: number;
  title: string;
  projectId: number | null;
}

function validTimes(startMin: number, endMin: number) {
  return (
    Number.isInteger(startMin) &&
    Number.isInteger(endMin) &&
    startMin % SLOT === 0 &&
    endMin % SLOT === 0 &&
    startMin >= DAY_START &&
    endMin <= DAY_END &&
    endMin > startMin
  );
}

async function ownedProjectId(userId: string, projectId: number | null): Promise<number | null> {
  if (projectId === null) return null;
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  if (!row) throw new Error("Unknown project.");
  return row.id;
}

export async function createBlock(input: BlockInput): Promise<WeekBlock> {
  const userId = await requireUser();
  if (!isISODate(input.date) || !validTimes(input.startMin, input.endMin)) throw new Error("Invalid block.");
  const [row] = await db
    .insert(weekBlocks)
    .values({
      userId,
      date: input.date,
      startMin: input.startMin,
      endMin: input.endMin,
      title: input.title.trim() || "New block",
      projectId: await ownedProjectId(userId, input.projectId),
      source: "manual",
    })
    .returning();
  return row;
}

/** Edits apply to this week's copy only — the template is never touched here. */
export async function updateBlock(id: number, input: Partial<BlockInput>): Promise<WeekBlock> {
  const userId = await requireUser();
  const [current] = await db.select().from(weekBlocks).where(and(eq(weekBlocks.id, id), eq(weekBlocks.userId, userId)));
  if (!current) throw new Error("Block not found.");

  const next = {
    date: input.date ?? current.date,
    startMin: input.startMin ?? current.startMin,
    endMin: input.endMin ?? current.endMin,
    title: input.title !== undefined ? input.title.trim() || current.title : current.title,
    projectId: input.projectId !== undefined ? await ownedProjectId(userId, input.projectId) : current.projectId,
  };
  if (!isISODate(next.date) || !validTimes(next.startMin, next.endMin)) throw new Error("Invalid block.");

  const [row] = await db.update(weekBlocks).set(next).where(eq(weekBlocks.id, id)).returning();
  return row;
}

export async function deleteBlock(id: number): Promise<void> {
  const userId = await requireUser();
  await db.delete(weekBlocks).where(and(eq(weekBlocks.id, id), eq(weekBlocks.userId, userId)));
}

/** percent: 0–100, or null to clear the mark. */
export async function setCompletion(id: number, percent: number | null): Promise<WeekBlock> {
  const userId = await requireUser();
  if (percent !== null && !(Number.isInteger(percent) && percent >= 0 && percent <= 100)) {
    throw new Error("Percent must be 0–100.");
  }
  const [row] = await db
    .update(weekBlocks)
    .set({ percent, markedAt: percent === null ? null : new Date() })
    .where(and(eq(weekBlocks.id, id), eq(weekBlocks.userId, userId)))
    .returning();
  if (!row) throw new Error("Block not found.");
  return row;
}

export async function updateProject(id: number, input: { name?: string; color?: string }): Promise<void> {
  const userId = await requireUser();
  const patch: { name?: string; color?: string } = {};
  if (input.name !== undefined && input.name.trim()) patch.name = input.name.trim();
  if (input.color !== undefined) {
    if (!/^#[0-9a-f]{6}$/i.test(input.color)) throw new Error("Invalid color.");
    patch.color = input.color;
  }
  if (Object.keys(patch).length === 0) return;
  await db.update(projects).set(patch).where(and(eq(projects.id, id), eq(projects.userId, userId)));
  revalidatePath("/", "layout");
}
