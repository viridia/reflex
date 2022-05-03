import { OutputChunk } from '../codegen/OutputChunk';

/** Object used to resolve names while compiling formulas. */
export interface INameResolver {
  /** Reset the prologue and the name table. */
  reset(): void;

  /** Return the list of statements in the prologue. */
  getPrologue(): OutputChunk[];

  /** A scoped name is of the form `scope:name`, and is used to access global resources. */
  scopedName(scope: string, name: string): OutputChunk | null;

  /** Resolve a simple identifier into an output chunk. */
  unqualifiedName(name: string): OutputChunk | null;

  /** Resolve a member name of the form `expression.name`. */
  memberName(base: OutputChunk, name: string): OutputChunk | null;

  /** Construct a formula for a function call. */
  call(name: string, args: OutputChunk[]): OutputChunk | null;

  /** Make sure hooks are called unconditionally. */
  separateHookCall(name: string, sym: OutputChunk): OutputChunk;

  /** Generate a unique id. */
  genId(base: string): string;
}
