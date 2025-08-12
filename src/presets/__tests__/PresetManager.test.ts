import { PresetManager } from '../PresetManager';
import { PresetDefinition } from '../types';

describe('PresetManager', () => {
    let presetManager: PresetManager;

    beforeEach(() => {
        presetManager = new PresetManager();
    });

    describe('registerPreset', () => {
        it('should register a new preset', () => {
            const customPreset: PresetDefinition = {
                name: 'custom',
                description: 'Custom test preset',
                patterns: ['*.test'],
                systemSafe: true,
            };

            presetManager.registerPreset(customPreset);
            const retrieved = presetManager.getPreset('custom');

            expect(retrieved).toEqual(customPreset);
        });
    });

    describe('getPreset', () => {
        it('should return undefined for non-existent preset', () => {
            const preset = presetManager.getPreset('non-existent');
            expect(preset).toBeUndefined();
        });

        it('should return built-in presets', () => {
            const nodePreset = presetManager.getPreset('node');
            expect(nodePreset).toBeDefined();
            expect(nodePreset?.name).toBe('node');
            expect(nodePreset?.patterns).toContain('node_modules');
        });
    });

    describe('listPresets', () => {
        it('should return all presets in normal mode', () => {
            const presets = presetManager.listPresets(false);

            expect(presets.length).toBeGreaterThan(0);
            expect(presets.some(p => p.name === 'node')).toBe(true);
            expect(presets.some(p => p.name === 'python')).toBe(true);

            // Should not include dev-mode-only presets
            expect(presets.some(p => p.devModeOnly)).toBe(false);
        });

        it('should include dev-mode presets when devMode is true', () => {
            const presets = presetManager.listPresets(true);

            expect(presets.length).toBeGreaterThan(0);
            expect(presets.some(p => p.devModeOnly)).toBe(true);
            expect(presets.some(p => p.name === 'dev-all')).toBe(true);
        });
    });

    describe('getPresetsByCategory', () => {
        it('should return presets filtered by category', () => {
            const devPresets = presetManager.getPresetsByCategory('development');

            expect(devPresets.length).toBeGreaterThan(0);
            expect(devPresets.every(p => p.category === 'development')).toBe(true);
            expect(devPresets.some(p => p.name === 'node')).toBe(true);
        });

        it('should return empty array for non-existent category', () => {
            const presets = presetManager.getPresetsByCategory('non-existent');
            expect(presets).toHaveLength(0);
        });
    });

    describe('built-in presets', () => {
        it('should have node preset with correct patterns', () => {
            const nodePreset = presetManager.getPreset('node');

            expect(nodePreset).toBeDefined();
            expect(nodePreset?.patterns).toContain('node_modules');
            expect(nodePreset?.patterns).toContain('.next');
            expect(nodePreset?.patterns).toContain('dist');
            expect(nodePreset?.systemSafe).toBe(true);
        });

        it('should have python preset with correct patterns', () => {
            const pythonPreset = presetManager.getPreset('python');

            expect(pythonPreset).toBeDefined();
            expect(pythonPreset?.patterns).toContain('__pycache__');
            expect(pythonPreset?.patterns).toContain('*.pyc');
            expect(pythonPreset?.patterns).toContain('.pytest_cache');
            expect(pythonPreset?.systemSafe).toBe(true);
        });

        it('should have java preset with correct patterns', () => {
            const javaPreset = presetManager.getPreset('java');

            expect(javaPreset).toBeDefined();
            expect(javaPreset?.patterns).toContain('target');
            expect(javaPreset?.patterns).toContain('.gradle');
            expect(javaPreset?.patterns).toContain('*.class');
            expect(javaPreset?.systemSafe).toBe(true);
        });

        it('should have rust preset with correct patterns', () => {
            const rustPreset = presetManager.getPreset('rust');

            expect(rustPreset).toBeDefined();
            expect(rustPreset?.patterns).toContain('target');
            expect(rustPreset?.patterns).toContain('Cargo.lock');
            expect(rustPreset?.systemSafe).toBe(true);
        });

        it('should have system preset for general cleanup', () => {
            const systemPreset = presetManager.getPreset('system');

            expect(systemPreset).toBeDefined();
            expect(systemPreset?.patterns).toContain('.DS_Store');
            expect(systemPreset?.patterns).toContain('Thumbs.db');
            expect(systemPreset?.patterns).toContain('*.tmp');
            expect(systemPreset?.systemSafe).toBe(true);
        });

        it('should have dev-mode-only presets', () => {
            const devAllPreset = presetManager.getPreset('dev-all');

            expect(devAllPreset).toBeDefined();
            expect(devAllPreset?.devModeOnly).toBe(true);
            expect(devAllPreset?.patterns.length).toBeGreaterThan(10);
        });
    });

    describe('getProjectSuggestions', () => {
        it('should return common preset suggestions', () => {
            const suggestions = presetManager.getProjectSuggestions('/some/project');

            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.some(p => p.name === 'node')).toBe(true);
            expect(suggestions.some(p => p.name === 'system')).toBe(true);
        });
    });

    describe('validatePreset', () => {
        it('should validate safe presets', () => {
            const nodePreset = presetManager.getPreset('node')!;
            const validation = presetManager.validatePreset(nodePreset);

            expect(validation.valid).toBe(true);
            expect(validation.warnings).toHaveLength(0);
        });

        it('should warn about dev-mode-only presets', () => {
            const devPreset = presetManager.getPreset('dev-all')!;
            const validation = presetManager.validatePreset(devPreset);

            expect(validation.warnings.some(w => w.includes('developer mode'))).toBe(true);
        });

        it('should warn about broad patterns', () => {
            const broadPreset: PresetDefinition = {
                name: 'broad',
                description: 'Broad pattern test',
                patterns: ['*', '**'],
                systemSafe: true,
            };

            const validation = presetManager.validatePreset(broadPreset);

            expect(validation.warnings.some(w => w.includes('Broad pattern'))).toBe(true);
        });
    });
});