# Design Document

## Overview

This design outlines the migration from the deprecated `@vscode/webview-ui-toolkit` to `@vscode-elements/elements` for the TLA+ VS Code extension. The migration will replace all webview UI components while maintaining identical functionality and visual appearance. The approach focuses on a systematic component-by-component replacement with comprehensive testing to ensure no regressions.

## Architecture

### Current Architecture
The extension currently uses the following webview structure:
- **Check Result View**: Displays TLC model checking results with error traces, statistics, and output
- **Coverage View**: Shows simulation coverage visualization
- **Current Proof Step View**: Displays TLAPS proof step information

### Target Architecture
The new architecture will maintain the same structure but replace the underlying UI toolkit:
- Same React-based webview components
- Identical component hierarchy and data flow
- Replaced UI primitives from `@vscode-elements/elements`
- Enhanced type safety and modern component patterns

### Migration Strategy
1. **Screenshot-First Approach**: Capture comprehensive screenshots of all webview states before migration
2. **Complete Replacement**: Replace all components in one migration, removing deprecated toolkit entirely
3. **Direct Component Mapping**: Map old components directly to new equivalents without compatibility layers
4. **Visual Validation**: Compare post-migration screenshots with baseline to ensure pixel-perfect consistency
5. **Clean Cutover**: Remove `@vscode/webview-ui-toolkit` dependency completely after migration

## Components and Interfaces

### Component Mapping

Based on the codebase analysis, the following components need migration:

| Current Component | New Component | Usage Location | Notes |
|-------------------|---------------|----------------|-------|
| `VSCodeButton` | `vscode-button` | Header section | Primary/secondary appearance |
| `VSCodeDivider` | `vscode-divider` | Multiple sections | Visual separation |
| `VSCodeLink` | `vscode-link` | Common, proof steps | Click handlers |
| `VSCodeDataGrid` | `vscode-data-grid` | Stats sections | Table display |
| `VSCodeDataGridRow` | `vscode-data-grid-row` | Stats sections | Table rows |
| `VSCodeDataGridCell` | `vscode-data-grid-cell` | Common components | Table cells |
| `VSCodePanels` | `vscode-panels` | Multiple sections | Tab containers |
| `VSCodePanelTab` | `vscode-panel-tab` | Error trace, stats | Tab headers |
| `VSCodePanelView` | `vscode-panel-view` | Error trace, stats | Tab content |
| `VSCodeTextField` | `vscode-text-field` | Error trace filter | Input field |
| `VSCodeTreeView` | Custom implementation | Error trace | Tree display |
| `VSCodeTreeItem` | Custom implementation | Error trace | Tree nodes |

### Custom Tree Components

The current implementation uses custom tree components built on `@microsoft/fast-components`. These will need special attention:

```typescript
// Current implementation in src/webview/checkResultView/tree/index.ts
class TreeView extends FoundationTreeView {}
class TreeItem extends FoundationTreeItem {}
```

**Migration Approach**: Replace with `vscode-tree-view` and `vscode-tree-item` from the new toolkit, maintaining the same event handling and styling.

### API Differences and Direct Migration

Key differences between toolkits that require direct code changes:

1. **Event Handling**: 
   - Old: React synthetic events
   - New: Web component custom events
   - Solution: Update event handlers to use custom event format

2. **Styling**:
   - Old: CSS-in-JS and className props
   - New: CSS custom properties and part selectors
   - Solution: Rewrite CSS to use new styling approach

3. **Props Interface**:
   - Old: React props with camelCase
   - New: Web component attributes with kebab-case
   - Solution: Update all component usage to new prop format

## Data Models

### Component Props Interfaces

```typescript
// New component interfaces for direct usage
interface VSCodeButtonProps {
  appearance?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: (event: CustomEvent) => void;
}

interface VSCodeLinkProps {
  href?: string;
  onClick?: (event: CustomEvent) => void;
}

interface VSCodeDataGridProps {
  'grid-template-columns'?: string;
  'generate-header'?: string;
}
```

### Migration Tracking

```typescript
interface MigrationProgress {
  totalComponents: number;
  migratedComponents: number;
  testsPassing: boolean;
  buildSuccessful: boolean;
}
```

## Error Handling

### Migration Error Scenarios

1. **Component API Mismatch**: When new components don't support exact same props
   - **Handling**: Update component usage to match new API directly
   - **Fallback**: Use alternative component properties or restructure usage

2. **Styling Conflicts**: When CSS doesn't apply correctly to new components
   - **Handling**: Rewrite CSS using new component's styling system
   - **Fallback**: Use CSS custom properties and part selectors

3. **Event Handler Differences**: When event signatures change
   - **Handling**: Update event handlers to work with custom events
   - **Fallback**: Manual event property extraction and transformation

4. **Runtime Errors**: When new components fail to render
   - **Handling**: Error boundaries with fallback UI
   - **Fallback**: Graceful degradation to basic HTML elements

### Error Recovery Strategy

```typescript
// Error boundary for webview components
class WebviewErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error and provide fallback UI
    console.error('Webview component error:', error, errorInfo);
    // Show basic HTML fallback instead of broken component
  }
}
```

## Testing Strategy

### Test Categories

1. **Visual Regression Tests**: UI consistency (Primary focus)
   - Baseline screenshot capture before migration
   - Post-migration screenshot comparison
   - Pixel-perfect validation across all webview states
   - Theme compatibility (light/dark/high contrast)
   - Different screen resolutions and zoom levels

2. **Unit Tests**: Individual component functionality
   - Component rendering with new toolkit
   - Props handling and attribute mapping
   - Event firing and custom event handling
   - Styling application with new CSS approach

3. **Integration Tests**: Component interaction
   - Data flow between migrated components
   - Event propagation with custom events
   - State management consistency

4. **End-to-End Tests**: User workflows
   - Model checking result display
   - Error trace navigation
   - Coverage visualization
   - Proof step interaction

### Test Implementation Plan

```typescript
// Example test structure
describe('VSCode Elements Migration', () => {
  describe('Button Component', () => {
    it('should render with primary appearance', () => {
      // Test new vscode-button with primary styling
    });
    
    it('should handle click events', () => {
      // Test event handling compatibility
    });
  });
  
  describe('Data Grid Component', () => {
    it('should display coverage statistics correctly', () => {
      // Test data grid with coverage data
    });
  });
});
```

### Automated Testing Pipeline

1. **Pre-migration Tests**: Capture current behavior
2. **Migration Tests**: Verify new components work
3. **Regression Tests**: Compare old vs new behavior
4. **Performance Tests**: Ensure no performance degradation

## Implementation Phases

### Phase 1: Foundation Setup
- Install `@vscode-elements/elements` dependency
- Remove `@vscode/webview-ui-toolkit` dependency
- Set up build configuration
- Create component adapter utilities

### Phase 2: Core Components Migration
- Migrate basic components (Button, Link, Divider)
- Update header section components
- Test basic functionality

### Phase 3: Complex Components Migration
- Migrate data grid components
- Update statistics sections
- Migrate panel components
- Update error trace sections

### Phase 4: Custom Components Migration
- Migrate tree view components
- Update error trace tree display
- Implement custom styling

### Phase 5: Integration and Testing
- End-to-end testing
- Visual regression testing
- Performance validation
- Documentation updates

## Visual Testing Strategy

### Screenshot Capture Plan

**Pre-Migration Baseline Screenshots:**
1. **Check Result View States:**
   - Successful model check with statistics
   - Failed model check with error trace
   - Running model check (in-progress state)
   - Model check with coverage data
   - Different error trace tree expansion states

2. **Coverage View States:**
   - Coverage chart with data
   - Coverage statistics table
   - Empty coverage state

3. **Current Proof Step View States:**
   - Proof step with obligations
   - Different proof status states (proved, failed, pending)
   - Proof step with notes and links

4. **Theme Variations:**
   - Light theme screenshots
   - Dark theme screenshots
   - High contrast theme screenshots

5. **Responsive States:**
   - Different panel widths
   - Collapsed/expanded sections
   - Various zoom levels (100%, 125%, 150%)

### Screenshot Automation Tools

**Temporary Directory Structure:**
```
.migration-temp/
├── screenshots/
│   ├── baseline/           # Pre-migration screenshots
│   ├── current/           # Post-migration screenshots
│   └── diff/              # Comparison results
├── visual-tests/          # Screenshot test scripts
└── comparison-reports/    # HTML diff reports
```

**Easy Removal Strategy:**
- All screenshot testing code in dedicated files with clear naming
- Baseline screenshots stored in `.migration-temp/` directory
- Add `.migration-temp/` to `.gitignore` to exclude from repository
- Screenshot test scripts isolated in separate test files
- Clear documentation on what to remove post-migration

```typescript
// Screenshot capture utility (in .migration-temp/visual-tests/)
interface ScreenshotConfig {
  viewName: string;
  testData: any;
  theme: 'light' | 'dark' | 'high-contrast';
  viewport: { width: number; height: number };
  zoomLevel: number;
}

async function captureBaseline(configs: ScreenshotConfig[]) {
  const baselineDir = '.migration-temp/screenshots/baseline/';
  for (const config of configs) {
    // Set up webview with test data
    // Apply theme and viewport settings
    // Capture screenshot to baselineDir
    // Save with descriptive filename
  }
}
```

### Visual Comparison Process

1. **Automated Comparison:**
   - Pixel-by-pixel comparison using tools like Playwright or Puppeteer
   - Configurable tolerance for minor rendering differences
   - Highlight differences in generated reports

2. **Manual Review Process:**
   - Side-by-side comparison interface
   - Approval workflow for acceptable differences
   - Documentation of intentional changes

3. **Regression Detection:**
   - Automated failure on significant visual changes
   - Integration with CI/CD pipeline
   - Blocking deployment on visual regressions

### Post-Migration Cleanup

**Files/Directories to Remove After Migration:**
```
.migration-temp/                    # Entire temporary directory
├── screenshots/                    # All baseline and comparison screenshots
├── visual-tests/                   # Screenshot test scripts
└── comparison-reports/             # HTML diff reports

tests/migration/                    # Migration-specific test files
├── visual-regression.test.ts       # Screenshot comparison tests
├── component-migration.test.ts     # Component replacement tests
└── baseline-capture.ts             # Baseline screenshot utilities
```

**Code to Remove:**
- Visual regression test files (clearly named with "migration" or "visual-regression")
- Screenshot capture utilities and scripts
- Temporary test data generators for screenshots
- Migration-specific configuration files

**Documentation for PR:**
- Copy baseline screenshots to attach to pull request before removing `.migration-temp/`
- Include before/after comparison images in PR description
- Document any intentional visual changes or improvements

## Rollback Strategy

### Rollback Triggers
- Critical functionality broken
- Performance significantly degraded
- Visual regressions affecting user experience
- Compatibility issues with VS Code versions

### Rollback Implementation
1. **Git Branch Strategy**: Maintain migration in feature branch
2. **Feature Flags**: Allow runtime switching between toolkits
3. **Dependency Management**: Keep old toolkit as dev dependency during transition
4. **Automated Rollback**: Scripts to quickly revert changes

## Success Metrics

### Functional Metrics
- All existing webview functionality works identically
- No increase in error rates or crashes
- All user workflows remain intact

### Performance Metrics
- Webview load time remains same or improves
- Memory usage doesn't increase significantly
- Rendering performance maintained

### Maintenance Metrics
- No deprecation warnings in build
- Code maintainability improved
- Future VS Code compatibility ensured