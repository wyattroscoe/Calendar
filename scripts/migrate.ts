import "dotenv/config";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { db } from "@/db";

// Applies the SQL files in ./drizzle to whichever database DATABASE_URL points at.
async function main() {
  const config = { migrationsFolder: "./drizzle" };
  if (process.env.DATABASE_URL) {
    await migrateNeon(db as unknown as Parameters<typeof migrateNeon>[0], config);
  } else {
    await migratePglite(db as unknown as Parameters<typeof migratePglite>[0], config);
  }
  console.log(`Migrations applied (${process.env.DATABASE_URL ? "hosted Postgres" : "local PGlite"}).`);
}

// Exit explicitly: the database client keeps the process alive otherwise.
main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
