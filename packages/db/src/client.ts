import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

/**
 * Postgres via Neon's HTTP driver — stateless, safe for serverless (Vercel)
 * and long-running processes alike. Migrations are not run at runtime;
 * apply the schema with `pnpm --filter @zveil/db db:push` (drizzle-kit push).
 */
export function createDb(url: string) {
  return drizzle(neon(url), { schema });
}
