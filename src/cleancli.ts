#!/usr/bin/env node

/**
 * cleancli - A fast, safe, cross-platform cleanup CLI with a beautiful terminal UI
 * 
 * Entry point for the application
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .scriptName('cleancli')
        .usage('$0 [options]')
        .option('preset', {
            alias: 'p',
            type: 'string',
            description: 'Run cleanup with specified preset'
        })
        .option('dry-run', {
            alias: 'd',
            type: 'boolean',
            description: 'Show what would be cleaned without executing'
        })
        .option('yes', {
            alias: 'y',
            type: 'boolean',
            description: 'Skip confirmation prompts'
        })
        .option('dev-mode', {
            type: 'boolean',
            description: 'Enable developer mode with advanced presets'
        })
        .help()
        .alias('help', 'h')
        .version()
        .alias('version', 'v')
        .parse();

    console.log('cleancli starting...');
    console.log('Options:', argv);

    // TODO: Initialize and start the application
    // This will be implemented in subsequent tasks
}

if (require.main === module) {
    main().catch(console.error);
}

export { main };