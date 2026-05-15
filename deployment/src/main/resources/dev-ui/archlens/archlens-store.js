export function normalizeModel(model) {
    if (!model) {
        return {
            appName: 'No model',
            subsystems: [],
            sharedLayers: [],
            unclassifiedComponents: [],
            dependencies: [],
            violations: []
        };
    }

    if (!model.subsystems && model.modules) {
        return { ...model, subsystems: model.modules };
    }

    return model;
}

export function countTotalComponents(model) {
    const m = model || {};
    const modules = m.subsystems || m.modules || [];
    let count = (m.unclassifiedComponents || []).length;
    count += (m.sharedLayers || []).reduce((s, l) => s + (l.components || []).length, 0);
    count += modules.reduce((s, mod) =>
        s + (mod.layers || []).reduce((ls, l) => ls + (l.components || []).length, 0), 0);
    return count;
}
