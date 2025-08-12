# cleancli

A fast, safe, cross-platform cleanup CLI with a beautiful terminal UI built with Node.js and Ink.

## Features

- Beautiful two-pane terminal UI with keyboard-first controls
- Smart preset-based cleanup with built-in safety rules
- Developer mode with advanced presets and shortcuts
- Big file detection and management
- Comprehensive quarantine and restore capabilities
- Cross-platform compatibility with native OS integration
- Flexible command-line options and scriptable modes
- Extensible plugin support and community presets

## Installation

```bash
npm install -g cleancli
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Usage

```bash
# Interactive mode
cleancli

# Run with preset
cleancli --preset node

# Dry run mode
cleancli --dry-run

# Developer mode
cleancli --dev-mode

# Skip confirmations
cleancli --yes
```

## Project Structure

```
src/
├── cleancli.ts      # CLI entry point
├── scanner/         # File system scanning engine
├── ui/              # Ink-based React components
├── safety/          # Trash integration and quarantine system
└── presets/         # Built-in cleanup patterns and preset management
```

## License

MIT