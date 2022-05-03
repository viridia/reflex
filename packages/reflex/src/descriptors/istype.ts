import {
  IArrayTypeDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  IIntegerTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStringTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';

/** True if the value is a type compatible with the descriptor. */
export function istype(desc: ITypeDescriptor<unknown>, value: unknown): boolean {
  switch (desc.kind) {
    case 'boolean':
      return typeof value === 'boolean';

    case 'integer':
      if (typeof value === 'number') {
        const d = desc as IIntegerTypeDescriptor;
        if (Math.trunc(value) !== value) {
          return false;
        }
        if (d.minVal !== undefined && value < d.minVal) {
          return false;
        }
        if (d.maxVal !== undefined && value > d.maxVal) {
          return false;
        }
        return true;
      }
      return false;

    case 'float':
      if (typeof value === 'number') {
        const d = desc as IIntegerTypeDescriptor;
        if (d.minVal !== undefined && value < d.minVal) {
          return false;
        }
        if (d.maxVal !== undefined && value > d.maxVal) {
          return false;
        }
        return true;
      }
      return false;

    case 'string':
      if (typeof value === 'string') {
        const d = desc as IStringTypeDescriptor;
        if (d.maxLength !== undefined && value.length > d.maxLength) {
          return false;
        }
        if (d.enumVals) {
          const enumVals = typeof d.enumVals === 'function' ? d.enumVals() : d.enumVals;
          if (!enumVals.includes(value)) {
            return false;
          }
        }
        return true;
      }
      return false;

    case 'optional': {
      if (value === undefined) {
        return true;
      }
      return istype((desc as IOptionalTypeDescriptor<any>).element, value);
    }

    case 'nullable': {
      if (value === null) {
        return true;
      }
      return istype((desc as INullableTypeDescriptor<any>).element, value);
    }

    case 'array': {
      const d = desc as IArrayTypeDescriptor<any>;
      if (Array.isArray(value)) {
        return value.every((el, index) => istype(d.element, el));
      }
      return false;
    }

    case 'tuple': {
      const d = desc as ITupleTypeDescriptor<any>;
      if (Array.isArray(value)) {
        if (value.length !== d.elements.length) {
          return false;
        }
        for (let i = 0, ct = d.elements.length; i < ct; i += 1) {
          if (!istype(d.elements[i], value[i])) {
            return false;
          }
        }
        return true;
      }
      return false;
    }

    case 'union': {
      const d = desc as IUnionTypeDescriptor<any>;
      if (d.typeTest) {
        const typeDesc = d.typeTest(value);
        if (!typeDesc) {
          return false;
        }
        return true;
      }
      for (let i = 0, ct = d.elements.length; i < ct; i += 1) {
        // Call `validate` rather than `istype` to suppress error message
        if (istype(d.elements[i], value)) {
          return true;
        }
      }

      return false;
    }

    case 'record': {
      const d = desc as IRecordTypeDescriptor<any>;
      if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          if (!istype(d.element, (value as any)[k])) {
            return false;
          }
        }
        return true;
      }
      return false;
    }

    case 'struct': {
      const d = desc as IStructTypeDescriptor<any>;
      if (value && typeof value === 'object') {
        const keys = Object.keys(d.properties);
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          const f = d.properties[k];
          if (f && (f.enumerable ?? true)) {
            if (!(k in value)) {
              if (f.type.kind !== 'optional') {
                return false;
              }
            } else if (!istype(f.type, (value as any)[k])) {
              return false;
            }
          }
        }

        if (d.additionalPropertes === false) {
          for (const key in value) {
            if (!(key in d.properties)) {
              return false;
            }
          }
        }

        return true;
      }
      return false;
    }

    case 'class': {
      const d = desc as IClassTypeDescriptor<any>;
      if (value && typeof value === 'object') {
        if (d.validate) {
          if (!d.validate(value)) {
            return false;
          } else {
            return true;
          }
        }

        const keys = Object.keys(d.properties);
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          const f = d.properties[k];
          if (f && (f.enumerable ?? true)) {
            if (!(k in value)) {
              if (f.type.kind !== 'optional') {
                return false;
              }
            } else if (!istype(f.type, (value as any)[k])) {
              return false;
            }
          }
        }

        if (d.additionalPropertes === false) {
          for (const key in value) {
            if (!(key in d.properties)) {
              return false;
            }
          }
        }

        return true;
      }
      return false;
    }

    case 'custom': {
      const d = desc as ICustomTypeDescriptor<any>;
      if (d.validate && !d.validate(value)) {
        return false;
      }
      return true;
    }

    case 'opaque':
    default:
      return false;
  }
}
