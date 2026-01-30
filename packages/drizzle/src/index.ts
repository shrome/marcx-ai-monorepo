import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./client";
import path from "node:path";

export * from "./client";
export * from "drizzle-orm";

const pkgRoot = path.dirname(
  require.resolve(".")
);

const migrationsFolder = path.join(pkgRoot, "../drizzle");
export function migrations(){
  return migrate(db, { migrationsFolder });
}
