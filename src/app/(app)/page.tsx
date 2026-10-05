import { WeekView } from "@/components/week/WeekView";
import { requireUser } from "@/lib/auth";
import { isISODate, localNow, startOfWeek } from "@/lib/time";
import { loadWeek } from "@/lib/weeks";

export default async function WeekPage({ searchParams }: PageProps<"/">) {
  const userId = await requireUser();
  const { week } = await searchParams;
  const timeZone = process.env.APP_TIMEZONE || "America/Los_Angeles";
  const now = localNow(timeZone);
  const weekStart = startOfWeek(isISODate(week) ? week : now.date);
  const { blocks, projects } = await loadWeek(userId, weekStart);

  return (
    <WeekView
      key={weekStart}
      weekStart={weekStart}
      initialBlocks={blocks}
      projects={projects}
      initialNow={now}
      timeZone={timeZone}
    />
  );
}
