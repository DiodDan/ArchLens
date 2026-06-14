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
        gap: 10px;
        padding: 8px 16px;
        background: var(--lumo-contrast-5pct, #16213e);
        border-bottom: 1px solid var(--lumo-contrast-10pct, #0f3460);
        flex-shrink: 0;
        flex-wrap: wrap;
    }

    .toolbar-top {
        padding: 8px 16px;
        gap: 8px;
    }

    .toolbar-graph {
        padding: 6px 16px;
        background: #111827;
        gap: 8px;
    }

    .toolbar h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--lumo-primary-color, #4fc3f7);
        white-space: nowrap;
    }

    .toolbar .app-name {
        font-size: 0.82rem;
        color: var(--lumo-secondary-text-color, #90caf9);
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .tab-nav {
        display: flex;
        gap: 2px;
        background: #0d1117;
        border-radius: 6px;
        padding: 3px;
    }

    .tab-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 12px;
        border-radius: 4px;
        border: none;
        background: transparent;
        color: #78909c;
        font-size: 0.78rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        white-space: nowrap;
    }

    .tab-btn:hover {
        background: #1e2d3d;
        color: #b0bec5;
    }

    .tab-active {
        background: #1565c0 !important;
        color: #fff !important;
        font-weight: 600;
    }

    .tab-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 16px;
        padding: 0 4px;
        border-radius: 8px;
        font-size: 0.65rem;
        font-weight: 700;
        line-height: 1;
    }

    .tab-badge-warn {
        background: #ef4444;
        color: #fff;
    }

    .badge {
        padding: 3px 9px;
        border-radius: 12px;
        font-size: 0.72rem;
        font-weight: 600;
        white-space: nowrap;
    }

    .badge-info {
        background: #1565c020;
        color: #4fc3f7;
        border: 1px solid #4fc3f740;
    }

    .badge-warn {
        background: #ef4444;
        color: #fff;
    }

    .badge-ok {
        background: #1b5e2020;
        color: #66bb6a;
        border: 1px solid #66bb6a40;
    }

    .layout-selector {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .layout-label {
        font-size: 0.72rem;
        color: #546e7a;
        white-space: nowrap;
    }

    .layout-select {
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #263238;
        background: #1e2d3d;
        color: #90caf9;
        font-size: 0.75rem;
        cursor: pointer;
        min-width: 100px;
    }

    .layout-select-dir {
        min-width: 120px;
    }

    .layout-select:focus {
        outline: 1px solid #4fc3f7;
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
    }

    .breadcrumb a {
        color: #4fc3f7;
        cursor: pointer;
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .breadcrumb .sep {
        color: #555;
    }

    .layout {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .left-panel {
        width: 220px;
        min-width: 180px;
        background: #111827;
        border-right: 1px solid #0f3460;
        overflow-y: auto;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
    }

    .left-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px 8px;
        border-bottom: 1px solid #1e2d3d;
        position: sticky;
        top: 0;
        background: #111827;
        z-index: 1;
    }

    .left-panel-title {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #546e7a;
    }

    .lp-reset-btn {
        padding: 1px 6px;
        border-radius: 3px;
        border: 1px solid #263238;
        background: transparent;
        color: #546e7a;
        font-size: 0.72rem;
        cursor: pointer;
        transition: background 0.15s;
    }

    .lp-reset-btn:hover {
        background: #1e2d3d;
        color: #90caf9;
    }

    .lp-empty {
        font-size: 0.72rem;
        color: #37474f;
        text-align: center;
        padding: 20px 12px;
    }

    .lp-channel {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 8px 5px 10px;
        border-bottom: 1px solid #0d1117;
        transition: background 0.12s;
    }

    .lp-channel:hover {
        background: #1e2d3d;
    }

    .lp-muted {
        opacity: 0.4;
    }

    .lp-soloed {
        background: #1565c015;
        border-left: 2px solid #4fc3f7;
    }

    .lp-dimmed {
        opacity: 0.35;
    }

    .lp-kind-icon {
        font-size: 0.8rem;
        flex-shrink: 0;
        width: 16px;
        text-align: center;
    }

    .lp-label {
        font-size: 0.72rem;
        color: #b0bec5;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .lp-controls {
        display: flex;
        gap: 2px;
        flex-shrink: 0;
    }

    .lp-btn {
        padding: 2px 5px;
        border-radius: 3px;
        border: 1px solid #263238;
        background: transparent;
        color: #546e7a;
        font-size: 0.65rem;
        cursor: pointer;
        transition: background 0.12s, color 0.12s;
        line-height: 1.2;
    }

    .lp-btn:hover {
        background: #1e2d3d;
        color: #90caf9;
    }

    .lp-btn.active {
        background: #1565c0;
        color: #fff;
        border-color: #1976d2;
    }

    .lp-solo {
        font-weight: 700;
        font-size: 0.6rem;
    }

    #graph-container {
        flex: 1;
        position: relative;
        background: #0d1117;
        min-width: 0;
    }

    #cy {
        width: 100%;
        height: 100%;
    }

    .graph-hint {
        position: absolute;
        bottom: 14px;
        left: 14px;
        font-size: 0.68rem;
        color: #37474f;
        pointer-events: none;
        line-height: 1.6;
    }


    .side-panel {
        width: 320px;
        background: var(--lumo-contrast-5pct, #16213e);
        border-left: 1px solid #0f3460;
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
        color: #546e7a;
        padding: 40px 20px;
    }

    .empty-state .icon {
        font-size: 2.5rem;
        margin-bottom: 10px;
    }

    .empty-state p {
        font-size: 0.82rem;
        line-height: 1.5;
    }

    .panel-header {
        padding: 14px 18px 10px;
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
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 5px;
    }

    .type-layered {
        background: #1565c030;
        color: #4fc3f7;
    }

    .type-event-driven {
        background: #6a1b9a30;
        color: #ce93d8;
    }

    .type-standalone {
        background: #1b5e2030;
        color: #66bb6a;
    }

    .type-shared {
        background: #e6510020;
        color: #ff8a65;
        border: 1px solid #e6510040;
    }

    .type-layer {
        background: #263238;
        color: #b0bec5;
    }

    .panel-header h3 {
        margin: 0 0 3px 0;
        font-size: 0.95rem;
        font-weight: 600;
        word-break: break-word;
    }

    .panel-desc {
        font-size: 0.76rem;
        color: #90a4ae;
        line-height: 1.5;
    }

    .panel-section {
        padding: 12px 18px;
        border-bottom: 1px solid #1e2d3d;
    }

    .panel-section h4 {
        margin: 0 0 7px 0;
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #546e7a;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.78rem;
        padding: 3px 0;
        color: #b0bec5;
    }

    .stat-value {
        font-weight: 600;
        color: #e0e0e0;
    }

    .violation-value {
        color: #ef4444;
    }

    .rule-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .rule-list li {
        font-size: 0.76rem;
        color: #b0bec5;
        padding: 4px 0 4px 12px;
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

    .comp-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .comp-item {
        padding: 6px 9px;
        border-radius: 4px;
        margin-bottom: 3px;
        background: #0d1a26;
        border: 1px solid #1e2d3d;
    }

    .comp-item:hover {
        background: #102030;
    }

    .comp-item .comp-name {
        font-size: 0.76rem;
        font-weight: 600;
        color: #e0e0e0;
        word-break: break-all;
    }

    .comp-item .comp-pkg {
        font-size: 0.66rem;
        color: #546e7a;
        margin-top: 1px;
        word-break: break-all;
    }

    .comp-item .comp-desc {
        font-size: 0.7rem;
        color: #78909c;
        margin-top: 3px;
        font-style: italic;
    }

    .source-tag {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 0.63rem;
        font-weight: 600;
    }

    .src-manual {
        background: #1a237e;
        color: #90caf9;
    }

    .src-annotation {
        background: #1b5e20;
        color: #a5d6a7;
    }

    .src-package {
        background: #1a1a2e;
        color: #7986cb;
        border: 1px solid #3949ab;
    }

    .src-unclassified {
        background: #3e2723;
        color: #ffcc80;
    }

    .ambiguous-tag {
        display: inline-block;
        padding: 1px 5px;
        border-radius: 3px;
        font-size: 0.63rem;
        background: #e65100;
        color: #fff;
    }

    .dep-edge {
        font-size: 0.73rem;
        color: #78909c;
        padding: 3px 0;
        border-bottom: 1px solid #1a2530;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .dep-edge .arrow {
        color: #4fc3f7;
    }

    .dep-edge-violation {
        color: #ef9a9a;
    }

    .dep-edge-violation .arrow {
        color: #ef4444;
    }

    .violation-item {
        padding: 6px 8px;
        margin-bottom: 4px;
        background: #1a0000;
        border: 1px solid #ef444430;
        border-radius: 4px;
    }

    .violation-rule {
        font-size: 0.73rem;
        color: #ef9a9a;
        line-height: 1.4;
        margin-bottom: 3px;
    }

    .violation-classes {
        font-size: 0.66rem;
        color: #546e7a;
        word-break: break-all;
        font-family: monospace;
    }

    .layer-chip {
        display: inline-flex;
        align-items: center;
        padding: 3px 9px;
        border-radius: 12px;
        font-size: 0.72rem;
        background: #1e2d3d;
        color: #90caf9;
        margin: 2px;
        cursor: pointer;
        border: 1px solid #263238;
        transition: background 0.15s;
    }

    .layer-chip:hover {
        background: #263238;
    }

    .layer-chip-violation {
        border-color: #ef4444;
        color: #ef9a9a;
    }

    .shared-layer-pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 7px;
        border-radius: 12px;
        font-size: 0.7rem;
        background: #e6510015;
        color: #ff8a65;
        border: 1px solid #e6510040;
        margin: 2px;
    }

    .al-icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
        vertical-align: -2px;
        pointer-events: none;
    }

    .btn {
        padding: 5px 12px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border-radius: 4px;
        border: 1px solid #263238;
        background: #1e2d3d;
        color: #90caf9;
        font-size: 0.76rem;
        cursor: pointer;
        transition: background 0.15s;
        white-space: nowrap;
    }

    .btn:hover {
        background: #263238;
    }

    .btn-primary {
        background: #1565c0;
        color: #fff;
        border-color: #1976d2;
    }

    .btn-primary:hover {
        background: #1976d2;
    }

    .tab-view {
        flex: 1;
        overflow-y: auto;
        padding: 0 0 40px 0;
    }

    .view-header {
        padding: 24px 32px 16px;
        border-bottom: 1px solid #1e2d3d;
    }

    .view-title {
        margin: 0 0 6px 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #e0e0e0;
        display: flex;
        align-items: center;
    }

    .view-desc {
        font-size: 0.8rem;
        color: #546e7a;
        line-height: 1.6;
        margin: 0;
    }

    .view-filters {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 32px;
        flex-wrap: wrap;
        border-bottom: 1px solid #1e2d3d;
    }

    .filter-input, .filter-select {
        padding: 7px 12px;
        border-radius: 6px;
        border: 1px solid #263238;
        background: #0d1117;
        color: #e0e0e0;
        font-size: 0.8rem;
    }

    .filter-input {
        flex: 1;
        min-width: 220px;
    }

    .filter-input:focus {
        outline: 1px solid #4fc3f7;
    }

    .filter-select {
        min-width: 160px;
        cursor: pointer;
    }

    .view-result-count {
        padding: 8px 32px;
        font-size: 0.74rem;
        color: #546e7a;
    }

    .view-empty {
        padding: 48px 32px;
        text-align: center;
        color: #546e7a;
        font-size: 0.84rem;
    }

    .violation-list {
        padding: 16px 32px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .viol-card {
        background: #1a0000;
        border: 1px solid #ef444425;
        border-radius: 8px;
        padding: 12px 16px;
        transition: border-color 0.15s;
    }

    .viol-card:hover {
        border-color: #ef444455;
    }

    .viol-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        gap: 12px;
    }

    .viol-rule {
        font-size: 0.8rem;
        color: #ef9a9a;
        font-weight: 600;
        flex: 1;
        min-width: 0;
    }

    .viol-goto {
        flex-shrink: 0;
        font-size: 0.72rem;
        padding: 4px 10px;
    }

    .viol-route {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .viol-side {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
    }

    .viol-sub {
        font-size: 0.7rem;
        color: #546e7a;
    }

    .viol-layer {
        font-size: 0.72rem;
        color: #78909c;
    }

    .viol-class {
        font-size: 0.68rem;
        color: #37474f;
        font-family: monospace;
        word-break: break-all;
    }

    .viol-arrow {
        font-size: 1.2rem;
        color: #ef4444;
        flex-shrink: 0;
    }

    .ambiguous-list {
        padding: 16px 32px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .amb-card {
        background: #1a0a00;
        border: 1px solid #e6510020;
        border-radius: 8px;
        padding: 11px 14px;
        transition: border-color 0.15s;
    }

    .amb-card:hover {
        border-color: #e6510050;
    }

    .amb-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
    }

    .amb-name {
        font-size: 0.84rem;
        font-weight: 600;
        color: #e0e0e0;
    }

    .amb-goto {
        flex-shrink: 0;
        font-size: 0.72rem;
        padding: 4px 10px;
    }

    .amb-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .amb-pkg {
        font-size: 0.68rem;
        color: #546e7a;
        font-family: monospace;
    }

    .amb-location {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    .amb-subsystem {
        font-size: 0.72rem;
        color: #78909c;
    }

    .amb-layer {
        font-size: 0.72rem;
        color: #78909c;
    }

    .amb-desc {
        font-size: 0.72rem;
        color: #546e7a;
        font-style: italic;
        margin-top: 4px;
    }

    .sep {
        color: #37474f;
    }

    .search-bar-wrap {
        position: relative;
        padding: 20px 32px 16px;
        border-bottom: 1px solid #1e2d3d;
    }

    .search-bar-input {
        width: 100%;
        padding: 10px 40px 10px 14px;
        border-radius: 8px;
        border: 1px solid #263238;
        background: #0d1117;
        color: #e0e0e0;
        font-size: 0.9rem;
        box-sizing: border-box;
    }

    .search-bar-input:focus {
        outline: 2px solid #4fc3f7;
    }

    .search-clear-btn {
        position: absolute;
        right: 42px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        color: #546e7a;
        cursor: pointer;
        font-size: 0.8rem;
        padding: 4px;
        line-height: 1;
    }

    .search-clear-btn:hover {
        color: #90caf9;
    }

    .search-results {
        padding: 8px 32px 32px;
    }

    .search-total {
        font-size: 0.74rem;
        color: #546e7a;
        padding: 8px 0 12px;
    }

    .search-group {
        margin-bottom: 24px;
    }

    .search-group-title {
        margin: 0 0 8px 0;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #546e7a;
    }

    .search-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 6px;
        background: #0d1a26;
        border: 1px solid #1e2d3d;
        margin-bottom: 5px;
        transition: background 0.14s;
    }

    .search-card:hover {
        background: #102030;
    }

    .search-card-main {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        min-width: 0;
    }

    .search-name {
        font-size: 0.82rem;
        font-weight: 600;
        color: #e0e0e0;
    }

    .search-meta {
        font-size: 0.7rem;
        color: #546e7a;
    }

    .search-location {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.7rem;
        color: #546e7a;
        flex-wrap: wrap;
    }

    .search-sub {
        color: #78909c;
    }

    .search-pkg {
        font-family: monospace;
        color: #37474f;
        font-size: 0.65rem;
    }

    .search-goto {
        flex-shrink: 0;
        font-size: 0.72rem;
        padding: 4px 10px;
    }

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
        font-size: 0.76rem;
        color: #80cbc4;
    }

    .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    .brand-logo {
        width: 300px;
        height: 50px;
    }
`;
