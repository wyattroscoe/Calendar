import { execSync } from "node:child_process";

// Runs during Vercel's production build: applies migrations and seeds the template
// (seeding skips if already done). Does nothing locally or on preview deploys.
if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set — skipping database setup. Add the Neon database in Vercel → Storage.");
  } else {
    execSync("npm run setup", { stdio: "inherit" });
  }
}
