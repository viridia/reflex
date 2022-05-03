import {
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  INamedTypeDescriptor,
  IOpaqueTypeDescriptor,
  IStructTypeDescriptor,
  ITypeDescriptor,
} from './descriptors';
import { transform } from './transform';

type RegisteredType =
  | IClassTypeDescriptor<any>
  | ICustomTypeDescriptor<any>
  | IOpaqueTypeDescriptor<any>
  | IStructTypeDescriptor<any, any>;

interface RegisteredTypes {
  class: IClassTypeDescriptor<any>;
  custom: ICustomTypeDescriptor<any>;
  opaque: IOpaqueTypeDescriptor<any>;
  struct: IStructTypeDescriptor<any>;
}

export class TypeRegistry {
  private types = new Map<string, RegisteredType>();

  public canonicalize(type: ITypeDescriptor<unknown>) {
    return transform(type, type => {
      if (
        type.kind === 'class' ||
        type.kind === 'custom' ||
        type.kind === 'struct' ||
        type.kind === 'opaque'
      ) {
        const d = type as ICustomTypeDescriptor<any>;
        const c = this.get(d.kind, d.name);
        if (c) {
          return c;
        } else if (type.kind === 'custom' || type.kind === 'class') {
          console.warn(`Unregistered ${d.kind} type: ${d.name}`);
        }
      }
      return type;
    });
  }

  public find<K extends keyof RegisteredTypes>(kind: K, name: string): RegisteredTypes[K] | null {
    const result = this.types.get(name) as RegisteredTypes[K];
    return result && result.kind === kind ? result : null;
  }

  public get<K extends keyof RegisteredTypes>(kind: K, name: string): RegisteredTypes[K] {
    const result = this.types.get(name) as RegisteredTypes[K];
    if (!result) {
      throw new Error(`Type ${name} not found in registry.`);
    } else if (result.kind !== kind) {
      throw new Error(`Type ${name} is not a ${kind} type.`);
    }
    return result;
  }

  public getType(name: string): INamedTypeDescriptor<any> {
    const result = this.types.get(name) as INamedTypeDescriptor<any>;
    if (!result) {
      throw new Error(`Type ${name} not found in registry.`);
    }
    return result;
  }

  public register(type: RegisteredType) {
    if (!type.name) {
      throw Error(`Cannot register unnamed type.`);
    }
    this.types.set(type.name, type);
  }

  public registerAll(types: Array<RegisteredType>) {
    types.forEach(this.register.bind(this));
  }
}

export const registry = new TypeRegistry();
