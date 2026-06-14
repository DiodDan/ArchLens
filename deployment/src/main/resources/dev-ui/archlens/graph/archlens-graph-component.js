import { componentTypeIcon, classNamesInLayer } from './archlens-graph-utils.js';

export function buildComponentElements(model, activeModuleRef, activeLayerRef, groupByDependency) {
    const m        = model || {};
    const elements = [];

    const mod = (m.subsystems || []).find(
        s => s.id === activeModuleRef || s.name === activeModuleRef
    );
    if (!mod) return elements;

    const layer = (mod.layers || []).find(
        l => l.id === activeLayerRef || l.name === activeLayerRef
    );
    if (!layer) return elements;

    const components  = layer.components || [];
    const classNames  = classNamesInLayer(layer); // class names IN this layer
    const edgeSeen    = new Set();
    const targetSeen  = new Map();               // key → nodeId

    const outDeps = (m.dependencies || []).filter(d => classNames.has(d.fromClass));

    function classifyDep(dep) {
        const { toClass, toSubsystem, toLayer } = dep;

        if (classNames.has(toClass)) {
            return { type: 'same-layer', targetCompId: `comp::${toClass}` };
        }

        if (toSubsystem && toSubsystem !== activeModuleRef) {
            return { type: 'target-module', key: `tmod::${toSubsystem}` };
        }

        if (toSubsystem === activeModuleRef && toLayer && toLayer !== activeLayerRef) {
            const layerData = (mod.layers || []).find(l => l.id === toLayer || l.name === toLayer);
            return {
                type:  'target-layer',
                key:   `tlayer::${toLayer}`,
                label: layerData ? (layerData.name || layerData.id) : toLayer,
            };
        }

        if (!toSubsystem && toLayer) {
            const sl = (m.sharedLayers || []).find(s => s.id === toLayer || s.name === toLayer);
            return {
                type:  'target-shared',
                key:   `tshared::${toLayer}`,
                label: sl ? (sl.name || sl.id) : toLayer,
                raw:   sl || null,
            };
        }

        return null;
    }

    function ensureTarget(cls, dep) {
        if (cls.type === 'same-layer') return cls.targetCompId;
        const key = cls.key;
        if (targetSeen.has(key)) return targetSeen.get(key);

        let nodeId, label, kind, raw, moduleId;

        switch (cls.type) {
            case 'target-module': {
                const ref = dep.toSubsystem;
                const tMod = (m.subsystems || []).find(s => s.id === ref || s.name === ref);
                nodeId   = key;
                label    = tMod ? (tMod.name || tMod.id) : ref;
                kind     = 'target-module';
                raw      = tMod || { id: ref, name: ref };
                moduleId = ref;
                break;
            }
            case 'target-layer': {
                nodeId   = key;
                label    = cls.label;
                kind     = 'target-layer';
                raw      = { id: dep.toLayer, name: cls.label };
                moduleId = activeModuleRef;
                break;
            }
            case 'target-shared': {
                nodeId = key;
                label  = cls.label;
                kind   = 'target-shared';
                raw    = cls.raw || { id: dep.toLayer, name: cls.label };
                break;
            }
            default: return null;
        }

        targetSeen.set(key, nodeId);
        elements.push({
            group: 'nodes',
            data: {
                id: nodeId, label, kind, _raw: raw,
                _targetId: dep.toSubsystem || dep.toLayer,
                _moduleId: moduleId || null,
            },
        });
        return nodeId;
    }

    function addEdge(srcId, tgtId, violation) {
        const key = `${srcId}→${tgtId}`;
        if (edgeSeen.has(key)) return;
        edgeSeen.add(key);
        elements.push({
            group: 'edges',
            data: { id: `e-comp-${key}`, source: srcId, target: tgtId, kind: 'dependency' },
            classes: ['component-edge', violation ? 'violation' : ''].filter(Boolean).join(' '),
        });
    }

    if (!groupByDependency) {
        for (const comp of components) {
            const nodeId = `comp::${comp.className}`;
            const icon   = componentTypeIcon(comp.componentType);
            const hasViol = (m.violations || []).some(
                v => v.fromClass === comp.className || v.toClass === comp.className
            );
            elements.push({
                group: 'nodes',
                data: {
                    id: nodeId,
                    label: `${icon} ${comp.simpleClassName || comp.className}`,
                    kind: 'component',
                    source: (comp.source || 'unclassified').toLowerCase(),
                    _raw: comp,
                },
                classes: [
                    comp.ambiguous ? 'ambiguous'      : '',
                    hasViol        ? 'has-violations' : '',
                ].filter(Boolean).join(' '),
            });
        }

        for (const dep of outDeps) {
            const cls = classifyDep(dep);
            if (!cls) continue;
            const targetId = ensureTarget(cls, dep);
            if (targetId) addEdge(`comp::${dep.fromClass}`, targetId, dep.violation);
        }

    } else {
        const groups = new Map();

        for (const comp of components) {
            const myDeps  = outDeps.filter(d => d.fromClass === comp.className);
            const extKeys = myDeps
                .map(d => classifyDep(d))
                .filter(c => c && c.type !== 'same-layer')
                .map(c => c.key)
                .filter(Boolean);
            const sortedKeys = [...new Set(extKeys)].sort();
            const gk         = sortedKeys.join('|') || '__no-ext-deps__';
            if (!groups.has(gk)) groups.set(gk, { comps: [], targetKeys: sortedKeys });
            groups.get(gk).comps.push(comp);
        }

        let gIdx = 0;
        for (const [, { comps: gc, targetKeys }] of groups) {
            let groupNodeId;

            if (gc.length === 1) {
                const comp   = gc[0];
                groupNodeId  = `comp::${comp.className}`;
                const icon   = componentTypeIcon(comp.componentType);
                const hasViol = (m.violations || []).some(v => v.fromClass === comp.className || v.toClass === comp.className);
                elements.push({
                    group: 'nodes',
                    data: {
                        id: groupNodeId,
                        label: `${icon} ${comp.simpleClassName || comp.className}`,
                        kind: 'component',
                        source: (comp.source || 'unclassified').toLowerCase(),
                        _raw: comp,
                    },
                    classes: [comp.ambiguous ? 'ambiguous' : '', hasViol ? 'has-violations' : ''].filter(Boolean).join(' '),
                });
            } else {
                groupNodeId = `compgroup::${gIdx++}`;
                elements.push({
                    group: 'nodes',
                    data: {
                        id: groupNodeId,
                        label: `▣ ${gc.length} components`,
                        kind: 'component-group',
                        groupSize: gc.length,
                        _components: gc,
                    },
                    classes: gc.some(c => c.ambiguous) ? 'ambiguous' : '',
                });
            }

            const groupDeps = outDeps.filter(d => gc.some(c => c.className === d.fromClass));
            const seenTargetKeys = new Set();

            for (const dep of groupDeps) {
                const cls = classifyDep(dep);
                if (!cls || cls.type === 'same-layer') continue;
                if (seenTargetKeys.has(cls.key)) continue;
                seenTargetKeys.add(cls.key);
                const targetId = ensureTarget(cls, dep);
                if (targetId) addEdge(groupNodeId, targetId, dep.violation);
            }

            if (gc.length === 1) {
                const intraLayerDeps = outDeps.filter(
                    d => d.fromClass === gc[0].className && classNames.has(d.toClass)
                );
                for (const dep of intraLayerDeps) {
                    addEdge(groupNodeId, `comp::${dep.toClass}`, dep.violation);
                }
            }
        }
    }

    return elements;
}
