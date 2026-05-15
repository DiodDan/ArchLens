import { html } from 'lit';

export function renderToolbar({
    model,
    viewMode,
    activeModule,
    totalComponents,
    violationCount,
    onBackToOverview,
    onFitGraph,
    onResetLayout,
}) {
    return html`
        <div class="toolbar">
            <h2>🏗 ArchLens</h2>
            <span class="app-name">${model.appName || 'Architecture'}</span>

            <span class="badge badge-info">${(model.modules || []).length} modules</span>
            <span class="badge badge-info">${totalComponents} components</span>
            ${violationCount > 0
                ? html`<span class="badge badge-warn">⚠ ${violationCount} violations</span>`
                : html`<span class="badge badge-ok">✓ No violations</span>`}

            ${viewMode === 'module' ? html`
                <div class="breadcrumb">
                    <span class="sep">|</span>
                    <a @click=${onBackToOverview}>Overview</a>
                    <span class="sep">›</span>
                    <span>${activeModule}</span>
                </div>
            ` : ''}

            <button class="btn" @click=${onFitGraph} title="Fit graph to screen">⊡ Fit</button>
            <button class="btn" @click=${onResetLayout} title="Reset layout">↺ Layout</button>
        </div>
    `;
}

