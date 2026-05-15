import { html } from 'lit';

export function renderSidePanel({ selectedNode, model, onSelectLayer, onDrillIntoModule }) {
    if (!selectedNode) {
        return html`
            <div class="empty-state">
                <div class="icon">🗺</div>
                <p>Click on a <b>module</b> or <b>layer</b> to see its details here.</p>
                ${model.appDescription
                    ? html`<p style="margin-top:12px; font-size:0.75rem; color:#546e7a;">${model.appDescription}</p>`
                    : ''}
            </div>`;
    }

    if (selectedNode.type === 'module') {
        return renderModulePanel(selectedNode.data, model, onSelectLayer, onDrillIntoModule);
    }
    if (selectedNode.type === 'layer') {
        return renderLayerPanel(selectedNode.data, selectedNode.moduleName);
    }
    if (selectedNode.type === 'shared') {
        return renderSharedLayerPanel(selectedNode.data);
    }

    return html``;
}

function renderModulePanel(mod, model, onSelectLayer, onDrillIntoModule) {
    const layers = mod.layers || [];
    const totalComps = layers.reduce((s, l) => s + (l.components || []).length, 0);
    const moduleRef = mod.id || mod.name;
    const moduleLabel = mod.name || mod.id;

    return html`
        <div class="panel-header">
            <span class="type-pill type-${(mod.type || 'layered').replace('-', '-')}">${mod.type || 'layered'}</span>
            <h3>${mod.name || mod.id}</h3>
            ${mod.description ? html`<div class="panel-desc">${mod.description}</div>` : ''}
        </div>

        <div class="panel-section">
            <h4>Statistics</h4>
            <div class="stat-row"><span>Layers</span><span class="stat-value">${layers.length}</span></div>
            <div class="stat-row"><span>Components</span><span class="stat-value">${totalComps}</span></div>
            ${mod.parallelTo ? html`<div class="stat-row"><span>Parallel to</span><span class="stat-value">${mod.parallelTo}</span></div>` : ''}
            ${mod.violationCount > 0
                ? html`<div class="stat-row"><span>Violations</span><span class="stat-value" style="color:#ef5350">${mod.violationCount}</span></div>`
                : ''}
        </div>

        <div class="panel-section">
            <h4>Layers</h4>
            ${layers.map((layer) => html`
                <span class="layer-chip"
                      @click=${() => onSelectLayer(layer, { ref: moduleRef, label: moduleLabel })}>
                    ${layer.name || layer.id}
                    <span style="margin-left:6px; color:#546e7a; font-size:0.68rem">${(layer.components || []).length}</span>
                </span>
            `)}
        </div>

        ${renderModuleDeps(mod, model)}

        <div class="panel-section">
            <button class="btn btn-primary" style="width:100%"
                    @click=${() => onDrillIntoModule(moduleRef)}>
                🔍 Explore Layers
            </button>
        </div>
    `;
}

function renderModuleDeps(mod, model) {
    const modules = model.subsystems || model.modules || [];
    const nameByRef = new Map(modules.map((m) => [m.id || m.name, m.name || m.id]));
    const moduleRef = mod.id || mod.name;

    const deps = (model.dependencies || []).filter((d) => {
        const fromRef = d.fromModule ?? d.fromSubsystem;
        const toRef = d.toModule ?? d.toSubsystem;
        return fromRef === moduleRef || toRef === moduleRef;
    });
    if (!deps.length) return html``;

    const crossModule = deps.filter((d) => (d.fromModule ?? d.fromSubsystem) !== (d.toModule ?? d.toSubsystem));
    if (!crossModule.length) return html``;

    const uniqueEdges = new Map();
    crossModule.forEach((d) => {
        const fromRef = d.fromModule ?? d.fromSubsystem;
        const toRef = d.toModule ?? d.toSubsystem;
        const key = `${fromRef}->${toRef}`;
        if (!uniqueEdges.has(key)) uniqueEdges.set(key, { fromRef, toRef });
    });

    return html`
        <div class="panel-section">
            <h4>Cross-Module Dependencies</h4>
            ${[...uniqueEdges.values()].map((d) => html`
                <div class="dep-edge">
                    <span>${nameByRef.get(d.fromRef) || d.fromRef}</span>
                    <span class="arrow">→</span>
                    <span>${nameByRef.get(d.toRef) || d.toRef}</span>
                </div>
            `)}
        </div>`;
}

function renderLayerPanel(layer, moduleName) {
    const comps = layer.components || [];
    const sharedRefs = layer.usesShared || [];

    return html`
        <div class="panel-header">
            <span class="type-pill type-layer">layer · ${moduleName || 'shared'}</span>
            <h3>${layer.name}</h3>
            ${layer.description ? html`<div class="panel-desc">${layer.description}</div>` : ''}
        </div>

        ${(layer.rules || []).length ? html`
            <div class="panel-section">
                <h4>Rules</h4>
                <ul class="rule-list">
                    ${(layer.rules || []).map((r) => html`<li>${r}</li>`)}
                </ul>
            </div>` : ''}

        ${sharedRefs.length ? html`
            <div class="panel-section">
                <h4>Uses Shared</h4>
                ${sharedRefs.map((s) => html`<span class="shared-layer-pill">⬡ ${s}</span>`)}
            </div>` : ''}

        <div class="panel-section">
            <h4>Components (${comps.length})</h4>
            ${comps.length === 0
                ? html`<p class="panel-desc">No components discovered in this layer.</p>`
                : html`<ul class="comp-list">${comps.map((c) => renderComponent(c))}</ul>`}
        </div>
    `;
}

function renderSharedLayerPanel(layer) {
    const comps = layer.components || [];

    return html`
        <div class="panel-header">
            <span class="type-pill type-shared">shared layer</span>
            <h3>${layer.name}</h3>
            ${layer.description ? html`<div class="panel-desc">${layer.description}</div>` : ''}
        </div>

        ${(layer.rules || []).length ? html`
            <div class="panel-section">
                <h4>Rules</h4>
                <ul class="rule-list">
                    ${(layer.rules || []).map((r) => html`<li>${r}</li>`)}
                </ul>
            </div>` : ''}

        <div class="panel-section">
            <h4>Components (${comps.length})</h4>
            ${comps.length === 0
                ? html`<p class="panel-desc">No components discovered in this layer.</p>`
                : html`<ul class="comp-list">${comps.map((c) => renderComponent(c))}</ul>`}
        </div>
    `;
}

function renderComponent(comp) {
    const srcClass = `src-${comp.source || 'package'}`;
    const srcLabel = {
        manual: '@ArchComponent',
        annotation: 'annotation',
        package: 'package',
        unclassified: 'unclassified'
    }[comp.source] || comp.source;

    return html`
        <li class="comp-item">
            <div class="comp-name">
                ${comp.simpleClassName || comp.className}
                ${comp.ambiguous ? html`<span class="ambiguous-tag">ambiguous</span>` : ''}
            </div>
            ${comp.packageName ? html`<div class="comp-pkg">${comp.packageName}</div>` : ''}
            ${comp.description ? html`<div class="comp-desc">${comp.description}</div>` : ''}
            <span class="source-tag ${srcClass}">${srcLabel}</span>
        </li>`;
}
