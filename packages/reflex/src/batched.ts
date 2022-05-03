import { ITrackingScope } from './scope';

let pendingReactions = new Set<ITrackingScope>();
let pendingUpdates = new Set<() => void>();
let inBatch = 0;
let inTrace = 0;

export function isBatched() {
  return inBatch > 0;
}

export function batchUpdate<T>(action: () => T, trace = false): T {
  if (trace) {
    inTrace++;
  }
  inBatch++;
  try {
    return action();
  } finally {
    if (--inBatch === 0) {
      let iterations = 0;
      while (pendingUpdates.size > 0 || pendingReactions.size > 0) {
        const updates = pendingUpdates;
        pendingUpdates = new Set();
        updates.forEach(fn => fn());

        const reactions = pendingReactions;
        pendingReactions = new Set();
        for (const tc of reactions) {
          if (inTrace) {
            console.log(`reaction from context: ${tc.debugName ?? '<unnamed>'}`);
          }
          tc.react();
        }
        ++iterations;
        if (iterations > 32) {
          console.error('Batch update did not converge, quitting.');
          break;
        }
      }
    }
    if (trace) {
      --inTrace;
    }
  }
}

export function scheduleUpdate(update: () => void) {
  if (inBatch > 0) {
    pendingUpdates.add(update);
  } else {
    throw Error('Mutation not in batch');
  }
}

export function unscheduleReaction(tc: ITrackingScope) {
  pendingReactions.delete(tc);
}

export function ensureBatch() {
  if (inBatch < 1) {
    throw Error('Mutation not in batch');
  }
}

export function scheduleReactionSet(tcSet: Iterable<ITrackingScope> | undefined) {
  if (tcSet) {
    for (const tc of tcSet) {
      pendingReactions.add(tc);
    }
  }
}

export function beginTracing() {
  inTrace++;
}

export function endTracing() {
  inTrace--;
}

export function isTracing() {
  return inTrace > 0;
}

// Allow tracing from the JS console
(globalThis as any).reflex = {
  beginTracing,
  endTracing,
};
