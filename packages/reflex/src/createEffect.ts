import { scopeStack } from './scopeStackInternal';
import { addChildScope, cleanupScope, disposeScope, ITrackingScope } from './scope';
import { runWithScope } from './scopeStack';

/** Runs a function with side effects. Will re-run the function if any of its dependencies
    change.

    @param action An action which gets run immediately, and then re-run when dependencies change.
      It gets passed the value of the previous execution.
    @param value An initial value which gets passed to the action the first time.
    @returns A callback which can be used to dispose this effect.
 */
export function createEffect<T>(action: (value: T | undefined) => T, value?: T): () => void {
  const react = () => {
    cleanupScope(scope);
    runWithScope(scope, () => action(value));
  };

  const scope: ITrackingScope = {
    react,
    dependencies: new Set(),
    debugName: 'createEffect',
  };

  const parentScope = scopeStack[scopeStack.length - 1];
  if (parentScope) {
    addChildScope(parentScope, scope);
  }

  react();
  return () => disposeScope(scope);
}
