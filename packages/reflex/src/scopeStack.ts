import { batchUpdate } from './batched';
import { ITrackingScope } from './scope';
import { scopeStack } from './scopeStackInternal';

/** Set a human-readable name for the current scope (for debugging). */
export function setScopeName(name: string): void {
  const scope = scopeStack[scopeStack.length - 1];
  if (scope) {
    scope.debugName = name;
  }
}

export function getCurrentScope(): ITrackingScope | undefined {
  return scopeStack[scopeStack.length - 1];
}

export function runWithScope<T>(scope: ITrackingScope, action: () => T): T {
  scopeStack.push(scope);
  try {
    return batchUpdate(action);
    // } catch (e) {
    //   console.log('root', e);
    //   throw e;
  } finally {
    scopeStack.pop();
  }
}
