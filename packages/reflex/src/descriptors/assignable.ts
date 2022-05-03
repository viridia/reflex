import {
  IArrayTypeDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  IFloatTypeDescriptor,
  IIntegerTypeDescriptor,
  INullableTypeDescriptor,
  IOpaqueTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStringTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';

/** Returns `true` if values of type `src` can be assigned to values of type `dst`. */
export function assignable(dst: ITypeDescriptor<unknown>, src: ITypeDescriptor<unknown>): boolean {
  if (src.kind === 'union') {
    const desc = src as IUnionTypeDescriptor<unknown[]>;
    return desc.elements.every(elt => assignable(dst, elt));
  }

  if (dst.kind !== src.kind) {
    if (dst.kind === 'optional') {
      const desc = dst as IOptionalTypeDescriptor<unknown>;
      return assignable(desc.element, src);
    } else if (dst.kind === 'nullable') {
      const desc = dst as INullableTypeDescriptor<unknown>;
      return assignable(desc.element, src);
    } else if (dst.kind === 'union') {
      const desc = dst as IUnionTypeDescriptor<unknown[]>;
      return desc.elements.some(elt => assignable(elt, src));
    }

    if (dst.kind === 'float' && src.kind === 'integer') {
      const iSrc = src as IIntegerTypeDescriptor<number>;
      const iDst = dst as IIntegerTypeDescriptor<number>;
      return (
        (iDst.minVal === undefined || (iSrc.minVal !== undefined && iDst.minVal <= iSrc.minVal)) &&
        (iDst.maxVal === undefined || (iSrc.maxVal !== undefined && iDst.maxVal >= iSrc.maxVal))
      );
    } else {
      return false;
    }
  }

  switch (dst.kind) {
    case 'boolean':
      return true;

    case 'integer': {
      const iSrc = src as IIntegerTypeDescriptor<number>;
      const iDst = dst as IIntegerTypeDescriptor<number>;
      return (
        (iDst.minVal === undefined || iDst.minVal === iSrc.minVal) &&
        (iDst.maxVal === undefined || iDst.maxVal === iSrc.maxVal)
      );
    }

    case 'float': {
      const iSrc = src as IFloatTypeDescriptor;
      const iDst = dst as IFloatTypeDescriptor;
      return (
        (iDst.minVal === undefined || iDst.minVal === iSrc.minVal) &&
        (iDst.maxVal === undefined || iDst.maxVal === iSrc.maxVal)
      );
    }

    case 'string': {
      const iSrc = src as IStringTypeDescriptor<string>;
      const iDst = dst as IStringTypeDescriptor<string>;
      return iDst.maxLength === undefined || iDst.maxLength === iSrc.maxLength;
    }

    case 'optional': {
      const iSrc = src as IOptionalTypeDescriptor<unknown>;
      const iDst = dst as IOptionalTypeDescriptor<unknown>;
      return assignable(iSrc.element, iDst.element);
    }

    case 'nullable': {
      const iSrc = src as INullableTypeDescriptor<unknown>;
      const iDst = dst as INullableTypeDescriptor<unknown>;
      return assignable(iSrc.element, iDst.element);
    }

    case 'array': {
      const iSrc = src as IArrayTypeDescriptor<unknown>;
      const iDst = dst as IArrayTypeDescriptor<unknown>;
      return assignable(iSrc.element, iDst.element);
    }

    case 'tuple': {
      const iSrc = src as ITupleTypeDescriptor<[]>;
      const iDst = dst as ITupleTypeDescriptor<[]>;
      if (iSrc.elements.length !== iDst.elements.length) {
        return false;
      }
      for (let i = 0, ct = iSrc.elements.length; i < ct; i++) {
        if (!assignable(iDst.elements[i], iSrc.elements[i])) {
          return false;
        }
      }
      return true;
    }

    case 'record': {
      const iSrc = src as IRecordTypeDescriptor<unknown>;
      const iDst = dst as IRecordTypeDescriptor<unknown>;
      return assignable(iSrc.element, iDst.element);
    }

    case 'struct': {
      const iSrc = src as IStructTypeDescriptor<{}>;
      const iDst = dst as IStructTypeDescriptor<{}>;
      return iDst.name === iSrc.name;
    }

    case 'class': {
      const iSrc = src as IClassTypeDescriptor<object>;
      const iDst = dst as IClassTypeDescriptor<object>;
      if (iDst.name === iSrc.name) {
        return true;
      }
      if (iSrc.supertypes) {
        return iSrc.supertypes.some(st => assignable(dst, st));
      }
      return false;
    }

    case 'opaque': {
      const iSrc = src as IOpaqueTypeDescriptor<unknown>;
      const iDst = dst as IOpaqueTypeDescriptor<unknown>;
      if (iSrc.name && iDst.name && iDst.name === iSrc.name) {
        return true;
      }
      if (iSrc.supertypes) {
        return iSrc.supertypes.some(st => assignable(dst, st));
      }
      return false;
    }

    case 'custom': {
      const iSrc = src as ICustomTypeDescriptor<unknown>;
      const iDst = dst as ICustomTypeDescriptor<unknown>;
      return iDst.name === iSrc.name;
    }

    default:
      return false;
  }
}
