import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { Scanner } from '../Scanner';

describe('Scanner', () => {
    let tempDir: string;
    let scanner: Scanner;

    beforeEach(async () => {
        // Create a temporary directory for testing
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scanner-test-'));
        scanner = new Scanner();
    });

    afterEach(async () => {
        // Clean up temporary directory
        await fs.remove(tempDir);
    });

    describe('scan', () => {
        it('should find node_modules directories', async () => {
            // Create test structure
            const nodeModulesPath = path.join(tempDir, 'node_modules');
            await fs.ensureDir(nodeModulesPath);
            await fs.writeFile(path.join(nodeModulesPath, 'package.json'), '{}');

            const results = await scanner.scan([tempDir], {
                patterns: ['node_modules'],
                excludePatterns: [],
                followSymlinks: false,
            });

            expect(results).toHaveLength(1);
            expect(results[0].path).toBe(nodeModulesPath);
            expect(results[0].type).toBe('directory');
            expect(results[0].size).toBeGreaterThan(0);
        });

        it('should find files matching patterns', async () => {
            // Create test files
            const logFile = path.join(tempDir, 'test.log');
            await fs.writeFile(logFile, 'test log content');

            const results = await scanner.scan([tempDir], {
                patterns: ['*.log'],
                excludePatterns: [],
                followSymlinks: false,
            });

            expect(results).toHaveLength(1);
            expect(results[0].path).toBe(logFile);
            expect(results[0].type).toBe('file');
        });

        it('should exclude patterns correctly', async () => {
            // Create test structure
            await fs.ensureDir(path.join(tempDir, 'node_modules'));
            await fs.ensureDir(path.join(tempDir, 'src'));

            const results = await scanner.scan([tempDir], {
                patterns: ['*'],
                excludePatterns: ['src'],
                followSymlinks: false,
            });

            const srcResults = results.filter(r => r.path.includes('src'));
            expect(srcResults).toHaveLength(0);
        });

        it('should respect minimum size filter', async () => {
            // Create small and large files
            const smallFile = path.join(tempDir, 'small.txt');
            const largeFile = path.join(tempDir, 'large.txt');

            await fs.writeFile(smallFile, 'small');
            await fs.writeFile(largeFile, 'x'.repeat(1000));

            const results = await scanner.scan([tempDir], {
                patterns: ['*.txt'],
                excludePatterns: [],
                followSymlinks: false,
                minSize: 100,
            });

            expect(results).toHaveLength(1);
            expect(results[0].path).toBe(largeFile);
        });
    });

    describe('calculateSize', () => {
        it('should calculate file size correctly', async () => {
            const testFile = path.join(tempDir, 'test.txt');
            const content = 'test content';
            await fs.writeFile(testFile, content);

            const size = await scanner.calculateSize(testFile);
            expect(size).toBe(content.length);
        });

        it('should calculate directory size recursively', async () => {
            // Create nested directory structure
            const subDir = path.join(tempDir, 'subdir');
            await fs.ensureDir(subDir);

            await fs.writeFile(path.join(tempDir, 'file1.txt'), 'content1');
            await fs.writeFile(path.join(subDir, 'file2.txt'), 'content2');

            const size = await scanner.calculateSize(tempDir);
            expect(size).toBe('content1'.length + 'content2'.length);
        });
    });

    describe('isSystemPath', () => {
        it('should identify system paths', async () => {
            const platform = os.platform();

            if (platform === 'darwin') {
                expect(await scanner.isSystemPath('/System')).toBe(true);
                expect(await scanner.isSystemPath('/Users/test')).toBe(false);
            } else if (platform === 'win32') {
                expect(await scanner.isSystemPath('C:\\Windows')).toBe(true);
                expect(await scanner.isSystemPath('C:\\Users\\test')).toBe(false);
            } else if (platform === 'linux') {
                expect(await scanner.isSystemPath('/usr')).toBe(true);
                expect(await scanner.isSystemPath('/home/test')).toBe(false);
            }
        });
    });

    describe('safety integration', () => {
        it('should throw error when scanning system paths', async () => {
            const platform = os.platform();
            let systemPath = '/usr';

            if (platform === 'win32') {
                systemPath = 'C:\\Windows';
            } else if (platform === 'darwin') {
                systemPath = '/System';
            }

            await expect(scanner.scan([systemPath], {
                patterns: ['*'],
                excludePatterns: [],
                followSymlinks: false,
            })).rejects.toThrow('Unsafe scan detected');
        });

        it('should apply system exclude patterns', async () => {
            // Create a .git/objects directory that should be excluded
            const gitObjectsPath = path.join(tempDir, '.git', 'objects');
            await fs.ensureDir(gitObjectsPath);
            await fs.writeFile(path.join(gitObjectsPath, 'test'), 'content');

            const results = await scanner.scan([tempDir], {
                patterns: ['**/*'],
                excludePatterns: [],
                followSymlinks: false,
            });

            // Should not find files in .git/objects due to system excludes
            const gitObjectResults = results.filter(r => r.path.includes('.git/objects'));
            expect(gitObjectResults).toHaveLength(0);
        });
    });

    describe('preset functionality', () => {
        it('should scan with preset', async () => {
            // Create test structure for node preset
            const nodeModulesPath = path.join(tempDir, 'node_modules');
            const distPath = path.join(tempDir, 'dist');
            await fs.ensureDir(nodeModulesPath);
            await fs.ensureDir(distPath);
            await fs.writeFile(path.join(nodeModulesPath, 'package.json'), '{}');
            await fs.writeFile(path.join(distPath, 'index.js'), 'console.log("test");');

            const results = await scanner.scanWithPreset([tempDir], 'node');

            expect(results.length).toBeGreaterThan(0);
            expect(results.some(r => r.path === nodeModulesPath)).toBe(true);
            expect(results.some(r => r.path === distPath)).toBe(true);
            expect(results.every(r => r.preset === 'node')).toBe(true);
        });

        it('should throw error for non-existent preset', async () => {
            await expect(scanner.scanWithPreset([tempDir], 'non-existent'))
                .rejects.toThrow("Preset 'non-existent' not found");
        });

        it('should throw error for dev-mode preset in normal mode', async () => {
            await expect(scanner.scanWithPreset([tempDir], 'dev-all', false))
                .rejects.toThrow("Preset 'dev-all' is only available in developer mode");
        });

        it('should allow dev-mode preset in dev mode', async () => {
            // Create test structure
            const nodeModulesPath = path.join(tempDir, 'node_modules');
            await fs.ensureDir(nodeModulesPath);
            await fs.writeFile(path.join(nodeModulesPath, 'package.json'), '{}');

            const results = await scanner.scanWithPreset([tempDir], 'dev-all', true);

            expect(results.some(r => r.path === nodeModulesPath)).toBe(true);
            expect(results.every(r => r.preset === 'dev-all')).toBe(true);
        });

        it('should get available presets', () => {
            const presets = scanner.getPresets();

            expect(presets.length).toBeGreaterThan(0);
            expect(presets.some(p => p.name === 'node')).toBe(true);
            expect(presets.some(p => p.devModeOnly)).toBe(false);
        });

        it('should get dev-mode presets', () => {
            const presets = scanner.getPresets(true);

            expect(presets.some(p => p.devModeOnly)).toBe(true);
            expect(presets.some(p => p.name === 'dev-all')).toBe(true);
        });

        it('should get preset by name', () => {
            const nodePreset = scanner.getPreset('node');

            expect(nodePreset).toBeDefined();
            expect(nodePreset?.name).toBe('node');
            expect(nodePreset?.patterns).toContain('node_modules');
        });

        it('should get preset suggestions', () => {
            const suggestions = scanner.getPresetSuggestions(tempDir);

            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.some(p => p.name === 'node')).toBe(true);
        });
    });

    describe('getCommonPatterns', () => {
        it('should return predefined patterns for different ecosystems', () => {
            const patterns = Scanner.getCommonPatterns();

            expect(patterns.node).toContain('node_modules');
            expect(patterns.python).toContain('__pycache__');
            expect(patterns.java).toContain('target');
            expect(patterns.rust).toContain('target');
            expect(patterns.general).toContain('.DS_Store');
        });
    });
});