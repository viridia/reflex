import { scopeStack } from './scopeStackInternal';
import { addChildScope, disposeScope, ITrackingScope } from './scope';
import { runWithScope } from './scopeStack';

/** Create a tracking scope which is not auto-disposed, and run an effect within it. */
export function createRoot<T>(
  action: (dispose: () => void) => T,
  detachedParent?: ITrackingScope
): T {
  const scope: ITrackingScope = {
    react: () => {}, // Root scope has no default reaction.
    dependencies: new Set(),
  };

  const dispose = () => {
    disposeScope(scope);
  };

  const parentScope = detachedParent ?? scopeStack[scopeStack.length - 1];
  if (parentScope) {
    addChildScope(parentScope, scope);
  }

  return runWithScope(scope, () => action(dispose));
}
