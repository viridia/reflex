import {
  formatDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';

/** Return a shallow copy of the object. */
export function clone<T>(desc: ITypeDescriptor<T>, value: T): T {
  switch (desc.kind) {
    case 'boolean':
    case 'integer':
    case 'float':
    case 'string':
      return value;

    case 'optional': {
      if (value === undefined) {
        return value;
      }
      const d = desc as IOptionalTypeDescriptor<any>;
      return clone(d.element, value);
    }

    case 'nullable': {
      if (value === null) {
        return value;
      }
      const d = desc as INullableTypeDescriptor<any>;
      return clone(d.element, value);
    }

    case 'array':
    case 'tuple':
      return [...(value as unknown as any[])] as unknown as T;

    case 'union': {
      const d = desc as IUnionTypeDescriptor<any>;
      if (d.typeTest) {
        const typeDesc = d.typeTest(value);
        if (typeDesc) {
          return clone(typeDesc, value) as T;
        }
      }
      throw new Error(`Type not cloneable: ${formatDescriptor(desc)}`);
    }

    case 'record':
    case 'struct': {
      return { ...value };
    }

    case 'class': {
      const d = desc as IClassTypeDescriptor<any>;
      if (d.clone) {
        return d.clone(value);
      }
      throw new Error(`Type not cloneable: ${d.name}`);
    }

    case 'custom': {
      const d = desc as ICustomTypeDescriptor<any>;
      if (d.clone) {
        return d.clone(value);
      }
      throw new Error(`Type not cloneable: ${d.name}`);
    }

    default:
      throw new Error(`Type not cloneable: ${formatDescriptor(desc)}`);
  }
}
