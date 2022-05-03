import { isBatched, isTracing, scheduleReactionSet } from './batched';
import { scopeStack } from './scopeStackInternal';
import { ITrackingScope, addDependency } from './scope';

export interface Atom {
  onObserved(): void;
  onChanged(msg?: string): void;
}

/** Creates a pair of functions for recording access to a dependency and signalling dependants. */
export function createAtom(): Atom {
  const subscriptions = new Set<ITrackingScope>();
  const onObserved = () => {
    const scope = scopeStack[scopeStack.length - 1];
    if (scope) {
      addDependency(scope, subscriptions);
    }
  };

  const onChanged = (msg: string) => {
    if (isTracing()) {
      console.log(`Atom.onChanged(${msg}), numObservers=${subscriptions.size}.`);
    }
    if (isBatched()) {
      // Don't modify until end of current batch.
      scheduleReactionSet([...subscriptions]);
    } else {
      for (const sub of [...subscriptions]) {
        sub.react();
      }
    }
  };

  return { onObserved, onChanged };
}
