import { refOf, registerRef } from './archlens-graph-utils.js';

export function buildModuleElements(model, activeModuleRef) {
    const m        = model || {};
    const elements = [];
    const edgeSeen = new Set();

    const mod = (m.subsystems || []).find(
        s => s.id === activeModuleRef || s.name === activeModuleRef
    );
    if (!mod) return elements;

    const modRef = mod.id || mod.name;

    const layerNodeId = new Map(); // layerRef → nodeId

    (mod.layers || []).forEach((layer, i) => {
        const ref    = refOf(layer.id ?? layer.name, 'layer', i);
        const nodeId = `layer::${ref}`;
        registerRef(layerNodeId, layer.id, layer.name, nodeId);

        elements.push({
            group: 'nodes',
            data: {
                id: nodeId,
                label: layer.name || layer.id || ref,
                kind: 'layer',
                componentCount: (layer.components || []).length,
                violationCount: layer.violationCount || 0,
                _raw: layer,
                _ref: ref,
                _moduleId: modRef,
                _moduleName: mod.name || mod.id,
            },
            classes: (layer.violationCount || 0) > 0 ? 'has-violations' : '',
        });
    });

    const sharedNodeId = new Map();

    for (const sl of (mod.visibleSharedLayers || [])) {
        const ref    = sl.id || sl.name;
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
    }

    const ghostModuleSeen = new Set();

    const relevantDeps = (m.dependencies || []).filter(d => {
        const fromRef = d.fromSubsystem;
        return fromRef === modRef || fromRef === mod.id || fromRef === mod.name;
    });

    for (const dep of relevantDeps) {
        const fromLayerRef = dep.fromLayer;
        const fromId = layerNodeId.get(fromLayerRef);
        if (!fromId) continue;

        const vClass = dep.violation ? 'violation' : '';

        const toSub = dep.toSubsystem;

        if (toSub === modRef || toSub === mod.id || toSub === mod.name) {
            const toId = layerNodeId.get(dep.toLayer);
            if (toId) {
                const key = `${fromId}→${toId}`;
                if (!edgeSeen.has(key)) {
                    edgeSeen.add(key);
                    elements.push({
                        group: 'edges',
                        data: {
                            id: `e-intra-${key}`,
                            source: fromId,
                            target: toId,
                            kind: 'dependency',
                        },
                        classes: ['detail-edge', vClass].filter(Boolean).join(' '),
                    });
                }
            }

        } else if (!toSub) {
            let slRef  = dep.toLayer;
            let toId   = sharedNodeId.get(slRef);

            if (!toId) {
                toId = `shared::${slRef}`;
                const sl = (m.sharedLayers || []).find(s => s.id === slRef || s.name === slRef);
                if (!sharedNodeId.has(slRef)) {
                    sharedNodeId.set(slRef, toId);
                    elements.push({
                        group: 'nodes',
                        data: {
                            id: toId,
                            label: sl ? (sl.name || sl.id) : slRef,
                            kind: 'shared',
                            componentCount: sl ? (sl.components || []).length : 0,
                            violationCount: 0,
                            _raw: sl || { id: slRef, name: slRef },
                            _ref: slRef,
                        },
                    });
                }
            }

            const key = `${fromId}→${toId}`;
            if (!edgeSeen.has(key)) {
                edgeSeen.add(key);
                elements.push({
                    group: 'edges',
                    data: {
                        id: `e-shared-${key}`,
                        source: fromId,
                        target: toId,
                        kind: 'uses-shared',
                    },
                    classes: ['detail-edge', vClass].filter(Boolean).join(' '),
                });
            }

        } else {
            const targetModRef = toSub;
            const ghostId      = `ghost-module::${targetModRef}`;

            if (!ghostModuleSeen.has(targetModRef)) {
                ghostModuleSeen.add(targetModRef);
                const targetMod = (m.subsystems || []).find(
                    s => s.id === targetModRef || s.name === targetModRef
                );
                elements.push({
                    group: 'nodes',
                    data: {
                        id: ghostId,
                        label: targetMod ? (targetMod.name || targetMod.id) : targetModRef,
                        kind: 'ghost-module',
                        _raw: targetMod || { id: targetModRef, name: targetModRef },
                        _targetId: targetModRef,
                    },
                });
            }

            const key = `${fromId}→${ghostId}`;
            if (!edgeSeen.has(key)) {
                edgeSeen.add(key);
                elements.push({
                    group: 'edges',
                    data: {
                        id: `e-ghost-${key}`,
                        source: fromId,
                        target: ghostId,
                        kind: dep.violation ? 'violation-cross' : 'dependency',
                    },
                    classes: ['detail-edge', vClass].filter(Boolean).join(' '),
                });
            }
        }
    }

    return elements;
}
