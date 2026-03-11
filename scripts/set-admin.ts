import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

const email = process.argv[2];

if (!email) {
  console.error("Usage: pnpm set-admin <email>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

async function main() {
  const result = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    console.error(`User with email "${email}" not found`);
    process.exit(1);
  }

  const user = result[0];

  if (user.role === "admin") {
    console.log(`User "${email}" is already an admin`);
    process.exit(0);
  }

  await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
  console.log(`User "${email}" is now an admin`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
