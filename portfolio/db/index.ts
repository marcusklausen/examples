import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as relations from "../../drizzle/relations";
import * as schema from "../../drizzle/schema";

config({ path: ".env" });

const client = postgres(process.env.DATABASE_URL as string);

export const db = drizzle(client, { schema: { ...schema, ...relations } });

export * as Schema from "../../drizzle/schema";
