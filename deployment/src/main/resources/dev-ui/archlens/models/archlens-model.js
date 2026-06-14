export function normalizeModel(model) {
    if (!model) {
        return {
            appName: 'No model',
            appDescription: '',
            subsystems: [],
            sharedLayers: [],
            unclassifiedComponents: [],
            dependencies: [],
            violations: [],
            totalComponentCount: 0,
            totalViolationCount: 0,
        };
    }
    return { ...model, subsystems: model.subsystems || model.modules || [] };
}

export function getUnclassifiedComponents(model) {
    return (model?.unclassifiedComponents || []);
}

export function countTotalComponents(model) {
    const m = model || {};
    let count = (m.unclassifiedComponents || []).length;
    count += (m.sharedLayers || []).reduce((s, l) => s + (l.components || []).length, 0);
    count += (m.subsystems || []).reduce(
        (s, mod) => s + (mod.layers || []).reduce((ls, l) => ls + (l.components || []).length, 0),
        0
    );
    return count;
}

export function getAllComponents(model) {
    const m = model || {};
    const results = [];

    for (const mod of (m.subsystems || [])) {
        const subsystemId = mod.id || mod.name;
        const subsystemName = mod.name || mod.id;
        for (const layer of (mod.layers || [])) {
            const layerId = layer.id || layer.name;
            const layerName = layer.name || layer.id;
            for (const comp of (layer.components || [])) {
                results.push({ ...comp, subsystemId, subsystemName, layerId, layerName, isSharedLayer: false });
            }
        }
    }

    for (const sl of (m.sharedLayers || [])) {
        const layerId = sl.id || sl.name;
        const layerName = sl.name || sl.id;
        for (const comp of (sl.components || [])) {
            results.push({ ...comp, subsystemId: null, subsystemName: null, layerId, layerName, isSharedLayer: true });
        }
    }

    return results;
}

export function getAmbiguousComponents(model) {
    return getAllComponents(model).filter(c => c.ambiguous);
}

export function getViolationsWithMeta(model) {
    const m = model || {};
    const modById   = new Map((m.subsystems  || []).map(s => [s.id || s.name, s]));
    const sharedById = new Map((m.sharedLayers || []).map(s => [s.id || s.name, s]));

    return (m.violations || []).map((v, idx) => {
        const fromMod = v.fromSubsystem ? modById.get(v.fromSubsystem) : null;
        const toMod   = v.toSubsystem   ? modById.get(v.toSubsystem)   : null;

        let fromLayerName = v.fromLayer;
        let toLayerName   = v.toLayer;

        if (fromMod) {
            const fl = (fromMod.layers || []).find(l => l.id === v.fromLayer || l.name === v.fromLayer);
            if (fl) fromLayerName = fl.name || fl.id;
        }
        if (toMod) {
            const tl = (toMod.layers || []).find(l => l.id === v.toLayer || l.name === v.toLayer);
            if (tl) toLayerName = tl.name || tl.id;
        } else if (!v.toSubsystem) {
            const sl = sharedById.get(v.toLayer);
            if (sl) toLayerName = sl.name || sl.id;
        }

        return {
            ...v,
            _idx: idx,
            fromSubsystemName: fromMod
                ? (fromMod.name || fromMod.id)
                : (v.fromSubsystem || 'shared'),
            toSubsystemName: toMod
                ? (toMod.name || toMod.id)
                : (v.toSubsystem || 'shared'),
            fromLayerName,
            toLayerName,
        };
    });
}

export function findSharedLayer(model, ref) {
    return (model?.sharedLayers || []).find(s => s.id === ref || s.name === ref) || null;
}

export function findSubsystem(model, ref) {
    return (model?.subsystems || []).find(s => s.id === ref || s.name === ref) || null;
}
