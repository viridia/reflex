import {
  formatDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  IFloatTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  IStringTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
} from './descriptors';

/** Create a new instance of the type. */
export function create(desc: ITypeDescriptor<any>): unknown {
  switch (desc.kind) {
    case 'boolean':
      return false;

    case 'integer':
    case 'float': {
      const d = desc as IFloatTypeDescriptor;
      if (d.maxVal !== undefined && d.maxVal < 0) {
        return d.maxVal;
      } else if (d.minVal !== undefined && d.minVal > 0) {
        return d.minVal;
      }
      return 0;
    }

    case 'string': {
      const d = desc as IStringTypeDescriptor;
      if (d.enumVals) {
        const enumVals = typeof d.enumVals === 'function' ? d.enumVals() : d.enumVals;
        return enumVals[0];
      }
      return '';
    }

    case 'optional': {
      const d = desc as IOptionalTypeDescriptor<any>;
      return create(d.element);
    }

    case 'nullable': {
      const d = desc as INullableTypeDescriptor<any>;
      return create(d.element);
    }

    case 'array':
      return [];

    case 'tuple': {
      const d = desc as ITupleTypeDescriptor<any>;
      return d.elements.map(d => create(d));
    }

    case 'record': {
      return {};
    }

    case 'struct': {
      const d = desc as IStructTypeDescriptor<any>;
      if (!d.properties) {
        throw Error(`Missing schema for type: ${formatDescriptor(d)}`);
      }
      const keys = Object.keys(d.properties);
      const result: any = {};
      for (let i = 0, ct = keys.length; i < ct; i += 1) {
        const k = keys[i];
        const f = d.properties[k];
        if (f && (f.enumerable ?? true)) {
          if (f.type.kind === 'optional') {
            continue;
          } else if (f.type.kind === 'nullable') {
            result[k] = null;
          } else {
            result[k] = create(f.type);
          }
        }
      }
      return result;
    }

    case 'class': {
      const d = desc as IClassTypeDescriptor<any>;
      if (d.create) {
        return d.create();
      }
      throw new Error(`Type not creatable: ${d.name}`);
    }

    case 'custom': {
      const d = desc as ICustomTypeDescriptor<any>;
      if (d.create) {
        return d.create(d.name);
      }

      throw new Error(`Type not creatable: ${d.name}`);
    }

    default:
      throw new Error(`Type not creatable: ${desc.kind}`);
  }
}
