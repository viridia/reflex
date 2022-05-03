import { scopeStack } from './scopeStackInternal';
import { addChildScope, cleanupScope, disposeScope, ITrackingScope } from './scope';
import { runWithScope } from './scopeStack';

/** Runs an action function once a condition becomes true.

    @param condition A reactive expression which returns a boolean.
    @param action An action which will get executed when the condition function returns true.
      The action will be performed in an untracked context.
    @returns A callback which can be used to cancel the condition.
 */
export function createWhen(
  condition: () => boolean,
  action: () => void,
): () => void {
  const react = () => {
    cleanupScope(scope);
    if (runWithScope(scope, condition)) {
      disposeScope(scope);
      action();
    }
  };

  const scope: ITrackingScope = {
    react,
    dependencies: new Set(),
    debugName: 'createWhen',
  };

  const parentScope = scopeStack[scopeStack.length - 1];
  if (parentScope) {
    addChildScope(parentScope, scope);
  }

  react();
  return () => disposeScope(scope);
}
