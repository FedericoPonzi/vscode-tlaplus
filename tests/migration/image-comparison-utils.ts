import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser, Page } from 'playwright';

export interface ImageComparisonResult {
  filename: string;
  passed: boolean;
  diffPixels?: number;
  diffPercentage?: number;
  diffImagePath?: string;
  error?: string;
}

export interface ComparisonOptions {
  threshold: number; // 0-1, sensitivity for pixel comparison
  tolerance: number; // 0-100, percentage of different pixels allowed
  maxDiffPixels: number; // absolute maximum number of different pixels
  generateDiffImage: boolean;
}

/**
 * Image comparison utility using Playwright's built-in capabilities and simple buffer comparison
 */
export class ImageComparator {
  private options: ComparisonOptions;
  private browser: Browser | null = null;

  constructor(options: Partial<ComparisonOptions> = {}) {
    this.options = {
      threshold: 0.1,
      tolerance: 0.5,
      maxDiffPixels: 200,
      generateDiffImage: true,
      ...options
    };
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Compare two PNG images using simple buffer comparison and file size analysis
   */
  async compareImages(
    baselinePath: string,
    currentPath: string,
    diffOutputPath?: string
  ): Promise<ImageComparisonResult> {
    const filename = path.basename(baselinePath);

    if (!fs.existsSync(baselinePath)) {
      return {
        filename,
        passed: false,
        error: `Baseline image not found: ${baselinePath}`
      };
    }

    if (!fs.existsSync(currentPath)) {
      return {
        filename,
        passed: false,
        error: `Current image not found: ${currentPath}`
      };
    }

    try {
      const baselineBuffer = fs.readFileSync(baselinePath);
      const currentBuffer = fs.readFileSync(currentPath);

      // Quick check: if buffers are identical, images are identical
      if (baselineBuffer.equals(currentBuffer)) {
        return {
          filename,
          passed: true,
          diffPixels: 0,
          diffPercentage: 0
        };
      }

      // Estimate difference based on file size and buffer comparison
      const sizeDiff = Math.abs(baselineBuffer.length - currentBuffer.length);
      const maxSize = Math.max(baselineBuffer.length, currentBuffer.length);
      const estimatedDiffPercentage = (sizeDiff / maxSize) * 100;

      // Use Playwright for more detailed comparison if available
      let detailedComparison: ImageComparisonResult | null = null;
      if (this.browser) {
        detailedComparison = await this.performPlaywrightComparison(
          baselinePath,
          currentPath,
          diffOutputPath
        );
      }

      const finalDiffPercentage = detailedComparison?.diffPercentage ?? estimatedDiffPercentage;
      const finalDiffPixels = detailedComparison?.diffPixels ?? sizeDiff;

      const passed = finalDiffPercentage <= this.options.tolerance && 
                    finalDiffPixels <= this.options.maxDiffPixels;

      return {
        filename,
        passed,
        diffPixels: finalDiffPixels,
        diffPercentage: finalDiffPercentage,
        diffImagePath: detailedComparison?.diffImagePath || diffOutputPath
      };

    } catch (error) {
      return {
        filename,
        passed: false,
        error: `Comparison failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Use Playwright to perform more detailed image comparison
   */
  private async performPlaywrightComparison(
    baselinePath: string,
    currentPath: string,
    diffOutputPath?: string
  ): Promise<ImageComparisonResult | null> {
    if (!this.browser) return null;

    try {
      const page = await this.browser.newPage();
      
      // Create a simple HTML page to load and compare images
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 20px; }
            .comparison { display: flex; gap: 20px; }
            .image-container { flex: 1; }
            img { max-width: 100%; height: auto; border: 1px solid #ccc; }
            .label { font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="comparison">
            <div class="image-container">
              <div class="label">Baseline</div>
              <img id="baseline" src="file://${baselinePath}" alt="Baseline">
            </div>
            <div class="image-container">
              <div class="label">Current</div>
              <img id="current" src="file://${currentPath}" alt="Current">
            </div>
          </div>
        </body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForLoadState('networkidle');

      // Get image dimensions and perform basic comparison
      const comparison = await page.evaluate(() => {
        const baselineImg = document.getElementById('baseline') as HTMLImageElement;
        const currentImg = document.getElementById('current') as HTMLImageElement;
        
        if (!baselineImg || !currentImg) {
          return { error: 'Images not loaded' };
        }

        const baselineNaturalWidth = baselineImg.naturalWidth;
        const baselineNaturalHeight = baselineImg.naturalHeight;
        const currentNaturalWidth = currentImg.naturalWidth;
        const currentNaturalHeight = currentImg.naturalHeight;

        // Check if dimensions match
        const dimensionsMatch = baselineNaturalWidth === currentNaturalWidth && 
                               baselineNaturalHeight === currentNaturalHeight;

        return {
          baselineWidth: baselineNaturalWidth,
          baselineHeight: baselineNaturalHeight,
          currentWidth: currentNaturalWidth,
          currentHeight: currentNaturalHeight,
          dimensionsMatch
        };
      });

      await page.close();

      if ('error' in comparison) {
        return null;
      }

      // If dimensions don't match, consider it a significant difference
      if (!comparison.dimensionsMatch) {
        return {
          filename: path.basename(baselinePath),
          passed: false,
          diffPixels: Math.abs(
            (comparison.baselineWidth * comparison.baselineHeight) - 
            (comparison.currentWidth * comparison.currentHeight)
          ),
          diffPercentage: 100
        };
      }

      // For same dimensions, we'll rely on the buffer comparison
      return null;

    } catch (error) {
      console.warn('Playwright comparison failed:', error);
      return null;
    }
  }

  /**
   * Generate a simple diff image by creating a side-by-side comparison
   */
  async generateDiffImage(
    baselinePath: string,
    currentPath: string,
    outputPath: string
  ): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              font-size: 18px;
              font-weight: bold;
            }
            .comparison { 
              display: flex; 
              gap: 20px; 
              justify-content: center;
            }
            .image-container { 
              text-align: center;
              border: 2px solid #ddd;
              padding: 10px;
              border-radius: 8px;
            }
            .label { 
              font-weight: bold; 
              margin-bottom: 10px; 
              padding: 5px;
              background: #f0f0f0;
              border-radius: 4px;
            }
            img { 
              max-width: 400px; 
              height: auto; 
              border: 1px solid #ccc;
              display: block;
              margin: 0 auto;
            }
            .baseline { border-color: #4CAF50; }
            .current { border-color: #2196F3; }
          </style>
        </head>
        <body>
          <div class="header">Visual Comparison: ${path.basename(baselinePath)}</div>
          <div class="comparison">
            <div class="image-container baseline">
              <div class="label">Baseline (Expected)</div>
              <img src="file://${baselinePath}" alt="Baseline">
            </div>
            <div class="image-container current">
              <div class="label">Current (Actual)</div>
              <img src="file://${currentPath}" alt="Current">
            </div>
          </div>
        </body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Allow images to load

      await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: 'png'
      });

    } finally {
      await page.close();
    }
  }

  /**
   * Generate a detailed comparison report
   */
  generateComparisonReport(
    result: ImageComparisonResult,
    baselinePath: string,
    currentPath: string
  ): string {
    const status = result.passed ? 'PASSED' : 'FAILED';
    const errorInfo = result.error ? `\nError: ${result.error}` : '';
    const diffInfo = result.diffImagePath ? `\nDiff image: ${result.diffImagePath}` : '';
    
    return `
Image Comparison Report: ${result.filename}
Status: ${status}
Different pixels: ${result.diffPixels?.toLocaleString() || 'N/A'}
Difference percentage: ${result.diffPercentage?.toFixed(4) || 'N/A'}%
Baseline: ${baselinePath}
Current: ${currentPath}${diffInfo}${errorInfo}
`;
  }
}



/**
 * Batch comparison utility
 */
export async function batchCompareImages(
  baselineDir: string,
  currentDir: string,
  diffDir: string,
  options: Partial<ComparisonOptions> = {}
): Promise<Map<string, ImageComparisonResult>> {
  const comparator = new ImageComparator(options);
  await comparator.initialize();
  
  const results = new Map<string, ImageComparisonResult>();
  
  try {
    if (!fs.existsSync(baselineDir)) {
      throw new Error(`Baseline directory not found: ${baselineDir}`);
    }
    
    // Ensure diff directory exists
    if (!fs.existsSync(diffDir)) {
      fs.mkdirSync(diffDir, { recursive: true });
    }
    
    const baselineFiles = fs.readdirSync(baselineDir)
      .filter(file => file.toLowerCase().endsWith('.png'));
    
    for (const filename of baselineFiles) {
      const baselinePath = path.join(baselineDir, filename);
      const currentPath = path.join(currentDir, filename);
      const diffPath = path.join(diffDir, filename.replace('.png', '_diff.png'));
      
      try {
        const result = await comparator.compareImages(baselinePath, currentPath, diffPath);
        
        // Generate diff image if comparison failed and option is enabled
        if (!result.passed && options.generateDiffImage !== false && !result.error) {
          try {
            await comparator.generateDiffImage(baselinePath, currentPath, diffPath);
            result.diffImagePath = diffPath;
          } catch (diffError) {
            console.warn(`Failed to generate diff image for ${filename}:`, diffError);
          }
        }
        
        results.set(filename, result);
      } catch (error) {
        // Handle comparison errors
        results.set(filename, {
          filename,
          passed: false,
          error: `Comparison failed: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
  } finally {
    await comparator.cleanup();
  }
  
  return results;
}