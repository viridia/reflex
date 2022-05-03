import { ITrackingScope } from './scope';

export let scopeStack: ITrackingScope[] = [];

/** Temporarily suppress tracking. */
export function untrack<T>(fn: () => T): T {
  // TODO: Do we want to set a flag instead?
  const savedStack = scopeStack;
  scopeStack = [];
  const result = fn();
  scopeStack = savedStack;
  return result;
}
