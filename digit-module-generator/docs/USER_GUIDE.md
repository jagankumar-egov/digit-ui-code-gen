# digit-gen User Guide

`digit-gen` is a CLI tool that generates production-ready DIGIT micro-UI modules from templates, JSON configuration files, or OpenAPI specifications. It scaffolds React components, form configs, API hooks, utilities, localization files, and optionally integrates the generated module into your `micro-ui/web` host app -- all from a single command.

---

## Table of Contents

1. [Creating a Module](#creating-a-module)
2. [Available Templates](#available-templates)
3. [Generated Module Structure](#generated-module-structure)
4. [Integration with micro-ui/web](#integration-with-micro-uiweb)
5. [Building and Running](#building-and-running)
6. [CLI Flags Reference](#cli-flags-reference)
7. [Individual Commands](#individual-commands)
8. [FAQ](#faq)

---

## Creating a Module

There are three ways to generate a module.

### 1. From a built-in template

The fastest path. Pick a template and go:

```bash
digit-gen create --template showcase
```

Override specific values on the fly:

```bash
digit-gen create --template hrms --entity Employee --name "HR Module" --code hr-module
```

### 2. From a JSON configuration file

Write a config that describes your module, entity, screens, and fields, then point the CLI at it:

```bash
digit-gen create --config ./my-module-config.json
```

You can combine a template with a config file. The config file values take precedence:

```bash
digit-gen create --template showcase --config ./overrides.json
```

### 3. From an OpenAPI specification

Point at a Swagger/OpenAPI YAML or JSON file. The CLI extracts entity fields, API paths, and validation rules:

```bash
digit-gen create --api-spec ./swagger.yaml --entity Project
```

Combine with a template for defaults the spec does not cover:

```bash
digit-gen create --api-spec ./swagger.yaml --template project-mgmt --entity Project
```

If none of these flags are provided, the CLI launches an interactive prompt that walks you through module name, entity, screens, auth, and workflow configuration.

---

## Available Templates

| Template | Description |
|---|---|
| `showcase` | Demo module with all 6 screen types and 22+ field types. Good for learning. |
| `hrms` | Human Resource Management -- employee create/search/view with workflow. |
| `inventory` | Inventory management with stock tracking screens. |
| `project-mgmt` | Project management with task tracking, inbox, and workflow. |

List templates from the CLI:

```bash
digit-gen templates
digit-gen templates --detailed
```

---

## Generated Module Structure

After running `digit-gen create`, you get a self-contained module package. Assuming entity name `Demo` and module code `demo-module`:

```
demo-module/
  package.json
  webpack.config.js
  README.md
  src/
    Module.js
    components/
      DemoCard.js                  # Home page card (always generated)
    configs/
      DemoCreateConfig.js
      DemoSearchConfig.js
      DemoInboxConfig.js
      DemoViewConfig.js
      UICustomizations.js
    hooks/
      index.js                     # CustomisedHooks with nested namespace
      useDemo.js                   # API calls only; transforms imported from utils
    pages/
      employee/
        index.js
        DemoCreate.js
        DemoSearch.js
        DemoInbox.js
        DemoView.js
        DemoResponse.js
    services/
      DemoService.js
      apiEndpoints.js
    utils/
      createUtils.js
      searchUtils.js
      responseUtils.js
      transformers.js              # API data transforms
      formatters.js                # Date, number, currency formatting
      validators.js                # Form validation rules
  localization/
    en_IN.json
    hi_IN.json
```

Notes:

- The `{Entity}Card.js` component (e.g., `DemoCard.js`) is always generated. It serves as the module's home page card in the DIGIT UI.
- Config files are generated for create, search, inbox, and view screens. Response and custom screens are self-contained and do not need separate config files.
- There are 6 screen types: **create**, **search**, **inbox**, **view**, **response**, **custom**.
- Hooks in `src/hooks/` contain only API calls. Data transformation logic lives in `src/utils/transformers.js`.

---

## Integration with micro-ui/web

After module generation completes, the CLI prompts:

```
? Integrate this module into the host app? (found at ./micro-ui/web) (Y/n)
```

If `./micro-ui/web/src/index.js` exists, the CLI auto-detects it and defaults to **Yes**. If the directory is elsewhere, it asks for the path.

When you confirm, the integrator patches two files:

1. **`web/package.json`** -- adds `@egovernments/digit-ui-module-<code>` as a workspace dependency (version `1.0.0`).
2. **`web/src/index.js`** -- adds the module to the `enabledModules` array and inserts a `try/catch` block that calls `init{Entity}Components()` before `setIsReady(true)`.

The integration is **idempotent** -- running it twice does not create duplicate entries.

### Cleaning up stale integrations

When you use `--force` for a full regeneration (without `--only`), the CLI automatically removes the old integration entries from `web/package.json` and `web/src/index.js` before regenerating and re-integrating.

To manually remove a module's integration without regenerating, the `deintegrateFromWebApp` function is available programmatically. It removes the dependency from `package.json` and the registration block from `index.js`.

---

## Building and Running

After generation and integration:

```bash
# 1. Install dependencies (from the web directory)
cd ./micro-ui/web
yarn install

# 2. Build the module
cd packages/modules/<module-code>
yarn build:dev

# 3. Start the host app
cd ../../..   # back to web/
yarn start
```

If you skipped auto-integration, you need to manually:

1. Add the module as a dependency in `web/package.json`.
2. Register the init function in `web/src/index.js`.
3. Then follow the same install/build/start steps above.

---

## CLI Flags Reference

### `digit-gen create`

| Flag | Short | Description | Default |
|---|---|---|---|
| `--name <name>` | `-n` | Module display name | Interactive prompt |
| `--code <code>` | `-c` | Module code (kebab-case) | Derived from name |
| `--entity <entity>` | `-e` | Entity name (PascalCase) | Interactive prompt |
| `--api-spec <path>` | `-a` | Path or URL to OpenAPI spec | -- |
| `--template <name>` | `-t` | Built-in template to use | -- |
| `--screens <list>` | `-s` | Comma-separated screen types | Interactive prompt |
| `--output <path>` | `-o` | Output directory | `./micro-ui/web/packages/modules` |
| `--config <file>` | | JSON configuration file | -- |
| `--force` | | Overwrite existing files. On full regen, also cleans stale integration entries. | `false` |
| `--dry-run` | | Preview only. Shows a config summary (module, entity, screens, fields, auth, workflow, i18n) followed by the file list. No files are written. | `false` |
| `--only <parts>` | | Partial regeneration. Comma-separated list of components to regenerate. Valid values: `base`, `configs`, `screens`, `utils`, `hooks`, `services`, `i18n`. | All components |

#### Examples

```bash
# Full generation from template
digit-gen create --template showcase --force

# Dry run to preview what would be generated
digit-gen create --template hrms --dry-run

# Regenerate only utils and hooks (leaves other files untouched)
digit-gen create --template showcase --force --only utils,hooks

# Custom output directory
digit-gen create --config ./config.json --output ./my-output

# Specific screens only
digit-gen create --template showcase --screens create,search,view
```

---

## Individual Commands

### `digit-gen screen <type>`

Generate a single screen and its config file.

```bash
digit-gen screen create --entity Employee --config ./config.json
digit-gen screen search --entity Employee --output ./src
```

Valid screen types: `create`, `search`, `inbox`, `view`, `response`, `custom`.

| Flag | Required | Description |
|---|---|---|
| `--entity <name>` / `-e` | Yes | Entity name (PascalCase) |
| `--config <file>` | No | JSON config file. If omitted, a minimal config is generated. |
| `--output <path>` / `-o` | No | Output directory (default: `./generated`) |
| `--name <name>` / `-n` | No | Custom screen name (for `custom` type) |

### `digit-gen utils`

Generate utility files (createUtils, searchUtils, responseUtils, and index).

```bash
digit-gen utils --entity Employee
digit-gen utils --entity Employee --config ./config.json --output ./src
```

| Flag | Required | Description |
|---|---|---|
| `--entity <name>` / `-e` | Yes | Entity name |
| `--config <file>` | No | JSON config file |
| `--output <path>` / `-o` | No | Output directory |

### `digit-gen i18n`

Generate localization JSON files and i18n config.

```bash
digit-gen i18n --config ./config.json
digit-gen i18n --config ./config.json --languages en_IN,hi_IN,ta_IN
```

| Flag | Required | Description |
|---|---|---|
| `--config <file>` | Yes | JSON config file |
| `--languages <list>` / `-l` | No | Comma-separated locales (default: `en_IN,hi_IN`) |
| `--output <path>` / `-o` | No | Output directory |

### `digit-gen templates`

List available templates.

```bash
digit-gen templates
digit-gen templates --detailed
```

| Flag | Description |
|---|---|
| `--detailed` / `-d` | Show full template metadata (category, version, author) |

### `digit-gen validate`

Validate a JSON configuration file against the schema and business rules.

```bash
digit-gen validate --config ./config.json
```

| Flag | Required | Description |
|---|---|---|
| `--config <file>` | Yes | Configuration file to validate |

---

## FAQ

**Q1: What is the minimum I need to get a working module?**

```bash
digit-gen create --template showcase
```

Answer "Y" to the integration prompt. Then `yarn install`, `yarn build:dev`, `yarn start`.

**Q2: Can I combine a template with my own config?**

Yes. The config file overrides template values:

```bash
digit-gen create --template hrms --config ./my-overrides.json
```

**Q3: How do I add a new screen to an existing module?**

Use the `screen` command:

```bash
digit-gen screen inbox --entity Employee --config ./config.json --output ./src
```

Then import the new screen in your `Module.js` and add the route.

**Q4: How do I regenerate only part of a module?**

Use `--only` with `--force`:

```bash
digit-gen create --template showcase --force --only utils,hooks
```

Valid components: `base`, `configs`, `screens`, `utils`, `hooks`, `services`, `i18n`.

**Q5: What does `--dry-run` show?**

A configuration summary (module name, entity, screens, field counts, auth, workflow, i18n settings) followed by the full list of files that would be generated. No files are written.

**Q6: What happens if I run `--force` on an already-integrated module?**

A full `--force` regeneration (without `--only`) detects existing integration entries in `web/package.json` and `web/src/index.js`, removes them, regenerates the module, then re-prompts for integration. This prevents stale or duplicate entries.

**Q7: How do I remove a module from the host app?**

The `deintegrateFromWebApp` utility removes the dependency from `web/package.json` and the init block from `web/src/index.js`. It is called automatically during `--force` regeneration. For manual cleanup, it can be invoked programmatically.

**Q8: Where do pages go? Why `src/pages/employee/`?**

This is a DIGIT convention. The `employee` directory corresponds to the admin portal role context. All module screens live under this path.

**Q9: How does localization work?**

The generator creates `localization/en_IN.json` (and other locales) with keys for every screen heading, field label, validation message, and workflow action. Components use `react-i18next`:

```jsx
const { t } = useTranslation();
return <label>{t("EMPLOYEE_NAME")}</label>;
```

**Q10: What field types are supported?**

22 types: `text`, `textarea`, `numeric`, `password`, `date`, `time`, `toggle`, `checkbox`, `radio`, `dropdown`, `multiselectdropdown`, `apidropdown`, `phone`, `mobileNumber`, `email`, `component`, `document`, `locationdropdown`, `geolocation`, `multiupload`, `select`, `custom`.

**Q11: How do I add custom validation?**

Add a `validation` object to any field in your config:

```json
{
  "name": "email",
  "type": "email",
  "required": true,
  "validation": {
    "pattern": "^[^@]+@[^@]+\\.[^@]+$",
    "maxLength": 255
  }
}
```

The generated `validators.js` file contains the compiled validation rules. Custom logic can be added there after generation.

**Q12: Can I use an OpenAPI spec that has circular references?**

Yes. The API spec parser resolves circular `$ref` entries before extracting fields.

**Q13: The module builds but the card does not appear on the home page.**

Check that:

1. The module is listed in `enabledModules` in `web/src/index.js`.
2. The `init{Entity}Components()` call is present before `setIsReady(true)`.
3. `yarn install` was run in the `web/` directory after integration.
4. The module was built (`yarn build:dev` in the module directory).
