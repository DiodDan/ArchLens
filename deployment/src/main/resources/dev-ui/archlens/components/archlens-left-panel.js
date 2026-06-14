import {html} from 'lit';
import {Icon} from './archlens-icons.js';

const KIND_ICON = {
    'module': Icon.Module,
    'shared': Icon.SharedLayer,
    'layer': Icon.Layer,
    'ghost-module': Icon.Ghost,
    'component': Icon.Component,
    'component-group': Icon.Group,
    'target-module': Icon.Module,
    'target-shared': Icon.SharedLayer,
    'target-layer': Icon.Layer,
};

const KIND_LABEL = {
    'module': 'Subsystem',
    'shared': 'Shared',
    'layer': 'Layer',
    'ghost-module': 'External',
    'component': 'Component',
    'component-group': 'Group',
    'target-module': 'Target mod',
    'target-shared': 'Target shared',
    'target-layer': 'Target layer',
};

const EXCLUDED_KINDS = new Set(['ghost-module', 'target-module', 'target-shared', 'target-layer']);

export function renderLeftPanel({nodes, hiddenNodes, soloNode, onMuteToggle, onSoloToggle, onResetAll}) {
    const visible = (nodes || []).filter(n => !EXCLUDED_KINDS.has(n.kind));
    const hasState = hiddenNodes.size > 0 || soloNode !== null;

    return html`
        <div class="left-panel">
            <div class="left-panel-header">
                <span class="left-panel-title">Channels</span>
                ${hasState ? html`
                    <button class="lp-reset-btn" @click=${onResetAll} title="Clear all mute/solo">↺</button>
                ` : ''}
            </div>

            ${visible.length === 0 ? html`
                <div class="lp-empty">No entities in view</div>
            ` : visible.map(node => {
                const isMuted = hiddenNodes.has(node.id);
                const isSoloed = soloNode === node.id;
                const isDimmed = soloNode !== null && !isSoloed; // someone else is soloed

                return html`
                    <div class="lp-channel ${isMuted ? 'lp-muted' : ''} ${isDimmed ? 'lp-dimmed' : ''} ${isSoloed ? 'lp-soloed' : ''}">
                        <span class="lp-kind-icon" title="${KIND_LABEL[node.kind] || node.kind}">
                            ${KIND_ICON[node.kind] || Icon.Component}
                        </span>
                        <span class="lp-label" title="${node.label}">${node.label}</span>
                        <div class="lp-controls">
                            <button
                                    class="lp-btn lp-mute ${isMuted ? 'active' : ''}"
                                    title="${isMuted ? 'Un-mute' : 'Mute'}"
                                    @click=${() => onMuteToggle(node.id)}>
                                ${isMuted ? Icon.EyeOff : Icon.Eye}
                            </button>
                            <button
                                    class="lp-btn lp-solo ${isSoloed ? 'active' : ''}"
                                    title="${isSoloed ? 'Un-solo' : 'Solo (show only this + its connections)'}"
                                    @click=${() => onSoloToggle(node.id)}>
                                ${Icon.Solo}
                            </button>
                        </div>
                    </div>
                `;
            })}
        </div>
    `;
}
