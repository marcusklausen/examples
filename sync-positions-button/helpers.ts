import { type Order } from 'ccxt';
import { Position } from '@/types/models/position';

//Sort orders by timestamp in descending order
export function sortOrdersDescending(orders: Order[]): Order[] {
  return orders.sort((a, b) => b.timestamp - a.timestamp);
}

export function sortOrdersAscending(orders: Order[]): Order[] {
  return orders.sort((a, b) => a.timestamp - b.timestamp);
}

function splitFees(
  orderSize: number,
  remainderToClose: number,
  newPositionSize: number,
  totalFees: number
) {
  // Calculate the ratios
  const closingRatio = remainderToClose / orderSize;
  const newPositionRatio = newPositionSize / orderSize;

  // Split the fees according to the ratios
  const closingFees = totalFees * closingRatio;
  const newPositionFees = totalFees * newPositionRatio;

  return {
    closingFees: Number(closingFees.toFixed(2)), // Fees for closing position
    newPositionFees: Number(newPositionFees.toFixed(2)), // Fees for new position
  };
}
export function splitOrder(order: Order, remainderSum: number) {
  const { closingFees, newPositionFees } = splitFees(
    order.filled,
    remainderSum,
    order.filled - remainderSum,
    order.fee?.cost || 0
  );

  return {
    /** This is the order that starts the new group/position */
    newOrder: {
      ...order,
      filled: Number((order.filled - remainderSum).toFixed(2)),
      fee: {
        ...order.fee,
        cost: newPositionFees,
        currency: order.fee?.currency,
      },
    } satisfies Order,

    /** This is the order that will close the current group/position */
    closingOrder: {
      ...order,
      filled: remainderSum,
      fee: {
        ...order.fee,
        cost: closingFees,
        currency: order.fee?.currency,
      },
    } satisfies Order,

    /** This is the starting sum for the new group after splitting the order */
    newSum: Number((order.filled - remainderSum).toFixed(2)),
  };
}

export function groupOrdersByZeroSum(orders: Order[]) {
  const groups: Order[][] = [[]];
  let currentGroup = groups[0];
  let currentSum = 0;

  // Used to determine if we should subtract or add the orders filled amount

  for (const order of orders) {
    currentSum = Number(currentSum.toFixed(2)); // JS floating point math is poop

    const anchor = groups[groups.length - 1]?.[0]?.side;
    const isNewGroup = currentGroup.length === 0;
    const isSameDirection = order.side === anchor;
    const isZeroSum = currentSum - order.filled === 0;
    const isOverflow = currentSum - order.filled < 0;

    if (isSameDirection) {
      // If same direction, add to the current group
      currentGroup.push(order);
      currentSum += order.filled;
      continue;
    }

    if (isZeroSum) {
      // Close the current group, and continue
      currentGroup.push(order);
      groups.push([]);
      currentSum = 0;

      currentGroup = groups[groups.length - 1];
      continue;
    }

    if (isNewGroup) {
      // Add the order to the current group
      currentGroup.push(order);
      currentSum = order.filled;
      continue;
    }

    if (isOverflow) {
      // If overflow, we need to split the order, and start a new group
      const { closingOrder, newOrder, newSum } = splitOrder(order, currentSum);

      // Add the closing order to the current group
      currentGroup.push(closingOrder);

      // Start new group only if anything is left over after splitting
      if (newSum > 0) {
        groups.push([newOrder]);
      }

      // Update the current sum and group
      currentSum = newSum;
      currentGroup = groups[groups.length - 1];
      continue;
    }

    // If we get here, the order is not a match
    currentGroup.push(order);
    currentSum -= order.filled;
  }

  return groups.filter((group) => group.length > 0);
}

export function generatePositions(orders: Order[][]) {
  const positions: Omit<Position, 'id'>[] = [];

  for (const group of orders) {
    const sortedOrders = sortOrdersAscending(group);
    const anchor = sortedOrders[0];

    // Calculate peak amount
    let runningSum = 0;
    const peakAmount = sortedOrders.reduce((peak, order) => {
      runningSum += order.side === anchor.side ? order.cost : -order.cost;
      return Math.max(peak, Math.abs(runningSum));
    }, 0);

    // Calculate weighted average entry price
    const entryOrders = sortedOrders.filter((o) => o.side === anchor.side);
    const averageEntryPrice = entryOrders.reduce((acc, order) => {
      return acc + (order.average || 0) * (order.filled / peakAmount);
    }, 0);

    // Calculate weighted average exit price
    const exitOrders = sortedOrders.filter((o) => o.side !== anchor.side);
    const totalExitAmount = exitOrders.reduce(
      (sum, order) => sum + order.filled,
      0
    );
    const averageExitPrice = exitOrders.reduce((acc, order) => {
      return acc + (order.average || 0) * (order.filled / totalExitAmount);
    }, 0);

    // This is wrong
    const pnl = calculatePnlWithFifo(sortedOrders);

    const position: Omit<Position, 'id'> = {
      pnl,
      side: anchor.side as 'buy' | 'sell',
      symbol: anchor.symbol,
      setup: undefined,
      openTimestamp: anchor.timestamp,
      closeTimestamp: sortedOrders[sortedOrders.length - 1].timestamp,
      averageEntryPrice,
      averageExitPrice,
      // TODO: which is whcih
      quantity: peakAmount,
      quoteQuantity: peakAmount,
      // TODO: only for debugging
    };

    positions.push(position);
  }
  return positions;
}

function calculatePnlWithFifo(orderGroup: Order[]): number {
  let totalPnl = 0;
  const anchor = orderGroup[0];
  const queue: Order[] = [];

  for (const currentOrder of orderGroup) {
    if (currentOrder.side === anchor.side) {
      queue.push({ ...currentOrder }); // Create a copy of the order
      continue;
    }

    let remainingExitAmount = currentOrder.filled;

    while (remainingExitAmount > 0 && queue.length > 0) {
      const queueOrder = queue[0];
      const matchedAmount = Math.min(remainingExitAmount, queueOrder.filled);

      // Calculate PNL for this matched amount
      const entryPrice = queueOrder.average || queueOrder.price;
      const exitPrice = currentOrder.average || currentOrder.price;
      const pnl =
        anchor.side === 'buy'
          ? (exitPrice - entryPrice) * matchedAmount
          : (entryPrice - exitPrice) * matchedAmount;

      totalPnl += pnl;

      // Update remaining amounts
      remainingExitAmount -= matchedAmount;
      queueOrder.filled -= matchedAmount;

      // Remove fully matched orders from the queue
      if (queueOrder.filled === 0) {
        queue.shift();
      }
    }
  }

  return Number(
    (
      totalPnl -
      orderGroup.reduce((acc, order) => acc + (order.fee?.cost || 0), 0)
    ).toFixed(4)
  );
}
