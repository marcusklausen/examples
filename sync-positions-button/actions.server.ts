'use server';

import { Ratelimit } from '@upstash/ratelimit';

import ccxt, { type Exchange } from 'ccxt';
import { eq, sql } from 'drizzle-orm';
import { createBackendError, db } from '@/data-access';
// Ensure these interfaces are correctly imported
import createServerActionLayer from '@/utils/server-action-wrapper';
import { exchanges, positions, userProfiles } from 'drizzle/schema';
import {
  generatePositions,
  groupOrdersByZeroSum,
  sortOrdersDescending,
} from './helpers';

const isRateLimitEnabled =
  (process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview') &&
  process.env.KV_REST_API_URL !== undefined &&
  process.env.KV_REST_API_TOKEN !== undefined;

const withAuthAndRevalidation = createServerActionLayer({
  authRequired: true,
  revalidationPath: '/trades',
});

export const syncPositionsAction = withAuthAndRevalidation(
  async (userId, symbol) => {
    if (isRateLimitEnabled) {
      console.log('is enabled');
      /**
       * Basically it's disabled in local development because
       * we dont have the env vars as I don't want to pay for multiple kv stores.
       *
       * If @vercel/kv was not imported dynamically the action would throw in local dev due to missing env vars
       */
      const { default: kv } = await import('@vercel/kv');
      const ratelimit = new Ratelimit({
        redis: kv,
        // 5 requests from the same IP in 10 seconds
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        enableProtection: process.env.NODE_ENV === 'production',
      });

      const { success } = await ratelimit.limit(userId);
      if (!success) {
        return {
          data: null,
          error: createBackendError(
            'RATE_LIMITED',
            'Ratelimited',
            'You have been ratelimited. Please try again in 60 seconds.'
          ),
        };
      }
    }

    try {
      // 1. Retrieve user profile with active exchange details
      const [userProfile] = await db
        .select({
          activeExchange: userProfiles.fkActiveExchangeId,
          exchangeCcxtKey: exchanges.ccxtObjectKey,
        })
        .from(userProfiles)
        .where(eq(userProfiles.fkUserId, userId))
        .leftJoin(exchanges, eq(exchanges.id, userProfiles.fkActiveExchangeId));

      if (!userProfile.exchangeCcxtKey) {
        console.error('No exchange found for user.');
        return {
          data: null,
          error: createBackendError(
            'GENERIC_ERROR',
            'No exchange found',
            'Missing primary exchange. Please set your primary exchange under API Connections.'
          ),
        };
      }

      // 2. Retrieve API keys from the database
      const [apiKeys] = await db.execute(sql`
      SELECT 
        user_api_keys.fk_exchange_id,
        key_secret.decrypted_secret AS api_key,
        secret_secret.decrypted_secret AS api_secret
      FROM user_api_keys
      INNER JOIN vault.decrypted_secrets AS key_secret ON user_api_keys.fk_key_id = key_secret.id
      INNER JOIN vault.decrypted_secrets AS secret_secret ON user_api_keys.fk_secret_id = secret_secret.id
      WHERE user_api_keys.fk_user_id = ${userId}
      AND user_api_keys.fk_exchange_id = ${userProfile.activeExchange}
    `);

      if (!apiKeys) {
        console.error('API keys not found for user.');
        return {
          data: null,
          error: createBackendError(
            'GENERIC_ERROR',
            'API Keys Missing',
            'No API keys found, please set up your API keys.'
          ),
        };
      }

      const sandbox =
        process.env.NODE_ENV === 'development' ||
        process.env.VERCEL_ENV === 'preview';
      if (sandbox) {
        console.warn('Exchange API is in sandbox mode.');
      }

      // 3. Initialize exchange instance
      // @ts-ignore
      const exchangeInstance = new ccxt[userProfile.exchangeCcxtKey]({
        apiKey: apiKeys.api_key,
        secret: apiKeys.api_secret,
        // Optional: Enable verbose for debugging
        // verbose: true,
      }) as Exchange;
      exchangeInstance.setSandboxMode(sandbox);

      // 4. Fetch trades for 'RADUSDT'
      const orders = await exchangeInstance.fetchCanceledAndClosedOrders(
        symbol,
        new Date().getTime() - 1000 * 60 * 60 * 24 * 7, // 24 hours ago
        1000,
        undefined
      );

      const sortedOrders = sortOrdersDescending(orders);
      const sortedOrdersWithFilled = sortedOrders.filter((o) => o.filled > 0);

      const groups = groupOrdersByZeroSum(sortedOrdersWithFilled);
      const generatedPositions = generatePositions(groups);

      // TODO: need to get latest position and remove anything earlier than that

      if (!userProfile.activeExchange) {
        return {
          data: null,
          error: createBackendError(
            'GENERIC_ERROR',
            'No active exchange',
            'No active exchange found for the user.'
          ),
        };
      }

      await db.insert(positions).values(
        generatedPositions.map((p) => ({
          fkUserId: userId,
          fkExchangeId: userProfile.activeExchange as number,
          openTimestamp: p.openTimestamp,
          closeTimestamp: p.closeTimestamp,
          averageEntry: p.averageEntryPrice,
          averageExit: p.averageExitPrice,
          quoteQuantity: p.quoteQuantity,
          quantity: p.quantity,
          side: p.side,
          symbol: p.symbol,
          pnl: p.pnl,
        }))
      );

      return {
        data: { status: 'success' },
        error: null,
      };
    } catch (error) {
      console.error('Error in syncTradesAction:', error);
      return {
        data: null,
        error: createBackendError(
          'GENERIC_ERROR',
          'Failed to sync trades',
          'An error occurred while syncing trades.'
        ),
      };
    }
    // Yes down here
    // @link https://nextjs.org/docs/app/api-reference/functions/redirect
  }
);
