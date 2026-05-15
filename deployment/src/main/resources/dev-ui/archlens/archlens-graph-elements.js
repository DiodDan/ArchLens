export function buildOverviewElements(model) {
    const elements = [];
    const m = model || {};
    const modules = m.subsystems || m.modules || [];
    const sharedLayers = m.sharedLayers || [];

    const setRefKey = (map, ref, key) => {
        if (ref !== undefined && ref !== null && `${ref}`.length) map.set(ref, key);
    };
    const buildKey = (value, prefix, index) => {
        const v = value !== undefined && value !== null && `${value}`.length ? `${value}` : `${prefix}-${index}`;
        return v;
    };

    const sharedKeyByRef = new Map();
    const sharedLabelByKey = new Map();

    sharedLayers.forEach((sl, index) => {
        const sharedKey = buildKey(sl.id ?? sl.name, 'shared', index);
        const label = sl.name || sl.id || sharedKey;
        setRefKey(sharedKeyByRef, sl.id, sharedKey);
        setRefKey(sharedKeyByRef, sl.name, sharedKey);
        sharedLabelByKey.set(sharedKey, label);
        elements.push({
            group: 'nodes',
            data: {
                id: `shared::${sharedKey}`,
                label,
                kind: 'shared',
                componentCount: (sl.components || []).length,
                _raw: sl,
            }
        });
    });

    const moduleKeyByRef = new Map();
    modules.forEach((mod, index) => {
        const moduleKey = buildKey(mod.id ?? mod.name, 'module', index);
        const label = mod.name || mod.id || moduleKey;
        setRefKey(moduleKeyByRef, mod.id, moduleKey);
        setRefKey(moduleKeyByRef, mod.name, moduleKey);

        const totalComps = (mod.layers || []).reduce((s, l) => s + (l.components || []).length, 0);
        elements.push({
            group: 'nodes',
            data: {
                id: `module::${moduleKey}`,
                label,
                kind: 'module',
                moduleType: mod.type || 'layered',
                componentCount: totalComps,
                violationCount: mod.violationCount || 0,
                _raw: mod,
            }
        });
    });

    const edgeSeen = new Set();
    for (const mod of modules) {
        const moduleKey = moduleKeyByRef.get(mod.id) || moduleKeyByRef.get(mod.name);
        if (!moduleKey) continue;

        const sharedRefs = new Set();
        for (const layer of (mod.layers || [])) {
            for (const ref of (layer.allowedSharedLayerIds || [])) sharedRefs.add(ref);
            for (const ref of (layer.usesShared || [])) sharedRefs.add(ref);
        }

        for (const sharedRef of sharedRefs) {
            const sharedKey = sharedKeyByRef.get(sharedRef);
            if (!sharedKey) continue;
            const key = `${moduleKey}->${sharedKey}`;
            if (edgeSeen.has(key)) continue;
            edgeSeen.add(key);
            elements.push({
                group: 'edges',
                data: {
                    id: `edge-shared-${key}`,
                    source: `module::${moduleKey}`,
                    target: `shared::${sharedKey}`,
                    kind: 'uses-shared',
                    label: 'uses',
                }
            });
        }
    }

    for (const dep of (m.dependencies || [])) {
        const fromModule = dep.fromModule ?? dep.fromSubsystem;
        const toModule = dep.toModule ?? dep.toSubsystem;
        const fromKey = moduleKeyByRef.get(fromModule);
        const toKey = moduleKeyByRef.get(toModule);
        if (fromKey && toKey && fromKey !== toKey) {
            const key = `${fromKey}=>${toKey}`;
            if (!edgeSeen.has(key)) {
                edgeSeen.add(key);
                elements.push({
                    group: 'edges',
                    data: {
                        id: `edge-cross-${key}`,
                        source: `module::${fromKey}`,
                        target: `module::${toKey}`,
                        kind: 'cross-module',
                        label: '',
                    },
                    classes: dep.violation ? 'violation' : '',
                });
            }
        }
    }

    return elements;
}

export function buildModuleElements(model, moduleRef) {
    const elements = [];
    const m = model || {};
    const modules = m.modules || m.subsystems || [];
    const mod = modules.find((item) => item.id === moduleRef || item.name === moduleRef);
    if (!mod) return elements;

    const layers = mod.layers || [];

    const setRefKey = (map, ref, key) => {
        if (ref !== undefined && ref !== null && `${ref}`.length) map.set(ref, key);
    };
    const buildKey = (value, prefix, index) => {
        const v = value !== undefined && value !== null && `${value}`.length ? `${value}` : `${prefix}-${index}`;
        return v;
    };

    const sharedLayers = m.sharedLayers || [];
    const sharedKeyByRef = new Map();
    const sharedLabelByKey = new Map();
    sharedLayers.forEach((sl, index) => {
        const sharedKey = buildKey(sl.id ?? sl.name, 'shared', index);
        const label = sl.name || sl.id || sharedKey;
        setRefKey(sharedKeyByRef, sl.id, sharedKey);
        setRefKey(sharedKeyByRef, sl.name, sharedKey);
        sharedLabelByKey.set(sharedKey, label);
    });

    const layerKeyByRef = new Map();
    layers.forEach((layer, index) => {
        const layerKey = buildKey(layer.id ?? layer.name, 'layer', index);
        setRefKey(layerKeyByRef, layer.id, layerKey);
        setRefKey(layerKeyByRef, layer.name, layerKey);

        const sharedRefs = new Set();
        for (const ref of (layer.allowedSharedLayerIds || [])) sharedRefs.add(ref);
        for (const ref of (layer.usesShared || [])) sharedRefs.add(ref);
        const usesSharedNames = [...sharedRefs]
            .map((ref) => sharedLabelByKey.get(sharedKeyByRef.get(ref)) || ref)
            .filter((name) => name && `${name}`.length);

        const comps = layer.components || [];
        elements.push({
            group: 'nodes',
            data: {
                id: `layer::${layerKey}`,
                label: layer.name || layer.id || layerKey,
                kind: 'layer',
                componentCount: comps.length,
                violationCount: layer.violationCount || 0,
                usesShared: usesSharedNames.join(', '),
                _raw: { ...layer, usesShared: usesSharedNames },
                _moduleName: mod.name || mod.id || moduleRef,
                _moduleId: mod.id || mod.name || moduleRef,
            }
        });
    });

    const sharedNames = new Set();
    for (const layer of layers) {
        for (const ref of (layer.allowedSharedLayerIds || [])) sharedNames.add(ref);
        for (const ref of (layer.usesShared || [])) sharedNames.add(ref);
    }
    for (const ref of sharedNames) {
        const sharedKey = sharedKeyByRef.get(ref);
        if (!sharedKey) continue;
        const sl = sharedLayers.find((s) => (s.id === ref || s.name === ref)) || {};
        elements.push({
            group: 'nodes',
            data: {
                id: `shared::${sharedKey}`,
                label: sl.name || sl.id || sharedLabelByKey.get(sharedKey) || sharedKey,
                kind: 'shared',
                componentCount: (sl.components || []).length,
                _raw: sl,
            }
        });
    }

    const subsystemDeps = (m.dependencies || []).filter((d) => {
        const fromModule = d.fromModule ?? d.fromSubsystem;
        const toModule = d.toModule ?? d.toSubsystem;
        return fromModule === (mod.id || mod.name) && toModule === (mod.id || mod.name);
    });
    const edgeSeen = new Set();
    for (const dep of subsystemDeps) {
        const fromKey = layerKeyByRef.get(dep.fromLayer);
        const toKey = layerKeyByRef.get(dep.toLayer);
        if (!fromKey || !toKey) continue;
        const key = `${fromKey}->${toKey}`;
        if (!edgeSeen.has(key)) {
            edgeSeen.add(key);
            elements.push({
                group: 'edges',
                data: {
                    id: `dep-${key}`,
                    source: `layer::${fromKey}`,
                    target: `layer::${toKey}`,
                    kind: 'dependency',
                },
                classes: dep.violation ? 'violation' : '',
            });
        }
    }

    for (const layer of layers) {
        const layerKey = layerKeyByRef.get(layer.id) || layerKeyByRef.get(layer.name);
        if (!layerKey) continue;
        for (const ref of (layer.allowedSharedLayerIds || [])) {
            const sharedKey = sharedKeyByRef.get(ref);
            if (!sharedKey) continue;
            const key = `${layerKey}->shared:${sharedKey}`;
            if (!edgeSeen.has(key)) {
                edgeSeen.add(key);
                elements.push({
                    group: 'edges',
                    data: {
                        id: `shared-${key}`,
                        source: `layer::${layerKey}`,
                        target: `shared::${sharedKey}`,
                        kind: 'uses-shared',
                        label: 'uses',
                    }
                });
            }
        }
    }

    return elements;
}
