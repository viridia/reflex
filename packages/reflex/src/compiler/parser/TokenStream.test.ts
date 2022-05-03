import { scan, TokenStream, TokenType } from './TokenStream';

describe('scan', () => {
  test('whitespace', () => {
    expect(scan('')).toEqual([]);
    expect(scan('   ')).toEqual([]);
    expect(scan('\n')).toEqual([]);
  });

  test('ident', () => {
    expect(scan('a')).toEqual([[TokenType.ID, 'a', 0, 1]]);
    expect(scan('   abc   ')).toEqual([[TokenType.ID, 'abc', 3, 6]]);
    expect(scan('a-10')).toEqual([[TokenType.ID, 'a-10', 0, 4]]);
    expect(scan('a b c')).toEqual([
      [TokenType.ID, 'a', 0, 1],
      [TokenType.ID, 'b', 2, 3],
      [TokenType.ID, 'c', 4, 5],
    ]);
    expect(scan('a/b')).toEqual([[TokenType.ID, 'a/b', 0, 3]]);
  });

  test('number', () => {
    expect(scan('0')).toEqual([[TokenType.NUMBER, '0', 0, 1]]);
    expect(scan('10')).toEqual([[TokenType.NUMBER, '10', 0, 2]]);
    expect(scan('10.')).toEqual([[TokenType.NUMBER, '10.', 0, 3]]);
    expect(scan('10.22')).toEqual([[TokenType.NUMBER, '10.22', 0, 5]]);
  });

  test('punc', () => {
    expect(scan(',')).toEqual([[TokenType.PUNC, ',', 0, 1]]);
    expect(scan(':,')).toEqual([
      [TokenType.PUNC, ':', 0, 1],
      [TokenType.PUNC, ',', 1, 2],
    ]);
    expect(scan('.')).toEqual([[TokenType.PUNC, '.', 0, 1]]);
    expect(scan('[')).toEqual([[TokenType.PUNC, '[', 0, 1]]);
    expect(scan(']')).toEqual([[TokenType.PUNC, ']', 0, 1]]);
    expect(scan('(')).toEqual([[TokenType.PUNC, '(', 0, 1]]);
    expect(scan(')')).toEqual([[TokenType.PUNC, ')', 0, 1]]);
    expect(scan('&&')).toEqual([[TokenType.PUNC, '&&', 0, 2]]);
    expect(scan('||')).toEqual([[TokenType.PUNC, '||', 0, 2]]);
    expect(scan('==')).toEqual([[TokenType.PUNC, '==', 0, 2]]);
    expect(scan('!=')).toEqual([[TokenType.PUNC, '!=', 0, 2]]);
    expect(scan('>=')).toEqual([[TokenType.PUNC, '>=', 0, 2]]);
    expect(scan('<=')).toEqual([[TokenType.PUNC, '<=', 0, 2]]);
    expect(scan('>')).toEqual([[TokenType.PUNC, '>', 0, 1]]);
    expect(scan('<')).toEqual([[TokenType.PUNC, '<', 0, 1]]);
  });
});

describe('TokenStream', () => {
  test('scan', () => {
    const ts = new TokenStream('a.b(1)');
    expect(ts.token).toBe(TokenType.ID);
    expect(ts.value).toBe('a');
    ts.next();
    expect(ts.token).toBe(TokenType.PUNC);
    expect(ts.value).toBe('.');
    expect(ts.matchPunc(':')).toBe(false);
    expect(ts.matchPunc('.')).toBe(true);
    expect(ts.token).toBe(TokenType.ID);
    expect(ts.value).toBe('b');
    ts.next();
    expect(ts.matchPunc('(')).toBe(true);
    expect(ts.token).toBe(TokenType.NUMBER);
    expect(ts.value).toBe('1');
    ts.next();
    expect(ts.matchPunc(')')).toBe(true);
    expect(ts.token).toBe(TokenType.END);
    ts.next();
    expect(ts.token).toBe(TokenType.END);
  });
});
