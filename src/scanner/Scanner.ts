import * as fs from 'fs-extra';
import * as path from 'path';
import glob from 'fast-glob';
import { ScanResult, ScannerOptions } from './types';
import { SafetyManager } from './SafetyManager';
import { PresetManager, PresetDefinition } from '../presets';

export class Scanner {
    private presetManager: PresetManager;

    constructor() {
        this.presetManager = new PresetManager();
    }
    /**
     * Scan directories for files and folders matching the given patterns
     */
    async scan(rootPaths: string[], options: ScannerOptions): Promise<ScanResult[]> {
        const results: ScanResult[] = [];

        // Validate scan safety before proceeding
        const safetyCheck = SafetyManager.validateScanSafety(rootPaths, options.patterns);
        if (!safetyCheck.safe) {
            throw new Error(`Unsafe scan detected. Blocked paths: ${safetyCheck.blockedPaths.join(', ')}`);
        }

        // Add system exclude patterns to user-provided excludes
        const systemExcludes = SafetyManager.getSystemExcludePatterns();
        const allExcludePatterns = [...options.excludePatterns, ...systemExcludes];

        for (const rootPath of rootPaths) {
            // Skip system-protected paths
            if (SafetyManager.isSystemPath(rootPath)) {
                continue;
            }
            try {
                // Ensure root path exists and is accessible
                const rootStat = await fs.stat(rootPath);
                if (!rootStat.isDirectory()) {
                    continue;
                }

                // Build glob patterns with root path
                const fullPatterns = options.patterns.map(pattern =>
                    path.join(rootPath, pattern)
                );

                // Configure fast-glob options
                const globOptions = {
                    dot: true, // Include hidden files/directories
                    followSymbolicLinks: options.followSymlinks,
                    deep: options.maxDepth || 10,
                    onlyFiles: false, // Include both files and directories
                    markDirectories: true,
                    ignore: allExcludePatterns.map(pattern =>
                        path.join(rootPath, pattern)
                    ),
                    suppressErrors: true, // Continue on permission errors
                };

                // Scan for matching paths
                const matchedPaths = await glob(fullPatterns, globOptions);

                // Process each matched path
                for (const matchedPath of matchedPaths) {
                    try {
                        // Normalize path by removing trailing slash
                        const normalizedPath = matchedPath.replace(/\/$/, '');
                        const scanResult = await this.createScanResult(normalizedPath, options.minSize);
                        if (scanResult) {
                            results.push(scanResult);
                        }
                    } catch (error) {
                        // Skip files that can't be accessed (permission errors, etc.)
                        continue;
                    }
                }
            } catch (error) {
                // Skip root paths that can't be accessed
                continue;
            }
        }

        return results;
    }

    /**
     * Create a ScanResult from a file path
     */
    private async createScanResult(filePath: string, minSize?: number): Promise<ScanResult | null> {
        try {
            const stat = await fs.stat(filePath);
            const isDirectory = stat.isDirectory();

            // Calculate size
            const size = isDirectory ? await this.calculateDirectorySize(filePath) : stat.size;

            // Skip if below minimum size threshold
            if (minSize && size < minSize) {
                return null;
            }

            return {
                path: filePath,
                size,
                type: isDirectory ? 'directory' : 'file',
                lastModified: stat.mtime,
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Calculate the total size of a directory recursively
     */
    async calculateSize(targetPath: string): Promise<number> {
        try {
            const stat = await fs.stat(targetPath);

            if (stat.isFile()) {
                return stat.size;
            } else if (stat.isDirectory()) {
                return await this.calculateDirectorySize(targetPath);
            }

            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Calculate directory size by recursively summing all files
     */
    private async calculateDirectorySize(dirPath: string): Promise<number> {
        let totalSize = 0;

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            const sizePromises = entries.map(async (entry) => {
                const fullPath = path.join(dirPath, entry.name);

                try {
                    if (entry.isFile()) {
                        const stat = await fs.stat(fullPath);
                        return stat.size;
                    } else if (entry.isDirectory()) {
                        return await this.calculateDirectorySize(fullPath);
                    }
                    return 0;
                } catch (error) {
                    // Skip files/directories that can't be accessed
                    return 0;
                }
            });

            const sizes = await Promise.all(sizePromises);
            totalSize = sizes.reduce((sum, size) => sum + size, 0);
        } catch (error) {
            // Return 0 if directory can't be read
            return 0;
        }

        return totalSize;
    }

    /**
     * Check if a path is a system-protected path
     */
    async isSystemPath(targetPath: string): Promise<boolean> {
        return SafetyManager.isSystemPath(targetPath);
    }

    /**
     * Scan using a preset
     */
    async scanWithPreset(rootPaths: string[], presetName: string, devMode: boolean = false): Promise<ScanResult[]> {
        const preset = this.presetManager.getPreset(presetName);
        if (!preset) {
            throw new Error(`Preset '${presetName}' not found`);
        }

        if (preset.devModeOnly && !devMode) {
            throw new Error(`Preset '${presetName}' is only available in developer mode`);
        }

        const options: ScannerOptions = {
            patterns: preset.patterns,
            excludePatterns: preset.excludePatterns || [],
            followSymlinks: false,
        };

        const results = await this.scan(rootPaths, options);

        // Tag results with preset information
        return results.map(result => ({
            ...result,
            preset: presetName,
        }));
    }

    /**
     * Get available presets
     */
    getPresets(devMode: boolean = false): PresetDefinition[] {
        return this.presetManager.listPresets(devMode);
    }

    /**
     * Get preset by name
     */
    getPreset(name: string): PresetDefinition | undefined {
        return this.presetManager.getPreset(name);
    }

    /**
     * Get preset suggestions for a project
     */
    getPresetSuggestions(projectPath: string): PresetDefinition[] {
        return this.presetManager.getProjectSuggestions(projectPath);
    }

    /**
     * Get common cleanup patterns for different ecosystems
     */
    static getCommonPatterns(): Record<string, string[]> {
        return {
            node: [
                'node_modules',
                '.next',
                '.nuxt',
                'dist',
                'build',
                '.cache',
                '.npm',
                '.yarn/cache',
                '.pnpm-store',
            ],
            python: [
                '__pycache__',
                '*.pyc',
                '.pytest_cache',
                '.coverage',
                '.tox',
                'venv',
                '.venv',
                'env',
                '.env',
                'site-packages',
            ],
            java: [
                'target',
                '.gradle',
                'build',
                '*.class',
                '.m2/repository',
            ],
            rust: [
                'target',
                'Cargo.lock',
            ],
            general: [
                '.DS_Store',
                'Thumbs.db',
                '*.tmp',
                '*.temp',
                '*.log',
                '.git/objects',
                '.svn',
            ],
        };
    }
}