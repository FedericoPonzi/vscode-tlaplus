import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { TestScenario, VisualRegressionConfig, DEFAULT_CONFIG } from './visual-regression-config';

/**
 * Enhanced screenshot capture utilities for permanent visual regression testing
 * Moved from temporary migration infrastructure to permanent test infrastructure
 */

export interface ScreenshotCaptureOptions {
  outputDir: string;
  config?: Partial<VisualRegressionConfig>;
  headless?: boolean;
}

export class ScreenshotCapture {
  private browser: Browser | null = null;
  private config: VisualRegressionConfig;
  private outputDir: string;

  constructor(options: ScreenshotCaptureOptions) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...options.config
    };
    this.outputDir = options.outputDir;
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.screenshotOptions ? true : true
    });

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
 * Capture screenshots for multiple test scenarios
 */
  async captureScreenshots(scenarios: TestScenario[]): Promise<string[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const capturedFiles: string[] = [];

    for (const scenario of scenarios) {
      try {
        const filename = await this.captureScreenshot(scenario);
        capturedFiles.push(filename);
        console.log(`✓ Captured screenshot: ${filename}`);
      } catch (error) {
        console.error(`✗ Failed to capture screenshot for ${scenario.name}:`, error);
        throw error;
      }
    }

    return capturedFiles;
  }

  /**
 * Capture a single screenshot for a test scenario
 */
  async captureScreenshot(scenario: TestScenario): Promise<string> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Set viewport and zoom
      await page.setViewportSize(scenario.viewport);
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = `${zoomLevel}%`;
      }, scenario.zoomLevel);

      // Apply theme
      await this.applyTheme(page, scenario.theme);

      // Load the webview content
      await this.loadWebviewContent(page, scenario.viewName, scenario.testData);

      // Wait for content to be fully loaded
      await page.waitForLoadState('networkidle');

      // Additional wait conditions if specified
      if (scenario.waitConditions) {
        if (scenario.waitConditions.selector) {
          await page.waitForSelector(scenario.waitConditions.selector, {
            timeout: scenario.waitConditions.timeout || 5000
          });
        }
        if (scenario.waitConditions.networkIdle) {
          await page.waitForLoadState('networkidle');
        }
      }

      // Wait for animations to complete
      await page.waitForTimeout(1000);

      // Generate filename
      const filename = this.generateFilename(scenario);
      const filepath = path.join(this.outputDir, filename);

      // Capture screenshot
      await page.screenshot({
        path: filepath,
        fullPage: this.config.screenshotOptions.fullPage,
        type: this.config.screenshotOptions.type,
        animations: this.config.screenshotOptions.animations
      });

      return filename;
    } finally {
      await page.close();
    }
  }

  /**
 * Apply VS Code theme to the page
 */
  private async applyTheme(page: Page, theme: string): Promise<void> {
    await page.addStyleTag({
      content: `
        body.vscode-light { 
          --vscode-foreground: #000000;
          --vscode-background: #ffffff;
          --vscode-panel-border: #e5e5e5;
          --vscode-editor-background: #f8f8f8;
          --vscode-testing-iconPassed: #00aa00;
          --vscode-testing-iconFailed: #aa0000;
          --vscode-testing-iconQueued: #0066aa;
          --vscode-testing-iconUnset: #666666;
          --vscode-badge-background: #007acc;
          --vscode-badge-foreground: #ffffff;
          --vscode-progressBar-background: #e5e5e5;
          --vscode-progressBar-foreground: #007acc;
          --vscode-descriptionForeground: #666666;
          --vscode-inputValidation-errorBackground: #ffe6e6;
          --vscode-inputValidation-errorBorder: #ff0000;
        }
        body.vscode-dark { 
          --vscode-foreground: #ffffff;
          --vscode-background: #1e1e1e;
          --vscode-panel-border: #2d2d30;
          --vscode-editor-background: #252526;
          --vscode-testing-iconPassed: #00aa00;
          --vscode-testing-iconFailed: #f14c4c;
          --vscode-testing-iconQueued: #007acc;
          --vscode-testing-iconUnset: #cccccc;
          --vscode-badge-background: #007acc;
          --vscode-badge-foreground: #ffffff;
          --vscode-progressBar-background: #2d2d30;
          --vscode-progressBar-foreground: #007acc;
          --vscode-descriptionForeground: #cccccc;
          --vscode-inputValidation-errorBackground: #5a1d1d;
          --vscode-inputValidation-errorBorder: #be1100;
        }
        body.vscode-high-contrast { 
          --vscode-foreground: #ffffff;
          --vscode-background: #000000;
          --vscode-panel-border: #ffffff;
          --vscode-editor-background: #000000;
          --vscode-testing-iconPassed: #00ff00;
          --vscode-testing-iconFailed: #ff0000;
          --vscode-testing-iconQueued: #00ffff;
          --vscode-testing-iconUnset: #ffffff;
          --vscode-badge-background: #ffffff;
          --vscode-badge-foreground: #000000;
          --vscode-progressBar-background: #ffffff;
          --vscode-progressBar-foreground: #000000;
          --vscode-descriptionForeground: #ffffff;
          --vscode-inputValidation-errorBackground: #ff0000;
          --vscode-inputValidation-errorBorder: #ffffff;
        }
      `
    });

    await page.evaluate((theme) => {
      document.body.className = `vscode-${theme}`;
    }, theme);
  }

  /**
 * Load webview content for testing
 */
  private async loadWebviewContent(page: Page, viewName: string, testData?: any): Promise<void> {
    const htmlContent = this.generateWebviewHTML(viewName, testData);
    await page.setContent(htmlContent);

    // Wait for any dynamic content to load
    await page.waitForTimeout(500);
  }

  /**
 * Generate HTML content for webview testing
 */
  private generateWebviewHTML(viewName: string, testData?: any): string {
    switch (viewName) {
      case 'check-result-view':
        return this.generateCheckResultViewHTML(testData);
      case 'coverage-view':
        return this.generateCoverageViewHTML(testData);
      case 'current-proof-step-view':
        return this.generateCurrentProofStepViewHTML(testData);
      default:
        return this.generatePlaceholderHTML(viewName, testData);
    }
  }

  private generateCheckResultViewHTML(testData?: any): string {
    const mockData = this.getMockCheckResultData(testData);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check Result View</title>
        <link href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.35/dist/codicon.css" rel="stylesheet">
        <style>
          ${this.getBaseStyles()}
          ${this.getCheckResultViewStyles()}
        </style>
      </head>
      <body>
        <div id="root">
          ${this.renderCheckResultView(mockData)}
        </div>
      </body>
      </html>
    `;
  }

  private generateCoverageViewHTML(testData?: any): string {
    const mockData = this.getMockCoverageData(testData);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Coverage View</title>
        <link href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.35/dist/codicon.css" rel="stylesheet">
        <style>
          ${this.getBaseStyles()}
          ${this.getCoverageViewStyles()}
        </style>
      </head>
      <body>
        <div id="root">
          ${this.renderCoverageView(mockData)}
        </div>
      </body>
      </html>
    `;
  }

  private generateCurrentProofStepViewHTML(testData?: any): string {
    const mockData = this.getMockProofStepData(testData);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Current Proof Step View</title>
        <link href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.35/dist/codicon.css" rel="stylesheet">
        <style>
          ${this.getBaseStyles()}
          ${this.getCurrentProofStepViewStyles()}
        </style>
      </head>
      <body>
        <div id="root">
          ${this.renderCurrentProofStepView(mockData)}
        </div>
      </body>
      </html>
    `;
  }

  private generatePlaceholderHTML(viewName: string, testData?: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${viewName} Test</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .placeholder { padding: 20px; border: 2px dashed #ccc; margin: 10px; }
        </style>
      </head>
      <body>
        <div class="placeholder">
          <h2>${viewName} Placeholder</h2>
          <p>This is a placeholder for ${viewName} webview content.</p>
          ${testData ? `<pre>${JSON.stringify(testData, null, 2)}</pre>` : ''}
        </div>
      </body>
      </html>
    `;
  }

  private generateFilename(scenario: TestScenario): string {
    const sanitizedViewName = scenario.viewName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const sanitizedDescription = scenario.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${sanitizedViewName}_${scenario.theme}_${scenario.viewport.width}x${scenario.viewport.height}_${scenario.zoomLevel}pct_${sanitizedDescription}.png`;
  }

  // Mock data generators
  private getMockCheckResultData(testData?: any): any {
    const defaults = {
      status: 'success',
      hasStats: false,
      hasErrorTrace: false,
      hasCoverage: false
    };
    return { ...defaults, ...testData };
  }

  private getMockCoverageData(testData?: any): any {
    const defaults = {
      hasData: true,
      hasChart: true,
      coverageData: [
        { file: 'example.tla', coverage: 85, actionsCovered: 17, totalActions: 20 },
        { file: 'module.tla', coverage: 92, actionsCovered: 23, totalActions: 25 }
      ]
    };
    return { ...defaults, ...testData };
  }

  private getMockProofStepData(testData?: any): any {
    const defaults = {
      hasObligations: true,
      status: 'proved',
      obligations: [
        { id: 1, description: 'Safety property', status: 'proved' },
        { id: 2, description: 'Liveness property', status: 'pending' }
      ]
    };
    return { ...defaults, ...testData };
  }

  // Style generators (reusable from migration utilities)
  private getBaseStyles(): string {
    return `
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-foreground, #000);
        background-color: var(--vscode-background, #fff);
      }
      .container {
        max-width: 100%;
        margin: 0 auto;
      }
      .section {
        margin-bottom: 16px;
        padding: 12px;
        border: 1px solid var(--vscode-panel-border, #ccc);
        border-radius: 4px;
      }
      .header {
        font-weight: 600;
        margin-bottom: 8px;
      }
      .status-success { color: var(--vscode-testing-iconPassed, #00aa00); }
      .status-failure { color: var(--vscode-testing-iconFailed, #aa0000); }
      .status-running { color: var(--vscode-testing-iconQueued, #0066aa); }
      .status-pending { color: var(--vscode-testing-iconUnset, #666); }
    `;
  }

  private getCheckResultViewStyles(): string {
    return `
      .check-result-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .result-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      .stat-item {
        padding: 8px 12px;
        background: var(--vscode-editor-background, #f8f8f8);
        border-radius: 4px;
      }
      .error-trace {
        background: var(--vscode-inputValidation-errorBackground, #ffe6e6);
        border: 1px solid var(--vscode-inputValidation-errorBorder, #ff0000);
        padding: 12px;
        border-radius: 4px;
        font-family: monospace;
        white-space: pre-wrap;
      }
      .coverage-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: var(--vscode-badge-background, #007acc);
        color: var(--vscode-badge-foreground, #fff);
        border-radius: 4px;
      }
    `;
  }

  private getCoverageViewStyles(): string {
    return `
      .coverage-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .coverage-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .coverage-chart {
        height: 300px;
        background: var(--vscode-editor-background, #f8f8f8);
        border: 1px solid var(--vscode-panel-border, #ccc);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vscode-descriptionForeground, #666);
      }
      .coverage-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .coverage-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid var(--vscode-panel-border, #eee);
      }
      .coverage-bar {
        width: 100px;
        height: 8px;
        background: var(--vscode-progressBar-background, #eee);
        border-radius: 4px;
        overflow: hidden;
      }
      .coverage-fill {
        height: 100%;
        background: var(--vscode-progressBar-foreground, #007acc);
        transition: width 0.3s ease;
      }
      .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--vscode-descriptionForeground, #666);
      }
    `;
  }

  private getCurrentProofStepViewStyles(): string {
    return `
      .proof-step-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .proof-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--vscode-editor-background, #f8f8f8);
        border-radius: 4px;
      }
      .obligations-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .obligation-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-left: 3px solid transparent;
        margin-bottom: 4px;
      }
      .obligation-item.proved {
        border-left-color: var(--vscode-testing-iconPassed, #00aa00);
        background: var(--vscode-testing-iconPassed, #00aa00)10;
      }
      .obligation-item.failed {
        border-left-color: var(--vscode-testing-iconFailed, #aa0000);
        background: var(--vscode-testing-iconFailed, #aa0000)10;
      }
      .obligation-item.pending {
        border-left-color: var(--vscode-testing-iconUnset, #666);
        background: var(--vscode-testing-iconUnset, #666)10;
      }
      .status-icon {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        display: inline-block;
      }
      .status-icon.proved { background: var(--vscode-testing-iconPassed, #00aa00); }
      .status-icon.failed { background: var(--vscode-testing-iconFailed, #aa0000); }
      .status-icon.pending { background: var(--vscode-testing-iconUnset, #666); }
    `;
  }

  // HTML renderers
  private renderCheckResultView(mockData: any): string {
    const statusClass = `status-${mockData.status}`;
    let content = `
      <div class="check-result-container">
        <div class="result-header ${statusClass}">
          <span class="codicon codicon-${mockData.status === 'success' ? 'check' : mockData.status === 'failure' ? 'error' : 'sync'}"></span>
          Model Check ${mockData.status === 'success' ? 'Completed Successfully' : mockData.status === 'failure' ? 'Failed' : 'In Progress'}
        </div>
    `;

    if (mockData.hasStats && mockData.status === 'success') {
      const stats = mockData.stats || {
        statesFound: 1234567,
        distinctStates: 987654,
        queueSize: 0,
        duration: '2m 34s'
      };

      content += `
        <div class="section">
          <div class="header">Statistics</div>
          <div class="stats-grid">
            <div class="stat-item">
              <strong>States Found:</strong> ${stats.statesFound.toLocaleString()}
            </div>
            <div class="stat-item">
              <strong>Distinct States:</strong> ${stats.distinctStates.toLocaleString()}
            </div>
            <div class="stat-item">
              <strong>Queue Size:</strong> ${stats.queueSize}
            </div>
            <div class="stat-item">
              <strong>Duration:</strong> ${stats.duration}
            </div>
          </div>
        </div>
      `;
    }

    if (mockData.hasErrorTrace && mockData.status === 'failure') {
      const errorTrace = mockData.errorTrace || {
        states: [
          { id: 1, description: 'Initial state', variables: { x: 0, y: 1 } },
          { id: 2, description: 'Action Next', variables: { x: 1, y: 2 } },
          { id: 3, description: 'Invariant violation', variables: { x: 2, y: 3 }, error: 'Invariant "x < y" is violated' }
        ]
      };

      content += `
        <div class="section">
          <div class="header">Error Trace</div>
          <div class="error-trace">`;

      errorTrace.states.forEach((state: any) => {
        content += `State ${state.id}: ${state.description}\n`;
        Object.entries(state.variables).forEach(([key, value]) => {
          content += `  ${key} = ${value}\n`;
        });
        if (state.error) {
          content += `  ${state.error}\n`;
        }
        content += '\n';
      });

      content += `</div>
        </div>
      `;
    }

    if (mockData.hasCoverage) {
      const coverage = mockData.coverage || {
        percentage: 85,
        actionsCovered: 17,
        totalActions: 20
      };

      content += `
        <div class="section">
          <div class="header">Coverage Summary</div>
          <div class="coverage-summary">
            <span class="codicon codicon-graph"></span>
            Coverage: ${coverage.percentage}% (${coverage.actionsCovered}/${coverage.totalActions} actions covered)
          </div>
        </div>
      `;
    }

    if (mockData.status === 'running' && mockData.progress) {
      content += `
        <div class="section">
          <div class="header">Progress</div>
          <div class="stats-grid">
            <div class="stat-item">
              <strong>States Found:</strong> ${mockData.progress.statesFound.toLocaleString()}
            </div>
            <div class="stat-item">
              <strong>Distinct States:</strong> ${mockData.progress.distinctStates.toLocaleString()}
            </div>
            <div class="stat-item">
              <strong>Queue Size:</strong> ${mockData.progress.queueSize.toLocaleString()}
            </div>
            <div class="stat-item">
              <strong>Elapsed Time:</strong> ${mockData.progress.elapsedTime}
            </div>
          </div>
        </div>
      `;
    }

    content += '</div>';
    return content;
  }

  private renderCoverageView(mockData: any): string {
    if (!mockData.hasData) {
      return `
        <div class="coverage-container">
          <div class="empty-state">
            <span class="codicon codicon-graph" style="font-size: 48px; opacity: 0.3;"></span>
            <h3>No Coverage Data Available</h3>
            <p>Run model checking with coverage enabled to see coverage information.</p>
          </div>
        </div>
      `;
    }

    let content = `
      <div class="coverage-container">
        <div class="coverage-header">
          <h2>Coverage Report</h2>
          <span>Overall: 85%</span>
        </div>
    `;

    if (mockData.hasChart) {
      content += `
        <div class="section">
          <div class="header">Coverage Chart</div>
          <div class="coverage-chart">
            [Coverage Chart - Interactive visualization would be rendered here]
          </div>
        </div>
      `;
    }

    content += `
      <div class="section">
        <div class="header">File Coverage</div>
        <ul class="coverage-list">
    `;

    const files = mockData.coverageData || [
      { file: 'example.tla', coverage: 85, actionsCovered: 17, totalActions: 20 },
      { file: 'module.tla', coverage: 92, actionsCovered: 23, totalActions: 25 },
      { file: 'spec.tla', coverage: 78, actionsCovered: 14, totalActions: 18 }
    ];

    files.forEach((file: any) => {
      content += `
        <li class="coverage-item">
          <span>${file.file}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="coverage-bar">
              <div class="coverage-fill" style="width: ${file.coverage}%"></div>
            </div>
            <span>${file.coverage}%</span>
            ${file.actionsCovered ? `<span style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">(${file.actionsCovered}/${file.totalActions})</span>` : ''}
          </div>
        </li>
      `;
    });

    content += `
        </ul>
      </div>
    </div>
    `;

    return content;
  }

  private renderCurrentProofStepView(mockData: any): string {
    let content = `
      <div class="proof-step-container">
        <div class="proof-header">
          <span class="codicon codicon-symbol-method"></span>
          <span>Current Proof Step</span>
          <span class="status-${mockData.status}">${mockData.status.toUpperCase()}</span>
        </div>
    `;

    if (mockData.hasObligations) {
      content += `
        <div class="section">
          <div class="header">Proof Obligations</div>
          <ul class="obligations-list">
      `;

      const obligations = mockData.obligations || [
        { id: 1, description: 'Safety property holds', status: 'proved' },
        { id: 2, description: 'Liveness property holds', status: mockData.status },
        { id: 3, description: 'Invariant preservation', status: 'proved' }
      ];

      obligations.forEach((obligation: any) => {
        content += `
          <li class="obligation-item ${obligation.status}">
            <span class="status-icon ${obligation.status}"></span>
            <span>${obligation.description}</span>
          </li>
        `;
      });

      content += `
          </ul>
        </div>
      `;
    }

    content += '</div>';
    return content;
  }
}

/**
 * Utility functions for screenshot management
 */
export class ScreenshotManager {
  /**
 * Copy screenshots from one directory to another
 */
  static copyScreenshots(sourceDir: string, targetDir: string): string[] {
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory does not exist: ${sourceDir}`);
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir)
      .filter(file => file.toLowerCase().endsWith('.png'));

    const copiedFiles: string[] = [];

    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      fs.copyFileSync(sourcePath, targetPath);
      copiedFiles.push(file);
    });

    return copiedFiles;
  }

  /**
 * Clean up old screenshots (keep only the most recent N files)
 */
  static cleanupOldScreenshots(directory: string, keepCount: number = 10): void {
    if (!fs.existsSync(directory)) {
      return;
    }

    const files = fs.readdirSync(directory)
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        mtime: fs.statSync(path.join(directory, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Remove files beyond the keep count
    files.slice(keepCount).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`Cleaned up old screenshot: ${file.name}`);
    });
  }

  /**
 * Generate a summary report of screenshots
 */
  static generateScreenshotSummary(directory: string): {
    totalFiles: number;
    filesByTheme: Record<string, number>;
    filesByView: Record<string, number>;
    totalSize: number;
  } {
    if (!fs.existsSync(directory)) {
      return {
        totalFiles: 0,
        filesByTheme: {},
        filesByView: {},
        totalSize: 0
      };
    }

    const files = fs.readdirSync(directory)
      .filter(file => file.toLowerCase().endsWith('.png'));

    const filesByTheme: Record<string, number> = {};
    const filesByView: Record<string, number> = {};
    let totalSize = 0;

    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;

      // Extract theme and view from filename
      const parts = file.split('_');
      if (parts.length >= 4) {
        const view = parts[0] + '-' + parts[1] + '-' + parts[2];
        const theme = parts[3];

        filesByView[view] = (filesByView[view] || 0) + 1;
        filesByTheme[theme] = (filesByTheme[theme] || 0) + 1;
      }
    });

    return {
      totalFiles: files.length,
      filesByTheme,
      filesByView,
      totalSize
    };
  }
}