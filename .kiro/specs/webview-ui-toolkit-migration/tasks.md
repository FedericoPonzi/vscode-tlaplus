# Implementation Plan

- [x] 1. Set up migration infrastructure and baseline capture
  - Create `.migration-temp/` directory structure for temporary files
  - Add `.migration-temp/` to `.gitignore` to exclude from repository
  - Install screenshot testing dependencies (Playwright or Puppeteer)
  - Create baseline screenshot capture utilities in `.migration-temp/visual-tests/`
  - _Requirements: 2.2, 6.3_

- [x] 2. Capture comprehensive baseline screenshots
  - Implement screenshot capture for Check Result View in all states (success, failure, running, with coverage)
  - Capture Coverage View screenshots (with data, statistics table, empty state)
  - Capture Current Proof Step View screenshots (different proof statuses, with obligations)
  - Capture all theme variations (light, dark, high contrast) for each view
  - Capture responsive states (different panel widths, zoom levels 100%, 125%, 150%)
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Install new UI toolkit and remove deprecated dependency
  - Install `@vscode-elements/elements` package
  - Remove `@vscode/webview-ui-toolkit` from package.json dependencies
  - Update build configuration to include new toolkit
  - Verify build process works with new dependency
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Migrate header section components
  - Replace `VSCodeButton` with `vscode-button` in `src/webview/checkResultView/headerSection/index.tsx`
  - Replace `VSCodeDivider` with `vscode-divider` in header section
  - Replace `VSCodeLink` with `vscode-link` in header section
  - Update event handlers to work with custom events instead of React synthetic events
  - Update CSS styling to use new component styling approach
  - _Requirements: 1.1, 1.2, 3.3, 4.2_

- [x] 5. Migrate common components (DataGrid and Link)
  - Replace `VSCodeDataGridCell` with `vscode-data-grid-cell` in `src/webview/checkResultView/common.tsx`
  - Replace `VSCodeLink` with `vscode-link` in common components
  - Update `DataGridCellHeader` and `DataGridCellDefault` components to use new API
  - Update click handlers and file opening functionality to work with custom events
  - _Requirements: 1.2, 3.3, 4.2_

- [x] 6. Migrate panel components in error trace section
  - Replace `VSCodePanels` with `vscode-panels` in `src/webview/checkResultView/errorTraceSection/index.tsx`
  - Replace `VSCodePanelTab` and `VSCodePanelView` with new equivalents in error trace components
  - Replace `VSCodeTextField` with `vscode-text-field` in error trace filter
  - Update panel navigation and tab switching functionality
  - _Requirements: 1.1, 1.3, 3.3_

- [x] 7. Migrate statistics section components
  - Replace `VSCodeDivider` and `VSCodePanels` in `src/webview/checkResultView/statsSection/index.tsx`
  - Replace `VSCodeDataGrid` and `VSCodeDataGridRow` in coverage and states statistics
  - Replace `VSCodePanelTab` and `VSCodePanelView` in statistics panels
  - Update data grid functionality for displaying coverage and state statistics
  - _Requirements: 1.1, 1.2, 3.3_

- [x] 8. Migrate custom tree components
  - Replace custom `VSCodeTreeView` and `VSCodeTreeItem` implementations in `src/webview/checkResultView/tree/index.ts`
  - Update tree components to use `vscode-tree-view` and `vscode-tree-item` from new toolkit
  - Migrate tree styling and expand/collapse functionality
  - Update error trace variable display to work with new tree components
  - _Requirements: 1.1, 1.3, 3.3, 4.2_

- [x] 9. Migrate current proof step view components
  - Replace `VSCodeLink` with `vscode-link` in `src/webview/current-proof-step/main.tsx`
  - Replace `VSCodeLink` in obligation components (`src/webview/current-proof-step/obligation/index.tsx`)
  - Update proof step navigation and link functionality
  - Ensure proof status display works correctly with new components
  - _Requirements: 1.1, 1.4, 3.3_

- [x] 10. Update CSS and styling for new components
  - Rewrite CSS files to use CSS custom properties instead of className props
  - Update component styling to use part selectors for new web components
  - Ensure theme compatibility (light, dark, high contrast) with new styling approach
  - Update responsive design CSS for new component structure
  - _Requirements: 3.1, 3.2, 5.3_

- [x] 11. Implement visual regression testing
  - Create visual regression test suite in `tests/migration/visual-regression.test.ts`
  - Implement automated screenshot comparison using baseline screenshots
  - Set up pixel-perfect comparison with configurable tolerance
  - Create HTML diff reports for visual changes
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 12. Run comprehensive testing and validation
  - Execute visual regression tests to compare before/after screenshots
  - Run unit tests for all migrated components
  - Perform integration testing for component interactions
  - Test all user workflows end-to-end (model checking, error trace navigation, coverage visualization)
  - Validate performance metrics (load time, memory usage, rendering performance)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 6.1, 6.2_

- [x] 13. Fix any visual regressions and API issues
  - Address any visual differences found in screenshot comparison
  - Fix component API mismatches and event handling issues
  - Resolve styling conflicts and CSS issues
  - Ensure all functionality works identically to original implementation
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2_

- [ ] 14. Verify compatibility and clean build
  - Test extension with VS Code versions 1.95.0 and higher
  - Ensure no deprecation warnings in build output
  - Verify webview panels work correctly in all supported VS Code themes
  - Confirm extension loads and functions without errors
  - _Requirements: 2.3, 5.1, 5.2, 5.3_

- [ ] 15. Establish permanent visual regression testing infrastructure
  - Move successful "after" screenshots to permanent location (`tests/visual-regression/screenshots/`)
  - Create permanent visual regression test suite for ongoing use
  - Set up CI integration for visual regression testing on future changes
  - Document visual testing process for future UI changes
  - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2_

- [ ] 16. Document migration and prepare for selective cleanup
  - Copy baseline screenshots from `.migration-temp/` to attach to pull request
  - Document any intentional visual changes or improvements
  - Create component mapping documentation for future reference
  - Move reusable screenshot utilities to permanent test infrastructure
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 17. Clean up temporary migration artifacts only
  - Remove `.migration-temp/` directory (temporary baseline screenshots and comparison files)
  - Remove migration-specific baseline capture scripts (keep ongoing visual test utilities)
  - Remove temporary migration configuration files
  - Keep permanent visual regression testing infrastructure in place
  - Update documentation to reflect completed migration and ongoing visual testing
  - _Requirements: 2.2, 4.3_