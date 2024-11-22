"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { Criterion, TradeDirection, TradingSetup } from "@/types";

import createServerActionLayer from "@/utils/server-action-wrapper";
import {
  criteriaEmbracements,
  positions,
  strategies,
  strategyCriteria,
} from "drizzle/schema";
import { db } from "..";
import { createBackendError } from "../error";
import { createUserTags } from "../tags";

const withAuthAndRevalidation = createServerActionLayer({
  authRequired: true,
  revalidationPath: "/trades",
});

export const applySetupAction = withAuthAndRevalidation(
  async (userId, id: number, setup: TradingSetup) => {
    try {
      const result = await db
        .update(positions)
        .set({ fkStrategyId: setup.id })
        .where(and(eq(positions.id, id), isNull(positions.fkStrategyId)))
        .returning();

      if (result.length === 0) {
        console.warn("Apply setup failed, 0 rows affected");
        return {
          data: null,
          error: createBackendError(
            "GENERIC_ERROR",
            "Could not update position strategyId, its already set"
          ),
        };
      }

      await db.insert(criteriaEmbracements).values(
        setup.criteria.map((c) => ({
          fkUserId: userId,
          fkStrategyId: setup.id,
          fkCriterionId: c.id,
          fkPositionId: id,
          order: c.order,
          embraced: !!c.embraced,
        }))
      );

      // Invalidate the cache
      const tag = createUserTags(userId).setups;
      revalidateTag(tag);

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error(error);
      return {
        data: null,
        error: createBackendError("NETWORK_FAILURE", "Failed to apply setup"),
      };
    }
  }
);

export const removeSetupAction = withAuthAndRevalidation(
  async (userId, positionId: number) => {
    try {
      const rowsAffected = await db
        .update(positions)
        .set({ fkStrategyId: null })
        .where(
          and(eq(positions.id, positionId), eq(positions.fkUserId, userId))
        )
        .returning();

      if (rowsAffected.length === 0) {
        return {
          data: null,
          error: createBackendError(
            "GENERIC_ERROR",
            "Could not remove setup from position"
          ),
        };
      }

      // Delete embracements on position
      const rows = await db
        .delete(criteriaEmbracements)
        .where(eq(criteriaEmbracements.fkPositionId, positionId));

      console.log("Criteria deleted", rows.length);

      // Invalidate the cache
      const tag = createUserTags(userId).setups;
      revalidateTag(tag);

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error("Error removing strategy:", error);
      return {
        data: null,
        error: createBackendError(
          "NETWORK_FAILURE",
          "Failed to remove strategy"
        ),
      };
    }
  }
);

export const updateSetupAction = withAuthAndRevalidation(
  async (userId, positionId: number, setup: TradingSetup) => {
    try {
      await db
        .delete(criteriaEmbracements)
        .where(eq(criteriaEmbracements.fkPositionId, positionId));

      await db.insert(criteriaEmbracements).values(
        setup.criteria.map((c) => ({
          fkUserId: userId,
          fkStrategyId: setup.id,
          fkCriterionId: c.id,
          fkPositionId: positionId,
          order: c.order,
          embraced: !!c.embraced,
        }))
      );

      // Invalidate the cache
      const tag = createUserTags(userId).setups;
      revalidateTag(tag);

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error("Error updating setup:", error);
      return {
        data: null,
        error: createBackendError("NETWORK_FAILURE", "Failed to update setup"),
      };
    }
  }
);

export const getPositionSetupAction = withAuthAndRevalidation(
  async (userId, positionId: number) => {
    try {
      const result = await db
        .selectDistinct({
          criterionId: criteriaEmbracements.fkCriterionId,
          symbol: positions.symbol,
          id: strategies.id,
          title: strategies.title,
          side: strategies.side,
          criterionTitle: strategyCriteria.title,
          embraced: criteriaEmbracements.embraced,
        })
        .from(positions)
        .leftJoin(strategies, eq(strategies.id, positions.fkStrategyId))
        .leftJoin(
          strategyCriteria,
          eq(strategyCriteria.fkStrategyId, strategies.id)
        )
        .innerJoin(
          criteriaEmbracements,
          and(
            eq(strategyCriteria.id, criteriaEmbracements.fkCriterionId),
            eq(criteriaEmbracements.fkPositionId, positionId)
          )
        )
        .where(
          and(eq(positions.id, positionId), eq(positions.fkUserId, userId))
        );

      if (result.length === 0 || !result[0]) {
        return {
          data: null,
          error: createBackendError("NOT_FOUND", "Position setup not found"),
        };
      }

      const setup: TradingSetup = {
        title: result[0].title as string,
        id: result[0].id as number,
        side: result[0].side as TradeDirection,
        criteria: result.map(
          (r: any) =>
            ({
              id: r.criterionId,
              title: r.criterionTitle,
              embraced: r.embraced,
            } as Criterion)
        ),
      };

      return { data: setup, error: null };
    } catch (error) {
      console.error("Error fetching position setup:", error);
      return {
        data: null,
        error: createBackendError(
          "NETWORK_FAILURE",
          "Failed to fetch position setup"
        ),
      };
    }
  }
);
