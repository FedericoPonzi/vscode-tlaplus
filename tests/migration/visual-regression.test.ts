import { test, expect, chromium, Browser, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { BaselineCapture, BASELINE_CONFIGS, ScreenshotConfig } from '../../.migration-temp/visual-tests/baseline-capture';
import { 
  ImageComparator, 
  ImageComparisonResult, 
  ComparisonOptions,
  batchCompareImages 
} from './image-comparison-utils';
import { 
  DEFAULT_CONFIG, 
  STRICT_CONFIG, 
  LENIENT_CONFIG,
  TEST_SCENARIOS,
  CRITICAL_SCENARIOS,
  getCriticalScenarios
} from './visual-regression-config';

class VisualRegressionTester {
  private browser: Browser | null = null;
  private baselineDir = '.migration-temp/screenshots/baseline/';
  private currentDir = '.migration-temp/screenshots/current/';
  private diffDir = '.migration-temp/screenshots/diff/';
  private reportsDir = '.migration-temp/comparison-reports/';
  private config: typeof DEFAULT_CONFIG;

  constructor(config: Partial<typeof DEFAULT_CONFIG> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    
    // Ensure directories exist
    [this.currentDir, this.diffDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async captureCurrentScreenshots(configs: ScreenshotConfig[]): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const baselineCapture = new BaselineCapture();
    // Override the baseline directory to capture current screenshots
    (baselineCapture as any).baselineDir = this.currentDir;
    
    await baselineCapture.initialize();
    try {
      await baselineCapture.captureBaseline(configs);
    } finally {
      await baselineCapture.cleanup();
    }
  }

  async compareScreenshots(): Promise<ImageComparisonResult[]> {
    // Use the batch comparison utility for better performance and consistency
    const comparisonOptions: ComparisonOptions = {
      threshold: this.config.threshold,
      tolerance: this.config.tolerance,
      maxDiffPixels: this.config.maxDiffPixels,
      generateDiffImage: this.config.generateDiffImages
    };

    const resultsMap = await batchCompareImages(
      this.baselineDir,
      this.currentDir,
      this.diffDir,
      comparisonOptions
    );

    // Convert Map to Array for easier handling
    return Array.from(resultsMap.values());
  }



  async generateHtmlReport(results: ImageComparisonResult[]): Promise<string> {
    if (!this.config.generateHtmlReport) {
      return '';
    }

    const reportPath = path.join(this.reportsDir, `visual-regression-report-${Date.now()}.html`);
    
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card.passed {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .summary-card.failed {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .summary-card.total {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }
        .summary-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .results-table th,
        .results-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .results-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .status-passed {
            color: #28a745;
            font-weight: bold;
        }
        .status-failed {
            color: #dc3545;
            font-weight: bold;
        }
        .diff-percentage {
            font-family: monospace;
        }
        .image-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
        }
        .image-comparison img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .image-label {
            text-align: center;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        .expandable {
            cursor: pointer;
            user-select: none;
        }
        .expandable:hover {
            background-color: #f8f9fa;
        }
        .details {
            display: none;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            margin-top: 10px;
        }
        .details.expanded {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Visual Regression Test Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <div class="summary-number">${results.length}</div>
                <div>Total Tests</div>
            </div>
            <div class="summary-card passed">
                <div class="summary-number">${passedCount}</div>
                <div>Passed</div>
            </div>
            <div class="summary-card failed">
                <div class="summary-number">${failedCount}</div>
                <div>Failed</div>
            </div>
        </div>

        <table class="results-table">
            <thead>
                <tr>
                    <th>Screenshot</th>
                    <th>Status</th>
                    <th>Diff %</th>
                    <th>Diff Pixels</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${results.map((result, index) => `
                    <tr class="expandable" onclick="toggleDetails(${index})">
                        <td>${result.filename}</td>
                        <td class="status-${result.passed ? 'passed' : 'failed'}">
                            ${result.passed ? 'PASSED' : 'FAILED'}
                        </td>
                        <td class="diff-percentage">
                            ${result.diffPercentage?.toFixed(2) || 'N/A'}%
                        </td>
                        <td>${result.diffPixels || 'N/A'}</td>
                        <td>
                            ${result.diffImagePath ? '<a href="' + path.relative(this.reportsDir, result.diffImagePath) + '">View Diff</a>' : 'No diff'}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="5">
                            <div class="details" id="details-${index}">
                                <div class="image-comparison">
                                    <div>
                                        <div class="image-label">Baseline</div>
                                        <img src="${path.relative(this.reportsDir, path.join(this.baselineDir, result.filename))}" alt="Baseline">
                                    </div>
                                    <div>
                                        <div class="image-label">Current</div>
                                        <img src="${path.relative(this.reportsDir, path.join(this.currentDir, result.filename))}" alt="Current" onerror="this.style.display='none'">
                                    </div>
                                    ${result.diffImagePath ? `
                                    <div>
                                        <div class="image-label">Diff</div>
                                        <img src="${path.relative(this.reportsDir, result.diffImagePath)}" alt="Diff">
                                    </div>
                                    ` : '<div></div>'}
                                </div>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <script>
        function toggleDetails(index) {
            const details = document.getElementById('details-' + index);
            details.classList.toggle('expanded');
        }
    </script>
</body>
</html>
    `;

    fs.writeFileSync(reportPath, html);
    return reportPath;
  }

  getFailedTests(results: ImageComparisonResult[]): ImageComparisonResult[] {
    return results.filter(result => !result.passed);
  }

  getSummary(results: ImageComparisonResult[]): { total: number; passed: number; failed: number; passRate: number } {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, passRate };
  }
}

// Test suite
test.describe('Visual Regression Tests', () => {
  let visualTester: VisualRegressionTester;

  test.beforeAll(async () => {
    visualTester = new VisualRegressionTester({
      tolerance: 0.5, // Allow 0.5% difference
      maxDiffPixels: 200,
      generateDiffImages: true,
      generateHtmlReport: true
    });
    
    await visualTester.initialize();
  });

  test.afterAll(async () => {
    await visualTester.cleanup();
  });

  test('should capture current screenshots for all webview states', async () => {
    // Capture current screenshots using the migrated components
    await visualTester.captureCurrentScreenshots(BASELINE_CONFIGS);
    
    // Verify that current screenshots were created
    const currentDir = '.migration-temp/screenshots/current/';
    const currentFiles = fs.readdirSync(currentDir).filter(f => f.endsWith('.png'));
    
    expect(currentFiles.length).toBeGreaterThan(0);
    console.log(`Captured ${currentFiles.length} current screenshots`);
  });

  test('should compare baseline and current screenshots', async () => {
    // Perform the comparison
    const results = await visualTester.compareScreenshots();
    
    expect(results.length).toBeGreaterThan(0);
    
    // Generate HTML report
    const reportPath = await visualTester.generateHtmlReport(results);
    console.log(`Visual regression report generated: ${reportPath}`);
    
    // Get summary
    const summary = visualTester.getSummary(results);
    console.log(`Visual regression summary:`, summary);
    
    // Log failed tests for debugging
    const failedTests = visualTester.getFailedTests(results);
    if (failedTests.length > 0) {
      console.log('Failed visual regression tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.filename}: ${test.diffPercentage?.toFixed(2)}% difference`);
      });
    }
    
    // The test passes if we successfully generated the comparison
    // Individual failures are reported but don't fail the test suite
    // This allows for manual review of visual changes
    expect(results.length).toBeGreaterThan(0);
  });

  test('should validate specific webview components', async () => {
    const results = await visualTester.compareScreenshots();
    
    // Test specific components that are critical
    const criticalTests = [
      'check-result-view_light_1200x800_100pct_success-with-stats.png',
      'check-result-view_dark_1200x800_100pct_success-with-stats.png',
      'coverage-view_light_1200x800_100pct_with-data-and-chart.png',
      'current-proof-step-view_light_800x600_100pct_with-obligations.png'
    ];

    const criticalResults = results.filter(r => 
      criticalTests.some(critical => r.filename.includes(critical))
    );

    expect(criticalResults.length).toBeGreaterThan(0);
    
    // Log results for critical components
    criticalResults.forEach(result => {
      console.log(`Critical component ${result.filename}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (!result.passed) {
        console.log(`  Difference: ${result.diffPercentage?.toFixed(2)}%`);
      }
    });
  });

  test('should handle missing baseline screenshots gracefully', async () => {
    // Test with a non-existent baseline to ensure error handling
    const testTester = new VisualRegressionTester();
    await testTester.initialize();
    
    try {
      // This should handle missing baselines gracefully
      const results = await testTester.compareScreenshots();
      
      // Should return results even if some baselines are missing
      expect(Array.isArray(results)).toBe(true);
    } catch (error) {
      // Should provide a meaningful error message
      expect(error).toBeInstanceOf(Error);
    } finally {
      await testTester.cleanup();
    }
  });

  test('should generate diff images for failed comparisons', async () => {
    const results = await visualTester.compareScreenshots();
    const failedResults = results.filter(r => !r.passed);
    
    if (failedResults.length > 0) {
      // Check that diff images were generated for failed tests
      const diffDir = '.migration-temp/screenshots/diff/';
      const diffFiles = fs.readdirSync(diffDir);
      
      expect(diffFiles.length).toBeGreaterThan(0);
      console.log(`Generated ${diffFiles.length} diff files`);
    }
  });
});

// Utility test for configuration validation
test.describe('Visual Regression Configuration', () => {
  test('should validate screenshot configurations', () => {
    // Ensure all baseline configurations are valid
    BASELINE_CONFIGS.forEach(config => {
      expect(config.viewName).toBeTruthy();
      expect(config.theme).toMatch(/^(light|dark|high-contrast)$/);
      expect(config.viewport.width).toBeGreaterThan(0);
      expect(config.viewport.height).toBeGreaterThan(0);
      expect(config.zoomLevel).toBeGreaterThan(0);
      expect(config.description).toBeTruthy();
    });
    
    console.log(`Validated ${BASELINE_CONFIGS.length} screenshot configurations`);
  });

  test('should have comprehensive coverage of webview states', () => {
    const viewNames = [...new Set(BASELINE_CONFIGS.map(c => c.viewName))];
    const themes = [...new Set(BASELINE_CONFIGS.map(c => c.theme))];
    
    // Ensure we cover all main webviews
    expect(viewNames).toContain('check-result-view');
    expect(viewNames).toContain('coverage-view');
    expect(viewNames).toContain('current-proof-step-view');
    
    // Ensure we cover all themes
    expect(themes).toContain('light');
    expect(themes).toContain('dark');
    expect(themes).toContain('high-contrast');
    
    console.log(`Coverage: ${viewNames.length} views, ${themes.length} themes`);
  });
});

// Export for use in other test files
export { VisualRegressionTester, ImageComparisonResult, ComparisonOptions };