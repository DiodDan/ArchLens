import {CyIcon} from '../components/archlens-icons.js';

export function refOf(value, fallbackPrefix, fallbackIndex) {
    return (value !== undefined && value !== null && `${value}`.trim().length > 0)
        ? `${value}`
        : `${fallbackPrefix}-${fallbackIndex}`;
}

export function registerRef(map, id, name, value) {
    if (id != null) map.set(`${id}`, value);
    if (name != null) map.set(`${name}`, value);
}

export function componentTypeIcon(componentType) {
    switch ((componentType || '').toUpperCase()) {
        case 'INTERFACE':
            return CyIcon.Interface;
        case 'ENUM':
            return CyIcon.Enum;
        case 'RECORD':
            return CyIcon.Record;
        case 'ANNOTATION':
            return CyIcon.Annotation;
        default:
            return CyIcon.Class;
    }
}

export function classNamesInLayer(layer) {
    return new Set((layer?.components || []).map(c => c.className));
}
