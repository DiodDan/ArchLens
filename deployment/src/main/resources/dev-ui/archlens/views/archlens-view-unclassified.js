import { html } from 'lit';
import { componentTypeIcon } from '../graph/archlens-graph-utils.js';
import { getUnclassifiedComponents } from '../models/archlens-model.js';
import {Icon} from "../components/archlens-icons.js";

export function renderUnclassifiedView({
    model,
    filterText,
    onFilterTextChange,
    onNavigateToOverview,
}) {
    const all         = getUnclassifiedComponents(model);
    const searchLower  = (filterText || '').toLowerCase();

    const filtered = all.filter(c => {
        if (!searchLower) return true;
        return [
            c.className,
            c.simpleClassName,
            c.packageName,
            c.description,
            c.source,
            c.componentType,
        ].some(s => (s || '').toString().toLowerCase().includes(searchLower));
    });

    return html`
        <div class="tab-view unclassified-view">
            <div class="view-header">
                <h3 class="view-title">${Icon.Ghost} Unclassified Components
                    <span class="badge ${all.length > 0 ? 'badge-warn' : 'badge-ok'}" style="margin-left:8px">
                        ${all.length}
                    </span>
                </h3>
                <p class="view-desc">
                    Components discovered by ArchLens that did not match any subsystem or layer.
                    They are kept at the root model level so you can fix the ADL or add
                    an explicit <code>@ArchComponent</code> mapping.
                </p>
            </div>

            <div class="view-filters">
                <input
                    class="filter-input"
                    type="text"
                    placeholder="Search by class, package, source, description…"
                    .value=${filterText || ''}
                    @input=${e => onFilterTextChange(e.target.value)} />
                ${filterText ? html`
                    <button class="btn" @click=${() => onFilterTextChange('')}>
                        ✕ Clear
                    </button>
                ` : ''}
            </div>

            ${filterText ? html`
                <div class="view-result-count">Showing ${filtered.length} of ${all.length} unclassified components</div>
            ` : ''}

            ${filtered.length === 0 ? html`
                <div class="view-empty">
                    ${all.length === 0
                        ? html`<span class="badge badge-ok" style="font-size:1rem">✓ No unclassified components — everything is classified!</span>`
                        : html`<span>No matches for the current search.</span>`}
                </div>
            ` : html`
                <div class="ambiguous-list">
                    ${filtered.map(comp => html`
                        <div class="amb-card">
                            <div class="amb-card-header">
                                <div>
                                    <span class="amb-name">
                                        ${componentTypeIcon(comp.componentType)} ${comp.simpleClassName || comp.className}
                                    </span>
                                    <span class="source-tag src-unclassified" style="margin-left:6px">unclassified</span>
                                </div>

                                ${onNavigateToOverview ? html`
                                    <button class="btn btn-primary amb-goto" @click=${onNavigateToOverview}>
                                        Open graph overview →
                                    </button>
                                ` : ''}
                            </div>

                            <div class="amb-meta">
                                <span class="amb-pkg">${comp.packageName || comp.className || ''}</span>
                                <div class="amb-location">
                                    <span class="amb-subsystem">No subsystem</span>
                                    <span class="sep">›</span>
                                    <span class="amb-layer">No layer</span>
                                </div>
                            </div>

                            ${comp.description ? html`<div class="amb-desc">${comp.description}</div>` : ''}
                        </div>
                    `)}
                </div>
            `}
        </div>
    `;
}