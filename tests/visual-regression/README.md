# Visual Regression Testing Infrastructure

This directory contains the permanent visual regression testing infrastructure for the TLA+ VS Code extension webview components. This infrastructure was established during the migration from `@vscode/webview-ui-toolkit` to `@vscode-elements/elements` and is now used for ongoing quality assurance.

## Overview

The visual regression testing system captures screenshots of webview components in various states and compares them against baseline images to detect unintended visual changes.

## Files Structure

```
tests/visual-regression/
├── README.md                           # This documentation
├── visual-regression-config.ts         # Configuration and test scenarios
├── visual-regression.test.ts           # Main test suite
├── screenshot-utilities.ts             # Screenshot capture utilities
├── screenshots/                        # Baseline screenshots
│   ├── check-result-view_*.png
│   ├── coverage-view_*.png
│   └── current-proof-step-view_*.png
├── current/                            # Current test screenshots
├── diff/                               # Diff images for failed comparisons
└── reports/                            # HTML test reports
    └── visual-regression-report-*.html
```

## Test Coverage

### Webview Components Tested
- **Check Result View**: Model checking results display
- **Coverage View**: Coverage visualization and statistics
- **Current Proof Step View**: TLAPS proof step information

### Test Scenarios
- ✅ **Success States**: Successful model checks with statistics
- ✅ **Failure States**: Failed model checks with error traces
- ✅ **Running States**: In-progress model checking
- ✅ **Coverage States**: Coverage data visualization
- ✅ **Proof States**: Various proof statuses (proved, failed, pending)

### Theme Coverage
- ✅ **Light Theme**: Default VS Code light theme
- ✅ **Dark Theme**: Default VS Code dark theme  
- ✅ **High Contrast**: Accessibility high contrast theme

### Responsive Testing
- ✅ **Multiple Viewports**: 800x600, 1200x800, 1600x1000
- ✅ **Zoom Levels**: 100%, 125%, 150%
- ✅ **Layout Variations**: Narrow and wide layouts

## Usage

### Running Visual Regression Tests

```bash
# Run all visual regression tests
npm run test:visual-regression

# Run with Playwright UI for debugging
npx playwright test tests/visual-regression --ui

# Run specific test scenarios
npx playwright test tests/visual-regression -g "critical components"
```

### Updating Baseline Screenshots

When intentional visual changes are made:

1. **Capture new screenshots**:
   ```bash
   npm run capture-baseline-screenshots
   ```

2. **Review changes**:
   - Check generated HTML reports in `tests/visual-regression/reports/`
   - Verify changes are intentional

3. **Update baselines**:
   ```bash
   # Copy current screenshots to baseline
   cp tests/visual-regression/current/* tests/visual-regression/screenshots/
   ```

### Configuration

Edit `visual-regression-config.ts` to:
- Add new test scenarios
- Modify comparison tolerances
- Update viewport sizes or themes
- Configure screenshot options

## Test Configuration

### Comparison Settings

```typescript
// Default configuration
const config = {
  tolerance: 0.2,        // 0.2% pixel difference allowed
  threshold: 0.1,        // Individual pixel comparison threshold
  maxDiffPixels: 100,    // Maximum different pixels allowed
  generateDiffImages: true,
  generateHtmlReport: true
};
```

### Adding New Test Scenarios

```typescript
// Add to TEST_SCENARIOS in visual-regression-config.ts
{
  name: 'my-new-test',
  description: 'Description of the test scenario',
  viewName: 'check-result-view',
  theme: 'light',
  viewport: { width: 1200, height: 800 },
  zoomLevel: 100,
  testData: { /* test data */ }
}
```

## Screenshot Utilities

The `screenshot-utilities.ts` file provides reusable utilities:

### ScreenshotCapture Class
```typescript
const capture = new ScreenshotCapture({
  outputDir: 'tests/visual-regression/current/',
  config: { tolerance: 0.5 }
});

await capture.initialize();
await capture.captureScreenshots(scenarios);
await capture.cleanup();
```

### ScreenshotManager Class
```typescript
// Copy screenshots between directories
ScreenshotManager.copyScreenshots(sourceDir, targetDir);

// Clean up old screenshots
ScreenshotManager.cleanupOldScreenshots(directory, keepCount);

// Generate summary report
const summary = ScreenshotManager.generateScreenshotSummary(directory);
```

## Integration with CI/CD

### GitHub Actions Integration

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests
on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:visual-regression
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-regression-report
          path: tests/visual-regression/reports/
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:visual-regression:critical"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Screenshots Don't Match**
   - Check if intentional changes were made
   - Verify test data consistency
   - Review HTML diff reports

2. **Tests Fail Intermittently**
   - Increase wait times in test scenarios
   - Check for animations or loading states
   - Verify network stability

3. **Missing Baseline Screenshots**
   - Run baseline capture: `npm run capture-baseline`
   - Check file permissions
   - Verify directory structure

### Debug Mode

```bash
# Run with debug output
DEBUG=pw:api npx playwright test tests/visual-regression

# Run with headed browser for visual debugging
npx playwright test tests/visual-regression --headed

# Generate trace files
npx playwright test tests/visual-regression --trace on
```

## Best Practices

### When to Update Baselines
- ✅ Intentional UI improvements
- ✅ New component features
- ✅ Theme updates
- ❌ Accidental changes
- ❌ Test flakiness

### Screenshot Quality
- Use consistent test data
- Wait for animations to complete
- Ensure stable network conditions
- Test across different environments

### Maintenance
- Review failed tests promptly
- Keep baseline screenshots up to date
- Monitor test execution times
- Clean up old reports regularly

## Migration History

This visual regression testing infrastructure was created during the migration from `@vscode/webview-ui-toolkit` to `@vscode-elements/elements` in January 2025. The baseline screenshots represent the final state after successful migration with 0% visual difference.

### Migration Artifacts
- Original baseline screenshots: `docs/migration-screenshots/`
- Migration documentation: `docs/WEBVIEW_UI_TOOLKIT_MIGRATION.md`
- Migration summary: `docs/MIGRATION_SUMMARY.md`

## Contributing

When making changes to webview components:

1. **Before Changes**: Run visual regression tests to establish baseline
2. **After Changes**: Run tests again to identify differences
3. **Review Changes**: Use HTML reports to verify changes are intentional
4. **Update Documentation**: Document any intentional visual changes
5. **Update Baselines**: If changes are approved, update baseline screenshots

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-screenshots)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Visual Regression Testing Best Practices](https://docs.percy.io/docs/visual-testing-basics)

## Support

For questions about visual regression testing:
- Check this documentation first
- Review existing test scenarios in `visual-regression-config.ts`
- Examine HTML reports for detailed comparison results
- Refer to migration documentation for component mapping