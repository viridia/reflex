import { TokenStream, TokenType } from './TokenStream';
import { ASTNodeType, ASTValue, OpPrec } from './ASTNode';

type OpStackEntry = [number, ASTNodeType | ASTValue];

/** Parser for complex observable expressions */
export class FormulaParser {
  /** Parse an expression, returning an AST.
      @param input The text to parse.
      @visibleForTesting
   */
  public parseToAst(input: string): ASTValue {
    const tokens = new TokenStream(input);
    return this.expr(tokens);
  }

  protected expr(tokens: TokenStream): ASTValue {
    const result = this.binop(tokens);
    if (tokens.token !== TokenType.END) {
      this.syntaxError(`Unexpected input: ${tokens.value}`, tokens);
    }
    return result;
  }

  private binop(tokens: TokenStream): ASTValue {
    const result = this.unary(tokens);
    const opStack: OpStackEntry[] = [[0, result]];
    const reduce = (prec: number) => {
      while (opStack.length > 2) {
        const l = opStack.length;
        const [oldPrec, op] = opStack[l - 2] as [number, ASTNodeType];
        if (oldPrec < prec) {
          break;
        }
        const left = opStack[l - 3][1] as ASTValue;
        const right = opStack[l - 1][1] as ASTValue;
        opStack[l - 3][1] = { type: op, args: [left, right] };
        opStack.length = l - 2;
      }
    };

    while (tokens.token === TokenType.PUNC) {
      switch (tokens.value) {
        case '&&':
          tokens.next();
          reduce(OpPrec.LogicalAnd);
          opStack.push([OpPrec.LogicalAnd, 'land']);
          break;
        case '||':
          tokens.next();
          reduce(OpPrec.LogicalOr);
          opStack.push([OpPrec.LogicalOr, 'lor']);
          break;
        case '==':
          tokens.next();
          reduce(OpPrec.Equality);
          opStack.push([OpPrec.Equality, 'eq']);
          break;
        case '!=':
          tokens.next();
          reduce(OpPrec.Equality);
          opStack.push([OpPrec.Equality, 'ne']);
          break;
        case '>=':
          tokens.next();
          reduce(OpPrec.Relational);
          opStack.push([OpPrec.Relational, 'ge']);
          break;
        case '<=':
          tokens.next();
          reduce(OpPrec.Relational);
          opStack.push([OpPrec.Relational, 'le']);
          break;
        case '>':
          tokens.next();
          reduce(OpPrec.Relational);
          opStack.push([OpPrec.Relational, 'gt']);
          break;
        case '<':
          tokens.next();
          reduce(OpPrec.Relational);
          opStack.push([OpPrec.Relational, 'lt']);
          break;
        case '+':
          tokens.next();
          reduce(OpPrec.AddSub);
          opStack.push([OpPrec.AddSub, 'add']);
          break;
        case '-':
          tokens.next();
          reduce(OpPrec.AddSub);
          opStack.push([OpPrec.AddSub, 'sub']);
          break;
        case '*':
          tokens.next();
          reduce(OpPrec.MulDiv);
          opStack.push([OpPrec.MulDiv, 'mul']);
          break;
        case '/':
          tokens.next();
          reduce(OpPrec.MulDiv);
          opStack.push([OpPrec.MulDiv, 'div']);
          break;
        case '%':
          tokens.next();
          reduce(OpPrec.MulDiv);
          opStack.push([OpPrec.MulDiv, 'mod']);
          break;
        default:
          reduce(0);
          return opStack[0][1] as ASTValue;
      }

      const result = this.unary(tokens);
      if (result === undefined) {
        this.syntaxError('Expression expected', tokens);
      }

      opStack.push([0, result]);
    }

    reduce(0);
    return opStack[0][1] as ASTValue;
  }

  private unary(tokens: TokenStream): ASTValue {
    if (tokens.matchPunc('!')) {
      return { type: 'lnot', args: [this.unary(tokens)] };
    } else {
      return this.primary(tokens);
    }
  }

  private primary(tokens: TokenStream): ASTValue {
    let result: ASTValue;
    if (tokens.token === TokenType.ID) {
      result = tokens.value;
      tokens.next();
    } else if (tokens.token === TokenType.NUMBER) {
      result = Number(tokens.value);
      tokens.next();
    } else if (tokens.matchPunc('?')) {
      result = {
        type: 'placeholder',
        args: [],
      };
    } else if (tokens.matchPunc('(')) {
      const expr = this.binop(tokens);
      if (!tokens.matchPunc(')')) {
        this.syntaxError('Syntax error: expected ")"', tokens);
      }
      return expr;
    } else {
      this.syntaxError('Identifier expected', tokens);
    }

    for (;;) {
      if (tokens.matchPunc(':')) {
        if (tokens.token === TokenType.ID) {
          result = {
            type: 'scope',
            args: [result!, tokens.value],
          };
          tokens.next();
        } else {
          this.syntaxError('Identifier expected', tokens);
        }
      } else if (tokens.matchPunc('.')) {
        if (tokens.token === TokenType.ID) {
          result = {
            type: 'member',
            args: [result!, tokens.value],
          };
          tokens.next();
        } else {
          this.syntaxError('Identifier expected', tokens);
        }
      } else if (tokens.matchPunc('(')) {
        const args: ASTValue[] = [result];
        if (!tokens.matchPunc(')')) {
          for (;;) {
            const expr = this.binop(tokens);
            args.push(expr);
            if (tokens.matchPunc(')')) {
              break;
            } else if (!tokens.matchPunc(',')) {
              this.syntaxError('Syntax error: expected "," or ")"', tokens);
            }
          }
        }
        result = {
          type: 'call',
          args,
        };
      } else {
        break;
      }
    }
    return result;
  }

  private syntaxError(msg: string, tokens: TokenStream): never {
    const pos = tokens.tokenPos;
    if (pos.length === 2) {
      const [start, end] = pos;
      console.warn(tokens.source);
      console.warn(`${' '.repeat(start)}${'^'.repeat(end - start)}`);
    } else {
      console.warn(tokens.source);
    }
    throw new SyntaxError(msg);
  }
}
