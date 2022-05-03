import { unscheduleReaction } from './batched';

type Dependency = Set<ITrackingScope>;

/** Keeps track of a set of observables and reacts to changes. */
export interface ITrackingScope {
  /** The set of sets that include this scope. We need to remove ourselves from each
      of these sets when we get disposed.
   */
  dependencies: Set<Dependency>;

  /** String used to identify this scope. */
  debugName?: string;

  /** List of bound contexts. */
  contexts?: Record<symbol, any>;

  /** Array of cleanup functions to run when this scope is disposed. */
  cleanup?: Array<() => void>;

  /** Reaction function which is called when observables change. */
  react: () => void;

  /** Parent scope of this scope. */
  parentScope?: ITrackingScope;

  /** List of child scopes that get cleaned up when this scope does. */
  childScopes?: Set<ITrackingScope>;
}

/** Add a tracking scope as a subscriber to a reaction. */
export function addDependency(scope: ITrackingScope, dependency: Dependency) {
  dependency.add(scope);
  scope.dependencies.add(dependency);
}

/** Add a child scope to a tracking scope. */
export function addChildScope(parent: ITrackingScope, child: ITrackingScope) {
  if (!parent.childScopes) {
    parent.childScopes = new Set();
  }
  parent.childScopes.add(child);
  child.parentScope = parent;
}

/** Dispose of a scope. */
export function cleanupScope(scope: ITrackingScope) {
  if (scope.childScopes) {
    for (const child of scope.childScopes) {
      cleanupScope(child);
    }
    // Is this correct or not?
    scope.childScopes.clear();
  }
  if (scope.cleanup) {
    for (const cleanup of scope.cleanup) {
      cleanup();
    }
    scope.cleanup.length = 0;
  }
  for (const dep of scope.dependencies) {
    dep.delete(scope);
  }
  scope.dependencies.clear();
}

export function disposeScope(scope: ITrackingScope) {
  cleanupScope(scope);
  unscheduleReaction(scope);
  if (scope.parentScope) {
    scope.parentScope.childScopes?.delete(scope);
    scope.parentScope = undefined;
  }
}
