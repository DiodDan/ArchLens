import { css } from 'lit';

export const archlensStyles = css`
    :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--lumo-base-color, #1a1a2e);
        color: var(--lumo-body-text-color, #e0e0e0);
        font-family: var(--lumo-font-family, 'Inter', sans-serif);
    }

    .toolbar {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 10px 20px;
        background: var(--lumo-contrast-5pct, #16213e);
        border-bottom: 1px solid var(--lumo-contrast-10pct, #0f3460);
        flex-shrink: 0;
    }

    .toolbar h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--lumo-primary-color, #4fc3f7);
    }

    .toolbar .app-name {
        font-size: 0.85rem;
        color: var(--lumo-secondary-text-color, #90caf9);
        flex: 1;
    }

    .badge {
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .badge-info    { background: #1565c020; color: #4fc3f7; border: 1px solid #4fc3f740; }
    .badge-warn    { background: #e65100; color: #fff; }
    .badge-ok      { background: #1b5e2020; color: #66bb6a; border: 1px solid #66bb6a40; }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
    }
    .breadcrumb a {
        color: var(--lumo-primary-color, #4fc3f7);
        cursor: pointer;
        text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }
    .breadcrumb .sep { color: #555; }

    .layout {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    #graph-container {
        flex: 1;
        position: relative;
        background: #0d1117;
    }

    #cy {
        width: 100%;
        height: 100%;
    }

    .graph-hint {
        position: absolute;
        bottom: 16px;
        left: 16px;
        font-size: 0.72rem;
        color: #555;
        pointer-events: none;
        line-height: 1.6;
    }

    .side-panel {
        width: 340px;
        background: var(--lumo-contrast-5pct, #16213e);
        border-left: 1px solid var(--lumo-contrast-10pct, #0f3460);
        overflow-y: auto;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
    }

    .side-panel.empty {
        justify-content: center;
        align-items: center;
    }

    .empty-state {
        text-align: center;
        color: #555;
        padding: 40px 20px;
    }

    .empty-state .icon { font-size: 2.5rem; margin-bottom: 10px; }
    .empty-state p { font-size: 0.82rem; line-height: 1.5; }

    .panel-header {
        padding: 16px 20px 12px;
        border-bottom: 1px solid #1e2d3d;
        position: sticky;
        top: 0;
        background: #16213e;
        z-index: 1;
    }

    .panel-header .type-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
    }
    .type-layered      { background: #1565c030; color: #4fc3f7; }
    .type-event-driven { background: #6a1b9a30; color: #ce93d8; }
    .type-standalone   { background: #1b5e2030; color: #66bb6a; }
    .type-shared       { background: #e65100; color: #fff; opacity: 0.9; }
    .type-layer        { background: #263238; color: #b0bec5; }

    .panel-header h3 {
        margin: 0 0 4px 0;
        font-size: 1rem;
        font-weight: 600;
        word-break: break-word;
    }

    .panel-desc {
        font-size: 0.78rem;
        color: #90a4ae;
        line-height: 1.5;
    }

    .panel-section {
        padding: 14px 20px;
        border-bottom: 1px solid #1e2d3d;
    }

    .panel-section h4 {
        margin: 0 0 8px 0;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #546e7a;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        padding: 3px 0;
        color: #b0bec5;
    }
    .stat-value { font-weight: 600; color: #e0e0e0; }

    .rule-list { list-style: none; margin: 0; padding: 0; }
    .rule-list li {
        font-size: 0.78rem;
        color: #b0bec5;
        padding: 4px 0 4px 14px;
        position: relative;
        line-height: 1.4;
        border-bottom: 1px solid #1a2530;
    }
    .rule-list li::before {
        content: '›';
        position: absolute;
        left: 0;
        color: #4fc3f7;
    }

    .comp-list { list-style: none; margin: 0; padding: 0; }
    .comp-item {
        padding: 7px 10px;
        border-radius: 4px;
        margin-bottom: 3px;
        background: #0d1a26;
        border: 1px solid #1e2d3d;
        cursor: default;
        transition: background 0.15s;
    }
    .comp-item:hover { background: #102030; }
    .comp-item .comp-name {
        font-size: 0.78rem;
        font-weight: 600;
        color: #e0e0e0;
        word-break: break-all;
    }
    .comp-item .comp-pkg {
        font-size: 0.68rem;
        color: #546e7a;
        margin-top: 1px;
        word-break: break-all;
    }
    .comp-item .comp-desc {
        font-size: 0.72rem;
        color: #78909c;
        margin-top: 3px;
        font-style: italic;
    }
    .comp-item .source-tag {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: 600;
        margin-top: 3px;
    }
    .src-manual     { background: #1a237e; color: #90caf9; }
    .src-annotation { background: #1b5e20; color: #a5d6a7; }
    .src-package    { background: #1a1a2e; color: #7986cb; border: 1px solid #3949ab; }
    .src-unclassified { background: #3e2723; color: #ffcc80; }

    .ambiguous-tag {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 0.65rem;
        background: #e65100;
        color: #fff;
        margin-left: 4px;
    }

    .layer-chip {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        background: #1e2d3d;
        color: #90caf9;
        margin: 2px;
        cursor: pointer;
        border: 1px solid #263238;
        transition: background 0.15s;
    }
    .layer-chip:hover { background: #263238; }

    .btn {
        padding: 5px 14px;
        border-radius: 4px;
        border: 1px solid #263238;
        background: #1e2d3d;
        color: #90caf9;
        font-size: 0.78rem;
        cursor: pointer;
        transition: background 0.15s;
    }
    .btn:hover { background: #263238; }
    .btn-primary {
        background: #1565c0;
        color: #fff;
        border-color: #1976d2;
    }
    .btn-primary:hover { background: #1976d2; }

    .no-config-banner {
        padding: 30px 20px;
        text-align: center;
        color: #546e7a;
        font-size: 0.82rem;
        line-height: 1.6;
    }
    .no-config-banner code {
        background: #0d1117;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.78rem;
        color: #80cbc4;
    }

    .dep-edge {
        font-size: 0.75rem;
        color: #78909c;
        padding: 3px 0;
        border-bottom: 1px solid #1a2530;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .dep-edge .arrow { color: #4fc3f7; }

    .shared-layer-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.72rem;
        background: #e6510015;
        color: #ff8a65;
        border: 1px solid #e6510040;
        margin: 2px;
    }
`;

