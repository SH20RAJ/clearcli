#!/usr/bin/env node

/**
 * Example usage of the Scanner engine
 * This demonstrates the core functionality implemented in task 2
 */

import { Scanner } from './Scanner';
import { SafetyManager } from './SafetyManager';

async function main() {
    const scanner = new Scanner();

    console.log('🔍 Scanner Engine Demo\n');

    // Show available presets
    console.log('📋 Available Presets:');
    const presets = scanner.getPresets();
    presets.forEach(preset => {
        console.log(`  ${preset.icon || '📦'} ${preset.name}: ${preset.description}`);
    });

    console.log('\n🔧 Dev Mode Presets:');
    const devPresets = scanner.getPresets(true).filter(p => p.devModeOnly);
    devPresets.forEach(preset => {
        console.log(`  ${preset.icon || '🔧'} ${preset.name}: ${preset.description}`);
    });

    // Show safety features
    console.log('\n🛡️  Safety Features:');
    console.log('  ✓ System path protection');
    console.log('  ✓ Critical directory warnings');
    console.log('  ✓ Built-in exclude patterns');

    // Show safe default paths
    const safePaths = SafetyManager.getSafeDefaultPaths();
    console.log('\n🏠 Safe Default Scan Paths:');
    safePaths.forEach(path => {
        console.log(`  📁 ${path}`);
    });

    // Example scan (commented out to avoid actual scanning)
    /*
    console.log('\n🔍 Example Scan (node preset):');
    try {
      const results = await scanner.scanWithPreset([process.cwd()], 'node');
      console.log(`Found ${results.length} items to clean`);
      results.slice(0, 5).forEach(result => {
        console.log(`  📦 ${result.path} (${result.size} bytes)`);
      });
    } catch (error) {
      console.log(`  ⚠️  ${error.message}`);
    }
    */

    console.log('\n✅ Scanner engine ready for use!');
}

if (require.main === module) {
    main().catch(console.error);
}