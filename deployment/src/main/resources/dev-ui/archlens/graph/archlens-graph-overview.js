import { refOf, registerRef } from './archlens-graph-utils.js';

export function buildOverviewElements(model) {
    const m        = model || {};
    const elements = [];
    const edgeSeen = new Set();

    /** @type {Map<string, string>} anyRef → nodeId */
    const sharedNodeId = new Map();

    (m.sharedLayers || []).forEach((sl, i) => {
        const ref    = refOf(sl.id ?? sl.name, 'shared', i);
        const nodeId = `shared::${ref}`;
        registerRef(sharedNodeId, sl.id, sl.name, nodeId);

        elements.push({
            group: 'nodes',
            data: {
                id: nodeId,
                label: sl.name || sl.id || ref,
                kind: 'shared',
                componentCount: (sl.components || []).length,
                violationCount: sl.violationCount || 0,
                _raw: sl,
                _ref: ref,
            },
            classes: (sl.violationCount || 0) > 0 ? 'has-violations' : '',
        });
    });

    /** @type {Map<string, string>} anyRef → nodeId */
    const moduleNodeId = new Map();

    (m.subsystems || []).forEach((mod, i) => {
        const ref    = refOf(mod.id ?? mod.name, 'module', i);
        const nodeId = `module::${ref}`;
        registerRef(moduleNodeId, mod.id, mod.name, nodeId);

        const componentCount = (mod.layers || []).reduce(
            (s, l) => s + (l.components || []).length, 0
        );

        elements.push({
            group: 'nodes',
            data: {
                id: nodeId,
                label: mod.name || mod.id || ref,
                kind: 'module',
                moduleType: mod.type || 'layered',
                componentCount,
                violationCount: mod.violationCount || 0,
                _raw: mod,
                _ref: ref,
            },
            classes: (mod.violationCount || 0) > 0 ? 'has-violations' : '',
        });
    });

    for (const mod of (m.subsystems || [])) {
        const fromId = moduleNodeId.get(mod.id) || moduleNodeId.get(mod.name);
        if (!fromId) continue;

        const usedSharedRefs = new Set();
        for (const layer of (mod.layers || [])) {
            for (const ref of (layer.allowedSharedLayerIds || [])) usedSharedRefs.add(ref);
        }

        for (const ref of usedSharedRefs) {
            const toId = sharedNodeId.get(ref);
            if (!toId) continue;
            const key = `${fromId}→${toId}`;
            if (edgeSeen.has(key)) continue;
            edgeSeen.add(key);
            elements.push({
                group: 'edges',
                data: { id: `e-uses-shared-${key}`, source: fromId, target: toId, kind: 'uses-shared' },
                classes: 'overview-edge',
            });
        }
    }

    for (const dep of (m.dependencies || [])) {
        const { fromSubsystem: fromSub, toSubsystem: toSub, fromLayer, toLayer, violation } = dep;
        const vClass = violation ? 'violation' : '';

        if (fromSub && toSub && fromSub !== toSub) {
            const fromId = moduleNodeId.get(fromSub);
            const toId   = moduleNodeId.get(toSub);
            if (fromId && toId) {
                const key = `${fromId}→${toId}`;
                if (!edgeSeen.has(key)) {
                    edgeSeen.add(key);
                    elements.push({
                        group: 'edges',
                        data: { id: `e-cross-${key}`, source: fromId, target: toId, kind: 'cross-module' },
                        classes: ['overview-edge', vClass].filter(Boolean).join(' '),
                    });
                }
            }
        }

        if (!fromSub && !toSub && fromLayer && toLayer && fromLayer !== toLayer) {
            const fromId = sharedNodeId.get(fromLayer);
            const toId   = sharedNodeId.get(toLayer);
            if (fromId && toId) {
                const key = `${fromId}→${toId}`;
                if (!edgeSeen.has(key)) {
                    edgeSeen.add(key);
                    elements.push({
                        group: 'edges',
                        data: { id: `e-shared-${key}`, source: fromId, target: toId, kind: 'uses-shared' },
                        classes: ['overview-edge', vClass].filter(Boolean).join(' '),
                    });
                }
            }
        }
    }

    return elements;
}
