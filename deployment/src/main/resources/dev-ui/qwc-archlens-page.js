import { LitElement, html }       from 'lit';
import { architectureModel }      from 'build-time-data';

import cytoscape from 'https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.esm.min.js';
import dagre     from 'https://esm.sh/cytoscape-dagre@2.5.0';
import cola      from 'https://esm.sh/cytoscape-cola@2.4.0';

import { archlensStyles }                          from './archlens/archlens-styles.js';
import { getCytoscapeStyle }                       from './archlens/archlens-cytoscape-style.js';
import { normalizeModel, countTotalComponents,
         getAmbiguousComponents }                  from './archlens/models/archlens-model.js';
import { ColorService }                            from './archlens/services/archlens-color-service.js';
import { buildLayoutConfig, defaultLayoutForMode } from './archlens/services/archlens-layout-service.js';
import { buildOverviewElements }                   from './archlens/graph/archlens-graph-overview.js';
import { buildModuleElements }                     from './archlens/graph/archlens-graph-module.js';
import { buildComponentElements }                  from './archlens/graph/archlens-graph-component.js';
import { buildSharedLayerElements }                from './archlens/graph/archlens-graph-shared.js';
import { renderToolbar }                           from './archlens/components/archlens-toolbar.js';
import { renderLeftPanel }                         from './archlens/components/archlens-left-panel.js';
import { renderSidePanel }                         from './archlens/panels/archlens-side-panel.js';
import { renderViolationsView }                    from './archlens/views/archlens-view-violations.js';
import { renderAmbiguousView }                     from './archlens/views/archlens-view-ambiguous.js';
import { renderSearchView }                        from './archlens/views/archlens-view-search.js';
import { renderUnclassifiedView } from './archlens/views/archlens-view-unclassified.js';

cytoscape.use(dagre);
try { cytoscape.use(cola); } catch (_) { /* cola already registered */ }

const DBLCLICK_MS = 300;

function addDblClickHandler(cy, handler) {
    let lastTap = 0, lastTarget = null;
    cy.on('tap', 'node', evt => {
        const now = Date.now();
        if (lastTarget === evt.target && now - lastTap < DBLCLICK_MS) {
            handler(evt); lastTap = 0; lastTarget = null;
        } else {
            lastTap = now; lastTarget = evt.target;
        }
    });
}

class QwcArchLensPage extends LitElement {

    static styles = archlensStyles;

    static properties = {
        _activeTab:         { state: true },

        _graphMode:         { state: true },
        _activeModule:      { state: true },
        _activeLayer:       { state: true },
        _activeSharedLayer: { state: true },
        _selectedNode:      { state: true },
        _groupByDependency: { state: true },

        _model:             { state: true },

        _hiddenNodes:       { state: true },
        _soloNode:          { state: true },
        _leftPanelNodes:    { state: true },

        _rainbowMode:       { state: true },

        _layoutConfig:      { state: true },

        _violFilterText:    { state: true },
        _violFilterSub:     { state: true },
        _ambFilterText:     { state: true },
        _searchText:        { state: true },
    };

    constructor() {
        super();
        this._model              = normalizeModel(architectureModel);
        this._activeTab          = 'graph';
        this._graphMode          = 'overview';
        this._activeModule       = null;
        this._activeLayer        = null;
        this._activeSharedLayer  = null;
        this._selectedNode       = null;
        this._groupByDependency  = false;
        this._hiddenNodes        = new Set();
        this._soloNode           = null;
        this._leftPanelNodes     = [];
        this._rainbowMode        = false;
        this._layoutConfig       = defaultLayoutForMode('overview');
        this._violFilterText     = '';
        this._violFilterSub      = '';
        this._ambFilterText      = '';
        this._searchText         = '';
        this._cy                 = null;
        this._colorService       = new ColorService();
        this._unclassifiedFilterText = '';
    }
    firstUpdated() {
        this._initCytoscape();
    }

    updated(changedProps) {
        const needsRebuild = ['_graphMode','_activeModule','_activeLayer','_activeSharedLayer','_groupByDependency']
            .some(p => changedProps.has(p));

        if (needsRebuild) {
            this._rebuildGraph();
            return;
        }

        if (changedProps.has('_layoutConfig')) {
            this._rerunLayout();
            return;
        }

        if (changedProps.has('_hiddenNodes') || changedProps.has('_soloNode')) {
            this._applyVisibility();
        }

        if (changedProps.has('_rainbowMode')) {
            if (this._rainbowMode) this._colorService.applyRainbowColors(this._cy);
            else                   this._colorService.removeRainbowColors(this._cy);
        }
    }

    render() {
        const m               = this._model;
        const totalComponents = countTotalComponents(m);
        const violationCount  = (m.violations || []).length;
        const ambiguousCount  = getAmbiguousComponents(m).length;
        const unclassifiedCount = (m.unclassifiedComponents || []).length;

        const sharedLayerObj  = this._activeSharedLayer
            ? (m.sharedLayers || []).find(s => s.id === this._activeSharedLayer || s.name === this._activeSharedLayer)
            : null;
        const activeSharedLayerName = sharedLayerObj
            ? (sharedLayerObj.name || sharedLayerObj.id)
            : this._activeSharedLayer;

        return html`
            ${renderToolbar({
                model:            m,
                activeTab:        this._activeTab,
                graphMode:        this._graphMode,
                activeModule:     this._activeModule,
                activeLayer:      this._activeLayer,
                activeSharedLayer: activeSharedLayerName,
                totalComponents,
                violationCount,
                ambiguousCount,
                groupByDependency: this._groupByDependency,
                rainbowMode:      this._rainbowMode,
                layoutConfig:     this._layoutConfig,
                onTabChange:          tab => this._onTabChange(tab),
                onBackToOverview:     ()  => this._backToOverview(),
                onBackToModule:       ()  => this._backToModule(),
                onFitGraph:           ()  => this._fitGraph(),
                onResetLayout:        ()  => this._rerunLayout(),
                onToggleGroup:        ()  => this._toggleGroup(),
                onToggleRainbow:      ()  => this._rainbowMode = !this._rainbowMode,
                onLayoutChange:       cfg => this._layoutConfig = cfg,
                unclassifiedCount: unclassifiedCount,
            })}

            <div class="layout" style="${this._activeTab !== 'graph' ? 'display:none' : ''}">
                ${renderLeftPanel({
                    nodes:        this._leftPanelNodes,
                    hiddenNodes:  this._hiddenNodes,
                    soloNode:     this._soloNode,
                    onMuteToggle: id => this._onMuteToggle(id),
                    onSoloToggle: id => this._onSoloToggle(id),
                    onResetAll:   ()  => this._resetVisibility(),
                })}

                <div id="graph-container">
                    <div id="cy"></div>
                    <div class="graph-hint">${this._graphHint()}</div>
                </div>

                <div class="side-panel ${this._selectedNode ? '' : 'empty'}">
                    ${renderSidePanel({
                        selectedNode:      this._selectedNode,
                        model:             m,
                        onSelectLayer:     (layer, modInfo) => this._selectLayerFromPanel(layer, modInfo),
                        onDrillIntoModule: ref  => this._drillIntoModule(ref),
                        onDrillIntoShared: ref  => this._drillIntoShared(ref),
                    })}
                </div>
            </div>

            ${this._activeTab === 'violations' ? renderViolationsView({
                model:                    m,
                filterText:               this._violFilterText,
                filterSubsystem:          this._violFilterSub,
                onFilterTextChange:       v => this._violFilterText = v,
                onFilterSubsystemChange:  v => this._violFilterSub = v,
                onNavigateToViolation:    ({ subsystemRef, layerRef }) =>
                    this._navigateToLayer(subsystemRef, layerRef),
            }) : ''}

            ${this._activeTab === 'ambiguous' ? renderAmbiguousView({
                model:             m,
                filterText:        this._ambFilterText,
                onFilterTextChange: v => this._ambFilterText = v,
                onNavigateToComponent: ({ subsystemRef, layerRef, isShared }) =>
                    isShared
                        ? this._drillIntoShared(layerRef)
                        : this._navigateToLayer(subsystemRef, layerRef),
            }) : ''}

            ${this._activeTab === 'search' ? renderSearchView({
                model:                   m,
                searchText:              this._searchText,
                onSearchChange:          v => this._searchText = v,
                onNavigateToModule:      ref => this._navigateToModuleAndSwitch(ref),
                onNavigateToLayer:       ({ subsystemRef, layerRef }) =>
                    this._navigateToLayerAndSwitch(subsystemRef, layerRef),
                onNavigateToShared:      ref => this._navigateToSharedAndSwitch(ref),
                onNavigateToComponent:   ({ subsystemRef, layerRef, isShared }) =>
                    isShared
                        ? this._navigateToSharedAndSwitch(layerRef)
                        : this._navigateToLayerAndSwitch(subsystemRef, layerRef),
            }) : ''}
            
            ${this._activeTab === 'unclassified' ? renderUnclassifiedView({
                model:                   m,
                filterText:              this._unclassifiedFilterText,
                onFilterTextChange:      v => this._unclassifiedFilterText = v,
                onNavigateToOverview:    () => this._navigateToOverviewAndSwitch(),
            }) : ''}
        `;
    }

    _graphHint() {
        switch (this._graphMode) {
            case 'overview':   return 'Double-click a subsystem to explore its layers · Single-click to inspect · Scroll to zoom';
            case 'module':     return 'Double-click a layer to view its components · Single-click to inspect';
            case 'component':
            case 'shared':     return 'Double-click a target to navigate to it · Single-click to inspect · Toggle grouping above';
            default: return '';
        }
    }

    _initCytoscape() {
        const container = this.shadowRoot.getElementById('cy');
        if (!container) return;

        this._cy = cytoscape({
            container,
            elements:         [],
            style:            getCytoscapeStyle(),
            layout:           { name: 'preset' },
            wheelSensitivity: 0.3,
            minZoom:          0.15,
            maxZoom:          3,
        });

        this._cy.on('tap', 'node', evt => this._onNodeTap(evt));

        this._cy.on('tap', evt => {
            if (evt.target === this._cy) {
                this._cy.nodes('.selected').removeClass('selected');
                this._selectedNode = null;
            }
        });

        ColorService.wireHoverHighlight(this._cy);

        addDblClickHandler(this._cy, evt => this._onNodeDblClick(evt));

        this._rebuildGraph();
    }

    _buildElements() {
        switch (this._graphMode) {
            case 'overview':
                return buildOverviewElements(this._model);
            case 'module':
                return buildModuleElements(this._model, this._activeModule);
            case 'component':
                return buildComponentElements(this._model, this._activeModule, this._activeLayer, this._groupByDependency);
            case 'shared':
                return buildSharedLayerElements(this._model, this._activeSharedLayer, this._groupByDependency);
            default:
                return [];
        }
    }

    _rebuildGraph() {
        if (!this._cy) return;

        this._cy.elements().remove();
        this._cy.add(this._buildElements());

        this._leftPanelNodes = this._cy.nodes().map(n => ({
            id:    n.id(),
            label: n.data('label') || n.id(),
            kind:  n.data('kind')  || '',
        }));

        this._applyVisibility();

        if (this._rainbowMode) this._colorService.applyRainbowColors(this._cy);

        const { algorithm, rankDir } = this._layoutConfig;
        this._cy.layout(buildLayoutConfig(algorithm, rankDir)).run();
    }

    _rerunLayout() {
        if (!this._cy) return;
        const { algorithm, rankDir } = this._layoutConfig;
        this._cy.layout(buildLayoutConfig(algorithm, rankDir)).run();
    }


    _applyVisibility() {
        if (!this._cy) return;
        const hidden = this._hiddenNodes;
        const solo   = this._soloNode;

        this._cy.batch(() => {
            if (solo) {
                const soloEl   = this._cy.$(`#${CSS.escape(solo)}`);
                const vicinity = soloEl.union(soloEl.neighborhood());

                this._cy.nodes().forEach(n =>
                    vicinity.has(n) ? n.removeClass('cy-muted') : n.addClass('cy-muted')
                );
                this._cy.edges().forEach(e => {
                    const s = e.data('source'), t = e.data('target');
                    (s === solo || t === solo) ? e.removeClass('cy-muted') : e.addClass('cy-muted');
                });

            } else {
                this._cy.nodes().forEach(n =>
                    hidden.has(n.id()) ? n.addClass('cy-muted') : n.removeClass('cy-muted')
                );
                this._cy.edges().forEach(e => {
                    const s = e.data('source'), t = e.data('target');
                    (hidden.has(s) || hidden.has(t)) ? e.addClass('cy-muted') : e.removeClass('cy-muted');
                });
            }
        });
    }

    _onMuteToggle(nodeId) {
        const next = new Set(this._hiddenNodes);
        next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
        this._hiddenNodes = next;
    }

    _onSoloToggle(nodeId) {
        this._soloNode = this._soloNode === nodeId ? null : nodeId;
    }

    _resetVisibility() {
        this._hiddenNodes = new Set();
        this._soloNode    = null;
    }

    _onNodeTap(evt) {
        const node = evt.target;
        this._cy.nodes('.selected').removeClass('selected');
        node.addClass('selected');
        this._selectedNode = this._toSelectedNode(node.data());
    }

    _onNodeDblClick(evt) {
        const data = evt.target.data();
        switch (data.kind) {
            case 'module':
                this._drillIntoModule(data._raw?.id || data._raw?.name || data.label); break;
            case 'layer':
                this._drillIntoLayer(data._ref || data._raw?.id || data._raw?.name, data._moduleId); break;
            case 'shared':
                this._drillIntoShared(data._ref || data._raw?.id || data._raw?.name); break;
            case 'target-module':
                this._drillIntoModule(data._targetId); break;
            case 'target-shared':
                this._drillIntoShared(data._targetId); break;
            case 'target-layer':
                data._moduleId ? this._drillIntoModule(data._moduleId) : this._backToOverview(); break;
            case 'ghost-module':
                this._drillIntoModule(data._targetId || data._raw?.id || data._raw?.name); break;
        }
    }

    _toSelectedNode(data) {
        switch (data.kind) {
            case 'module':          return { type: 'module',          data: data._raw };
            case 'layer':           return { type: 'layer',           data: data._raw, moduleName: data._moduleName };
            case 'shared':          return { type: 'shared',          data: data._raw };
            case 'ghost-module':    return { type: 'ghost-module',    data: data._raw };
            case 'component':       return { type: 'component',       data: data._raw };
            case 'component-group': return { type: 'component-group', components: data._components };
            case 'target-module':   return { type: 'target-module',   data: data._raw };
            case 'target-shared':   return { type: 'target-shared',   data: data._raw };
            case 'target-layer':    return { type: 'target-layer',    data: data._raw, moduleName: data._moduleId };
            default: return null;
        }
    }

    _drillIntoModule(ref) {
        if (!ref) return;
        this._activeModule      = ref;
        this._graphMode         = 'module';
        this._activeLayer       = null;
        this._activeSharedLayer = null;
        this._selectedNode      = null;
        this._groupByDependency = false;
        this._resetVisibility();
    }

    _drillIntoLayer(layerRef, moduleRef) {
        if (!layerRef) return;
        if (moduleRef) this._activeModule = moduleRef;
        this._activeLayer       = layerRef;
        this._graphMode         = 'component';
        this._activeSharedLayer = null;
        this._selectedNode      = null;
        this._groupByDependency = false;
        this._resetVisibility();
    }

    _drillIntoShared(ref) {
        if (!ref) return;
        this._activeSharedLayer = ref;
        this._graphMode         = 'shared';
        this._activeModule      = null;
        this._activeLayer       = null;
        this._selectedNode      = null;
        this._groupByDependency = false;
        this._resetVisibility();
    }

    _backToOverview() {
        this._graphMode         = 'overview';
        this._activeModule      = null;
        this._activeLayer       = null;
        this._activeSharedLayer = null;
        this._selectedNode      = null;
        this._groupByDependency = false;
        this._resetVisibility();
        this._layoutConfig      = defaultLayoutForMode('overview');
    }

    _backToModule() {
        this._graphMode    = 'module';
        this._activeLayer  = null;
        this._selectedNode = null;
        this._resetVisibility();
        this._layoutConfig = defaultLayoutForMode('module');
    }

    _navigateToLayer(subsystemRef, layerRef) {
        this._drillIntoLayer(layerRef, subsystemRef);
        this._activeTab = 'graph';
        setTimeout(() => this._cy?.resize(), 80);
    }

    _navigateToModuleAndSwitch(ref) {
        this._drillIntoModule(ref);
        this._activeTab = 'graph';
        setTimeout(() => this._cy?.resize(), 80);
    }

    _navigateToLayerAndSwitch(subsystemRef, layerRef) {
        this._navigateToLayer(subsystemRef, layerRef);
    }

    _navigateToSharedAndSwitch(ref) {
        this._drillIntoShared(ref);
        this._activeTab = 'graph';
        setTimeout(() => this._cy?.resize(), 80);
    }

    _navigateToOverviewAndSwitch() {
        this._backToOverview();
        this._activeTab = 'graph';
        setTimeout(() => this._cy?.resize(), 80);
    }

    _selectLayerFromPanel(layer, modInfo) {
        const modRef   = modInfo?.ref   || modInfo;
        const modLabel = modInfo?.label || modInfo;
        this._drillIntoModule(modRef);

        setTimeout(() => {
            const layerRef = layer.id || layer.name;
            const node     = this._cy.$(`#${CSS.escape(`layer::${layerRef}`)}`);
            if (node?.length) {
                this._cy.nodes('.selected').removeClass('selected');
                node.addClass('selected');
                this._selectedNode = { type: 'layer', data: layer, moduleName: modLabel };
            }
        }, 500);
    }

    _onTabChange(tab) {
        this._activeTab = tab;
        if (tab === 'graph' && this._cy) {
            setTimeout(() => this._cy.resize(), 50);
        }
    }

    _toggleGroup() {
        this._groupByDependency = !this._groupByDependency;
    }

    _fitGraph() {
        this._cy?.fit(undefined, 40);
    }
}

customElements.define('qwc-archlens-page', QwcArchLensPage);
