import { assignable, formatDescriptor, ITypeDescriptor } from '../../descriptors';
import { OutputChunk } from '../codegen/OutputChunk';
import { CompilationError } from './errors';
import { INameResolver } from './INameResolver';

type FunctionCtor = (resolver: INameResolver, args: OutputChunk[]) => OutputChunk;

interface IFunctionDefn {
  args: ITypeDescriptor<any>[];
  ctor: FunctionCtor;
}

interface IMutationDefn {
  args: ITypeDescriptor<any>[];
  ctor: FunctionCtor;
}

export type FunctionMap = Record<string, IFunctionDefn | IFunctionDefn[]>;
export type MutationMap = Record<string, IMutationDefn | IMutationDefn[]>;

function matchFunctionOverload(
  resolver: INameResolver,
  fnName: string,
  fn: IFunctionDefn,
  args: OutputChunk[],
  displayError: boolean
): OutputChunk | null {
  if (args.length > fn.args.length) {
    if (displayError) {
      throw new CompilationError(
        `Function "${fnName}" expects ${fn.args.length} arguments, received ${args.length}.`
      );
    } else {
      return null;
    }
  }
  for (let i = 0, ct = args.length; i < ct; i++) {
    const srcArgType = args[i].type;
    const dstArgType = fn.args[i];
    if (!assignable(dstArgType, srcArgType)) {
      if (displayError) {
        throw new CompilationError(
          `Function "${fnName}" expects argmument #${i + 1} to be type ${formatDescriptor(
            dstArgType
          )}, value provided was type ${formatDescriptor(srcArgType)}.`
        );
      } else {
        return null;
      }
    }
  }

  return fn.ctor(resolver, args);
}

export function findOverload(
  resolver: INameResolver,
  fnName: string,
  fn: IFunctionDefn | IFunctionDefn[],
  args: OutputChunk[]
): OutputChunk | null {
  if (Array.isArray(fn)) {
    for (let overload of fn) {
      const result = matchFunctionOverload(resolver, fnName, overload, args, false);
      if (result) {
        return result;
      }
    }

    throw new CompilationError(
      `No matching overload found for call of "${fnName}" with arguments (${args
        .map(arg => formatDescriptor(arg.type))
        .join(', ')}).`
    );
  } else {
    return matchFunctionOverload(resolver, fnName, fn, args, true);
  }
}
