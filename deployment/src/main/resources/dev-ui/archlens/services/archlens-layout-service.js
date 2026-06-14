export const LAYOUT_ALGORITHMS = [
    { id: 'dagre',        label: 'Dagre — Hierarchical',    hasDirOption: true  },
    { id: 'cose',         label: 'CoSE — Force-directed',   hasDirOption: false },
    { id: 'breadthfirst', label: 'Breadthfirst — BFS tree', hasDirOption: false },
    { id: 'concentric',   label: 'Concentric — By degree',  hasDirOption: false },
    { id: 'circle',       label: 'Circle',                  hasDirOption: false },
    { id: 'grid',         label: 'Grid',                    hasDirOption: false },
    { id: 'cola',         label: 'Cola — Physics-based',    hasDirOption: false },
];

export const DAGRE_RANK_DIRS = [
    { id: 'TB', label: 'Top → Bottom' },
    { id: 'BT', label: 'Bottom → Top' },
    { id: 'LR', label: 'Left → Right' },
    { id: 'RL', label: 'Right → Left' },
];

export function defaultLayoutForMode(graphMode) {
    switch (graphMode) {
        case 'component':
        case 'shared':
            return { algorithm: 'dagre', rankDir: 'LR' };
        default:
            return { algorithm: 'dagre', rankDir: 'TB' };
    }
}

export function buildLayoutConfig(algorithm, rankDir = 'TB') {
    const base = { animate: true, animationDuration: 400, padding: 50 };

    switch (algorithm) {
        case 'dagre':
            return { ...base, name: 'dagre', rankDir, nodeSep: 60, rankSep: 80, edgeSep: 20, animate: false };

        case 'cose':
            return { ...base, name: 'cose', nodeRepulsion: 8000, idealEdgeLength: 160, padding: 60, animate: false };

        case 'breadthfirst':
            return { ...base, name: 'breadthfirst', directed: true, spacingFactor: 1.6 };

        case 'concentric':
            return {
                ...base,
                name: 'concentric',
                concentric: node => node.degree(),
                levelWidth:  ()   => 2,
                spacingFactor: 1.8,
            };

        case 'circle':
            return { ...base, name: 'circle', spacingFactor: 1.5 };

        case 'grid':
            return { ...base, name: 'grid', spacingFactor: 1.2 };

        case 'cola':
            return { ...base, name: 'cola', maxSimulationTime: 2000, nodeSpacing: 40, edgeLength: 160 };

        default:
            return { ...base, name: 'preset' };
    }
}
