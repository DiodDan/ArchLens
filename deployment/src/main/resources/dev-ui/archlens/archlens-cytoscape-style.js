export function getCytoscapeStyle() {
    return [
        {
            selector: 'node',
            style: {
                'label':               'data(label)',
                'text-valign':         'center',
                'text-halign':         'center',
                'font-family':         'Inter, sans-serif',
                'font-size':           '13px',
                'color':               '#e0e0e0',
                'text-wrap':           'wrap',
                'text-max-width':      '130px',
                'padding':             '14px',
                'border-width':        '2px',
                'transition-property': 'background-color, border-color',
                'transition-duration': '0.15s',
            }
        },
        {
            selector: 'node[kind="module"]',
            style: {
                'shape':              'round-rectangle',
                'background-color':   '#0d2137',
                'border-color':       '#1565c0',
                'width':              '160px',
                'height':             '80px',
                'font-weight':        '600',
                'font-size':          '14px',
                'label':              (node) => {
                    const n = node.data('label');
                    const c = node.data('componentCount');
                    const v = node.data('violationCount');
                    const vBadge = v > 0 ? `\n⚠ ${v}` : '';
                    return `${n}\n${c} components${vBadge}`;
                },
            }
        },
        {
            selector: 'node[kind="module"][moduleType="event-driven"]',
            style: { 'border-color': '#6a1b9a', 'background-color': '#1a0a2e' }
        },
        {
            selector: 'node[kind="module"][moduleType="standalone"]',
            style: { 'border-color': '#1b5e20', 'background-color': '#0a1e0a' }
        },
        {
            selector: 'node[kind="shared"]',
            style: {
                'shape':            'octagon',
                'background-color': '#1a0e00',
                'border-color':     '#e65100',
                'width':            '120px',
                'height':           '60px',
                'font-size':        '12px',
                'label':            (node) => `⬡ ${node.data('label')}\n${node.data('componentCount')} comps`,
            }
        },
        {
            selector: 'node[kind="layer"]',
            style: {
                'shape':            'round-rectangle',
                'background-color': '#0a1929',
                'border-color':     '#263238',
                'width':            '150px',
                'height':           '70px',
                'font-size':        '13px',
                'label':            (node) => {
                    const n = node.data('label');
                    const c = node.data('componentCount');
                    return `${n}\n${c} component${c !== 1 ? 's' : ''}`;
                },
            }
        },
        {
            selector: 'node.selected',
            style: {
                'border-color': '#4fc3f7',
                'border-width': '3px',
                'background-color': '#102030',
            }
        },
        {
            selector: 'node.hovered',
            style: { 'border-color': '#90caf9', 'cursor': 'pointer' }
        },
        {
            selector: 'edge',
            style: {
                'width':               '1.5px',
                'line-color':          '#263238',
                'target-arrow-color':  '#263238',
                'target-arrow-shape': 'triangle',
                'curve-style':         'bezier',
                'arrow-scale':         '0.8',
            }
        },
        {
            selector: 'edge[kind="uses-shared"]',
            style: {
                'line-color':         '#e65100',
                'target-arrow-color': '#e65100',
                'line-style':         'dashed',
                'width':              '1.5px',
            }
        },
        {
            selector: 'edge[kind="cross-module"]',
            style: {
                'line-color':         '#1565c0',
                'target-arrow-color': '#1565c0',
                'width':              '1.5px',
            }
        },
        {
          selector: '.ambiguous',
          style: {
            'border-color': '#f59e0b',
            'border-width': 3,
            'border-style': 'dashed'
          }
        },
        {
          selector: 'edge.violation',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'width': 2
          }
        }
    ];
}
