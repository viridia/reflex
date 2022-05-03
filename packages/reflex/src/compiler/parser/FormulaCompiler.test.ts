import {
  field,
  IStructTypeDescriptor,
  opaqueType,
  plainBooleanType,
  plainFloatType,
  plainIntegerType,
  structType,
} from '../../descriptors';
import { FormulaCompiler } from './FormulaCompiler';
import { CompilationError } from './errors';
import { INameResolver } from './INameResolver';
import { fcall, flat, lit, OutputChunk, stmt } from '../codegen/OutputChunk';
import { findOverload, FunctionMap } from './overloads';

const builtinFunctions: FunctionMap = {
  and: {
    args: [plainBooleanType, plainBooleanType],
    ctor: (resolver, args) => fcall(plainBooleanType, 'and', args),
  },
  flipFlop: {
    args: [plainBooleanType],
    ctor: (resolver, args) => fcall(plainBooleanType, 'ctx.useFlipFlop', args),
  },
  distance: [
    {
      args: [plainIntegerType],
      ctor: (resolver, args) => fcall(plainBooleanType, 'distance', args),
    },
    {
      args: [plainIntegerType, plainIntegerType],
      ctor: (resolver, args) => fcall(plainBooleanType, 'distance', args),
    },
  ],
};

const instanceType = structType({
  name: 'Instance',
  properties: {
    position: field(plainFloatType),
  },
});

const containerType = structType({
  name: 'Container',
  properties: {},
});

// const builtinMutations: FunctionMap = {
//   mutate: {
//     args: [plainBooleanType],
//     ctor: (resolver, args) => new TestMutation(args),
//   },
// };

const builtinNames: { [name: string]: (name: string) => OutputChunk } = {
  always: () => lit(plainBooleanType, 'true'),
  never: () => lit(plainBooleanType, 'false'),
  active: () => lit(instanceType, 'active'),
  player: () => fcall(instanceType, 'usePlayer', [], { isHook: true, isIdempotent: true }),
  self: () => fcall(instanceType, 'useSelf', [], { isHook: true, isIdempotent: true }),
  here: () => fcall(containerType, 'useHere', [], { isHook: true }),
};

const nt = opaqueType<void>();

class TestResolver implements INameResolver {
  private prologue = new Map<string, OutputChunk>();
  private names = new Set<string>();

  public reset() {
    this.prologue.clear();
    this.names.clear();
  }

  public getPrologue(): OutputChunk[] {
    const result: OutputChunk[] = [];
    this.prologue.forEach((value, key) => {
      result.push(stmt(flat(nt, `const ${key} = `, value)));
    });
    return result;
  }

  scopedName(scope: string, name: string): OutputChunk | null {
    return null;
  }

  unqualifiedName(name: string): OutputChunk | null {
    const sym = builtinNames[name]?.(name);
    if (sym) {
      if (sym.kind === 'fcall' && sym.opts.isHook) {
        if (sym.opts.isIdempotent) {
          if (!this.prologue.has(name)) {
            this.prologue.set(name, sym);
            this.names.add(name);
          }
        } else {
          const uniqueName = this.genId(name);
          this.prologue.set(uniqueName, sym);
        }
        return lit(sym.type, name);
      }
      return sym;
    }

    return null;
  }

  memberName(base: OutputChunk, name: string): OutputChunk | null {
    const baseType = base.type;
    if (baseType.kind === 'struct') {
      const prop = (baseType as IStructTypeDescriptor<any>).properties[name];
      if (prop) {
        return flat(prop.type, base, '.', name);
      }
    }
    return null;
  }

  call(name: string, args: OutputChunk[]): OutputChunk | null {
    const fn = builtinFunctions[name];
    if (!fn) {
      throw new CompilationError(`Function ${name} not found.`);
    }
    return findOverload(this, name, fn, args);
  }

  public separateHookCall(name: string, sym: OutputChunk): OutputChunk {
    if (sym.kind === 'fcall' && sym.opts.isHook) {
      if (sym.opts.isIdempotent) {
        if (!this.prologue.has(name)) {
          this.prologue.set(name, fcall(sym.type, sym.fn, sym.args));
          this.names.add(name);
        }
      } else {
        const uniqueName = this.genId(name);
        this.prologue.set(uniqueName, sym);
      }
      return lit(sym.type, name);
    }
    return sym;
  }

  public genId(base: string): string {
    let result = base;
    let counter = 1;
    while (this.names.has(result)) {
      result = `${base}${++counter}`;
    }
    this.names.add(result);
    return result;
  }
}

describe('FormulaCompiler', () => {
  let parser: FormulaCompiler;

  beforeEach(() => {
    const resolver = new TestResolver();
    parser = new FormulaCompiler(resolver);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('gencode', () => {
    test('relational', () => {
      expect(parser.parseToJs('1 < 2')).toBe('return 1 < 2;');
      expect(parser.parseToJs('1 <= 2')).toBe('return 1 <= 2;');
      expect(parser.parseToJs('1 > 2')).toBe('return 1 > 2;');
      expect(parser.parseToJs('1 >= 2')).toBe('return 1 >= 2;');
    });

    test('equal', () => {
      expect(parser.parseToJs('1 == 2')).toBe('return 1 === 2;');
      expect(parser.parseToJs('1 != 2')).toBe('return 1 !== 2;');
    });

    test('logical', () => {
      expect(parser.parseToJs('always && never')).toBe('return true && false;');
      expect(parser.parseToJs('always || never')).toBe('return true || false;');
    });

    test('arith', () => {
      expect(parser.parseToJs('1 + 2')).toBe('return 1 + 2;');
      expect(parser.parseToJs('1 - 2')).toBe('return 1 - 2;');
      expect(parser.parseToJs('1 * 2')).toBe('return 1 * 2;');
      expect(parser.parseToJs('1 / 2')).toBe('return 1 / 2;');
      expect(parser.parseToJs('1 % 2')).toBe('return 1 % 2;');
    });

    test('operator precedence', () => {
      expect(parser.parseToJs('1 + 2 + 3')).toBe('return 1 + 2 + 3;');
      expect(parser.parseToJs('(1 + 2) + 3')).toBe('return 1 + 2 + 3;');
      expect(parser.parseToJs('1 + (2 + 3)')).toBe('return 1 + 2 + 3;');
      expect(parser.parseToJs('1 + 2 * 3')).toBe('return 1 + 2 * 3;');
      expect(parser.parseToJs('(1 + 2) * 3')).toBe('return (1 + 2) * 3;');
      expect(parser.parseToJs('1 * 2 + 3')).toBe('return 1 * 2 + 3;');
      expect(parser.parseToJs('1 * (2 + 3)')).toBe('return 1 * (2 + 3);');
      expect(parser.parseToJs('1 - 2 - 3')).toBe('return (1 - 2) - 3;');
      expect(parser.parseToJs('1 - (2 - 3)')).toBe('return 1 - (2 - 3);');
    });

    test('self', () => {
      expect(parser.parseToJs('self')).toBe(
        `const self = useSelf();
return self;`
      );
    });

    test('hook', () => {
      expect(parser.parseToJs('here')).toBe('const here = useHere();\nreturn here;');
    });

    test('member reference', () => {
      expect(parser.parseToJs('active.position')).toBe('return active.position;');
      expect(parser.parseToJs('self.position')).toBe(
        'const self = useSelf();\nreturn self.position;'
      );
    });

    test('multiple calls to same hook', () => {
      expect(parser.parseToJs('self.position + self.position')).toBe(
        'const self = useSelf();\nreturn self.position +\n  self.position;'
      );
    });

    test('call', () => {
      expect(parser.parseToJs('distance(1)')).toBe('return distance(1);');
      expect(parser.parseToJs('distance(1, 2)')).toBe('return distance(1, 2);');
      expect(() => parser.parseToJs('distance(false)')).toThrow(CompilationError);
      expect(() => parser.parseToJs('distance(1, 2, 3)')).toThrow(CompilationError);
    });

    test.todo('idempotentHook');

    test('function', () => {
      // eslint-disable-next-line no-new-func
      const fn = new Function('"use strict";' + parser.parseToJs('1 + 2'));
      expect(fn()).toBe(3);
    });

    test.todo('function context');
  });
});
