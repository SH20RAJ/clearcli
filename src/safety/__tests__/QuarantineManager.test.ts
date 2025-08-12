import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { QuarantineManager } from '../QuarantineManager';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('QuarantineManager', () => {
    let quarantineManager: QuarantineManager;
    let testDir: string;
    let testFile: string;
    let testFile2: string;

    beforeEach(async () => {
        quarantineManager = new QuarantineManager();

        // Create a temporary test directory and files
        testDir = join(tmpdir(), `cleancli-quarantine-test-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });

        testFile = join(testDir, 'test-file.txt');
        testFile2 = join(testDir, 'test-file-2.txt');

        await fs.writeFile(testFile, 'test content');
        await fs.writeFile(testFile2, 'test content 2');
    });

    afterEach(async () => {
        // Clean up test directory and quarantine
        try {
            await fs.rm(testDir, { recursive: true, force: true });
            await quarantineManager.clearAll();
        } catch {
            // Ignore cleanup errors
        }
    });

    it('should quarantine files successfully', async () => {
        const entries = await quarantineManager.quarantine([testFile]);

        expect(entries).toHaveLength(1);
        expect(entries[0].originalPath).toBe(testFile);
        expect(entries[0].id).toBeDefined();
        expect(entries[0].size).toBeGreaterThan(0);
        expect(entries[0].metadata.type).toBe('file');

        // Original file should no longer exist
        await expect(fs.access(testFile)).rejects.toThrow();
    });

    it('should handle empty paths array', async () => {
        const entries = await quarantineManager.quarantine([]);
        expect(entries).toHaveLength(0);
    });

    it('should list quarantined items', async () => {
        await quarantineManager.quarantine([testFile, testFile2]);

        const list = await quarantineManager.listQuarantine();
        expect(list).toHaveLength(2);

        const originalPaths = list.map(entry => entry.originalPath);
        expect(originalPaths).toContain(testFile);
        expect(originalPaths).toContain(testFile2);
    });

    it('should restore quarantined items', async () => {
        const entries = await quarantineManager.quarantine([testFile]);
        const entryId = entries[0].id;

        // Restore the file
        const restored = await quarantineManager.restore(entryId);
        expect(restored).toBe(true);

        // File should exist at original location
        await expect(fs.access(testFile)).resolves.not.toThrow();

        // Should no longer be in quarantine list
        const list = await quarantineManager.listQuarantine();
        expect(list).toHaveLength(0);
    });

    it('should handle restore of non-existent entry', async () => {
        const restored = await quarantineManager.restore('non-existent-id');
        expect(restored).toBe(false);
    });

    it('should get specific entry by ID', async () => {
        const entries = await quarantineManager.quarantine([testFile]);
        const entryId = entries[0].id;

        const entry = await quarantineManager.getEntry(entryId);
        expect(entry).not.toBeNull();
        expect(entry?.id).toBe(entryId);
        expect(entry?.originalPath).toBe(testFile);
    });

    it('should return null for non-existent entry', async () => {
        const entry = await quarantineManager.getEntry('non-existent-id');
        expect(entry).toBeNull();
    });

    it('should calculate total size correctly', async () => {
        await quarantineManager.quarantine([testFile, testFile2]);

        const totalSize = await quarantineManager.getTotalSize();
        expect(totalSize).toBeGreaterThan(0);
    });

    it('should clear all quarantined items', async () => {
        await quarantineManager.quarantine([testFile, testFile2]);

        let list = await quarantineManager.listQuarantine();
        expect(list).toHaveLength(2);

        const clearedCount = await quarantineManager.clearAll();
        expect(clearedCount).toBe(2);

        list = await quarantineManager.listQuarantine();
        expect(list).toHaveLength(0);
    });

    it('should handle cleanup with retention policy', async () => {
        await quarantineManager.quarantine([testFile]);

        // Wait a moment to ensure time difference
        await new Promise(resolve => setTimeout(resolve, 10));

        // Cleanup with -1 days retention (should remove everything older than tomorrow)
        const cleanedCount = await quarantineManager.cleanup(-1);
        expect(cleanedCount).toBe(1);

        const list = await quarantineManager.listQuarantine();
        expect(list).toHaveLength(0);
    });

    it('should preserve metadata during quarantine', async () => {
        const entries = await quarantineManager.quarantine([testFile]);
        const entry = entries[0];

        expect(entry.metadata.type).toBe('file');
        expect(entry.metadata.permissions).toBeDefined();
        expect(entry.metadata.lastModified).toBeDefined();
        expect(entry.movedAt).toBeInstanceOf(Date);
    });
});