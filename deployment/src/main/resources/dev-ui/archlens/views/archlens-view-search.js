import { html } from 'lit';
import {Icon} from '../components/archlens-icons.js';

const MIN_QUERY_LENGTH = 2;

export function renderSearchView({
    model, searchText,
    onSearchChange, onNavigateToModule, onNavigateToLayer, onNavigateToShared, onNavigateToComponent,
}) {
    const q = (searchText || '').trim().toLowerCase();
    const results = q.length >= MIN_QUERY_LENGTH ? runSearch(model, q) : null;

    return html`
        <div class="tab-view search-view">
            <div class="view-header">
                <h3 class="view-title">${Icon.Search} Search</h3>
                <p class="view-desc">Find any subsystem, layer, or component. Navigate directly to its view.</p>
            </div>

            <div class="search-bar-wrap">
                <input
                    class="search-bar-input"
                    type="text"
                    placeholder="Search subsystems, layers, components…"
                    autofocus
                    .value=${searchText || ''}
                    @input=${e => onSearchChange(e.target.value)} />
                ${searchText ? html`
                    <button class="search-clear-btn" @click=${() => onSearchChange('')}>${Icon.Clear}</button>
                ` : ''}
            </div>

            ${q.length > 0 && q.length < MIN_QUERY_LENGTH ? html`
                <div class="view-empty">Type at least ${MIN_QUERY_LENGTH} characters to search.</div>
            ` : ''}

            ${results !== null ? renderResults(results, {
                onNavigateToModule, onNavigateToLayer, onNavigateToShared, onNavigateToComponent,
            }) : ''}
        </div>
    `;
}

function runSearch(model, q) {
    const m           = model || {};
    const subsystems  = [];
    const layers      = [];
    const sharedLayers = [];
    const components  = [];

    for (const mod of (m.subsystems || [])) {
        if (matchesAny(q, mod.name, mod.id, mod.description)) {
            subsystems.push({
                ref: mod.id || mod.name,
                name: mod.name || mod.id,
                type: mod.type || 'layered',
                layerCount: (mod.layers || []).length,
                componentCount: (mod.layers || []).reduce((s, l) => s + (l.components || []).length, 0),
            });
        }
    }

    for (const mod of (m.subsystems || [])) {
        const subsystemRef  = mod.id || mod.name;
        const subsystemName = mod.name || mod.id;
        for (const layer of (mod.layers || [])) {
            const layerRef  = layer.id || layer.name;
            const layerName = layer.name || layer.id;

            if (matchesAny(q, layerName, layer.description)) {
                layers.push({ subsystemRef, subsystemName, layerRef, layerName, isShared: false,
                    componentCount: (layer.components || []).length });
            }

            for (const comp of (layer.components || [])) {
                if (matchesComponent(q, comp)) {
                    components.push({ ...comp, subsystemRef, subsystemName, layerRef, layerName, isShared: false });
                }
            }
        }
    }

    for (const sl of (m.sharedLayers || [])) {
        const layerRef  = sl.id || sl.name;
        const layerName = sl.name || sl.id;

        if (matchesAny(q, layerName, sl.description)) {
            sharedLayers.push({ layerRef, layerName, componentCount: (sl.components || []).length });
        }

        for (const comp of (sl.components || [])) {
            if (matchesComponent(q, comp)) {
                components.push({ ...comp, subsystemRef: null, subsystemName: null, layerRef, layerName, isShared: true });
            }
        }
    }

    for (const comp of (m.unclassifiedComponents || [])) {
        if (matchesComponent(q, comp)) {
            components.push({
                ...comp,
                subsystemRef: null,
                subsystemName: null,
                layerRef: null,
                layerName: 'Unclassified',
                isShared: false,
                isUnclassified: true,
            });
        }
    }

    return { subsystems, layers, sharedLayers, components,
        total: subsystems.length + layers.length + sharedLayers.length + components.length };
}

function matchesAny(q, ...fields) {
    return fields.some(f => f && `${f}`.toLowerCase().includes(q));
}

function matchesComponent(q, comp) {
    return matchesAny(q, comp.className, comp.simpleClassName, comp.packageName, comp.description);
}

function renderResults(results, { onNavigateToModule, onNavigateToLayer, onNavigateToShared, onNavigateToComponent }) {
    if (results.total === 0) {
        return html`<div class="view-empty">No results found.</div>`;
    }

    return html`
        <div class="search-results">
            <div class="search-total">${results.total} result${results.total !== 1 ? 's' : ''}</div>

            ${results.subsystems.length > 0 ? html`
                <div class="search-group">
                    <h4 class="search-group-title">${Icon.Module} Subsystems (${results.subsystems.length})</h4>
                    ${results.subsystems.map(s => html`
                        <div class="search-card">
                            <div class="search-card-main">
                                <span class="search-name">${s.name}</span>
                                <span class="search-meta">${s.layerCount} layers · ${s.componentCount} components</span>
                            </div>
                            <button class="btn btn-primary search-goto" @click=${() => onNavigateToModule(s.ref)}>
                                Open →
                            </button>
                        </div>
                    `)}
                </div>
            ` : ''}

            ${results.layers.length > 0 ? html`
                <div class="search-group">
                    <h4 class="search-group-title">${Icon.Layer} Layers (${results.layers.length})</h4>
                    ${results.layers.map(l => html`
                        <div class="search-card">
                            <div class="search-card-main">
                                <span class="search-name">${l.layerName}</span>
                                <div class="search-location">
                                    <span class="search-sub">${l.subsystemName}</span>
                                    <span class="sep">›</span>
                                    <span>${l.componentCount} components</span>
                                </div>
                            </div>
                            <button class="btn btn-primary search-goto"
                                @click=${() => onNavigateToLayer({ subsystemRef: l.subsystemRef, layerRef: l.layerRef })}>
                                Go to layer →
                            </button>
                        </div>
                    `)}
                </div>
            ` : ''}

            ${results.sharedLayers.length > 0 ? html`
                <div class="search-group">
                    <h4 class="search-group-title">${Icon.SharedLayer} Shared Layers (${results.sharedLayers.length})</h4>
                    ${results.sharedLayers.map(sl => html`
                        <div class="search-card">
                            <div class="search-card-main">
                                <span class="search-name">${sl.layerName}</span>
                                <span class="search-meta">${sl.componentCount} components · shared</span>
                            </div>
                            <button class="btn btn-primary search-goto"
                                @click=${() => onNavigateToShared(sl.layerRef)}>
                                Explore →
                            </button>
                        </div>
                    `)}
                </div>
            ` : ''}

            ${results.components.length > 0 ? html`
                <div class="search-group">
                    <h4 class="search-group-title">${Icon.Component} Components (${results.components.length})</h4>
                    ${results.components.slice(0, 50).map(c => html`
                        <div class="search-card">
                            <div class="search-card-main">
                                <span class="search-name">
                                    ${c.simpleClassName || c.className}
                                    ${c.ambiguous ? html`<span class="ambiguous-tag">ambiguous</span>` : ''}
                                </span>
                                <div class="search-location">
                                    <span class="search-pkg">${c.packageName || ''}</span>
                                    <span class="sep">·</span>
                                    ${c.isShared
                                        ? html`<span class="shared-layer-pill" style="font-size:0.65rem">⬡ ${c.layerName}</span>`
                                        : html`<span>${c.subsystemName} › ${c.layerName}</span>`}
                                </div>
                            </div>
                            <button class="btn btn-primary search-goto"
                                @click=${() => onNavigateToComponent({
                                    subsystemRef: c.subsystemRef,
                                    layerRef: c.layerRef,
                                    isShared: c.isShared,
                                })}>
                                Go to layer →
                            </button>
                        </div>
                    `)}
                    ${results.components.length > 50 ? html`
                        <div class="view-empty" style="padding:10px 0;text-align:left">
                            …and ${results.components.length - 50} more. Refine your query.
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}
