import {html} from 'lit';
import {getViolationsWithMeta} from '../models/archlens-model.js';
import {Icon} from '../components/archlens-icons.js';

export function renderViolationsView({
                                         model,
                                         filterText,
                                         filterSubsystem,
                                         onFilterTextChange,
                                         onFilterSubsystemChange,
                                         onNavigateToViolation,
                                     }) {
    const all = getViolationsWithMeta(model);
    const subsystems = [...new Set(all.map(v => v.fromSubsystemName))].sort();
    const searchLower = (filterText || '').toLowerCase();

    const filtered = all.filter(v => {
        const matchesSub = !filterSubsystem || v.fromSubsystemName === filterSubsystem;
        const matchesText = !searchLower || [
            v.fromClass, v.toClass, v.fromLayerName, v.toLayerName,
            v.fromSubsystemName, v.toSubsystemName, v.violatedRule,
        ].some(s => (s || '').toLowerCase().includes(searchLower));
        return matchesSub && matchesText;
    });

    return html`
        <div class="tab-view violations-view">
            <div class="view-header">
                <h3 class="view-title">${Icon.Violation} Violations
                    <span class="badge badge-warn" style="margin-left:8px">${all.length}</span>
                </h3>
                <p class="view-desc">All dependency rule violations in the architecture. Click "Go to" to jump to the
                    relevant layer view.</p>
            </div>

            <div class="view-filters">
                <input
                        class="filter-input"
                        type="text"
                        placeholder="Search by class, layer, rule…"
                        .value=${filterText || ''}
                        @input=${e => onFilterTextChange(e.target.value)}/>
                <select
                        class="filter-select"
                        .value=${filterSubsystem || ''}
                        @change=${e => onFilterSubsystemChange(e.target.value)}>
                    <option value="">All subsystems</option>
                    ${subsystems.map(s => html`
                        <option value=${s}>${s}</option>`)}
                </select>
                ${(filterText || filterSubsystem) ? html`
                    <button class="btn" @click=${() => {
                        onFilterTextChange('');
                        onFilterSubsystemChange('');
                    }}>
                        ✕ Clear
                    </button>
                ` : ''}
            </div>

            ${filterText || filterSubsystem ? html`
                <div class="view-result-count">Showing ${filtered.length} of ${all.length} violations</div>
            ` : ''}

            ${filtered.length === 0 ? html`
                <div class="view-empty">
                    ${all.length === 0
                            ? html`<span class="badge badge-ok" style="font-size:1rem">✓ No violations found — architecture is clean!</span>`
                            : html`<span>No violations match the current filters.</span>`}
                </div>
            ` : html`
                <div class="violation-list">
                    ${filtered.map(v => html`
                        <div class="viol-card">
                            <div class="viol-card-header">
                                <span class="viol-rule">${v.violatedRule || 'Rule violation'}</span>
                                <button
                                        class="btn btn-primary viol-goto"
                                        @click=${() => onNavigateToViolation({
                                            subsystemRef: v.fromSubsystem,
                                            layerRef: v.fromLayer,
                                        })}>
                                    Go to layer →
                                </button>
                            </div>
                            <div class="viol-route">
                                <div class="viol-side">
                                    <span class="viol-sub">${v.fromSubsystemName}</span>
                                    <span class="viol-layer">◫ ${v.fromLayerName}</span>
                                    <span class="viol-class">${v.fromClass}</span>
                                </div>
                                <span class="viol-arrow">→</span>
                                <div class="viol-side">
                                    <span class="viol-sub">${v.toSubsystemName}</span>
                                    <span class="viol-layer">◫ ${v.toLayerName}</span>
                                    <span class="viol-class">${v.toClass}</span>
                                </div>
                            </div>
                        </div>
                    `)}
                </div>
            `}
        </div>
    `;
}
