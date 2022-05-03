import { disposeScope, ITrackingScope } from './scope';
import { batchUpdate } from './batched';

/** An explicitly-created tracking scope. */
export class TrackingScope implements ITrackingScope {
  /** The set of all observables we are currently subscribed to. */
  public dependencies = new Set<Set<ITrackingScope>>();
  public cleanup?: Array<() => void>;

  /** Create a new reaction context.
      @param action A task which is automatically re-run whenever its dependent data changes.
   */
  constructor(public readonly action: () => void, public debugName?: string) {}

  /** Unsubscribe from all observables */
  public dispose() {
    disposeScope(this);
  }

  /** Run a reaction function when any observable signals a change. */
  public react() {
    batchUpdate(this.action);
  }

  /** Return the number of observables tracked. Mainly used in unit tests. */
  public get size(): number {
    return this.dependencies ? this.dependencies.size : 0;
  }
}
