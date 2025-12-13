/**
 * Barrel file for shared components.
 * Re-exports commonly used UI components for simplified imports.
 */
export * from './primary-button/primary-button.component';
export * from './card/card.component';
export * from './progress-bar/progress-bar.component';
export * from './user-badge/user-badge.component';
// DEPRECATED: Replaced with native ion-select (Production build fix - Issue #227)
// Custom modal-based rank selector caused setFocus errors in production builds
// export * from './rank-selector/rank-selector.component';
