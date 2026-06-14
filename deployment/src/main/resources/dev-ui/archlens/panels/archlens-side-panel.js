import { html } from 'lit';
import {Icon} from "../components/archlens-icons.js";


export function renderSidePanel({ selectedNode, model, onSelectLayer, onDrillIntoModule, onDrillIntoShared }) {
    if (!selectedNode) {
        return html`
            <div class="empty-state">
                <div class="icon">${Icon.Search}</div>
                <p>Click any node to inspect it.<br>Double-click to drill into it.</p>
            </div>
        `;
    }

    const { type, data, moduleName, components } = selectedNode;

    switch (type) {
        case 'module':
            return renderModulePanel(data, model, onSelectLayer, onDrillIntoModule);
        case 'layer':
            return renderLayerPanel(data, moduleName, model, onDrillIntoModule);
        case 'shared':
            return renderSharedPanel(data, model, onDrillIntoShared);
        case 'component':
            return renderComponentPanel(data, model);
        case 'component-group':
            return renderGroupPanel(components);
        case 'ghost-module':
            return renderGhostPanel(data, onDrillIntoModule);
        case 'target-module':
            return renderTargetModulePanel(data, onDrillIntoModule);
        case 'target-shared':
            return renderSharedPanel(data, model, onDrillIntoShared);
        case 'target-layer':
            return renderLayerPanel(data, moduleName, model, onDrillIntoModule);
        default:
            return html`<div class="empty-state"><p>Unknown node type: ${type}</p></div>`;
    }
}

function renderModulePanel(mod, model, onSelectLayer, onDrillIntoModule) {
    if (!mod) return html``;
    const layers     = mod.layers || [];
    const violations = (model?.violations || []).filter(
        v => v.fromSubsystem === (mod.id || mod.name) || v.toSubsystem === (mod.id || mod.name)
    );
    const moduleRef   = mod.id || mod.name;
    const moduleLabel = mod.name || mod.id;

    return html`
        <div class="panel-header">
            <div class="type-pill ${moduleTypePill(mod.type)}">
                ${mod.type || 'Layered'} subsystem
            </div>
            <h3>${mod.name || mod.id}</h3>
            ${mod.description ? html`<p class="panel-desc">${mod.description}</p>` : ''}
        </div>

        <div class="panel-section">
            <h4>Stats</h4>
            <div class="stat-row"><span>Layers</span>         <span class="stat-value">${layers.length}</span></div>
            <div class="stat-row"><span>Components</span>     <span class="stat-value">${mod.totalComponentCount ?? layers.reduce((s,l) => s+(l.components||[]).length,0)}</span></div>
            <div class="stat-row"><span>Violations</span>
                <span class="stat-value ${violations.length ? 'violation-value' : ''}">${violations.length}</span>
            </div>
        </div>

        <div class="panel-section">
            <h4>Layers <span style="font-weight:normal;color:#546e7a">(click to navigate)</span></h4>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
                ${layers.map(layer => html`
                    <span
                        class="layer-chip ${(layer.violationCount||0) > 0 ? 'layer-chip-violation' : ''}"
                        @click=${() => onSelectLayer(layer, { ref: moduleRef, label: moduleLabel })}>
                        ${layer.name || layer.id}
                        ${(layer.violationCount||0) > 0 ? html`<span style="margin-left:4px">⚠</span>` : ''}
                    </span>
                `)}
            </div>
        </div>

        ${violations.length > 0 ? html`
            <div class="panel-section">
                <h4>Violations</h4>
                ${violations.slice(0, 5).map(v => html`
                    <div class="violation-item">
                        <div class="violation-rule">${v.violatedRule || 'Rule violation'}</div>
                        <div class="violation-classes">${v.fromClass}<br>→ ${v.toClass}</div>
                    </div>
                `)}
                ${violations.length > 5 ? html`<div class="panel-desc" style="padding-top:6px">+${violations.length-5} more</div>` : ''}
            </div>
        ` : ''}

        <div class="panel-section">
            <button class="btn btn-primary" style="width:100%" @click=${() => onDrillIntoModule(moduleRef)}>
                Explore layers →
            </button>
        </div>
    `;
}

function renderLayerPanel(layer, moduleName, model, onDrillIntoModule) {
    if (!layer) return html``;
    const components  = layer.components || [];
    const rules       = layer.rules || [];
    const violations  = (model?.violations || []).filter(
        v => v.fromLayer === (layer.id || layer.name) || v.toLayer === (layer.id || layer.name)
    );

    return html`
        <div class="panel-header">
            <div class="type-pill type-layer">Layer</div>
            <h3>${layer.name || layer.id}</h3>
            ${moduleName ? html`<p class="panel-desc">in ${moduleName}</p>` : ''}
            ${layer.description ? html`<p class="panel-desc">${layer.description}</p>` : ''}
        </div>

        <div class="panel-section">
            <h4>Stats</h4>
            <div class="stat-row"><span>Components</span>  <span class="stat-value">${components.length}</span></div>
            <div class="stat-row"><span>Violations</span>
                <span class="stat-value ${violations.length ? 'violation-value' : ''}">${violations.length}</span>
            </div>
        </div>

        ${rules.length > 0 ? html`
            <div class="panel-section">
                <h4>Rules</h4>
                <ul class="rule-list">
                    ${rules.map(r => html`<li>${r}</li>`)}
                </ul>
            </div>
        ` : ''}

        ${components.length > 0 ? html`
            <div class="panel-section">
                <h4>Components (${components.length})</h4>
                <ul class="comp-list">
                    ${components.slice(0, 12).map(c => renderCompItem(c))}
                    ${components.length > 12 ? html`<li class="panel-desc" style="padding:6px 0">+${components.length-12} more</li>` : ''}
                </ul>
            </div>
        ` : ''}

        ${violations.length > 0 ? html`
            <div class="panel-section">
                <h4>Violations</h4>
                ${violations.slice(0, 5).map(v => html`
                    <div class="violation-item">
                        <div class="violation-rule">${v.violatedRule || 'Rule violation'}</div>
                        <div class="violation-classes">${v.fromClass}<br>→ ${v.toClass}</div>
                    </div>
                `)}
            </div>
        ` : ''}
    `;
}

function renderSharedPanel(sl, model, onDrillIntoShared) {
    if (!sl) return html``;
    const components = sl.components || [];
    const slRef      = sl.id || sl.name;

    return html`
        <div class="panel-header">
            <div class="type-pill type-shared">⬡ Shared Layer</div>
            <h3>${sl.name || sl.id}</h3>
            ${sl.description ? html`<p class="panel-desc">${sl.description}</p>` : ''}
        </div>

        <div class="panel-section">
            <h4>Stats</h4>
            <div class="stat-row"><span>Components</span> <span class="stat-value">${components.length}</span></div>
        </div>

        ${components.length > 0 ? html`
            <div class="panel-section">
                <h4>Components (${components.length})</h4>
                <ul class="comp-list">
                    ${components.slice(0, 10).map(c => renderCompItem(c))}
                    ${components.length > 10 ? html`<li class="panel-desc" style="padding:6px 0">+${components.length-10} more</li>` : ''}
                </ul>
            </div>
        ` : ''}

        <div class="panel-section">
            <button class="btn btn-primary" style="width:100%" @click=${() => onDrillIntoShared(slRef)}>
                Explore components →
            </button>
        </div>
    `;
}

function renderComponentPanel(comp, model) {
    if (!comp) return html``;
    const outgoing = (model?.dependencies || []).filter(d => d.fromClass === comp.className);
    const incoming = (model?.dependencies || []).filter(d => d.toClass   === comp.className);
    const compViolations = (model?.violations || []).filter(
        v => v.fromClass === comp.className || v.toClass === comp.className
    );

    return html`
        <div class="panel-header">
            <div class="type-pill type-layer">${comp.componentType || 'Class'}</div>
            <h3>${comp.simpleClassName || comp.className}</h3>
            <p class="panel-desc">${comp.packageName || comp.className}</p>
            ${comp.description ? html`<p class="panel-desc">${comp.description}</p>` : ''}
        </div>

        <div class="panel-section">
            <h4>Metadata</h4>
            <div class="stat-row"><span>Source</span>     <span class="stat-value">${sourceTag(comp.source)}</span></div>
            <div class="stat-row"><span>Ambiguous</span>  <span class="stat-value ${comp.ambiguous ? 'violation-value' : ''}">${comp.ambiguous ? '⚠ Yes' : 'No'}</span></div>
            <div class="stat-row"><span>Outgoing deps</span> <span class="stat-value">${outgoing.length}</span></div>
            <div class="stat-row"><span>Incoming deps</span> <span class="stat-value">${incoming.length}</span></div>
        </div>

        ${outgoing.length > 0 ? html`
            <div class="panel-section">
                <h4>Outgoing (${outgoing.length})</h4>
                ${outgoing.slice(0, 8).map(d => html`
                    <div class="dep-edge ${d.violation ? 'dep-edge-violation' : ''}">
                        <span class="arrow">→</span>
                        <span>${shortClassName(d.toClass)}</span>
                    </div>
                `)}
                ${outgoing.length > 8 ? html`<div class="panel-desc" style="padding-top:4px">+${outgoing.length-8} more</div>` : ''}
            </div>
        ` : ''}

        ${compViolations.length > 0 ? html`
            <div class="panel-section">
                <h4>Violations (${compViolations.length})</h4>
                ${compViolations.map(v => html`
                    <div class="violation-item">
                        <div class="violation-rule">${v.violatedRule}</div>
                        <div class="violation-classes">${v.fromClass} → ${v.toClass}</div>
                    </div>
                `)}
            </div>
        ` : ''}
    `;
}

function renderGroupPanel(components) {
    const comps = components || [];
    return html`
        <div class="panel-header">
            <div class="type-pill type-layer">Component Group</div>
            <h3>▣ ${comps.length} components</h3>
            <p class="panel-desc">These components share the same dependency targets.</p>
        </div>
        <div class="panel-section">
            <h4>Members</h4>
            <ul class="comp-list">
                ${comps.map(c => renderCompItem(c))}
            </ul>
        </div>
    `;
}


function renderGhostPanel(data, onDrillIntoModule) {
    const ref = data?._targetId || data?.id || data?.name;
    return html`
        <div class="panel-header">
            <div class="type-pill" style="background:#1a000020;color:#ef9a9a;border:1px solid #ef444430">External</div>
            <h3>${data?.name || ref}</h3>
            <p class="panel-desc">This subsystem is a violation target from outside.</p>
        </div>
        ${ref ? html`
            <div class="panel-section">
                <button class="btn btn-primary" style="width:100%" @click=${() => onDrillIntoModule(ref)}>
                    Navigate to ${data?.name || ref} →
                </button>
            </div>
        ` : ''}
    `;
}

function renderTargetModulePanel(data, onDrillIntoModule) {
    const ref = data?._targetId || data?.id || data?.name;
    return html`
        <div class="panel-header">
            <div class="type-pill type-layered">📦 Subsystem</div>
            <h3>${data?.name || ref}</h3>
            <p class="panel-desc">Dependency target subsystem.</p>
        </div>
        ${ref ? html`
            <div class="panel-section">
                <button class="btn btn-primary" style="width:100%" @click=${() => onDrillIntoModule(ref)}>
                    Navigate to ${data?.name || ref} →
                </button>
            </div>
        ` : ''}
    `;
}


function renderCompItem(comp) {
    return html`
        <li class="comp-item">
            <div class="comp-name">
                ${comp.simpleClassName || comp.className}
                ${comp.ambiguous ? html`<span class="ambiguous-tag">ambiguous</span>` : ''}
            </div>
            <div class="comp-pkg">${comp.packageName || ''}</div>
            ${comp.description ? html`<div class="comp-desc">${comp.description}</div>` : ''}
        </li>
    `;
}

function shortClassName(fqn) {
    return fqn ? fqn.split('.').pop() : fqn;
}

function sourceTag(source) {
    const s = (source || 'unclassified').toLowerCase();
    const cls = {
        'manual':       'src-manual',
        'annotation':   'src-annotation',
        'package':      'src-package',
        'unclassified': 'src-unclassified',
    }[s] || 'src-unclassified';
    return html`<span class="source-tag ${cls}">${source || 'unclassified'}</span>`;
}

function moduleTypePill(type) {
    switch ((type || '').toLowerCase()) {
        case 'event-driven': return 'type-event-driven';
        case 'standalone':   return 'type-standalone';
        default:             return 'type-layered';
    }
}
