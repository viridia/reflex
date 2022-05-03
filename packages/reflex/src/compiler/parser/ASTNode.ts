export type ASTNodeType =
  | 'call'
  | 'member'
  | 'scope'
  | 'placeholder'
  | 'land'
  | 'lor'
  | 'lnot'
  | 'eq'
  | 'ne'
  | 'le'
  | 'lt'
  | 'ge'
  | 'gt'
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'mod'
  | 'lit-str';

export enum OpPrec {
  Lowest = 0,
  LogicalOr = 6,
  LogicalAnd = 7,
  Equality = 11,
  Relational = 12,
  AddSub = 14,
  MulDiv = 15,
}

export interface ASTNode {
  type: ASTNodeType;
  args: Array<ASTValue>;
}

export type ASTValue = ASTNode | string | number;

export function isAstNode(value: ASTValue): value is ASTNode {
  return typeof value === 'object' && (value as any).type;
}

export function astToString(ast: ASTValue): string {
  if (isAstNode(ast)) {
    switch (ast.type) {
      case 'scope':
        return `${astToString(ast.args[0])}:${astToString(ast.args[1])}:`;
      case 'member':
        return `${astToString(ast.args[0])}.${astToString(ast.args[1])}:`;
      case 'call':
        return `${astToString(ast.args[0])}(${ast.args.slice(1).map(astToString)})`;
      default:
        return `<invalid ast type: ${ast.type}>`;
    }
  } else {
    return String(ast);
  }
}
