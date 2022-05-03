export enum TokenType {
  END = 0,
  WS = 1,
  ID = 2,
  NUMBER = 3,
  PUNC = 4,
}

export type Token = [TokenType, string, number, number];

const reTokenizer =
  /(\s+)|([$A-Za-z_][$A-Za-z0-9_/-]*)|([0-9]+(?:\.[0-9]*)?)|(==|!=|<=|>=|&&|\|\||[-:,\\.\\+\\*/%[\]()?!<>])/y;

/** Parser for complex observable expressions */
export class TokenStream {
  private tokens: Token[];
  private pos = 0;

  constructor(private input: string) {
    this.tokens = scan(input);
  }

  /** If the current token is the given punctuation character, consume it and return true,
      otherwise leave the state unchanged and return false.
  */
  public matchPunc(punc: string) {
    if (this.pos < this.tokens.length) {
      const [token, value] = this.tokens[this.pos];
      if (token === TokenType.PUNC && value === punc) {
        this.next();
        return true;
      }
    }
    return false;
  }

  /** Return the current token type. */
  public get token(): TokenType {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos][0];
    } else {
      return TokenType.END;
    }
  }

  /** Return the current token value. */
  public get value(): string {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos][1];
    } else {
      return '';
    }
  }

  /** Advance to the next token. */
  public next(): this {
    this.pos += 1;
    return this;
  }

  public get source(): string {
    return this.input;
  }

  public get tokenPos(): [number, number] | [] {
    if (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.length === 4) {
        return token.slice(2) as [number, number];
      }
    } else if (this.pos > 0 && this.pos - 1 < this.tokens.length) {
      const token = this.tokens[this.pos - 1];
      if (token.length === 4) {
        return token.slice(2) as [number, number];
      }
    }
    return [];
  }
}

export function scan(input: string) {
  const tokens: Token[] = [];
  reTokenizer.lastIndex = 0;
  while (reTokenizer.lastIndex < input.length) {
    const startCol = reTokenizer.lastIndex;
    const m = reTokenizer.exec(input);
    if (!m) {
      console.error(`Unexpected token: [${input}] @ ${reTokenizer.lastIndex}`);
      return [];
    } else if (m[1]) {
      continue;
    }

    const endCol = reTokenizer.lastIndex;
    if (m[2]) {
      tokens.push([TokenType.ID, m[2], startCol, endCol]);
    } else if (m[3]) {
      tokens.push([TokenType.NUMBER, m[3], startCol, endCol]);
    } else if (m[4]) {
      tokens.push([TokenType.PUNC, m[4], startCol, endCol]);
    }
  }
  return tokens;
}
