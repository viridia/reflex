/* eslint-disable no-new-func */
import { INameResolver } from './INameResolver';
import { TokenStream } from './TokenStream';
import { ITypeDescriptor, plainBooleanType } from '../../descriptors';
import { infix, OutputChunk, ret } from '../codegen/OutputChunk';
import { printToString } from '../codegen/print';
import { ASTValue } from './ASTNode';
import { FormulaParser } from './FormulaParser';
import { CodeGenerator } from './CodeGenerator';

/** Compiles a formula expression to a JavaScript function. */
export class FormulaCompiler extends FormulaParser {
  constructor(private resolver: INameResolver) {
    super();
  }

  /** Parse an observable expression.
      @param input The text to parse.
      @param requireType If present, the result must be assignable to this type or it's an error.
   */
  public parseExpression(input: string, requireType?: ITypeDescriptor<any>): () => unknown {
    this.resolver.reset();
    const gen = new CodeGenerator(this.resolver);
    const tokens = new TokenStream(input);
    const ast = this.expr(tokens);
    const term = gen.genChunk(ast, requireType);

    const statements = [...this.resolver.getPrologue(), ret(infix(plainBooleanType, '&&', term))];

    const js = printToString(statements, 60);
    // console.log(js);
    return new Function('ctx', `"use strict";\n${js}`) as () => boolean;
  }

  /** Parse a boolean predicate expression.
      @param input A single expression or list of expressions in source form. If there are multiple
        expressions, they will be AND-ed together.
      @returns A compiled JS function that evaluates the expression.
  */
  public parsePredicate(input: string | string[]): () => boolean {
    const inputs = Array.isArray(input) ? input : [input];

    this.resolver.reset();
    const gen = new CodeGenerator(this.resolver);
    const terms: OutputChunk[] = [];
    inputs.forEach(src => {
      const tokens = new TokenStream(src);
      const ast = this.expr(tokens);
      const term = gen.genChunk(ast, plainBooleanType);
      terms.push(term);
    });

    const statements = [...this.resolver.getPrologue()];
    if (terms.length > 0) {
      statements.push(ret(infix(plainBooleanType, '&&', ...terms)));
    }

    const js = printToString(statements, 60);
    // console.log(js);
    return new Function('ctx', `"use strict";\n${js}`) as () => boolean;
  }

  /** Parse a list of commands.
      @param input A single method call or list of calls in source form.
  */
  public parseMutation(input: string | string[]): (ctx: any) => void {
    const src = Array.isArray(input) ? input : [input];

    this.resolver.reset();
    const gen = new CodeGenerator(this.resolver);
    const mutations: OutputChunk[] = [];
    src.forEach(src => {
      const tokens = new TokenStream(src);
      const ast = this.expr(tokens);
      const term = gen.genChunk(ast);
      mutations.push(term);
    });

    const statements = [...this.resolver.getPrologue(), ...mutations];
    const js = printToString(statements, 60);
    // console.log(js);
    return new Function('ctx', `"use strict";\n${js}`) as (ctx: any) => void;
  }

  /** Parse an observable expression.
      @param input The text to parse.
      @param requireType If present, the result must be assignable to this type or it's an error.
   */
  public parseToJs(input: string, requireType?: ITypeDescriptor<any>): string {
    const tokens = new TokenStream(input);
    const ast = this.expr(tokens);
    return this.gen(ast, requireType);
  }

  private gen(ast: ASTValue, requireType?: ITypeDescriptor<any>): string {
    this.resolver.reset();
    const gen = new CodeGenerator(this.resolver);
    const chunks = gen.genChunk(ast, requireType);
    const statements = [...this.resolver.getPrologue()];
    statements.push(ret(chunks));
    return printToString(statements, 60);
  }
}
