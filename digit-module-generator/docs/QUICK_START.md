# Quick Start Guide

## Prerequisites

- Node.js 20+ (check with `node -v`)
- npm 8+ or yarn 1.22+

## Installation

**Global install (recommended):**

```bash
npm install -g @egovernments/digit-module-generator
```

**Local development:**

```bash
git clone https://github.com/egovernments/digit-module-generator.git
cd digit-module-generator
npm install
npm link
```

Verify installation:

```bash
digit-gen --version
```

## Quick Start

### Method 1: From a built-in template

```bash
digit-gen create --template showcase
```

Available templates: `showcase`, `hrms`, `inventory`, `project-mgmt`.

Use `digit-gen templates --detailed` to see what each template includes.

### Method 2: From a JSON config file

```bash
digit-gen create --config myconfig.json
```

The config file defines the module name, entity, screens, fields, API paths, and workflow settings. Run `--dry-run` first to preview what will be generated:

```bash
digit-gen create --config myconfig.json --dry-run
```

### Method 3: From an OpenAPI/Swagger spec

```bash
digit-gen create --api-spec ./api.yaml --entity Property
```

The parser extracts fields, validation rules, and API paths from the spec and builds a module config automatically.

## Generated Module Structure

After running `digit-gen create`, you get a module directory like this:

```
{module-code}/
  package.json
  webpack.config.js
  README.md
  src/
    Module.js
    components/
      {Entity}Card.js
    configs/
      {Entity}CreateConfig.js
      {Entity}SearchConfig.js
      {Entity}InboxConfig.js
      {Entity}ViewConfig.js
      UICustomizations.js
    hooks/
      index.js
      use{Entity}.js
    pages/
      employee/
        index.js
        {Entity}Create.js
        {Entity}Search.js
        {Entity}Inbox.js
        {Entity}View.js
        {Entity}Response.js
    services/
      {Entity}Service.js
      apiEndpoints.js
    utils/
      createUtils.js
      searchUtils.js
      responseUtils.js
      transformers.js
      formatters.js
      validators.js
  localization/
    en_IN.json
    hi_IN.json
```

Which screens and configs are generated depends on your configuration.

## Integration with micro-ui/web

After generation, the CLI prompts:

> Integrate this module into the host app?

If you accept, it automatically:

1. Adds the module as a workspace dependency in `micro-ui/web/package.json`
2. Patches `micro-ui/web/src/index.js` to register the module in `enabledModules[]` and call `init{Entity}Components` on startup

This integration is idempotent -- running it again will not create duplicate entries.

## Building and Running

After generation and integration:

```bash
# Install dependencies (from the web app root)
cd micro-ui/web
yarn install

# Build the generated module
cd packages/modules/{module-code}
yarn build:dev

# Start the dev server
cd ../../
yarn start
```

## Useful Flags

All flags below apply to `digit-gen create`:

| Flag | Description |
|------|-------------|
| `--template <name>` | Use a built-in template (showcase, hrms, inventory, project-mgmt) |
| `--config <path>` | Load config from a JSON file |
| `--api-spec <path>` | Parse an OpenAPI/Swagger spec |
| `--entity <name>` | Override entity name (PascalCase) |
| `--screens <list>` | Comma-separated screen list (create,search,inbox,view,response) |
| `--force` | Overwrite existing files |
| `--dry-run` | Preview files without generating anything |
| `--only <components>` | Partial regeneration: base, configs, screens, utils, hooks, services, i18n |
| `--output <path>` | Output directory (default: `./micro-ui/web/packages/modules`) |
| `--name <name>` | Module display name |
| `--code <code>` | Module code (kebab-case) |

## Individual Commands

Regenerate specific parts of an existing module without re-running the full `create`:

```bash
# Regenerate a single screen type
digit-gen screen create -e Employee
digit-gen screen search -e Employee --config config.json

# Regenerate utility files
digit-gen utils -e Employee

# Regenerate i18n/localization files
digit-gen i18n --config config.json
digit-gen i18n --config config.json --languages en_IN,hi_IN,ka_IN

# List available templates
digit-gen templates
digit-gen templates --detailed

# Validate a config file without generating anything
digit-gen validate --config config.json
```

## Troubleshooting

**"Module already exists" error:** Use `--force` to overwrite.

**Integration fails:** Make sure `micro-ui/web/src/index.js` exists at the expected path. The CLI will prompt for the correct path if it cannot auto-detect.

**Build errors after generation:** Run `yarn install` from the `micro-ui/web` directory to resolve workspace dependencies before building.
