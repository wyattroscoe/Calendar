import { isRotationKey, rotationOption } from "./rotation";
import { weekDates, type ISODate } from "./time";

export interface TemplateBlockLike {
  id: number;
  weekday: number;
  startMin: number;
  endMin: number;
  projectId: number | null;
  title: string;
  tags: string[];
  rotationKey: string | null;
  rotationOption: string | null;
}

export interface GeneratedBlock {
  date: ISODate;
  startMin: number;
  endMin: number;
  projectId: number | null;
  title: string;
  tags: string[];
  source: "template";
  templateBlockId: number;
}

/** Copy the template into concrete dated blocks for one week, applying rotations. */
export function generateWeek(template: TemplateBlockLike[], weekStart: ISODate): GeneratedBlock[] {
  return weekDates(weekStart).flatMap((date, weekday) =>
    template
      .filter((t) => t.weekday === weekday)
      .filter((t) => !isRotationKey(t.rotationKey) || rotationOption(t.rotationKey, date) === t.rotationOption)
      .sort((a, b) => a.startMin - b.startMin)
      .map((t) => ({
        date,
        startMin: t.startMin,
        endMin: t.endMin,
        projectId: t.projectId,
        title: t.title,
        tags: t.tags,
        source: "template" as const,
        templateBlockId: t.id,
      })),
  );
}
