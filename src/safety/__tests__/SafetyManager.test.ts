import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SafetyManager } from '../SafetyManager';
import { ConfirmationPrompt, ConfirmationResult } from '../types';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SafetyManager', () => {
    let safetyManager: SafetyManager;
    let testDir: string;
    let testFile: string;
    let testFile2: string;

    beforeEach(async () => {
        // Create a temporary test directory and files
        testDir = join(tmpdir(), `cleancli-safety-test-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });

        safetyManager = new SafetyManager(testDir);

        testFile = join(testDir, 'test-file.txt');
        testFile2 = join(testDir, 'test-file-2.txt');

        await fs.writeFile(testFile, 'test content');
        await fs.writeFile(testFile2, 'test content 2');
    });

    afterEach(async () => {
        // Clean up test directory
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    it('should validate paths successfully', async () => {
        const result = await safetyManager.validatePaths([testFile, testFile2]);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
        expect(result.blockers).toHaveLength(0);
        expect(result.systemPaths).toHaveLength(0);
    });

    it('should detect non-existent paths', async () => {
        const nonExistentFile = join(testDir, 'does-not-exist.txt');
        const result = await safetyManager.validatePaths([nonExistentFile]);

        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('Path does not exist');
    });

    it('should detect system paths', async () => {
        // Test with a known system path (this will vary by platform)
        const systemPath = process.platform === 'win32' ? 'C:\\Windows' : '/usr';
        const result = await safetyManager.validatePaths([systemPath]);

        if (await safetyManager.isSystemPath(systemPath)) {
            expect(result.isValid).toBe(false);
            expect(result.systemPaths).toContain(systemPath);
            expect(result.blockers.length).toBeGreaterThan(0);
        }
    });

    it('should perform dry run deletion', async () => {
        const result = await safetyManager.safeDelete([testFile, testFile2], {
            dryRun: true
        });

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
        expect(result.processedPaths).toContain(testFile);
        expect(result.processedPaths).toContain(testFile2);
        expect(result.totalSize).toBeGreaterThan(0);

        // Files should still exist after dry run
        await expect(fs.access(testFile)).resolves.not.toThrow();
        await expect(fs.access(testFile2)).resolves.not.toThrow();
    });

    it('should perform actual deletion with quarantine', async () => {
        const result = await safetyManager.safeDelete([testFile], {
            useTrash: false // Force quarantine
        });

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(false);
        expect(result.method).toBe('quarantine');
        expect(result.processedPaths).toContain(testFile);

        // File should no longer exist at original location
        await expect(fs.access(testFile)).rejects.toThrow();
    });

    it('should list quarantined items', async () => {
        await safetyManager.safeDelete([testFile], { useTrash: false });

        const quarantined = await safetyManager.listQuarantine();
        expect(quarantined.length).toBeGreaterThan(0);

        const entry = quarantined.find(e => e.originalPath === testFile);
        expect(entry).toBeDefined();
    });

    it('should restore quarantined items', async () => {
        const result = await safetyManager.safeDelete([testFile], { useTrash: false });
        expect(result.success).toBe(true);

        const lastOp = await safetyManager.getLastOperation();
        expect(lastOp).not.toBeNull();

        if (lastOp) {
            const restored = await safetyManager.restore(lastOp.id);
            expect(restored).toBe(true);

            // File should exist again (possibly with modified name due to conflict resolution)
            const restoredExists = await fs.access(testFile).then(() => true).catch(() => false);
            expect(restoredExists).toBe(true);
        }
    });

    it('should get last operation', async () => {
        await safetyManager.safeDelete([testFile], { useTrash: false });

        const lastOp = await safetyManager.getLastOperation();
        expect(lastOp).not.toBeNull();
        expect(lastOp?.originalPath).toBe(testFile);
    });

    it('should handle empty paths array', async () => {
        const result = await safetyManager.safeDelete([]);

        expect(result.success).toBe(true); // Empty array is successfully processed
        expect(result.processedPaths).toHaveLength(0);
        expect(result.totalSize).toBe(0);
    });

    it('should calculate total size correctly', async () => {
        const result = await safetyManager.safeDelete([testFile, testFile2], {
            dryRun: true
        });

        expect(result.totalSize).toBeGreaterThan(0);
        // Should be sum of both files
        expect(result.totalSize).toBeGreaterThan(10); // Both files have content
    });

    it('should handle validation failures', async () => {
        // Create a mock system path scenario - use a real system path
        const systemPath = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/usr/bin';
        const result = await safetyManager.safeDelete([systemPath], {
            skipConfirmation: false
        });

        // Should fail due to validation or have no valid paths to process
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should skip confirmation when requested', async () => {
        const result = await safetyManager.safeDelete([testFile], {
            skipConfirmation: true,
            useTrash: false
        });

        expect(result.success).toBe(true);
        expect(result.processedPaths).toContain(testFile);
    });

    describe('Confirmation Flows', () => {
        it('should generate confirmation prompt correctly', async () => {
            const prompt = await safetyManager.generateConfirmationPrompt([testFile, testFile2]);

            expect(prompt.itemCount).toBe(2);
            expect(prompt.totalSize).toBeGreaterThan(0);
            expect(prompt.message).toContain('Delete 2 items');
            expect(prompt.details).toHaveLength(2);
            expect(prompt.details[0]).toContain(testFile);
            expect(prompt.details[1]).toContain(testFile2);
            expect(prompt.method).toBe('trash'); // Default should be trash if supported
        });

        it('should generate confirmation prompt for single file', async () => {
            const prompt = await safetyManager.generateConfirmationPrompt([testFile]);

            expect(prompt.itemCount).toBe(1);
            expect(prompt.message).toContain('Delete "test-file.txt"');
            expect(prompt.details).toHaveLength(1);
            expect(prompt.details[0]).toContain(testFile);
        });

        it('should handle empty paths in confirmation prompt', async () => {
            const prompt = await safetyManager.generateConfirmationPrompt([]);

            expect(prompt.itemCount).toBe(0);
            expect(prompt.message).toContain('No valid items to delete');
            expect(prompt.totalSize).toBe(0);
        });

        it('should show quarantine method when trash is disabled', async () => {
            const prompt = await safetyManager.generateConfirmationPrompt([testFile], {
                useTrash: false
            });

            expect(prompt.method).toBe('quarantine');
            expect(prompt.message).toContain('quarantined');
        });

        it('should include warnings in confirmation prompt', async () => {
            // Create a test file and mock the size calculation to simulate a large file
            const largeFile = join(testDir, 'large-file.txt');
            await fs.writeFile(largeFile, 'test content');

            // Mock the calculatePathSize method to return a large size
            const originalCalculatePathSize = (safetyManager as any).calculatePathSize;
            (safetyManager as any).calculatePathSize = async () => 1024 * 1024 * 1024 + 1; // > 1GB

            const prompt = await safetyManager.generateConfirmationPrompt([largeFile]);

            expect(prompt.warnings.length).toBeGreaterThan(0);
            expect(prompt.warnings.some(w => w.includes('1GB'))).toBe(true);

            // Restore original method
            (safetyManager as any).calculatePathSize = originalCalculatePathSize;

            // Clean up
            await fs.unlink(largeFile);
        });

        it('should perform deletion with user confirmation', async () => {
            const mockConfirmation = async (prompt: ConfirmationPrompt): Promise<ConfirmationResult> => {
                expect(prompt.itemCount).toBe(1);
                return { confirmed: true };
            };

            const result = await safetyManager.safeDeleteWithConfirmation(
                [testFile],
                { interactive: true, useTrash: false },
                mockConfirmation
            );

            expect(result.success).toBe(true);
            expect(result.processedPaths).toContain(testFile);
            expect(result.errors).not.toContain('Operation cancelled by user');

            // File should be deleted
            await expect(fs.access(testFile)).rejects.toThrow();
        });

        it('should cancel deletion when user declines confirmation', async () => {
            const mockConfirmation = async (prompt: ConfirmationPrompt): Promise<ConfirmationResult> => {
                return { confirmed: false };
            };

            const result = await safetyManager.safeDeleteWithConfirmation(
                [testFile],
                { interactive: true },
                mockConfirmation
            );

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Operation cancelled by user');

            // File should still exist
            await expect(fs.access(testFile)).resolves.not.toThrow();
        });

        it('should skip confirmation when skipConfirmation is true', async () => {
            const mockConfirmation = async (): Promise<ConfirmationResult> => {
                throw new Error('Confirmation should not be called');
            };

            const result = await safetyManager.safeDeleteWithConfirmation(
                [testFile],
                { interactive: true, skipConfirmation: true, useTrash: false },
                mockConfirmation
            );

            expect(result.success).toBe(true);
            expect(result.processedPaths).toContain(testFile);
        });

        it('should handle skipFuture option in confirmation', async () => {
            let confirmationCallCount = 0;
            const mockConfirmation = async (): Promise<ConfirmationResult> => {
                confirmationCallCount++;
                return { confirmed: true, skipFuture: true };
            };

            // Create shared options object that will be modified
            const options = { interactive: true, useTrash: false };

            // First call should trigger confirmation
            const result1 = await safetyManager.safeDeleteWithConfirmation(
                [testFile],
                options,
                mockConfirmation
            );

            expect(result1.success).toBe(true);
            expect(confirmationCallCount).toBe(1);

            // Create another test file
            const testFile3 = join(testDir, 'test-file-3.txt');
            await fs.writeFile(testFile3, 'test content 3');

            // Second call should not trigger confirmation due to skipFuture modifying options
            const result2 = await safetyManager.safeDeleteWithConfirmation(
                [testFile3],
                options, // Same options object, now with skipConfirmation: true
                mockConfirmation
            );

            expect(result2.success).toBe(true);
            expect(confirmationCallCount).toBe(1); // Should still be 1
        });

        it('should work without confirmation callback in non-interactive mode', async () => {
            const result = await safetyManager.safeDeleteWithConfirmation(
                [testFile2],
                { interactive: false, useTrash: false }
            );

            expect(result.success).toBe(true);
            expect(result.processedPaths).toContain(testFile2);
        });
    });

    describe('Detailed Validation', () => {
        it('should provide detailed validation results', async () => {
            const result = await safetyManager.validatePathsDetailed([testFile, testFile2]);

            expect(result.isValid).toBe(true);
            expect(result.criticalPaths).toBeDefined();
            expect(result.largePaths).toBeDefined();
            expect(result.activePaths).toBeDefined();
        });

        it('should detect critical paths in detailed validation', async () => {
            // Create a mock critical directory
            const criticalDir = join(testDir, 'node_modules');
            await fs.mkdir(criticalDir);

            const result = await safetyManager.validatePathsDetailed([criticalDir]);

            expect(result.criticalPaths).toContain(criticalDir);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });
});