import { PresetDefinition } from './types';

export class PresetManager {
    private presets: Map<string, PresetDefinition> = new Map();

    constructor() {
        this.loadBuiltInPresets();
    }

    /**
     * Register a new preset
     */
    registerPreset(preset: PresetDefinition): void {
        this.presets.set(preset.name, preset);
    }

    /**
     * Get a preset by name
     */
    getPreset(name: string): PresetDefinition | undefined {
        return this.presets.get(name);
    }

    /**
     * List all available presets, optionally filtered by dev mode
     */
    listPresets(devMode: boolean = false): PresetDefinition[] {
        const allPresets = Array.from(this.presets.values());

        if (!devMode) {
            // Filter out dev-mode-only presets
            return allPresets.filter(preset => !preset.devModeOnly);
        }

        return allPresets;
    }

    /**
     * Get presets by category
     */
    getPresetsByCategory(category: string, devMode: boolean = false): PresetDefinition[] {
        return this.listPresets(devMode).filter(preset => preset.category === category);
    }

    /**
     * Load plugin presets from a file or module
     */
    async loadPluginPresets(pluginPath: string): Promise<void> {
        try {
            // This would be implemented to load external presets
            // For now, just a placeholder
            console.log(`Loading presets from ${pluginPath}`);
        } catch (error) {
            console.error(`Failed to load presets from ${pluginPath}:`, error);
        }
    }

    /**
     * Load all built-in presets
     */
    private loadBuiltInPresets(): void {
        // Node.js ecosystem presets
        this.registerPreset({
            name: 'node',
            description: 'Clean Node.js project artifacts',
            category: 'development',
            icon: '📦',
            patterns: [
                'node_modules',
                '.next',
                '.nuxt',
                'dist',
                'build',
                '.cache',
                '.npm',
                '.yarn/cache',
                '.pnpm-store',
                'coverage',
                '.nyc_output',
            ],
            excludePatterns: [
                'node_modules/.bin',
            ],
            systemSafe: true,
        });

        this.registerPreset({
            name: 'node-modules',
            description: 'Clean only node_modules directories',
            category: 'development',
            icon: '📦',
            patterns: ['node_modules'],
            systemSafe: true,
        });

        // Python ecosystem presets
        this.registerPreset({
            name: 'python',
            description: 'Clean Python project artifacts',
            category: 'development',
            icon: '🐍',
            patterns: [
                '__pycache__',
                '*.pyc',
                '*.pyo',
                '*.pyd',
                '.pytest_cache',
                '.coverage',
                '.tox',
                'venv',
                '.venv',
                'env',
                '.env',
                'site-packages',
                '.mypy_cache',
                'htmlcov',
                'dist',
                'build',
                '*.egg-info',
            ],
            systemSafe: true,
        });

        // Java ecosystem presets
        this.registerPreset({
            name: 'java',
            description: 'Clean Java project artifacts',
            category: 'development',
            icon: '☕',
            patterns: [
                'target',
                '.gradle',
                'build',
                '*.class',
                '.m2/repository',
                'bin',
                'out',
                '.idea/workspace.xml',
                '.idea/tasks.xml',
            ],
            systemSafe: true,
        });

        // Rust ecosystem presets
        this.registerPreset({
            name: 'rust',
            description: 'Clean Rust project artifacts',
            category: 'development',
            icon: '🦀',
            patterns: [
                'target',
                'Cargo.lock',
            ],
            excludePatterns: [
                'target/release',
            ],
            systemSafe: true,
        });

        // General system cleanup
        this.registerPreset({
            name: 'system',
            description: 'Clean general system artifacts',
            category: 'system',
            icon: '🧹',
            patterns: [
                '.DS_Store',
                'Thumbs.db',
                '*.tmp',
                '*.temp',
                '*.log',
                '.Trash-*',
                'desktop.ini',
                'ehthumbs.db',
            ],
            systemSafe: true,
        });

        // Browser caches
        this.registerPreset({
            name: 'browser',
            description: 'Clean browser caches and temporary files',
            category: 'system',
            icon: '🌐',
            patterns: [
                'Library/Caches/Google/Chrome',
                'Library/Caches/com.apple.Safari',
                'AppData/Local/Google/Chrome/User Data/Default/Cache',
                'AppData/Local/Microsoft/Edge/User Data/Default/Cache',
                '.cache/mozilla',
                '.mozilla/firefox/*/Cache',
            ],
            systemSafe: true,
        });

        // Development mode presets (broader patterns)
        this.registerPreset({
            name: 'dev-all',
            description: 'Comprehensive development cleanup (Dev Mode)',
            category: 'development',
            icon: '🔧',
            devModeOnly: true,
            patterns: [
                'node_modules',
                '__pycache__',
                'target',
                '.gradle',
                'build',
                'dist',
                '.next',
                '.nuxt',
                '.cache',
                'coverage',
                '.pytest_cache',
                '.tox',
                'venv',
                '.venv',
                '*.pyc',
                '*.class',
                '.DS_Store',
                'Thumbs.db',
                '*.tmp',
                '*.log',
            ],
            systemSafe: true,
        });

        this.registerPreset({
            name: 'dev-caches',
            description: 'Clean development tool caches (Dev Mode)',
            category: 'development',
            icon: '💾',
            devModeOnly: true,
            patterns: [
                '.npm',
                '.yarn/cache',
                '.pnpm-store',
                '.cache',
                '.gradle/caches',
                '.m2/repository',
                '.cargo/registry',
                '.rustup/toolchains/*/lib/rustlib/*/lib',
                'Library/Caches/pip',
                'AppData/Local/pip/Cache',
                '.cache/pip',
            ],
            systemSafe: true,
        });

        // Big files preset
        this.registerPreset({
            name: 'big-files',
            description: 'Find large files (>10MB)',
            category: 'analysis',
            icon: '📊',
            patterns: ['**/*'],
            systemSafe: true,
            // This would be handled specially by the scanner with size filtering
        });

        // Log files preset
        this.registerPreset({
            name: 'logs',
            description: 'Clean log files',
            category: 'system',
            icon: '📝',
            patterns: [
                '*.log',
                '*.log.*',
                'logs',
                'log',
                '.log',
                'npm-debug.log*',
                'yarn-debug.log*',
                'yarn-error.log*',
            ],
            systemSafe: true,
        });
    }

    /**
     * Get preset suggestions based on detected project types
     */
    getProjectSuggestions(projectPath: string): PresetDefinition[] {
        const suggestions: PresetDefinition[] = [];

        // This would analyze the project directory to detect project types
        // For now, return some common suggestions
        const commonPresets = ['node', 'python', 'java', 'rust', 'system'];

        for (const presetName of commonPresets) {
            const preset = this.getPreset(presetName);
            if (preset) {
                suggestions.push(preset);
            }
        }

        return suggestions;
    }

    /**
     * Validate that a preset is safe to use
     */
    validatePreset(preset: PresetDefinition): { valid: boolean; warnings: string[] } {
        const warnings: string[] = [];

        if (!preset.systemSafe) {
            warnings.push('This preset may affect system files');
        }

        if (preset.devModeOnly) {
            warnings.push('This preset is only available in developer mode');
        }

        // Check for overly broad patterns
        const dangerousPatterns = ['*', '**', '**/*'];
        for (const pattern of preset.patterns) {
            if (dangerousPatterns.includes(pattern)) {
                warnings.push(`Broad pattern detected: ${pattern}`);
            }
        }

        return {
            valid: preset.systemSafe,
            warnings,
        };
    }
}