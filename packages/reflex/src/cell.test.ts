import {
  field,
  IPropertyDescriptors,
  plainBooleanType,
  plainIntegerType,
  plainStringType,
} from './descriptors';
import { createEffect } from './createEffect';
import { cellGetter, cellSetter, cellType, makeCell, makeCells, makeFormulaCell } from './cell';

export { makeCell } from './cell';

interface ITestObject {
  s: string;
  n: number;
  b: boolean;
}

class TestClass {
  public s: string = 'w';
}

describe('cell', () => {
  test('makeCell', () => {
    const obj = {} as ITestObject;
    makeCell(obj, 'b', plainBooleanType, false);
    makeCell(obj, 'n', plainIntegerType, 7);
    makeCell(obj, 's', plainStringType, 'test');

    expect(obj.b).toBe(false);
    expect(obj.n).toBe(7);
    expect(obj.s).toBe('test');

    expect(cellType(obj, 'b')?.kind).toBe('boolean');
    expect(cellType(obj, 'n')?.kind).toBe('integer');
    expect(cellType(obj, 's')?.kind).toBe('string');
    expect(cellType(obj as any, 'x')).toBeNull();
  });

  test('makeCell (mutate)', () => {
    const obj = {} as ITestObject;
    makeCell(obj, 'b', plainBooleanType, false);
    makeCell(obj, 'n', plainIntegerType, 7);
    makeCell(obj, 's', plainStringType, 'test');

    obj.b = true;
    obj.n = 8;
    obj.s = 'done';

    expect(obj.b).toBe(true);
    expect(obj.n).toBe(8);
    expect(obj.s).toBe('done');
  });

  test('makeCell (react)', () => {
    const obj = {} as ITestObject;
    makeCell(obj, 'b', plainBooleanType, false);

    const effectFn = jest.fn().mockImplementation(() => obj.b);

    createEffect(effectFn);
    expect(effectFn).toHaveBeenCalledTimes(1);
    obj.b = true;
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  test('makeCell should create a getter', () => {
    const obj = {} as ITestObject;
    makeCell(obj, 'b', plainBooleanType, false);
    makeCell(obj, 'n', plainIntegerType, 7);
    makeCell(obj, 's', plainStringType, 'test');

    expect(cellGetter(obj, 'b')?.()).toBe(false);
    expect(cellGetter(obj, 'n')?.()).toBe(7);
    expect(cellGetter(obj, 's')?.()).toBe('test');
    expect(() => cellGetter(obj as any, 'x')).toThrow();
  });

  test('makeCell should create a setter', () => {
    const obj = {} as ITestObject;
    makeCell(obj, 'b', plainBooleanType, false);
    makeCell(obj, 'n', plainIntegerType, 7);
    makeCell(obj, 's', plainStringType, 'test');

    cellSetter(obj, 'b')?.(true);
    cellSetter(obj, 'n')?.(8);
    cellSetter(obj, 's')?.('done');

    expect(obj.b).toBe(true);
    expect(obj.n).toBe(8);
    expect(obj.s).toBe('done');
  });

  test('should be able to make formula cells', () => {
    const obj = {} as ITestObject;
    makeFormulaCell(obj, 'n', plainIntegerType, () => 1 + 2);
    expect(obj.n).toBe(3);
  });

  test('should be able to make cells on a plain object', () => {
    const obj = {} as ITestObject;
    const props: IPropertyDescriptors<ITestObject> = {
      s: field(plainStringType, { default: 'def' }),
      n: field(plainIntegerType),
    };

    makeCells(obj, props);

    expect(obj.s).toBe('def');
    expect(obj.b).toBeUndefined();
    expect(obj.n).toBeUndefined();
  });

  test('should be able to make cells on a class instance', () => {
    const obj = new TestClass();
    makeCells(obj, {
      s: field(plainStringType, { default: 'def' }),
    });

    expect(obj.s).toBe('def');
  });

  test('should use the existing property value if no default specified', () => {
    const obj = new TestClass();
    makeCells(obj, {
      s: field(plainStringType),
    });

    expect(obj.s).toBe('w');

    const obj2 = new TestClass();
    obj2.s = ''; // Falsey
    makeCells(obj2, {
      s: field(plainStringType),
    });

    expect(obj2.s).toBe('');
  });

  test('makeCell (replace and restore)', () => {
    const obj = {} as ITestObject;
    makeCell(obj, 'n', plainIntegerType, 77);
    expect(obj.n).toBe(77);

    const prop = Object.getOwnPropertyDescriptor(obj, 'n');

    makeFormulaCell(obj, 'n', plainIntegerType, () => 1 + 2);
    expect(obj.n).toBe(3);
    expect(() => { obj.n = 4 }).toThrow();

    makeCell(obj, 'n', plainIntegerType, 79);
    expect(obj.n).toBe(79);

    Reflect.defineProperty(obj, 'n', prop!);
    expect(obj.n).toBe(77);
  });
});
