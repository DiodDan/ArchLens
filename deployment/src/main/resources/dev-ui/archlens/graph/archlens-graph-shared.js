import { componentTypeIcon, classNamesInLayer } from './archlens-graph-utils.js';

export function buildSharedLayerElements(model, activeSharedLayerRef, groupByDependency = false) {
    const m        = model || {};
    const elements = [];

    const sharedLayer = (m.sharedLayers || []).find(
        sl => sl.id === activeSharedLayerRef || sl.name === activeSharedLayerRef
    );
    if (!sharedLayer) return elements;

    const components  = sharedLayer.components || [];
    const classNames  = classNamesInLayer(sharedLayer);
    const edgeSeen    = new Set();
    const targetSeen  = new Map();

    const outDeps = (m.dependencies || []).filter(d => classNames.has(d.fromClass));

    function classifyDep(dep) {
        const { toClass, toSubsystem, toLayer } = dep;

        if (classNames.has(toClass)) {
            return { type: 'same-layer', targetCompId: `comp::${toClass}` };
        }
        if (toSubsystem) {
            const tMod = (m.subsystems || []).find(s => s.id === toSubsystem || s.name === toSubsystem);
            return { type: 'target-module', key: `tmod::${toSubsystem}`, label: tMod ? (tMod.name || tMod.id) : toSubsystem, raw: tMod };
        }
        if (!toSubsystem && toLayer && toLayer !== activeSharedLayerRef) {
            const sl = (m.sharedLayers || []).find(s => s.id === toLayer || s.name === toLayer);
            return { type: 'target-shared', key: `tshared::${toLayer}`, label: sl ? (sl.name || sl.id) : toLayer, raw: sl };
        }
        return null;
    }

    function ensureTarget(cls, dep) {
        if (cls.type === 'same-layer') return cls.targetCompId;
        const key = cls.key;
        if (targetSeen.has(key)) return targetSeen.get(key);

        let nodeId, label, kind, raw, moduleId;
        switch (cls.type) {
            case 'target-module':
                nodeId = key; label = cls.label; kind = 'target-module';
                raw = cls.raw || { id: dep.toSubsystem, name: cls.label };
                moduleId = dep.toSubsystem;
                break;
            case 'target-shared':
                nodeId = key; label = cls.label; kind = 'target-shared';
                raw = cls.raw || { id: dep.toLayer, name: cls.label };
                break;
            default: return null;
        }

        targetSeen.set(key, nodeId);
        elements.push({
            group: 'nodes',
            data: { id: nodeId, label, kind, _raw: raw, _targetId: dep.toSubsystem || dep.toLayer, _moduleId: moduleId || null },
        });
        return nodeId;
    }

    function addEdge(srcId, tgtId, violation) {
        const key = `${srcId}→${tgtId}`;
        if (edgeSeen.has(key)) return;
        edgeSeen.add(key);
        elements.push({
            group: 'edges',
            data: { id: `e-sl-${key}`, source: srcId, target: tgtId, kind: 'dependency' },
            classes: ['component-edge', violation ? 'violation' : ''].filter(Boolean).join(' '),
        });
    }

    if (!groupByDependency) {
        for (const comp of components) {
            const nodeId = `comp::${comp.className}`;
            const icon   = componentTypeIcon(comp.componentType);
            elements.push({
                group: 'nodes',
                data: {
                    id: nodeId,
                    label: `${icon} ${comp.simpleClassName || comp.className}`,
                    kind: 'component',
                    source: (comp.source || 'unclassified').toLowerCase(),
                    _raw: comp,
                },
                classes: comp.ambiguous ? 'ambiguous' : '',
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
                .map(c => c.key).filter(Boolean);
            const sortedKeys = [...new Set(extKeys)].sort();
            const gk = sortedKeys.join('|') || '__no-ext-deps__';
            if (!groups.has(gk)) groups.set(gk, { comps: [], targetKeys: sortedKeys });
            groups.get(gk).comps.push(comp);
        }

        let gIdx = 0;
        for (const [, { comps: gc }] of groups) {
            let groupNodeId;
            if (gc.length === 1) {
                const comp  = gc[0];
                groupNodeId = `comp::${comp.className}`;
                const icon  = componentTypeIcon(comp.componentType);
                elements.push({
                    group: 'nodes',
                    data: { id: groupNodeId, label: `${icon} ${comp.simpleClassName || comp.className}`, kind: 'component', source: (comp.source || 'unclassified').toLowerCase(), _raw: comp },
                    classes: comp.ambiguous ? 'ambiguous' : '',
                });
            } else {
                groupNodeId = `compgroup::${gIdx++}`;
                elements.push({
                    group: 'nodes',
                    data: { id: groupNodeId, label: `▣ ${gc.length} components`, kind: 'component-group', groupSize: gc.length, _components: gc },
                    classes: gc.some(c => c.ambiguous) ? 'ambiguous' : '',
                });
            }

            const groupDeps  = outDeps.filter(d => gc.some(c => c.className === d.fromClass));
            const seenExtKeys = new Set();
            for (const dep of groupDeps) {
                const cls = classifyDep(dep);
                if (!cls || cls.type === 'same-layer') continue;
                if (seenExtKeys.has(cls.key)) continue;
                seenExtKeys.add(cls.key);
                const targetId = ensureTarget(cls, dep);
                if (targetId) addEdge(groupNodeId, targetId, dep.violation);
            }
        }
    }

    return elements;
}
