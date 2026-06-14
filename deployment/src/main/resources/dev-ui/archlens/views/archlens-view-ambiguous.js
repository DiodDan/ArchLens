import {html} from 'lit';
import {getAmbiguousComponents} from '../models/archlens-model.js';
import {Icon} from '../components/archlens-icons.js';

export function renderAmbiguousView({model, filterText, onFilterTextChange, onNavigateToComponent}) {
    const all = getAmbiguousComponents(model);
    const searchLower = (filterText || '').toLowerCase();

    const filtered = all.filter(c => {
        if (!searchLower) return true;
        return [c.className, c.simpleClassName, c.packageName, c.layerName, c.subsystemName]
            .some(s => (s || '').toLowerCase().includes(searchLower));
    });

    return html`
        <div class="tab-view ambiguous-view">
            <div class="view-header">
                <h3 class="view-title">${Icon.Ambiguous} Ambiguous Components
                    <span class="badge ${all.length > 0 ? 'badge-warn' : 'badge-ok'}" style="margin-left:8px">
                        ${all.length}
                    </span>
                </h3>
                <p class="view-desc">
                    Components that match more than one layer rule and could not be unambiguously
                    classified. Resolve them by tightening your rules or adding explicit annotations.
                </p>
            </div>

            <div class="view-filters">
                <input
                        class="filter-input"
                        type="text"
                        placeholder="Search by class, package, layer…"
                        .value=${filterText || ''}
                        @input=${e => onFilterTextChange(e.target.value)}/>
                ${filterText ? html`
                    <button class="btn" @click=${() => onFilterTextChange('')}>✕ Clear</button>
                ` : ''}
            </div>

            ${filterText ? html`
                <div class="view-result-count">Showing ${filtered.length} of ${all.length}</div>
            ` : ''}

            ${filtered.length === 0 ? html`
                <div class="view-empty">
                    ${all.length === 0
                            ? html`<span class="badge badge-ok" style="font-size:1rem">✓ No ambiguous components — all classifications are clear!</span>`
                            : html`<span>No matches for the current search.</span>`}
                </div>
            ` : html`
                <div class="ambiguous-list">
                    ${filtered.map(comp => html`
                        <div class="amb-card">
                            <div class="amb-card-header">
                                <div>
                                    <span class="amb-name">${comp.simpleClassName || comp.className}</span>
                                    <span class="ambiguous-tag" style="margin-left:6px">ambiguous</span>
                                </div>
                                <button
                                        class="btn btn-primary amb-goto"
                                        title="Navigate to the layer containing this component"
                                        @click=${() => onNavigateToComponent({
                                            subsystemRef: comp.subsystemId,
                                            layerRef: comp.layerId,
                                            isShared: comp.isSharedLayer,
                                        })}>
                                    Go to layer →
                                </button>
                            </div>
                            <div class="amb-meta">
                                <span class="amb-pkg">${comp.packageName || comp.className}</span>
                                <div class="amb-location">
                                    ${comp.isSharedLayer
                                            ? html`<span class="shared-layer-pill">⬡ ${comp.layerName} (shared)</span>`
                                            : html`
                                                <span class="amb-subsystem">${comp.subsystemName}</span>
                                                <span class="sep">›</span>
                                                <span class="amb-layer">◫ ${comp.layerName}</span>
                                            `}
                                </div>
                            </div>
                            ${comp.description ? html`
                                <div class="amb-desc">${comp.description}</div>` : ''}
                        </div>
                    `)}
                </div>
            `}
        </div>
    `;
}
