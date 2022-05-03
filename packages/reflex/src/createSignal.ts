import { isBatched, scheduleReactionSet, scheduleUpdate } from './batched';
import { scopeStack } from './scopeStackInternal';
import { ITrackingScope, addDependency } from './scope';

export interface ISignalOptions<T> {
  equals?: false | ((value: T, prev: T) => boolean);
}

interface ISignalState<T> {
  value: T;
  nextValue: T;
  update: () => void;
}

type Reducer<T> = (prev: T) => T;

/** A reactive value holder. */
export function createSignal<T>(
  init: T,
  options?: ISignalOptions<T>
): [() => T, (value: T | Reducer<T>) => T] {
  const subscriptions = new Set<ITrackingScope>();
  const s: ISignalState<T> = {
    value: init,
    nextValue: init,
    update: () => {
      s.value = s.nextValue;
    },
  };

  const read = () => {
    const scope = scopeStack[scopeStack.length - 1];
    if (scope) {
      addDependency(scope, subscriptions);
    }
    return s.value;
  };

  const write = (next: T | Reducer<T>) => {
    const cmp = options?.equals;
    const nextValue = typeof next === 'function' ? (next as Reducer<T>)(s.value) : next;
    const equal = cmp ? cmp(s.value, nextValue) : cmp === false ? false : s.value === nextValue;
    if (!equal) {
      if (isBatched()) {
        // Don't modify until end of current batch.
        s.nextValue = nextValue;
        scheduleUpdate(s.update);
        scheduleReactionSet([...subscriptions]);
        return s.nextValue; // Return updated value.
      } else {
        s.value = nextValue;
        for (const sub of [...subscriptions]) {
          sub.react();
        }
      }
    }

    return s.value;
  };

  return [read, write];
}
