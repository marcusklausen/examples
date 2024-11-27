"use server";

import { db } from "src/db";
import { resources as resourcesSchema } from "../../../drizzle/schema";

export async function getResources() {
  return await db.select().from(resourcesSchema);
}

export async function getAllTags() {
  return await db.query.resources
    .findMany({
      columns: {
        tags: true,
      },
    })
    .then((res) => Array.from(new Set(res.map((r) => r.tags).flat())));
}
