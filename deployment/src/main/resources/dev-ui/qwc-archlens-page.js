import { LitElement, html } from 'lit';
import { architectureModel } from 'build-time-data';
import cytoscape from 'https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.esm.min.js';
import { archlensStyles } from './archlens/archlens-styles.js';
import { normalizeModel, countTotalComponents } from './archlens/archlens-store.js';
import { buildOverviewElements, buildModuleElements } from './archlens/archlens-graph-elements.js';
import { getCytoscapeStyle } from './archlens/archlens-cytoscape-style.js';
import { renderToolbar } from './archlens/archlens-toolbar.js';
import { renderSidePanel } from './archlens/archlens-panels.js';

/**
 * ArchLens Dev UI — main page component.
 */
class QwcArchLensPage extends LitElement {

    static properties = {
        _selectedNode:  { state: true },
        _viewMode:      { state: true },
        _activeModule:  { state: true },
        _showUnclassified: { state: true },
        _model:         { state: true },
    };

    static styles = archlensStyles;

    constructor() {
        super();
        this._model = normalizeModel(architectureModel);
        this._selectedNode = null;
        this._viewMode = 'overview';
        this._activeModule = null;
        this._showUnclassified = true;
        this._cy = null;
    }

    render() {
        const m = this._model;
        const totalComponents = countTotalComponents(m);
        const violations = (m.violations || []).length;

        return html`
            ${renderToolbar({
                model: m,
                viewMode: this._viewMode,
                activeModule: this._activeModule,
                totalComponents,
                violationCount: violations,
                onBackToOverview: () => this._backToOverview(),
                onFitGraph: () => this._fitGraph(),
                onResetLayout: () => this._resetLayout(),
            })}

            <div class="layout">
                <div id="graph-container">
                    <div id="cy"></div>
                    <div class="graph-hint">
                        ${this._viewMode === 'overview'
                            ? 'Click a module to explore its layers • Scroll to zoom • Drag to pan'
                            : 'Click a layer to see its components • Click background to deselect'}
                    </div>
                </div>
                <div class="side-panel ${this._selectedNode ? '' : 'empty'}">
                    ${renderSidePanel({
                        selectedNode: this._selectedNode,
                        model: m,
                        onSelectLayer: (layer, moduleInfo) => this._selectLayerFromPanel(layer, moduleInfo),
                        onDrillIntoModule: (moduleName) => this._drillIntoModule(moduleName),
                    })}
                </div>
            </div>
        `;
    }

    firstUpdated() {
        this._initCytoscape();
    }

    updated(changedProperties) {
        if (changedProperties.has('_viewMode') || changedProperties.has('_activeModule')) {
            this._rebuildGraph();
        }
    }

    _initCytoscape() {
        const container = this.shadowRoot.getElementById('cy');
        if (!container) return;

        this._cy = cytoscape({
            container,
            elements: [],
            style: getCytoscapeStyle(),
            layout: { name: 'preset' },
            wheelSensitivity: 0.3,
            minZoom: 0.2,
            maxZoom: 3,
        });

        this._cy.on('tap', 'node', (evt) => this._onNodeTap(evt));
        this._cy.on('tap', (evt) => {
            if (evt.target === this._cy) this._selectedNode = null;
        });

        this._cy.on('mouseover', 'node', (evt) => {
            evt.target.addClass('hovered');
        });
        this._cy.on('mouseout', 'node', (evt) => {
            evt.target.removeClass('hovered');
        });

        this._rebuildGraph();
    }

    _rebuildGraph() {
        if (!this._cy) return;
        this._cy.elements().remove();

        const elements = this._viewMode === 'overview'
            ? buildOverviewElements(this._model)
            : buildModuleElements(this._model, this._activeModule);

        this._cy.add(elements);

        const layout = this._viewMode === 'overview'
            ? { name: 'cose', padding: 60, nodeRepulsion: 8000, idealEdgeLength: 160, animate: true, animationDuration: 400 }
            : { name: 'breadthfirst', directed: true, padding: 50, spacingFactor: 1.4, animate: true, animationDuration: 400 };

        this._cy.layout(layout).run();
    }

    _onNodeTap(evt) {
        const node = evt.target;
        const data = node.data();

        this._cy.nodes('.selected').removeClass('selected');
        node.addClass('selected');

        const kind = data.kind;

        if (kind === 'module') {
            this._selectedNode = { type: 'module', data: data._raw };
        } else if (kind === 'layer') {
            this._selectedNode = { type: 'layer', data: data._raw, moduleName: data._moduleName };
        } else if (kind === 'shared') {
            this._selectedNode = { type: 'shared', data: data._raw };
        }
    }

    _drillIntoModule(moduleName) {
        this._activeModule = moduleName;
        this._viewMode = 'module';
        this._selectedNode = null;
    }

    _backToOverview() {
        this._viewMode = 'overview';
        this._activeModule = null;
        this._selectedNode = null;
    }

    _selectLayerFromPanel(layer, moduleInfo) {
        const moduleRef = moduleInfo?.ref || moduleInfo;
        const moduleLabel = moduleInfo?.label || moduleInfo;
        this._drillIntoModule(moduleRef);
        setTimeout(() => {
            const layerRef = layer.id || layer.name;
            const node = this._cy.$(`#layer\\:\\:${CSS.escape(layerRef)}`);
            if (node.length) {
                this._cy.nodes('.selected').removeClass('selected');
                node.addClass('selected');
                this._selectedNode = { type: 'layer', data: layer, moduleName: moduleLabel };
            }
        }, 500);
    }

    _fitGraph() {
        this._cy?.fit(undefined, 40);
    }

    _resetLayout() {
        this._rebuildGraph();
    }
}

customElements.define('qwc-archlens-page', QwcArchLensPage);
