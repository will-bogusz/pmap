# projmap

A fast, configurable project structure documentation generator. Instantly create markdown maps of your project's file structure with optional content inclusion. Easily copy to clipboard or save to a file with markdown formatting intended to easily be injected into LLM context. Easily grab project structure from subdirectories and optionally include file contents for providing quick project awareness to LLMs prompts.

## Features

- 🚀 **Fast & Lightweight**: Quickly generates project structure documentation
- 🎯 **Smart Defaults**: Automatically uses `.gitignore` patterns if available
- ⚙️ **Highly Configurable**: Customize ignored patterns and included file types per project
- 📋 **Clipboard Support**: Option to copy output directly to clipboard
- 📁 **Directory Aware**: Remembers project root when run from subdirectories
- 📝 **Content Inclusion**: Optional inclusion of file contents in the output
- 🔄 **Automatic Output**: Configurable output location with smart defaults

## Installation

```bash
# Using npm
npm install -g projmap

# Using yarn
yarn global add projmap

# Using pnpm
pnpm add -g projmap
```

## Quick Start

```bash
# Initialize in your project
cd your-project
projmap --init

# Generate project structure
projmap

# Include file contents
projmap --content

# Map specific directory
projmap src

# Copy to clipboard instead of file
projmap --clipboard
```

## Usage

### Basic Commands

```bash
# Generate project structure
projmap

# Map specific directory
projmap src/components

# Include file contents
projmap --content

# Copy to clipboard
projmap --clipboard

# Specify custom output location
projmap --output docs/structure.md
```

### Configuration

```bash
# Initialize project with all configuration options
projmap --init --config-ignored --config-extensions

# Update default settings for new projects
projmap --set-defaults
```

### Project Configuration

When you run `projmap --init`, you'll be prompted to:
1. Confirm project root directory
2. Set default output location
3. Configure ignored patterns (optional with --config-ignored)
4. Configure included file extensions (optional with --config-extensions)

Your configuration is stored per-project and will be remembered for future runs.

### Output Location

By default, project maps are saved to:
- If configured during init: Your specified location
- Default fallback: `PROJECT_STRUCTURE.md` in project root

Use `--output` to specify a different location for a single run:
```bash
projmap --output custom/location/structure.md
```

### Using with Git

`projmap` automatically detects and uses your project's `.gitignore` patterns if available. If no `.gitignore` is found, it will use sensible defaults and notify you.

### File Type Configuration

By default, `projmap` includes common development files (`.ts`, `.js`, `.json`, etc.). Configure included extensions during initialization:
```bash
projmap --init --config-extensions
```

### Ignored Patterns

Configure which files/directories to ignore:
```bash
projmap --init --config-ignored
```

## Configuration Storage

Project configurations are stored centrally at:
- Windows: `%APPDATA%/projmap-nodejs/config.json`
- macOS: `~/Library/Preferences/projmap-nodejs/config.json`
- Linux: `~/.config/projmap-nodejs/config.json`

## Examples

### Basic Project Structure
```bash
projmap
```
Generates:
```
└─ 📁 src
   ├─ 📄 index.ts
   ├─ 📁 components
   │  ├─ 📄 Button.tsx
   │  └─ 📄 Card.tsx
   └─ 📁 utils
      └─ 📄 helpers.ts
```

### With File Contents
```bash
projmap --content
```
Includes file contents after the structure map.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT