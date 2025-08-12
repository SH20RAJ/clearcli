#!/usr/bin/env node

/**
 * Example script demonstrating the SafetyManager confirmation flows
 * This shows how to integrate the confirmation system with a CLI or UI
 */

import { SafetyManager, ConfirmationPrompt, ConfirmationResult } from './index';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

async function createTestFiles(): Promise<string[]> {
    const testDir = join(tmpdir(), `cleancli-demo-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    const files = [
        join(testDir, 'temp-file-1.txt'),
        join(testDir, 'temp-file-2.txt'),
        join(testDir, 'large-cache.tmp')
    ];

    await fs.writeFile(files[0], 'This is a temporary file');
    await fs.writeFile(files[1], 'Another temporary file');
    await fs.writeFile(files[2], 'x'.repeat(1024 * 100)); // 100KB file

    console.log(`Created test files in: ${testDir}`);
    return files;
}

async function simpleConfirmationCallback(prompt: ConfirmationPrompt): Promise<ConfirmationResult> {
    console.log('\n=== DELETION CONFIRMATION ===');
    console.log(prompt.message);

    if (prompt.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        prompt.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    console.log('\n📁 Items to delete:');
    prompt.details.forEach(detail => console.log(`  ${detail}`));

    console.log(`\n📊 Total size: ${formatBytes(prompt.totalSize)}`);
    console.log(`🗑️  Method: ${prompt.method}`);

    // In a real CLI, you would prompt the user for input
    // For this demo, we'll automatically confirm
    console.log('\n✅ Auto-confirming for demo...');

    return { confirmed: true };
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function demonstrateConfirmationFlows() {
    console.log('🧹 SafetyManager Confirmation Flow Demo\n');

    const safetyManager = new SafetyManager();
    const testFiles = await createTestFiles();

    try {
        // Demo 1: Dry run mode
        console.log('📋 Demo 1: Dry Run Mode');
        console.log('='.repeat(50));

        const dryRunResult = await safetyManager.safeDelete(testFiles, {
            dryRun: true,
            useTrash: false
        });

        console.log(`Dry run completed: ${dryRunResult.success ? '✅' : '❌'}`);
        console.log(`Would delete ${dryRunResult.processedPaths.length} items`);
        console.log(`Would free ${formatBytes(dryRunResult.totalSize)}`);

        // Demo 2: Interactive confirmation
        console.log('\n📋 Demo 2: Interactive Confirmation');
        console.log('='.repeat(50));

        const interactiveResult = await safetyManager.safeDeleteWithConfirmation(
            testFiles,
            {
                interactive: true,
                useTrash: false
            },
            simpleConfirmationCallback
        );

        console.log(`\nInteractive deletion: ${interactiveResult.success ? '✅' : '❌'}`);
        console.log(`Processed ${interactiveResult.processedPaths.length} items`);
        console.log(`Freed ${formatBytes(interactiveResult.totalSize)}`);

        if (interactiveResult.errors.length > 0) {
            console.log('❌ Errors:');
            interactiveResult.errors.forEach(error => console.log(`  • ${error}`));
        }

        // Demo 3: Show quarantine contents
        console.log('\n📋 Demo 3: Quarantine Contents');
        console.log('='.repeat(50));

        const quarantined = await safetyManager.listQuarantine();
        console.log(`Found ${quarantined.length} items in quarantine`);

        if (quarantined.length > 0) {
            const lastItem = quarantined[quarantined.length - 1];
            console.log(`\nMost recent: ${lastItem.originalPath}`);
            console.log(`Quarantined at: ${lastItem.movedAt}`);
            console.log(`Size: ${formatBytes(lastItem.size)}`);

            // Demo restore
            console.log('\n🔄 Restoring last item...');
            const restored = await safetyManager.restore(lastItem.id);
            console.log(`Restore result: ${restored ? '✅' : '❌'}`);
        }

    } catch (error) {
        console.error('❌ Demo failed:', error);
    }

    console.log('\n🎉 Demo completed!');
}

// Run the demo if this file is executed directly
if (require.main === module) {
    demonstrateConfirmationFlows().catch(console.error);
}

export { demonstrateConfirmationFlows, simpleConfirmationCallback };