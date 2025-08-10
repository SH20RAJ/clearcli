# cleancli

**A fast, safe, cross-platform cleanup CLI with a beautiful terminal UI.**

> Not just for devs — *cleancli* ships a friendly default mode for non-technical users and an advanced **Dev Mode** that exposes developer-first presets and shortcuts (e.g. `node_modules`, `.next`, build caches).

## Quick Start

```bash
# Install dependencies
npm install

# Run interactive mode
node cleancli.js

# Or make executable (Unix)
chmod +x cleancli.js
./cleancli.js
```

## Features

- 🗑️ **Safe deletion** - Move to trash/quarantine by default, never permanent delete without explicit confirmation
- 🖥️ **Cross-platform** - Works on macOS, Linux, and Windows with native trash support
- ⚡ **Fast scanning** - Parallel directory traversal with smart filtering
- 🎯 **Smart presets** - Built-in cleanup rules for Node.js, Python, Java, Rust, and more
- 📊 **Big file finder** - Identify and remove large files taking up space
- 🔧 **Developer mode** - Advanced presets and shortcuts for development environments
- ⌨️ **Keyboard-first UI** - Intuitive terminal interface with one-key shortcuts
- 🔄 **Restore capability** - Easily restore quarantined items

## Usage

### Interactive Mode

Launch the two-pane terminal UI:

```bash
node cleancli.js
```

**Keyboard shortcuts:**
- `j/k` or arrows - Navigate
- `space` - Toggle select
- `enter` - Preview/expand
- `d` - Delete (safe mode)
- `g` - Quick clean `node_modules`
- `b` - List big files
- `r` - Restore last item
- `q` - Quit

### Command Line

```bash
# Run preset scans
node cleancli.js --preset=node --dry-run
node cleancli.js --preset=python --yes

# Target specific patterns
node cleancli.js --target ".next"
node cleancli.js --pattern "**/node_modules"

# Enable dev mode
node cleancli.js --dev
```

## Built-in Presets

- **`node`** - `node_modules`, `.next`, `dist`, `build`, `.cache`
- **`python`** - `.venv`, `venv`, `__pycache__`, `.mypy_cache`
- **`java`** - `target`, `build`, `.gradle`
- **`rust`** - `target`
- **`dev`** - Comprehensive developer caches and build directories

## Safety First

cleancli follows strict safety rules:

1. **No permanent deletes** unless `--force` is explicitly provided
2. **Move-to-trash** using OS native trash mechanisms
3. **Quarantine fallback** for large items with indexed restore capability
4. **System path protection** - Critical directories are blacklisted
5. **Repo awareness** - Detects active projects to prevent accidents
6. **Dry-run preview** - See what will be removed before deletion

## Installation Options

### Development
```bash
git clone <repo-url> cleancli
cd cleancli
npm install
node cleancli.js
```

### Global (future)
```bash
npx cleancli
```

## Quarantine & Restore

Items are safely stored in `~/.cleancli/quarantine/` with full metadata:

```bash
# Restore last quarantined item
node cleancli.js --restore-last

# View quarantine index
cat ~/.cleancli/quarantine-index.json
```

## Configuration

Create `~/.cleancli/config.json` to customize behavior:

```json
{
  "presets": {
    "custom": ["my-build-dir", "temp-files"]
  },
  "safety": {
    "alwaysMoveToTrash": true,
    "excludePaths": ["/custom/protected/path"]
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a PR with clear description

Please respect the safety model in any changes to deletion logic.

## Roadmap

- **v1.0** - Core TUI, presets, quarantine system
- **v1.1** - Plugin framework and community presets
- **v1.2** - Scheduling and automation features
- **v2.0** - Native performance optimizations

## License

MIT License - see LICENSE file for details.

---

**⚠️ Always test with `--dry-run` first when trying new patterns or presets.**