"use server";

import { db } from "src/db";
import { resources } from "../../../../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function voteAction(direction: "up" | "down", resourceId: number) {
  // TODO: rate limit ip

  await db
    .update(resources)
    .set({
      votes:
        direction === "up"
          ? sql`${resources.votes} + 1`
          : sql`${resources.votes} - 1`,
    })
    .where(eq(resources.id, resourceId));

  revalidatePath("/");
}
