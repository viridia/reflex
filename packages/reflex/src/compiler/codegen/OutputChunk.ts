import { ITypeDescriptor, opaqueType } from '../../descriptors';

export const voidType = opaqueType<void>();

export interface ICallOptions {
  isHook?: boolean;
  isIdempotent?: boolean;
}

/** Line-wrapping styles:

    * flat - prefer to break in as few places as possible.
*/
export type OutputChunk =
  | { type: ITypeDescriptor<unknown>; kind: 'parens' | 'brackets'; fragments: OutputChunk[] }
  | { type: ITypeDescriptor<unknown>; kind: 'flat'; fragments: (OutputChunk | string)[] }
  | { type: ITypeDescriptor<unknown>; kind: 'stmt' | 'ret'; fragments: OutputChunk[] }
  | { type: ITypeDescriptor<unknown>; kind: 'lit'; fragments: string }
  | {
      type: ITypeDescriptor<unknown>;
      kind: 'infix';
      fn: string;
      args: OutputChunk[];
      precedence?: number;
    }
  | {
      type: ITypeDescriptor<unknown>;
      kind: 'fcall';
      fn: string;
      args: OutputChunk[];
      opts: ICallOptions;
    };

export const parens = (
  type: ITypeDescriptor<unknown>,
  ...fragments: OutputChunk[]
): OutputChunk => ({
  kind: 'parens',
  type,
  fragments,
});

export const brackets = (
  type: ITypeDescriptor<unknown>,
  ...fragments: OutputChunk[]
): OutputChunk => ({
  kind: 'brackets',
  type,
  fragments,
});

export const flat = (
  type: ITypeDescriptor<unknown>,
  ...fragments: (OutputChunk | string)[]
): OutputChunk => ({
  kind: 'flat',
  type,
  fragments,
});

export const fcall = (
  type: ITypeDescriptor<unknown>,
  fn: string,
  args: OutputChunk[],
  opts: ICallOptions = {}
): OutputChunk => ({
  kind: 'fcall',
  type,
  fn,
  args,
  opts,
});

export const infix = (
  type: ITypeDescriptor<unknown>,
  fn: string,
  ...args: OutputChunk[]
): OutputChunk => ({
  kind: 'infix',
  type,
  fn,
  args,
});

export const stmt = (arg: OutputChunk): OutputChunk => ({
  kind: 'stmt',
  type: voidType,
  fragments: [arg],
});

export const ret = (arg: OutputChunk): OutputChunk => ({
  kind: 'ret',
  type: voidType,
  fragments: [arg],
});

export const lit = (type: ITypeDescriptor<unknown>, text: string): OutputChunk => ({
  kind: 'lit',
  type,
  fragments: text,
});
