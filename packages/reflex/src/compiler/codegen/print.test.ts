import { printToString } from './print';
import { flat, parens, fcall, infix, stmt, lit } from './OutputChunk';
import { opaqueType } from '../../descriptors';

const type = opaqueType();

const x = lit(type, 'x');
const y = lit(type, 'y');
const z = lit(type, 'z');
const assign = lit(type, ' = ');

describe('print', () => {
  test('flat', () => {
    expect(printToString(flat(type, ';'), 16)).toBe(`;`);
    expect(printToString(flat(type, x, assign, y, ';'), 16)).toBe(`x = y;`);
  });

  test('parens', () => {
    expect(printToString(parens(type, x), 16)).toBe(`(x)`);
    expect(printToString(parens(type, x, assign, y), 16)).toBe(`(x = y)`);
  });

  test('fcall', () => {
    expect(printToString(fcall(type, 'x', []), 16)).toBe(`x()`);
    expect(printToString(fcall(type, 'x', [y, y, z]), 16)).toBe(`x(y, y, z)`);
  });

  test('infix', () => {
    expect(printToString(infix(type, '+', x), 16)).toBe(`x`);
    expect(printToString(infix(type, '+', x, y, z), 16)).toBe(`x + y + z`);
    expect(
      printToString(infix(type, '+', lit(type, 'x123456789'), lit(type, 'y123456789')), 16)
    ).toBe(
      `x123456789 +
  y123456789`
    );
  });

  test('fcall', () => {
    expect(printToString(stmt(x), 16)).toBe(`x;`);
  });
});
