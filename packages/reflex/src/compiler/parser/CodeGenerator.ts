import { fcall, flat, lit, OutputChunk, parens } from '../codegen/OutputChunk';
import { ASTNode, astToString, ASTValue, isAstNode, OpPrec } from './ASTNode';
import { CompilationError } from './errors';
import {
  assignable,
  formatDescriptor,
  ITypeDescriptor,
  plainBooleanType,
  plainFloatType,
  plainIntegerType,
} from '../../descriptors';
import { INameResolver } from './INameResolver';

export class CodeGenerator {
  constructor(private resolver: INameResolver) {}

  public genChunk(ast: ASTValue, requireType?: ITypeDescriptor<any>): OutputChunk {
    const walk = (ast: ASTValue): OutputChunk => {
      if (isAstNode(ast)) {
        switch (ast.type) {
          case 'scope': {
            const scopeType = ast.args[0];
            const scopeName = ast.args[1];

            if (typeof scopeName !== 'string') {
              throw new CompilationError(`Invalid scope name: ${astToString(scopeName)}`);
            }

            if (typeof scopeType !== 'string') {
              throw new CompilationError(`Invalid scope name: ${astToString(scopeType)}`);
            }

            const sym = this.resolver.scopedName(scopeType, scopeName);
            if (sym) {
              // TODO:
              return lit(sym.type, scopeName);
              // return sym;
            }

            throw new CompilationError(`Undefined symbol: ${ast}`);
          }

          case 'member': {
            const propName = ast.args[1];
            if (typeof propName !== 'string') {
              throw new CompilationError(`Invalid property name: ${astToString(propName)}`);
            }

            const base = walk(ast.args[0]);
            const chunk = this.resolver.memberName(base, propName);
            if (chunk) {
              return chunk;
            }

            // Resolve member name relative to scope.
            throw new CompilationError(`Member ${propName} not found.`);
          }

          case 'call': {
            const callable = ast.args[0];
            if (typeof callable !== 'string') {
              throw new CompilationError(`Invalid function name: ${astToString(callable)}`);
            }
            const args = ast.args.slice(1).map(walk);
            const result = this.resolver.call(callable, args);
            if (!result) {
              throw new CompilationError(`Unknown function name: ${astToString(callable)}`);
            }
            return this.resolver.separateHookCall(callable, result);
          }

          case 'land':
          case 'lor': {
            const args = flatten(ast).map(walk).map(castToBoolean);
            switch (ast.type) {
              case 'land':
                return infixPrecedence(plainBooleanType, '&&', args, OpPrec.LogicalAnd);
              case 'lor':
                return infixPrecedence(plainBooleanType, '||', args, OpPrec.LogicalOr);
            }
            break;
          }

          case 'lnot': {
            const args = flatten(ast).map(walk).map(castToBoolean);
            return flat(plainBooleanType, lit(plainBooleanType, '!'), args[0]);
          }

          case 'eq': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainBooleanType, '===', args, OpPrec.Equality);
          }

          case 'ne': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainBooleanType, '!==', args, OpPrec.Equality);
          }

          case 'gt': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainBooleanType, '>', args, OpPrec.Relational);
          }

          case 'ge': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainBooleanType, '>=', args, OpPrec.Relational);
          }

          case 'lt': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainBooleanType, '<', args, OpPrec.Relational);
          }

          case 'le': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainBooleanType, '<=', args, OpPrec.Relational);
          }

          case 'add': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainFloatType, '+', args, OpPrec.AddSub);
          }

          case 'sub': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainFloatType, '-', args, OpPrec.AddSub);
          }

          case 'mul': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainFloatType, '*', args, OpPrec.MulDiv);
          }

          case 'div': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainFloatType, '/', args, OpPrec.MulDiv);
          }

          case 'mod': {
            const args = ast.args.map(walk).map(castToFloat);
            return infixPrecedence(plainFloatType, '%', args, OpPrec.MulDiv);
          }

          default: {
            throw new CompilationError(`Invalid AST: ${astToString(ast)}`);
          }
        }
      } else if (typeof ast === 'string') {
        const sym = this.resolver.unqualifiedName(ast);
        if (sym) {
          return sym;
        }

        throw new CompilationError(`Undefined symbol: ${ast}`);
      } else if (typeof ast === 'number') {
        if (Math.trunc(ast) === ast) {
          return lit(plainIntegerType, String(ast));
        } else {
          return lit(plainFloatType, String(ast));
        }
      } else {
        throw new CompilationError(`Invalid AST type: ${astToString(ast)}`);
      }
    };

    try {
      const result = walk(ast);
      if (requireType) {
        const castResult = castIfNeeded(result, requireType);
        if (castResult) {
          return castResult;
        }
        throw new CompilationError(
          `Expected expression "${astToString(ast)}" to be type ${formatDescriptor(
            requireType!
          )}, but was ${formatDescriptor(result.type)}.`
        );
      }
      return result;
    } catch (e) {
      console.error('Input source:', astToString(ast));
      throw e;
    }
  }
}

function flatten(root: ASTNode): ASTValue[] {
  const out: ASTValue[] = [];
  const walk = (ast: ASTValue) => {
    if (!isAstNode(ast) || ast.type !== root.type) {
      out.push(ast);
    } else {
      ast.args.forEach(arg => walk(arg));
    }
  };
  walk(root);
  return out;
}

export function castIfNeeded(arg: OutputChunk, type: ITypeDescriptor<any>): OutputChunk | null {
  switch (type.kind) {
    case 'boolean':
      if (arg.type.kind === 'boolean') {
        return arg;
      } else if (arg.type.kind === 'nullable' || arg.type.kind === 'optional') {
        // Nullable and optional args can be implicitly cast to boolean.
        return fcall(plainBooleanType, 'Boolean', [arg]);
      } else {
        return null;
      }
    // case 'float':
    //   return castToFloat(arg);
    default:
      if (!assignable(type, arg.type)) {
        return null;
      }
      return arg;
  }
}

function castToBoolean(arg: OutputChunk): OutputChunk {
  if (arg.type.kind === 'boolean') {
    return arg;
  } else if (arg.type.kind === 'nullable' || arg.type.kind === 'optional') {
    // Nullable and optional args can be implicitly cast to boolean.
    return fcall(plainBooleanType, 'Boolean', [arg]);
  } else {
    throw new CompilationError(
      `Expected boolean expression, type was ${formatDescriptor(arg.type)}.`
    );
  }
}

function castToFloat(arg: OutputChunk): OutputChunk {
  if (assignable(plainFloatType, arg.type)) {
    return arg;
  } else {
    throw new CompilationError(
      `Expected numeric expression, type was ${formatDescriptor(arg.type)}.`
    );
  }
}

function infixPrecedence(
  type: ITypeDescriptor<unknown>,
  fn: string,
  args: OutputChunk[],
  precedence: OpPrec
): OutputChunk {
  if (precedence !== undefined) {
    args = args.map(arg => {
      if (arg.kind === 'infix' && arg.precedence !== undefined) {
        if (arg.precedence < precedence) {
          return parens(arg.type, arg);
        } else if (arg.precedence === precedence && (fn === '-' || fn === '/' || fn === '%')) {
          return parens(arg.type, arg);
        }
      }
      return arg;
    });
  }
  return {
    kind: 'infix',
    type,
    fn,
    args,
    precedence,
  };
}
