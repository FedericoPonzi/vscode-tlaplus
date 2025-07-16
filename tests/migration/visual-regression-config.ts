/**
 * Configuration for visual regression testing
 */

export interface VisualRegressionConfig {
  /** Tolerance percentage for pixel differences (0-100) */
  tolerance: number;
  
  /** Threshold for individual pixel comparison (0-1) */
  threshold: number;
  
  /** Maximum number of different pixels allowed */
  maxDiffPixels: number;
  
  /** Whether to generate diff images for failed comparisons */
  generateDiffImages: boolean;
  
  /** Whether to generate HTML reports */
  generateHtmlReport: boolean;
  
  /** Directory paths for screenshots and reports */
  paths: {
    baseline: string;
    current: string;
    diff: string;
    reports: string;
  };
  
  /** Playwright screenshot options */
  screenshotOptions: {
    fullPage: boolean;
    type: 'png' | 'jpeg';
    quality?: number;
    animations: 'disabled' | 'allow';
  };
}

export const DEFAULT_CONFIG: VisualRegressionConfig = {
  tolerance: 0.2, // 0.2% tolerance for pixel differences
  threshold: 0.1, // 0.1 threshold for individual pixel comparison
  maxDiffPixels: 100, // Maximum number of different pixels allowed
  generateDiffImages: true,
  generateHtmlReport: true,
  paths: {
    baseline: '.migration-temp/screenshots/baseline/',
    current: '.migration-temp/screenshots/current/',
    diff: '.migration-temp/screenshots/diff/',
    reports: '.migration-temp/comparison-reports/'
  },
  screenshotOptions: {
    fullPage: true,
    type: 'png',
    animations: 'disabled'
  }
};

export const STRICT_CONFIG: VisualRegressionConfig = {
  ...DEFAULT_CONFIG,
  tolerance: 0.05, // Very strict - only 0.05% difference allowed
  maxDiffPixels: 10,
  threshold: 0.05
};

export const LENIENT_CONFIG: VisualRegressionConfig = {
  ...DEFAULT_CONFIG,
  tolerance: 1.0, // Allow up to 1% difference
  maxDiffPixels: 500,
  threshold: 0.2
};

/**
 * Test scenarios for different webview states
 */
export interface TestScenario {
  name: string;
  description: string;
  viewName: string;
  testData?: any;
  theme: 'light' | 'dark' | 'high-contrast';
  viewport: { width: number; height: number };
  zoomLevel: number;
  waitConditions?: {
    selector?: string;
    timeout?: number;
    networkIdle?: boolean;
  };
}

export const TEST_SCENARIOS: TestScenario[] = [
  // Check Result View - Success scenarios
  {
    name: 'check-result-success-stats-light',
    description: 'Check result view with successful model check and statistics in light theme',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      status: 'success', 
      hasStats: true,
      stats: {
        statesFound: 1234567,
        distinctStates: 987654,
        queueSize: 0,
        duration: '2m 34s'
      }
    }
  },
  {
    name: 'check-result-success-stats-dark',
    description: 'Check result view with successful model check and statistics in dark theme',
    viewName: 'check-result-view',
    theme: 'dark',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      status: 'success', 
      hasStats: true,
      stats: {
        statesFound: 1234567,
        distinctStates: 987654,
        queueSize: 0,
        duration: '2m 34s'
      }
    }
  },
  {
    name: 'check-result-success-stats-high-contrast',
    description: 'Check result view with successful model check and statistics in high contrast theme',
    viewName: 'check-result-view',
    theme: 'high-contrast',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      status: 'success', 
      hasStats: true,
      stats: {
        statesFound: 1234567,
        distinctStates: 987654,
        queueSize: 0,
        duration: '2m 34s'
      }
    }
  },

  // Check Result View - Failure scenarios
  {
    name: 'check-result-failure-error-trace-light',
    description: 'Check result view with failed model check and error trace in light theme',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      status: 'failure', 
      hasErrorTrace: true,
      errorTrace: {
        states: [
          { id: 1, description: 'Initial state', variables: { x: 0, y: 1 } },
          { id: 2, description: 'Action Next', variables: { x: 1, y: 2 } },
          { id: 3, description: 'Invariant violation', variables: { x: 2, y: 3 }, error: 'Invariant "x < y" is violated' }
        ]
      }
    }
  },
  {
    name: 'check-result-failure-error-trace-dark',
    description: 'Check result view with failed model check and error trace in dark theme',
    viewName: 'check-result-view',
    theme: 'dark',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      status: 'failure', 
      hasErrorTrace: true,
      errorTrace: {
        states: [
          { id: 1, description: 'Initial state', variables: { x: 0, y: 1 } },
          { id: 2, description: 'Action Next', variables: { x: 1, y: 2 } },
          { id: 3, description: 'Invariant violation', variables: { x: 2, y: 3 }, error: 'Invariant "x < y" is violated' }
        ]
      }
    }
  },

  // Check Result View - Running state
  {
    name: 'check-result-running-light',
    description: 'Check result view with model check in progress in light theme',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      status: 'running',
      progress: {
        statesFound: 45678,
        distinctStates: 34567,
        queueSize: 1234,
        elapsedTime: '45s'
      }
    }
  },

  // Check Result View - With coverage
  {
    name: 'check-result-success-coverage-light',
    description: 'Check result view with successful model check and coverage data in light theme',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      status: 'success', 
      hasCoverage: true,
      coverage: {
        percentage: 85,
        actionsCovered: 17,
        totalActions: 20
      }
    }
  },

  // Coverage View scenarios
  {
    name: 'coverage-view-with-data-light',
    description: 'Coverage view with data and chart in light theme',
    viewName: 'coverage-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      hasData: true, 
      hasChart: true,
      coverageData: [
        { file: 'example.tla', coverage: 85, actionsCovered: 17, totalActions: 20 },
        { file: 'module.tla', coverage: 92, actionsCovered: 23, totalActions: 25 },
        { file: 'spec.tla', coverage: 78, actionsCovered: 14, totalActions: 18 }
      ]
    }
  },
  {
    name: 'coverage-view-with-data-dark',
    description: 'Coverage view with data and chart in dark theme',
    viewName: 'coverage-view',
    theme: 'dark',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { 
      hasData: true, 
      hasChart: true,
      coverageData: [
        { file: 'example.tla', coverage: 85, actionsCovered: 17, totalActions: 20 },
        { file: 'module.tla', coverage: 92, actionsCovered: 23, totalActions: 25 },
        { file: 'spec.tla', coverage: 78, actionsCovered: 14, totalActions: 18 }
      ]
    }
  },
  {
    name: 'coverage-view-empty-state-light',
    description: 'Coverage view with empty state in light theme',
    viewName: 'coverage-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 100,
    testData: { hasData: false }
  },

  // Current Proof Step View scenarios
  {
    name: 'proof-step-with-obligations-light',
    description: 'Current proof step view with obligations in light theme',
    viewName: 'current-proof-step-view',
    theme: 'light',
    viewport: { width: 800, height: 600 },
    zoomLevel: 100,
    testData: { 
      hasObligations: true, 
      status: 'proved',
      obligations: [
        { id: 1, description: 'Safety property holds', status: 'proved' },
        { id: 2, description: 'Liveness property holds', status: 'proved' },
        { id: 3, description: 'Invariant preservation', status: 'proved' }
      ]
    }
  },
  {
    name: 'proof-step-with-obligations-dark',
    description: 'Current proof step view with obligations in dark theme',
    viewName: 'current-proof-step-view',
    theme: 'dark',
    viewport: { width: 800, height: 600 },
    zoomLevel: 100,
    testData: { 
      hasObligations: true, 
      status: 'proved',
      obligations: [
        { id: 1, description: 'Safety property holds', status: 'proved' },
        { id: 2, description: 'Liveness property holds', status: 'proved' },
        { id: 3, description: 'Invariant preservation', status: 'proved' }
      ]
    }
  },
  {
    name: 'proof-step-failed-status-light',
    description: 'Current proof step view with failed status in light theme',
    viewName: 'current-proof-step-view',
    theme: 'light',
    viewport: { width: 800, height: 600 },
    zoomLevel: 100,
    testData: { 
      hasObligations: true, 
      status: 'failed',
      obligations: [
        { id: 1, description: 'Safety property holds', status: 'proved' },
        { id: 2, description: 'Liveness property holds', status: 'failed' },
        { id: 3, description: 'Invariant preservation', status: 'pending' }
      ]
    }
  },
  {
    name: 'proof-step-pending-status-light',
    description: 'Current proof step view with pending status in light theme',
    viewName: 'current-proof-step-view',
    theme: 'light',
    viewport: { width: 800, height: 600 },
    zoomLevel: 100,
    testData: { 
      hasObligations: true, 
      status: 'pending',
      obligations: [
        { id: 1, description: 'Safety property holds', status: 'proved' },
        { id: 2, description: 'Liveness property holds', status: 'pending' },
        { id: 3, description: 'Invariant preservation', status: 'pending' }
      ]
    }
  },

  // Responsive scenarios - different widths
  {
    name: 'check-result-narrow-width-light',
    description: 'Check result view in narrow width layout',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 800, height: 600 },
    zoomLevel: 100,
    testData: { status: 'success', hasStats: true }
  },
  {
    name: 'check-result-wide-width-light',
    description: 'Check result view in wide width layout',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 1600, height: 1000 },
    zoomLevel: 100,
    testData: { status: 'success', hasStats: true }
  },

  // Different zoom levels
  {
    name: 'check-result-125pct-zoom-light',
    description: 'Check result view at 125% zoom level',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 125,
    testData: { status: 'success', hasStats: true }
  },
  {
    name: 'check-result-150pct-zoom-light',
    description: 'Check result view at 150% zoom level',
    viewName: 'check-result-view',
    theme: 'light',
    viewport: { width: 1200, height: 800 },
    zoomLevel: 150,
    testData: { status: 'success', hasStats: true }
  }
];

/**
 * Critical test scenarios that must pass for the migration to be considered successful
 */
export const CRITICAL_SCENARIOS = [
  'check-result-success-stats-light',
  'check-result-success-stats-dark',
  'check-result-failure-error-trace-light',
  'coverage-view-with-data-light',
  'proof-step-with-obligations-light'
];

/**
 * Utility function to get scenarios by view name
 */
export function getScenariosByView(viewName: string): TestScenario[] {
  return TEST_SCENARIOS.filter(scenario => scenario.viewName === viewName);
}

/**
 * Utility function to get scenarios by theme
 */
export function getScenariosByTheme(theme: string): TestScenario[] {
  return TEST_SCENARIOS.filter(scenario => scenario.theme === theme);
}

/**
 * Utility function to get critical scenarios
 */
export function getCriticalScenarios(): TestScenario[] {
  return TEST_SCENARIOS.filter(scenario => CRITICAL_SCENARIOS.includes(scenario.name));
}