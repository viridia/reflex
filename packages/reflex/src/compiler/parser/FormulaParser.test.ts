import { FormulaParser } from './FormulaParser';

describe('FormulaParser', () => {
  let parser: FormulaParser;

  beforeEach(() => {
    parser = new FormulaParser();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('AST', () => {
    test('ident', () => {
      expect(parser.parseToAst('X')).toEqual('X');
    });

    test('number literal', () => {
      expect(parser.parseToAst('12')).toEqual(12);
    });

    test('member', () => {
      expect(parser.parseToAst('X')).toEqual('X');
      expect(parser.parseToAst('X.Y')).toEqual({
        type: 'member',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X:Y')).toEqual({
        type: 'scope',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X:Y.Z')).toEqual({
        type: 'member',
        args: [
          {
            type: 'scope',
            args: ['X', 'Y'],
          },
          'Z',
        ],
      });
    });

    test('call', () => {
      expect(parser.parseToAst('X(Y)')).toEqual({
        type: 'call',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X(?)')).toEqual({
        type: 'call',
        args: ['X', { type: 'placeholder', args: [] }],
      });
      expect(parser.parseToAst('X(?.Z)')).toEqual({
        type: 'call',
        args: ['X', { type: 'member', args: [{ type: 'placeholder', args: [] }, 'Z'] }],
      });
    });

    test('binop', () => {
      expect(parser.parseToAst('X && Y')).toEqual({
        type: 'land',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X || Y')).toEqual({
        type: 'lor',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X == Y')).toEqual({
        type: 'eq',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X != Y')).toEqual({
        type: 'ne',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X > Y')).toEqual({
        type: 'gt',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X < Y')).toEqual({
        type: 'lt',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X >= Y')).toEqual({
        type: 'ge',
        args: ['X', 'Y'],
      });
      expect(parser.parseToAst('X <= Y')).toEqual({
        type: 'le',
        args: ['X', 'Y'],
      });
    });

    test('binop prec', () => {
      expect(parser.parseToAst('X && Y && Z')).toEqual({
        type: 'land',
        args: [
          {
            type: 'land',
            args: ['X', 'Y'],
          },
          'Z',
        ],
      });
      expect(parser.parseToAst('X || Y && Z')).toEqual({
        type: 'lor',
        args: [
          'X',
          {
            type: 'land',
            args: ['Y', 'Z'],
          },
        ],
      });
      expect(parser.parseToAst('X && Y || Z')).toEqual({
        type: 'lor',
        args: [
          {
            type: 'land',
            args: ['X', 'Y'],
          },
          'Z',
        ],
      });
    });

    test.todo('precedence for other operators');
  });
});
