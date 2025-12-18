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

    // Import Ink and React for terminal UI
    const { render, useInput, useApp } = await import('ink');
    const React = await import('react');
    const { App } = await import('./ui/index');

    // Create a wrapper component that handles keyboard input
    const AppWithKeyboard = React.createElement(() => {
        const { exit } = useApp();

        // Set up keyboard input handling
        useInput((input: string, key: any) => {
            // Handle special keys
            if (key.upArrow || input === 'k') {
                // Move focus up - will be handled by app state
                return;
            }
            if (key.downArrow || input === 'j') {
                // Move focus down - will be handled by app state
                return;
            }
            if (key.ctrl && input === 'c') {
                exit();
                return;
            }
            if (input === 'q') {
                exit();
                return;
            }
        });

        return React.createElement(App, {
            initialDevMode: argv['dev-mode'] || false,
            initialPreset: argv.preset || undefined
        });
    });

    // Render the terminal UI
    render(AppWithKeyboard);
}

if (require.main === module) {
    main().catch(console.error);
}

export { main };