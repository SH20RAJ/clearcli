import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TrashManager } from '../TrashManager';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('TrashManager', () => {
    let trashManager: TrashManager;
    let testDir: string;
    let testFile: string;

    beforeEach(async () => {
        trashManager = new TrashManager();

        // Create a temporary test directory and file
        testDir = join(tmpdir(), `cleancli-test-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });

        testFile = join(testDir, 'test-file.txt');
        await fs.writeFile(testFile, 'test content');
    });

    afterEach(async () => {
        // Clean up test directory if it still exists
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    it('should be supported on current platform', () => {
        const supported = trashManager.isSupported();
        expect(typeof supported).toBe('boolean');

        // Should be supported on major platforms
        if (['darwin', 'win32', 'linux'].includes(process.platform)) {
            expect(supported).toBe(true);
        }
    });

    it('should return correct platform', () => {
        const platform = trashManager.getPlatform();
        expect(platform).toBe(process.platform);
    });

    it('should handle empty paths array', async () => {
        const result = await trashManager.moveToTrash([]);
        expect(result).toBe(true);
    });

    it('should get trash size without errors', async () => {
        const size = await trashManager.getTrashSize();
        expect(typeof size).toBe('number');
        expect(size).toBeGreaterThanOrEqual(0);
    });

    // Platform-specific tests would require actual platform environments
    // These are integration tests that should be run on each platform

    it('should handle non-existent files gracefully', async () => {
        const nonExistentFile = join(testDir, 'does-not-exist.txt');

        // This should not throw an error, but may return false
        const result = await trashManager.moveToTrash([nonExistentFile]);
        expect(typeof result).toBe('boolean');
    });

    it('should create provider for current platform', () => {
        // Test that the manager creates without throwing
        expect(() => new TrashManager()).not.toThrow();
    });
});