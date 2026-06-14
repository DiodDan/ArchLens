const PALETTE = [
    '#4fc3f7', // sky-blue
    '#81c784', // green
    '#ffb74d', // amber
    '#ce93d8', // lavender
    '#f48fb1', // rose
    '#80cbc4', // teal
    '#fff176', // yellow
    '#80deea', // cyan
    '#a5d6a7', // sage
    '#b39ddb', // violet
    '#ffcc80', // peach
    '#90caf9', // periwinkle
    '#c5e1a5', // lime
    '#ffab91', // coral
    '#e6ee9c', // chartreuse
    '#64b5f6', // cornflower
    '#4db6ac', // medium-teal
    '#dce775', // yellow-green
    '#ff8a65', // orange
    '#f06292', // pink
];

export class ColorService {
    constructor() {
        this._colorMap  = new Map();
        this._nextIndex = 0;
    }

    reset() {
        this._colorMap.clear();
        this._nextIndex = 0;
    }

    getColorForSource(sourceId) {
        if (!this._colorMap.has(sourceId)) {
            this._colorMap.set(sourceId, PALETTE[this._nextIndex % PALETTE.length]);
            this._nextIndex++;
        }
        return this._colorMap.get(sourceId);
    }

    applyRainbowColors(cy) {
        this.reset();
        cy.edges().forEach(edge => {
            if (edge.hasClass('violation')) return;           // keep red
            const color = this.getColorForSource(edge.data('source'));
            edge.style({ 'line-color': color, 'target-arrow-color': color });
        });
    }

    removeRainbowColors(cy) {
        cy.edges().forEach(edge => {
            edge.removeStyle('line-color');
            edge.removeStyle('target-arrow-color');
        });
    }

    static wireHoverHighlight(cy) {
        cy.on('mouseover', 'node', evt => {
            const node = evt.target;
            node.addClass('hovered');
            node.connectedEdges().addClass('edge-highlighted');
            node.neighborhood('node').addClass('neighbor-highlighted');
        });
        cy.on('mouseout', 'node', evt => {
            const node = evt.target;
            node.removeClass('hovered');
            node.connectedEdges().removeClass('edge-highlighted');
            node.neighborhood('node').removeClass('neighbor-highlighted');
        });
    }
}
