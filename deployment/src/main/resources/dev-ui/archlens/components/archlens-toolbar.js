import {html} from 'lit';
import {LAYOUT_ALGORITHMS, DAGRE_RANK_DIRS} from '../services/archlens-layout-service.js';
import {Icon} from './archlens-icons.js';

const TABS = [
    {id: 'unclassified', icon: Icon.Ghost, label: 'Unclassified'},
    {id: 'graph', icon: Icon.Graph, label: 'Graph'},
    {id: 'violations', icon: Icon.Violation, label: 'Violations'},
    {id: 'ambiguous', icon: Icon.Ambiguous, label: 'Ambiguous'},
    {id: 'search', icon: Icon.Search, label: 'Search'},
];

export function renderToolbar(opts) {
    const {
        model, activeTab, graphMode, activeModule, activeLayer, activeSharedLayer,
        totalComponents, violationCount, ambiguousCount, groupByDependency,
        rainbowMode, layoutConfig,
        onTabChange, onBackToOverview, onBackToModule, onFitGraph, onResetLayout,
        onToggleGroup, onToggleRainbow, onLayoutChange, unclassifiedCount,
    } = opts;

    const currentAlgo = layoutConfig?.algorithm || 'dagre';
    const currentDir = layoutConfig?.rankDir || 'TB';
    const algoMeta = LAYOUT_ALGORITHMS.find(a => a.id === currentAlgo);

    return html`
        <div class="toolbar toolbar-top">
            <h2>${Icon.Logo} ArchLens</h2>
            <span class="app-name">${model.appName || 'Architecture'}</span>

            <nav class="tab-nav">
                ${TABS.map(tab => html`
                    <button
                            class="tab-btn ${activeTab === tab.id ? 'tab-active' : ''}"
                            @click=${() => onTabChange(tab.id)}>
                        ${tab.icon} ${tab.label}
                        ${tab.id === 'violations' && violationCount > 0
                                ? html`<span class="tab-badge tab-badge-warn">${violationCount}</span>`
                                : ''}
                        ${tab.id === 'ambiguous' && ambiguousCount > 0
                                ? html`<span class="tab-badge tab-badge-warn">${ambiguousCount}</span>`
                                : ''}
                        ${tab.id === 'unclassified' && unclassifiedCount > 0
                                ? html`<span class="tab-badge tab-badge-warn">${unclassifiedCount}</span>`
                                : ''}
                    </button>
                `)}
            </nav>

            <span class="badge badge-info">
                ${(model.subsystems || []).length} module${(model.subsystems || []).length !== 1 ? 's' : ''}
            </span>
            <span class="badge badge-info">
                ${totalComponents} component${totalComponents !== 1 ? 's' : ''}
            </span>
            ${violationCount > 0
                    ? html`<span class="badge badge-warn">⚠ ${violationCount}</span>`
                    : html`<span class="badge badge-ok">✓ Clean</span>`}
        </div>

        ${activeTab === 'graph' ? html`
            <div class="toolbar toolbar-graph">
                ${graphMode !== 'overview' ? html`
                    <div class="breadcrumb">
                        <a @click=${onBackToOverview}>Overview</a>
                        <span class="sep">›</span>
                        ${graphMode === 'component' ? html`
                            <a @click=${onBackToModule}>${activeModule}</a>
                            <span class="sep">›</span>
                            <span>${activeLayer}</span>
                        ` : graphMode === 'shared' ? html`
                            <span>⬡ ${activeSharedLayer}</span>
                        ` : html`
                            <span>${activeModule}</span>
                        `}
                    </div>
                ` : ''}

                ${(graphMode === 'component' || graphMode === 'shared') ? html`
                    <button
                            class="btn ${groupByDependency ? 'btn-primary' : ''}"
                            @click=${onToggleGroup}
                            title="Group components that share the same dependency targets">
                        ${groupByDependency ? html`${Icon.Group} Grouped` : html`${Icon.Group} Group by deps`}
                    </button>
                ` : ''}

                <div class="layout-selector">
                    <label class="layout-label">Layout</label>
                    <select
                            class="layout-select"
                            .value=${currentAlgo}
                            @change=${e => onLayoutChange({algorithm: e.target.value, rankDir: currentDir})}>
                        ${LAYOUT_ALGORITHMS.map(a => html`
                            <option value=${a.id} ?selected=${a.id === currentAlgo}>${a.label}</option>
                        `)}
                    </select>

                    ${algoMeta?.hasDirOption ? html`
                        <select
                                class="layout-select layout-select-dir"
                                .value=${currentDir}
                                @change=${e => onLayoutChange({algorithm: currentAlgo, rankDir: e.target.value})}>
                            ${DAGRE_RANK_DIRS.map(d => html`
                                <option value=${d.id} ?selected=${d.id === currentDir}>${d.label}</option>
                            `)}
                        </select>
                    ` : ''}
                </div>

                <button
                        class="btn ${rainbowMode ? 'btn-primary' : ''}"
                        @click=${onToggleRainbow}
                        title="Colour each dependency arrow by its source node">
                    ${Icon.Rainbow} Rainbow
                </button>

                <button class="btn" @click=${onFitGraph} title="Fit graph to screen">${Icon.Fit} Fit</button>
                <button class="btn" @click=${onResetLayout} title="Re-run layout">${Icon.Layout} Layout</button>
            </div>
        ` : ''}
    `;
}
