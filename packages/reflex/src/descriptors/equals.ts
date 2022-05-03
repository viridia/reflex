import equal from 'fast-deep-equal';
import {
  IArrayTypeDescriptor,
  IFloatTypeDescriptor,
  IIntegerTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  IStringTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IPropertyDescriptors,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  IRecordTypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';
import { IFieldDescriptor } from './field';
import { istype } from './istype';

/** Compare two type descriptors for equality. */
export function equalTypeDescriptors(
  a: ITypeDescriptor<unknown>,
  b: ITypeDescriptor<unknown>
): boolean {
  if (a.kind !== b.kind) {
    return false;
  }

  switch (a.kind) {
    case 'boolean':
      return true;

    case 'integer': {
      const ai = a as IIntegerTypeDescriptor<any>;
      const bi = a as IIntegerTypeDescriptor<any>;
      return (
        ai.minVal === bi.minVal &&
        ai.maxVal === bi.maxVal &&
        equal(ai.custom, bi.custom) &&
        equal(ai.enumVals, bi.enumVals)
      );
    }

    case 'float': {
      const af = a as IFloatTypeDescriptor;
      const bf = a as IFloatTypeDescriptor;
      return af.minVal === bf.minVal && af.maxVal === bf.maxVal && equal(af.custom, bf.custom);
    }

    case 'string': {
      const af = a as IStringTypeDescriptor;
      const bf = a as IStringTypeDescriptor;
      return af.maxLength === bf.maxLength && equal(af.custom, bf.custom);
    }

    case 'optional':
      return equalTypeDescriptors(
        (a as IOptionalTypeDescriptor<unknown>).element,
        (b as IOptionalTypeDescriptor<unknown>).element
      );

    case 'nullable':
      return equalTypeDescriptors(
        (a as INullableTypeDescriptor<unknown>).element,
        (b as INullableTypeDescriptor<unknown>).element
      );

    case 'record':
      return equalTypeDescriptors(
        (a as IRecordTypeDescriptor<unknown>).element,
        (b as IRecordTypeDescriptor<unknown>).element
      );

    case 'array':
      return equalTypeDescriptors(
        (a as IArrayTypeDescriptor<unknown>).element,
        (b as IArrayTypeDescriptor<unknown>).element
      );

    case 'tuple': {
      const ta = a as ITupleTypeDescriptor<unknown[]>;
      const tb = b as ITupleTypeDescriptor<unknown[]>;
      if (ta.elements.length === tb.elements.length) {
        for (let i = 0, ct = ta.elements.length; i < ct; i++) {
          if (!equalTypeDescriptors(ta.elements[i], tb.elements[i])) {
            return false;
          }
        }
        return true;
      }
      return false;
    }

    case 'union': {
      const ua = a as IUnionTypeDescriptor<unknown[]>;
      const ub = b as IUnionTypeDescriptor<unknown[]>;
      if (ua.elements.length === ub.elements.length) {
        for (let i = 0, ct = ua.elements.length; i < ct; i++) {
          if (!equalTypeDescriptors(ua.elements[i], ub.elements[i])) {
            return false;
          }
        }
        return true;
      }
      return false;
    }

    case 'struct': {
      const ta = a as IStructTypeDescriptor<unknown[]>;
      const tb = b as IStructTypeDescriptor<unknown[]>;
      const thisKeys = Object.getOwnPropertyNames(ta.properties);
      const otherKeys = Object.getOwnPropertyNames(tb.properties);
      if (thisKeys.length !== otherKeys.length) {
        return false;
      }
      thisKeys.sort();
      otherKeys.sort();
      for (let i = 0; i < thisKeys.length; i += 1) {
        const k = thisKeys[i];
        if (k !== otherKeys[i]) {
          return false;
        }
        const fa: IFieldDescriptor<unknown> = (
          ta.properties as unknown as IPropertyDescriptors<any>
        )[k]!;
        const fb: IFieldDescriptor<unknown> = (
          tb.properties as unknown as IPropertyDescriptors<any>
        )[k]!;
        // We don't include `enumerable` or `writable` because those aren't attributes of the type.
        if (!equalTypeDescriptors(fa.type, fb.type)) {
          return false;
        }
      }
      return true;
    }

    case 'class': {
      const ca = a as IClassTypeDescriptor<any>;
      const cb = b as IClassTypeDescriptor<any>;
      return ca.name === cb.name;
    }

    case 'custom': {
      const ca = a as ICustomTypeDescriptor<any>;
      const cb = b as ICustomTypeDescriptor<any>;
      return ca.name === cb.name;
    }
    default:
      return false;
  }
}

/** Compare observable properties for equality. */
export function equalPropValues(a: unknown, b: unknown, desc: ITypeDescriptor<unknown>): boolean {
  // Early out if ref equals.
  if (a === b) {
    return true;
  }

  switch (desc.kind) {
    case 'boolean':
    case 'integer':
    case 'float':
    case 'string':
      return false;

    case 'optional':
      if (a === undefined || b === undefined) {
        return false;
      }
      return equalPropValues(a, b, (desc as IOptionalTypeDescriptor<unknown>).element);

    case 'nullable':
      if (a === null || b === null) {
        return false;
      }
      return equalPropValues(a, b, (desc as INullableTypeDescriptor<unknown>).element);

    case 'tuple':
      if (Array.isArray(a)) {
        if (Array.isArray(b) && a.length === b.length) {
          for (let i = 0, ct = a.length; i < ct; i++) {
            const element = (desc as ITupleTypeDescriptor<any>).elements[i];
            if (!equalPropValues(a[i], b[i], element)) {
              return false;
            }
          }
          return true;
        }
      }
      return false;

    case 'union': {
      const ud = desc as IUnionTypeDescriptor<unknown[]>;
      const um = ud.elements.find(elt => istype(elt, a));
      return um ? equalPropValues(a, b, um) : false;
    }

    case 'array':
      if (Array.isArray(a)) {
        if (Array.isArray(b) && a.length === b.length) {
          const element = (desc as IArrayTypeDescriptor<unknown>).element;
          for (let i = 0, ct = a.length; i < ct; i++) {
            if (!equalPropValues(a[i], b[i], element)) {
              return false;
            }
          }
          return true;
        }
      }
      return false;

    case 'record': {
      if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
      }
      const sd = desc as IRecordTypeDescriptor<unknown>;
      const aKeys = Object.keys(a!);
      const bKeys = Object.keys(b!);
      if (aKeys.length !== bKeys.length) {
        return false;
      }
      return aKeys.every(key => {
        return equalPropValues((a as any)[key], (b as any)[key], sd.element);
      });
    }

    case 'struct': {
      if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
      }
      const sd = desc as IStructTypeDescriptor<object>;
      const keys = Object.keys(sd.properties);
      return keys.every(key => {
        return equalPropValues(
          (a as any)[key],
          (b as any)[key],
          (sd.properties as unknown as IPropertyDescriptors<any>)[key]!.type
        );
      });
    }

    case 'class': {
      if (typeof a === 'object' && typeof b === 'object') {
        const td = desc as IClassTypeDescriptor<object>;
        return td.equal ? td.equal(a!, b!) : a === b;
      }
      return false;
    }

    case 'custom': {
      const td = desc as ICustomTypeDescriptor<any>;
      return td.equal(a, b);
    }

    case 'opaque':
      return false;

    default:
      return false;
  }
}
