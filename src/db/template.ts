// Wyatt's standard week, transcribed from BRIEF.md. Loaded by `npm run db:seed`.
// Times the brief doesn't pin down (Saturday, Sunday) are placeholders, editable later.

export interface SeedProject {
  key: string;
  name: string;
  color: string;
  parent?: string;
}

export const SEED_PROJECTS: SeedProject[] = [
  { key: "nth", name: "Nth Cycle", color: "#f97316" },
  { key: "exercise", name: "Exercise", color: "#16a34a" },
  { key: "run", name: "Run", color: "#4ade80", parent: "exercise" },
  { key: "walk", name: "Walk/stretch", color: "#86efac", parent: "exercise" },
  { key: "personal", name: "Personal projects", color: "#3b82f6" },
  { key: "family", name: "Family time", color: "#ec4899" },
  { key: "home", name: "Home projects", color: "#14b8a6" },
  { key: "cooking", name: "Cooking", color: "#eab308" },
  { key: "date", name: "Date", color: "#b4838d" },
  { key: "adventure", name: "Adventure", color: "#8a9a6b" },
  { key: "guys", name: "Guys' night", color: "#7d86a3" },
  { key: "commute", name: "Commute", color: "#a3a3a3" },
  { key: "bed", name: "Bed", color: "#9b8fb5" },
  { key: "planning", name: "Planning", color: "#94a3b8" },
];

export interface SeedBlock {
  start: string;
  end: string;
  title: string;
  project: string | null; // null = buffer
  tags?: string[];
  rotation?: [key: string, option: string];
}

const buffer = (start: string, end: string): SeedBlock => ({ start, end, title: "Buffer", project: null, tags: ["buffer"] });

const MONDAY_MORNING: SeedBlock[] = [
  { start: "5:00", end: "6:00", title: "Workout", project: "exercise" },
  { start: "6:00", end: "6:30", title: "Breakfast", project: "family", tags: ["on-call"] },
  { start: "6:30", end: "8:00", title: "Wolf and Gianna time, school drop-off", project: "family", tags: ["on-call"] },
  buffer("8:00", "8:30"),
  { start: "8:30", end: "9:00", title: "Go to co-working space", project: "commute" },
  { start: "9:00", end: "10:00", title: "Work", project: "nth" },
  { start: "10:00", end: "10:15", title: "Walk/stretch", project: "walk" },
  { start: "10:15", end: "11:30", title: "Work", project: "nth" },
  { start: "11:30", end: "12:30", title: "Run", project: "run" },
  { start: "12:30", end: "13:00", title: "Lunch", project: "family" },
  { start: "13:00", end: "14:00", title: "Work", project: "nth" },
  { start: "14:00", end: "16:00", title: "Personal project", project: "personal" },
];

const MONDAY: SeedBlock[] = [
  ...MONDAY_MORNING,
  buffer("16:00", "16:30"),
  { start: "16:30", end: "16:45", title: "Pick up Wolf", project: "family" },
  { start: "17:00", end: "17:30", title: "Family time", project: "family" },
  { start: "17:30", end: "18:30", title: "Cooking", project: "cooking" },
  { start: "18:30", end: "20:30", title: "Family time", project: "family" },
  { start: "20:30", end: "21:30", title: "Wind-down and bed", project: "bed" },
];

const FRIDAY: SeedBlock[] = [
  ...MONDAY_MORNING,
  buffer("16:00", "16:15"),
  { start: "16:15", end: "16:30", title: "Pick up Wolf", project: "family" },
  { start: "16:30", end: "17:30", title: "Family time", project: "family" },
  { start: "17:30", end: "18:30", title: "Cooking", project: "cooking" },
  { start: "18:30", end: "20:30", title: "Family time", project: "family" },
  { start: "20:30", end: "21:30", title: "Wind-down and bed", project: "bed" },
];

const TUESDAY_UNTIL_2PM: SeedBlock[] = [
  { start: "5:15", end: "6:15", title: "Exercise", project: "exercise" },
  { start: "6:15", end: "6:45", title: "Breakfast", project: "family" },
  { start: "6:45", end: "7:15", title: "Go to co-working space", project: "commute" },
  { start: "7:30", end: "9:00", title: "Work", project: "nth" },
  { start: "9:00", end: "10:00", title: "Run or workout", project: "exercise" },
  { start: "10:00", end: "11:00", title: "Work", project: "nth" },
  { start: "11:00", end: "11:15", title: "Stretch/walk", project: "walk" },
  { start: "11:15", end: "12:30", title: "Work", project: "nth" },
  { start: "12:30", end: "13:00", title: "Lunch", project: "family" },
  { start: "13:00", end: "14:00", title: "Work", project: "nth" },
];

const TUESDAY: SeedBlock[] = [
  ...TUESDAY_UNTIL_2PM,
  { start: "14:00", end: "17:00", title: "Date with Gianna", project: "date" },
  { start: "17:00", end: "17:30", title: "Pick up Wolf", project: "family" },
  { start: "17:30", end: "20:30", title: "Family time", project: "family" },
  { start: "20:30", end: "21:30", title: "Wind-down and bed", project: "bed" },
];

const THURSDAY: SeedBlock[] = [
  ...TUESDAY_UNTIL_2PM,
  { start: "14:00", end: "22:00", title: "Adventure", project: "adventure", rotation: ["thursday", "adventure"] },
  { start: "14:00", end: "22:00", title: "Guys' night", project: "guys", rotation: ["thursday", "guys-night"] },
];

const SATURDAY: SeedBlock[] = [
  { start: "7:00", end: "20:00", title: "Family day", project: "family", rotation: ["saturday", "family"] },
  { start: "7:00", end: "20:00", title: "Gianna adventure day", project: "adventure", rotation: ["saturday", "gianna-adventure"] },
  { start: "7:00", end: "20:00", title: "Wyatt adventure day", project: "adventure", rotation: ["saturday", "wyatt-adventure"] },
];

const SUNDAY: SeedBlock[] = [
  { start: "7:00", end: "12:00", title: "Family time", project: "family", rotation: ["sunday", "family"] },
  { start: "7:00", end: "12:00", title: "Home projects", project: "home", rotation: ["sunday", "home-projects"] },
  { start: "12:00", end: "16:00", title: "Family time", project: "family" },
  { start: "16:00", end: "16:30", title: "Weekly debrief", project: "planning" },
  { start: "16:30", end: "16:45", title: "Check in with Gianna: order ingredients", project: "cooking" },
  { start: "17:00", end: "17:15", title: "Plan date night with G", project: "date" },
  { start: "17:15", end: "20:30", title: "Family time", project: "family" },
  { start: "20:30", end: "21:30", title: "Wind-down and bed", project: "bed" },
];

/** Index 0 = Monday … 6 = Sunday */
export const SEED_WEEK: SeedBlock[][] = [MONDAY, TUESDAY, MONDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY];
