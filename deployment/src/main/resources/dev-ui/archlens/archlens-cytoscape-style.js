import {CyIcon} from './components/archlens-icons.js';

export function getCytoscapeStyle() {
    return [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-family': 'Inter, sans-serif',
                'font-size': '13px',
                'color': '#e0e0e0',
                'text-wrap': 'wrap',
                'text-max-width': '140px',
                'padding': '14px',
                'border-width': '2px',
                'transition-property': 'background-color, border-color, border-width, opacity',
                'transition-duration': '0.15s',
            },
        },
        {
            selector: 'node[kind="module"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#0d2137',
                'border-color': '#1565c0',
                'width': '170px',
                'height': '84px',
                'font-weight': '600',
                'font-size': '14px',
                'label': (node) => {
                    const n = node.data('label');
                    const c = node.data('componentCount');
                    const v = node.data('violationCount');
                    const vBadge = v > 0 ? `\n⚠ ${v} violation${v > 1 ? 's' : ''}` : '';
                    return `${n}\n${c} component${c !== 1 ? 's' : ''}${vBadge}`;
                },
            },
        },
        {
            selector: 'node[kind="module"][moduleType="event-driven"]',
            style: {'border-color': '#6a1b9a', 'background-color': '#1a0a2e'},
        },
        {
            selector: 'node[kind="module"][moduleType="standalone"]',
            style: {'border-color': '#1b5e20', 'background-color': '#0a1e0a'},
        },
        {
            selector: 'node[kind="shared"]',
            style: {
                'shape': 'octagon',
                'background-color': '#1a0e00',
                'border-color': '#e65100',
                'width': '130px',
                'height': '65px',
                'font-size': '12px',
                'label': (node) =>
                    `⬡ ${node.data('label')}\n${node.data('componentCount')} comp${node.data('componentCount') !== 1 ? 's' : ''}`,
            },
        },
        {
            selector: 'node[kind="layer"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#0a1929',
                'border-color': '#263238',
                'width': '155px',
                'height': '72px',
                'font-size': '13px',
                'label': (node) => {
                    const n = node.data('label');
                    const c = node.data('componentCount');
                    const v = node.data('violationCount');
                    return `${n}\n${c} component${c !== 1 ? 's' : ''}${v > 0 ? `\n⚠ ${v}` : ''}`;
                },
            },
        },
        {
            selector: 'node[kind="ghost-module"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#1a0000',
                'border-color': '#ef4444',
                'border-style': 'dashed',
                'width': '155px',
                'height': '72px',
                'font-size': '12px',
                'color': '#ef9a9a',
                'opacity': '0.75',
            },
        },
        {
            selector: 'node[kind="component"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#0d1a26',
                'border-color': '#1e3a4a',
                'width': '150px',
                'height': '54px',
                'font-size': '12px',
                'text-max-width': '136px',
            },
        },
        {selector: 'node[kind="component"][source="manual"]', style: {'border-color': '#1a237e'}},
        {selector: 'node[kind="component"][source="annotation"]', style: {'border-color': '#1b5e20'}},
        {selector: 'node[kind="component"][source="unclassified"]', style: {'border-color': '#4e342e'}},
        {
            selector: 'node[kind="component-group"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#0d1a26',
                'border-color': '#37474f',
                'border-width': '2px',
                'width': '160px',
                'height': '60px',
                'font-size': '12px',
                'font-weight': '600',
                'color': '#90caf9',
                'outline-width': '3px',
                'outline-color': '#1e2d3d',
                'outline-offset': '3px',
                'label': (node) => `${CyIcon.Group} ${node.data('groupSize')} components`,
            },
        },
        {
            selector: 'node[kind="target-module"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#0d2137',
                'border-color': '#1565c0',
                'width': '155px',
                'height': '64px',
                'font-size': '13px',
                'font-weight': '600',
                'label': (node) => `${CyIcon.Module} ${node.data('label')}`,
            },
        },
        {
            selector: 'node[kind="target-shared"]',
            style: {
                'shape': 'octagon',
                'background-color': '#1a0e00',
                'border-color': '#e65100',
                'width': '130px',
                'height': '60px',
                'font-size': '12px',
                'label': (node) => `${CyIcon.SharedLayer} ${node.data('label')}`,
            },
        },
        {
            selector: 'node[kind="target-layer"]',
            style: {
                'shape': 'round-rectangle',
                'background-color': '#0a1929',
                'border-color': '#263238',
                'width': '140px',
                'height': '54px',
                'font-size': '12px',
                'label': (node) => `${CyIcon.Layer} ${node.data('label')}`,
            },
        },
        {
            selector: 'node.selected',
            style: {
                'border-color': '#4fc3f7',
                'border-width': '3px',
                'background-color': '#102030',
            },
        },
        {
            selector: 'node.hovered',
            style: {'border-color': '#90caf9', 'cursor': 'pointer'},
        },
        {
            selector: 'node.neighbor-highlighted',
            style: {
                'border-color': '#4fc3f740',
                'border-width': '2px',
            },
        },
        {
            selector: 'node.has-violations',
            style: {'border-color': '#ef4444', 'border-width': '3px'},
        },
        {
            selector: 'node.ambiguous',
            style: {
                'border-color': '#f59e0b',
                'border-width': '3px',
                'border-style': 'dashed',
            },
        },
        {
            selector: 'node.cy-muted',
            style: {'opacity': '0.12'},
        },
        {
            selector: 'edge.cy-muted',
            style: {'opacity': '0.06'},
        },
        {
            selector: 'edge',
            style: {
                'width': '1.5px',
                'line-color': '#263238',
                'target-arrow-color': '#263238',
                'target-arrow-shape': 'triangle',
                'arrow-scale': '0.8',
                'curve-style': 'bezier',
                'transition-property': 'opacity',
                'transition-duration': '0.15s',
            },
        },
        {
            selector: 'edge.edge-highlighted',
            style: {
                'width': '3px',
                'opacity': '1',
                'z-index': '999',
            },
        },
        {
            selector: 'edge.overview-edge',
            style: {'curve-style': 'taxi', 'taxi-direction': 'auto', 'taxi-turn': '50%', 'edge-distances': 'node'},
        },
        {
            selector: 'edge.overview-edge[kind="uses-shared"]',
            style: {'line-color': '#e65100', 'target-arrow-color': '#e65100', 'line-style': 'dashed', 'width': '1.5px'},
        },
        {
            selector: 'edge.overview-edge[kind="cross-module"]',
            style: {'line-color': '#1565c0', 'target-arrow-color': '#1565c0', 'width': '1.5px'},
        },
        {
            selector: 'edge.detail-edge',
            style: {
                'curve-style': 'taxi', 'taxi-direction': 'downward',
                'taxi-turn': '50%', 'edge-distances': 'node',
                'line-color': '#37474f', 'target-arrow-color': '#37474f',
            },
        },
        {
            selector: 'edge.detail-edge[kind="uses-shared"]',
            style: {'line-color': '#e65100', 'target-arrow-color': '#e65100', 'line-style': 'dashed'},
        },
        {
            selector: 'edge.detail-edge[kind="dependency"]',
            style: {'line-color': '#1565c0', 'target-arrow-color': '#1565c0'},
        },
        {
            selector: 'edge.detail-edge[kind="violation-cross"]',
            style: {'line-color': '#ef4444', 'target-arrow-color': '#ef4444', 'line-style': 'dashed'},
        },
        {
            selector: 'edge.component-edge',
            style: {
                'curve-style': 'taxi', 'taxi-direction': 'rightward',
                'taxi-turn': '50%', 'edge-distances': 'node',
                'line-color': '#37474f', 'target-arrow-color': '#37474f', 'width': '1.5px',
            },
        },
        {
            selector: 'edge.violation',
            style: {
                'line-color': '#ef4444',
                'target-arrow-color': '#ef4444',
                'line-style': 'dashed',
                'width': '2.5px',
            },
        },
    ];
}
