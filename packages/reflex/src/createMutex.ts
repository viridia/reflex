import { Atom, createAtom } from './createAtom';

export { createAtom } from './createAtom';

export interface IMutexLock {
  held: boolean;
  release(): void;
}

/** Create a reactive mutex.

    Call acquire() to acquire the lock. If the mutex is not locked already, this will
    succeed immediately, otherwise the lock will go into a queue.

    The `held` attribute of the mutex will react when the lock state of the mutex changes.
*/
export function createMutex(): () => IMutexLock {
  const queue: Atom[] = [];

  const acquire = (): IMutexLock => {
    const atom = createAtom();

    const lock: IMutexLock = {
      get held(): boolean {
        atom.onObserved();
        return queue[0] === atom;
      },

      release: () => {
        const index = queue.indexOf(atom);
        if (index >= 0) {
          // Remove this lock from the queue.
          queue.splice(index, 1);
          // If this was first in the queue (in other words, the lock was held)
          if (index === 0) {
            atom.onChanged();

            // Inform the head of the queue that they have the lock.
            if (queue.length > 0) {
              queue[0].onChanged();
            }
          }
        }
      },
    };

    queue.push(atom);
    return lock;
  };

  return acquire;
}
