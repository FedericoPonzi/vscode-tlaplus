# Visual Regression Testing Suite

This directory contains a comprehensive visual regression testing suite for the webview UI toolkit migration. The suite ensures that the migrated webview components maintain visual consistency and functionality across different themes, viewport sizes, and zoom levels.

## Overview

The visual regression testing suite consists of several components:

- **Test Suite** (`visual-regression.test.ts`) - Main Playwright test suite
- **Image Comparison** (`image-comparison-utils.ts`) - Advanced image comparison utilities
- **Configuration** (`visual-regression-config.ts`) - Test scenarios and configuration options
- **Test Runner** (`run-visual-regression.ts`) - CLI tool for running tests with different options

## Features

### Comprehensive Coverage
- **Multiple Webviews**: Check Result View, Coverage View, Current Proof Step View
- **Theme Support**: Light, Dark, and High Contrast themes
- **Responsive Testing**: Multiple viewport sizes and zoom levels
- **State Variations**: Success, failure, running, and empty states

### Advanced Comparison
- Pixel-perfect image comparison using Playwright
- Configurable tolerance levels (strict, default, lenient)
- Automatic diff image generation for failed comparisons
- Detailed HTML reports with side-by-side comparisons

### Flexible Configuration
- Multiple test scenarios with detailed descriptions
- Critical test identification for CI/CD pipelines
- Customizable comparison thresholds and options
- Support for different reporter formats

## Quick Start

### Prerequisites
- Node.js and npm installed
- Playwright dependencies installed (`npm install`)

### Running Tests

#### Basic Usage
```bash
# Run the full visual regression test suite
npx playwright test tests/migration/visual-regression.test.ts

# Or use the test runner for more options
npx ts-node tests/migration/run-visual-regression.ts
```

#### Using the Test Runner
```bash
# Capture screenshots only
npx ts-node tests/migration/run-visual-regression.ts --mode capture

# Compare existing screenshots
npx ts-node tests/migration/run-visual-regression.ts --mode compare

# Run with strict comparison settings
npx ts-node tests/migration/run-visual-regression.ts --config strict

# Run in headed mode for debugging
npx ts-node tests/migration/run-visual-regression.ts --headed
```

## Test Scenarios

The suite includes comprehensive test scenarios covering:

### Check Result View
- **Success States**: With statistics, coverage data
- **Failure States**: With error traces and debugging information
- **Running States**: In-progress model checking with live updates
- **Responsive**: Different viewport sizes and zoom levels

### Coverage View
- **Data Visualization**: Charts and coverage statistics
- **Empty States**: No coverage data available
- **Theme Variations**: Light and dark theme support

### Current Proof Step View
- **Proof Obligations**: Various obligation states (proved, failed, pending)
- **Status Indicators**: Visual status representation
- **Theme Support**: Consistent appearance across themes

## Configuration Options

### Comparison Settings
```typescript
// Strict configuration - very sensitive to changes
const STRICT_CONFIG = {
  tolerance: 0.05,    // 0.05% difference allowed
  maxDiffPixels: 10,  // Maximum 10 different pixels
  threshold: 0.05     // Low threshold for pixel comparison
};

// Default configuration - balanced sensitivity
const DEFAULT_CONFIG = {
  tolerance: 0.2,     // 0.2% difference allowed
  maxDiffPixels: 100, // Maximum 100 different pixels
  threshold: 0.1      // Standard threshold
};

// Lenient configuration - allows more variation
const LENIENT_CONFIG = {
  tolerance: 1.0,     // 1% difference allowed
  maxDiffPixels: 500, // Maximum 500 different pixels
  threshold: 0.2      // Higher threshold
};
```

### Test Scenarios
Each test scenario includes:
- **Name**: Unique identifier for the test
- **Description**: Human-readable description
- **View Name**: Target webview component
- **Theme**: Visual theme (light/dark/high-contrast)
- **Viewport**: Screen dimensions
- **Zoom Level**: Browser zoom percentage
- **Test Data**: Mock data for the component

## Directory Structure

```
tests/migration/
├── README.md                           # This file
├── visual-regression.test.ts           # Main test suite
├── visual-regression-config.ts         # Test configuration and scenarios
├── image-comparison-utils.ts           # Image comparison utilities
└── run-visual-regression.ts            # CLI test runner

.migration-temp/
├── screenshots/
│   ├── baseline/                       # Reference screenshots
│   ├── current/                        # Current test screenshots
│   └── diff/                          # Difference images
└── comparison-reports/                 # HTML reports
    └── visual-regression-report-*.html
```

## Understanding Test Results

### HTML Reports
The suite generates detailed HTML reports showing:
- **Summary Statistics**: Total, passed, and failed tests
- **Side-by-Side Comparisons**: Baseline vs current screenshots
- **Diff Visualization**: Highlighted differences
- **Test Details**: Specific failure information

### Console Output
```
Visual regression summary: { 
  total: 18, 
  passed: 16, 
  failed: 2, 
  passRate: 88.89 
}

Failed visual regression tests:
  - check-result-view_light_1200x800_100pct_success.png: 0.15% difference
  - coverage-view_dark_1200x800_100pct_chart.png: 0.08% difference
```

## Troubleshooting

### Common Issues

#### Test Timeouts
If tests timeout during screenshot capture:
```bash
# Increase timeout
npx playwright test tests/migration/visual-regression.test.ts --timeout=120000
```

#### Missing Baseline Screenshots
If baseline screenshots are missing:
```bash
# Capture new baselines (be careful - this overwrites existing baselines)
npx ts-node tests/migration/run-visual-regression.ts --mode capture
```

#### High Failure Rate
If many tests are failing after changes:
1. Review the HTML report to understand the differences
2. Consider if the changes are intentional
3. Update baselines if the changes are correct
4. Adjust tolerance settings if needed

### Debugging Tips

#### Visual Debugging
```bash
# Run in headed mode to see what's happening
npx ts-node tests/migration/run-visual-regression.ts --headed
```

#### Specific Test Debugging
```bash
# Run only specific tests
npx playwright test tests/migration/visual-regression.test.ts --grep="check-result-view"
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Visual Regression Tests
on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run visual regression tests
        run: npx playwright test tests/migration/visual-regression.test.ts
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-regression-results
          path: |
            .migration-temp/screenshots/
            .migration-temp/comparison-reports/
```

### Critical Tests Only
For faster CI/CD pipelines, run only critical tests:
```bash
npx playwright test tests/migration/visual-regression.test.ts --grep="should validate specific webview components"
```

## Maintenance

### Updating Baselines
When intentional visual changes are made:
1. Review the changes in the HTML report
2. Verify the changes are correct
3. Update the baseline screenshots
4. Commit the new baselines to version control

### Adding New Test Scenarios
1. Add new scenarios to `visual-regression-config.ts`
2. Update the `TEST_SCENARIOS` array
3. Add to `CRITICAL_SCENARIOS` if the test is critical
4. Run the tests to generate new baselines

### Performance Optimization
- Use `--workers=1` for consistent results
- Consider running tests in parallel for different components
- Use `--headed=false` for faster execution
- Implement screenshot caching for unchanged components

## Best Practices

1. **Consistent Environment**: Always run tests in the same environment
2. **Version Control**: Include baseline screenshots in version control
3. **Regular Updates**: Update baselines when making intentional changes
4. **Critical Tests**: Focus on critical user journeys for CI/CD
5. **Documentation**: Document any special test requirements or setup

## Contributing

When contributing to the visual regression tests:
1. Follow the existing naming conventions for test scenarios
2. Include comprehensive descriptions for new tests
3. Test across all supported themes and viewport sizes
4. Update documentation for new features or changes
5. Ensure tests are deterministic and reliable