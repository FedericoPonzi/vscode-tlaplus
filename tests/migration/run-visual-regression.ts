#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Visual Regression Test Runner
 * 
 * This script provides a convenient way to run visual regression tests
 * with different configurations and options.
 */

interface RunnerOptions {
  mode: 'capture' | 'compare' | 'full';
  config: 'default' | 'strict' | 'lenient';
  reporter: 'list' | 'html' | 'json';
  timeout: number;
  headless: boolean;
  updateBaseline: boolean;
}

class VisualRegressionRunner {
  private options: RunnerOptions;

  constructor(options: Partial<RunnerOptions> = {}) {
    this.options = {
      mode: 'full',
      config: 'default',
      reporter: 'list',
      timeout: 90000,
      headless: true,
      updateBaseline: false,
      ...options
    };
  }

  async run(): Promise<void> {
    console.log('🎭 Visual Regression Test Runner');
    console.log('================================');
    console.log(`Mode: ${this.options.mode}`);
    console.log(`Config: ${this.options.config}`);
    console.log(`Reporter: ${this.options.reporter}`);
    console.log(`Timeout: ${this.options.timeout}ms`);
    console.log(`Headless: ${this.options.headless}`);
    console.log('');

    try {
      // Ensure directories exist
      this.ensureDirectories();

      // Run the appropriate test mode
      switch (this.options.mode) {
        case 'capture':
          await this.runCaptureOnly();
          break;
        case 'compare':
          await this.runCompareOnly();
          break;
        case 'full':
          await this.runFullSuite();
          break;
      }

      console.log('✅ Visual regression tests completed successfully!');
      
      // Show report location
      this.showReportLocation();

    } catch (error) {
      console.error('❌ Visual regression tests failed:');
      console.error(error);
      process.exit(1);
    }
  }

  private ensureDirectories(): void {
    const dirs = [
      '.migration-temp/screenshots/baseline',
      '.migration-temp/screenshots/current',
      '.migration-temp/screenshots/diff',
      '.migration-temp/comparison-reports'
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  private async runCaptureOnly(): Promise<void> {
    console.log('📸 Running screenshot capture only...');
    
    const command = this.buildPlaywrightCommand([
      'tests/migration/visual-regression.test.ts',
      '--grep="should capture current screenshots"'
    ]);

    execSync(command, { stdio: 'inherit' });
  }

  private async runCompareOnly(): Promise<void> {
    console.log('🔍 Running comparison only...');
    
    const command = this.buildPlaywrightCommand([
      'tests/migration/visual-regression.test.ts',
      '--grep="should compare baseline and current screenshots"'
    ]);

    execSync(command, { stdio: 'inherit' });
  }

  private async runFullSuite(): Promise<void> {
    console.log('🚀 Running full visual regression test suite...');
    
    const command = this.buildPlaywrightCommand([
      'tests/migration/visual-regression.test.ts'
    ]);

    execSync(command, { stdio: 'inherit' });
  }

  private buildPlaywrightCommand(args: string[]): string {
    const baseCommand = 'npx playwright test';
    const options = [
      `--reporter=${this.options.reporter}`,
      `--timeout=${this.options.timeout}`,
      this.options.headless ? '--headed=false' : '--headed=true'
    ];

    return `${baseCommand} ${args.join(' ')} ${options.join(' ')}`;
  }

  private showReportLocation(): void {
    const reportsDir = '.migration-temp/comparison-reports';
    
    if (fs.existsSync(reportsDir)) {
      const reports = fs.readdirSync(reportsDir)
        .filter(file => file.endsWith('.html'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(reportsDir, a));
          const statB = fs.statSync(path.join(reportsDir, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      if (reports.length > 0) {
        const latestReport = path.join(reportsDir, reports[0]);
        console.log('');
        console.log('📊 Latest visual regression report:');
        console.log(`   ${path.resolve(latestReport)}`);
        console.log('');
        console.log('💡 Open the report in your browser to view detailed results');
      }
    }
  }
}

// CLI Interface
function parseArgs(): Partial<RunnerOptions> {
  const args = process.argv.slice(2);
  const options: Partial<RunnerOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
        options.mode = args[++i] as RunnerOptions['mode'];
        break;
      case '--config':
        options.config = args[++i] as RunnerOptions['config'];
        break;
      case '--reporter':
        options.reporter = args[++i] as RunnerOptions['reporter'];
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--headed':
        options.headless = false;
        break;
      case '--update-baseline':
        options.updateBaseline = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Visual Regression Test Runner

Usage: ts-node tests/migration/run-visual-regression.ts [options]

Options:
  --mode <mode>         Test mode: capture, compare, full (default: full)
  --config <config>     Test config: default, strict, lenient (default: default)
  --reporter <reporter> Reporter: list, html, json (default: list)
  --timeout <ms>        Test timeout in milliseconds (default: 90000)
  --headed              Run tests in headed mode (default: headless)
  --update-baseline     Update baseline screenshots (default: false)
  --help               Show this help message

Examples:
  # Run full test suite
  ts-node tests/migration/run-visual-regression.ts

  # Capture screenshots only
  ts-node tests/migration/run-visual-regression.ts --mode capture

  # Run comparison with strict config
  ts-node tests/migration/run-visual-regression.ts --mode compare --config strict

  # Run in headed mode for debugging
  ts-node tests/migration/run-visual-regression.ts --headed
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const runner = new VisualRegressionRunner(options);
  runner.run().catch(console.error);
}

export { VisualRegressionRunner, RunnerOptions };