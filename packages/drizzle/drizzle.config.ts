import { defineConfig } from "drizzle-kit"
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
})
