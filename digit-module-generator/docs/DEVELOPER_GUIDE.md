# DIGIT Module Generator -- Developer / Maintainer Guide

This document is for developers who need to modify, extend, or debug the
`digit-gen` CLI tool itself. It assumes familiarity with Node.js, Handlebars,
and the DIGIT micro-ui framework.

---

## 1. Project Structure

```
digit-module-generator/
  bin/
    cli.js                  # Entry point -- Commander.js program definition
  src/
    commands/               # One file per CLI command
      create.js             # `digit-gen create` -- main generation flow
      validate.js           # `digit-gen validate`
      screen.js             # `digit-gen screen <type>`
      utils.js              # `digit-gen utils`
      i18n.js               # `digit-gen i18n`
      templates.js          # `digit-gen templates` (list)
      migrate.js            # `digit-gen migrate`
      diff.js               # `digit-gen diff`
    generators/
      moduleGenerator.js    # Orchestrator -- calls all sub-generators
      configGenerators/     # Produce JS config objects consumed by DIGIT FormComposer
        createConfigGenerator.js
        searchConfigGenerator.js
        inboxConfigGenerator.js
        viewConfigGenerator.js
      screenGenerators/
        screenGenerator.js  # Compiles .hbs templates into React components
      serviceGenerators/
        serviceGenerator.js # Generates hooks and API service files
      utilsGenerators/
        createUtilsGenerator.js
        responseUtilsGenerator.js
        searchUtilsGenerator.js
      i18nGenerator.js      # Generates localization JSON files
    integrators/
      webAppIntegrator.js   # Patches micro-ui/web host app for module registration
    parsers/
      apiSpecParser.js      # Swagger / OpenAPI spec -> config conversion
    validators/
      configValidator.js    # AJV JSON Schema + business-logic validation
    templates/
      templateManager.js    # Resolves and loads built-in templates
      screens/              # (if present) additional screen-level templates
  templates/                # Built-in template configs (each is a folder)
    showcase/
      template.json         # Wraps config with metadata (name, description, version)
    hrms/
    inventory/
    project-mgmt/
  dist/                     # Babel-compiled output (bin/cli.js requires from here)
  test-configs/             # Sample configs for manual/automated testing
```

Key points:

- `bin/cli.js` imports from `dist/`, not `src/`. You must build before testing.
- `src/templates/screens/` contains `.hbs` files:
  `create.hbs`, `search.hbs`, `inbox.hbs`, `view.hbs`, `response.hbs`, `custom.hbs`.
- `templates/` (root level) holds pre-built config bundles that users select with `--template`.

---

## 2. Architecture Overview

The generation pipeline flows as follows:

```
bin/cli.js
  |  Commander.js parses argv, dispatches to command handler
  v
src/commands/create.js
  |  1. Load config from --config file (unwraps "config" key if present)
  |  2. Merge template config if --template specified
  |  3. Parse API spec if --api-spec specified (apiSpecParser.js)
  |  4. Run interactive prompts for missing fields (inquirer)
  |  5. Override with explicit CLI flags (--name, --code, --entity, --screens)
  |  6. Validate config (configValidator.js -- AJV schema + business rules)
  |  7. If --dry-run, show preview and exit
  |  8. If --force without --only, deintegrate stale entries first
  |  9. Call generateFromConfig()
  | 10. Prompt for host-app integration
  v
src/generators/moduleGenerator.js  (generateFromConfig)
  |  Orchestrator. Respects --only flag to restrict categories.
  |  Categories: base, configs, screens, utils, services, hooks, i18n
  |
  |-- base:     package.json, webpack.config.js, Module.js, README
  |-- configs:  config generators (create, search, inbox, view) + UI customizations
  |-- screens:  screen generator (.hbs -> React) + EmployeeRouter + ModuleCard
  |-- utils:    createUtils, responseUtils, searchUtils
  |-- services: hooks and API endpoint files
  |-- hooks:    hooks index
  |-- i18n:     localization files (if config.i18n.generateKeys is true)
  |
  v
src/integrators/webAppIntegrator.js
  |  Patches micro-ui/web/package.json and micro-ui/web/src/index.js
```

### Execution order within a full `create`

1. Config generators run first (createConfigGenerator, searchConfigGenerator, etc.).
2. Screen generators run second (screenGenerator compiles .hbs templates).
3. Service generators, utils generators, hooks, and i18n run last.

This order matters because of the Handlebars singleton (see Gotchas below).

---

## 3. Key Patterns and Gotchas

### 3.1 Handlebars is a singleton

The `handlebars` npm package exports a single global instance. Helpers
registered with `Handlebars.registerHelper()` overwrite any previously
registered helper of the same name. Since config generators run BEFORE screen
generators, the helper versions in config generators are what take effect
during config generation. If a screen generator re-registers the same helper
with different logic, only subsequent compilations see the new version.

Rule: if you change a helper in one file, grep for every other registration
of that helper name and update all of them.

### 3.2 `toLocalizationKey` is registered in 6 files

This helper converts field names to `PREFIX_CONSTANT_CASE` localization keys.
It is registered in:

1. `src/generators/moduleGenerator.js`
2. `src/generators/screenGenerators/screenGenerator.js`
3. `src/generators/configGenerators/createConfigGenerator.js`
4. `src/generators/configGenerators/searchConfigGenerator.js`
5. `src/generators/configGenerators/inboxConfigGenerator.js`
6. `src/generators/configGenerators/viewConfigGenerator.js`

ALL six implementations must stay in sync. The canonical logic:

```js
const constantCase = fieldName
  .replace(/[\s-]+/g, '_')           // spaces/hyphens -> underscores
  .replace(/([a-z])([A-Z])/g, '$1_$2')  // camelCase -> CAMEL_CASE
  .toUpperCase();
return `${finalPrefix}${constantCase}`;
```

The `.replace(/[\s-]+/g, '_')` step is critical -- without it, field names
containing spaces or hyphens produce broken localization keys.

### 3.3 Use triple-stash `{{{ }}}` for raw output

Standard Handlebars `{{ }}` HTML-encodes the output. In config generators,
option names and descriptions that contain characters like `&`, `<`, or `"`
will be corrupted. Always use `{{{ }}}` (triple-stash) when emitting values
that should not be escaped, such as:

- `{{{description}}}`
- `{{{name}}}` inside option objects

### 3.4 `custom` screens are self-contained

Custom screens do not require a corresponding config file. In the
`generateConfigs` function in `moduleGenerator.js`, the switch/case for
screen types uses `default: continue` to skip unknown types (including
`custom` and the legacy `landing` type). The screen generator handles
them directly via `custom.hbs`.

### 3.5 `mobileNumber` default validation

The `mobileNumber` field type has a built-in default validation pattern
in the config generator template. If the user also supplies a `validation`
block in their config, the defaults and the user-supplied rules would
both render, producing duplicate validation keys. The template must wrap
the default validation in `{{#unless validation}} ... {{/unless}}` so it
only emits when no explicit validation is present.

### 3.6 react-i18next must be in webpack externals

The generated `webpack.config.js` must list `react-i18next` in its
`externals` configuration. The host app provides this package at runtime.
If it is missing from externals, the module bundles its own copy, which
causes duplicate context providers and `useTranslation()` returns
undefined translations.

---

## 4. How to Add a New Field Type

Adding a new field type (e.g., `colorpicker`) requires changes in four places.
No `.hbs` template changes are needed -- screens consume the config objects.

### Step 1: Add the type to the AJV enum

File: `src/validators/configValidator.js`

Locate the `fieldConfig` definition and add your type string to the `enum`
array under the `type` property:

```js
type: {
  type: 'string',
  enum: [
    'text', 'number', 'date', /* ... existing types ... */,
    'colorpicker'   // <-- add here
  ]
}
```

### Step 2: Add rendering logic in createConfigGenerator.js

File: `src/generators/configGenerators/createConfigGenerator.js`

Inside the Handlebars template string, add a conditional block for your type
within the `populators` section. Follow the pattern of existing types:

```handlebars
{{#if (eq type "colorpicker")}}
          componentInFront: "ColorPicker",
          colorFormat: "hex",
{{/if}}
```

### Step 3: Add data transformation in createUtilsGenerator.js

File: `src/generators/utilsGenerators/createUtilsGenerator.js`

Add a case for your type in the data transformation logic. This controls
how form data is mapped to the API payload before submission. For example,
a `colorpicker` might need to extract `.hex` from the component state:

```js
case 'colorpicker':
  return `formData.${field.name}?.hex || ""`;
```

### Step 4: Add to showcase template for testing

File: `templates/showcase/template.json` (or its `config.json`)

Add at least one field of the new type to the showcase template's `fields`
array. This lets you verify end-to-end generation with:

```bash
node bin/cli.js create --template showcase --output /tmp/test --force
```

### Step 5: Verify

Run the showcase generation and inspect the output config file to confirm
the new field renders correctly in the create config.

---

## 5. How to Add a New Screen Type

### Step 1: Create the .hbs template

File: `src/templates/screens/<type>.hbs`

Write a Handlebars template that produces a valid React component. Available
context variables match the config object (entity, module, fields, screens,
api, i18n, etc.). Use existing templates (e.g., `create.hbs`, `search.hbs`)
as reference.

### Step 2: Add to screenGenerator.js

File: `src/generators/screenGenerators/screenGenerator.js`

Add your new screen type to the type-to-template mapping so the generator
knows which `.hbs` file to compile for your type.

### Step 3: Add a config generator (if needed)

If your screen type needs a companion config file (like `create` has
`createConfigGenerator.js`), create a new file in
`src/generators/configGenerators/`. Follow the pattern of existing generators:

- Register Handlebars helpers (including `toLocalizationKey`).
- Define a template string that produces a JS export.
- Export a `generateXxxConfig(config)` function.

If the screen is self-contained (like `custom` or `response`), skip this step.

### Step 4: Update moduleGenerator.js

File: `src/generators/moduleGenerator.js`

1. Import your new config generator (if any) at the top of the file.
2. Add a case to the `generateConfigs` function's switch statement.
3. Add a call in `generateScreenComponents` if needed.

### Step 5: Update cli.js screen command

File: `bin/cli.js`

Update the `screen` command description to include your new type in the
valid types list:

```js
.command('screen <type>')
.description('Generate specific screen type (create, search, inbox, view, response, custom, yourtype)')
```

### Step 6: Update the AJV schema

File: `src/validators/configValidator.js`

Add your new screen type as a property in the `screens` schema object:

```js
screens: {
  type: 'object',
  properties: {
    create: { $ref: '#/definitions/screenConfig' },
    // ... existing ...
    yourtype: { $ref: '#/definitions/screenConfig' }
  }
}
```

---

## 6. How to Add a New Template

Templates are pre-built configurations that users select with `--template`.

### Step 1: Create the template folder

```
templates/<template-name>/
  template.json
```

### Step 2: Write template.json

`template.json` wraps the raw config with metadata:

```json
{
  "name": "My Template",
  "description": "A template for ...",
  "version": "1.0.0",
  "config": {
    "module": { "name": "...", "code": "...", "description": "..." },
    "entity": { "name": "...", "apiPath": "/...", "primaryKey": "id", "displayField": "name" },
    "screens": { "create": { "enabled": true }, "search": { "enabled": true } },
    "fields": [ ... ],
    "api": { "create": "/...", "search": "/..." },
    "i18n": { "prefix": "MY_MODULE_", "generateKeys": true }
  }
}
```

The `config` key is required. When the CLI loads a template via
`getTemplateConfig()` in `src/templates/templateManager.js`, it reads
`template.json` and unwraps the `config` property. If you also supply a
`--config` file, the CLI merges both (explicit config overrides template).

### Step 3: Test

```bash
node bin/cli.js create --template <template-name> --output /tmp/test --force
```

Verify all screens generate without errors and inspect the output directory.

---

## 7. Auto-Integration System

The integrator (`src/integrators/webAppIntegrator.js`) patches the
micro-ui/web host application so the generated module is loaded at runtime.

### Exported functions

| Function | Purpose |
|---|---|
| `integrateWithWebApp(config, webDir)` | Adds module to host app |
| `deintegrateFromWebApp(config, webDir)` | Removes module entries (cleanup) |
| `isIntegrated(config, webDir)` | Returns boolean -- is module already registered? |

### What `integrateWithWebApp` does

1. **Patches `{webDir}/package.json`** -- adds the module as a dependency:
   ```json
   "@egovernments/digit-ui-module-<code>": "1.0.0"
   ```
   Skips if the dependency already exists (idempotent).

2. **Patches `{webDir}/src/index.js`** -- two modifications:
   - Appends `"<PascalCaseCode>"` to the `enabledModules` array.
     Regex: `/(const enabledModules\s*=\s*\[)([^\]]*?)(\])/`
   - Inserts a try-catch block before `setIsReady(true)`:
     ```js
     try {
       const { init<Entity>Components } = await import("@egovernments/digit-ui-module-<code>")
       init<Entity>Components();
     } catch (error) {
       console.log("Error loading <Module> module:", error);
     }
     ```
     Regex: `/^(\s+setIsReady\(true\);)/m`

### Idempotency

Both `updateWebPackageJson` and `updateWebIndexJs` check for existing entries
before making changes. If the package is already in dependencies or the init
function is already in index.js, the function logs a skip message and returns.

### What `deintegrateFromWebApp` does

Performs the inverse:
- Deletes the dependency key from `package.json`.
- Removes the module name from `enabledModules` using a regex that handles
  leading/trailing comma placement (first item, middle item, last item).
- Removes the entire try-catch block matching the init function name.
- Cleans up double commas and trailing commas before `]`.

### When deintegration runs

The `create` command triggers deintegration automatically when `--force` is
used (without `--only`) and the output path is inside the default
`micro-ui/web` directory. This prevents stale entries from accumulating
during repeated regeneration cycles.

---

## 8. Build and Test

### Building

```bash
cd digit-module-generator
npm run build
```

This runs Babel to compile `src/` into `dist/`. The CLI entry point
(`bin/cli.js`) requires modules from `dist/`, so you must build after every
source change.

### Quick validation (dry run)

```bash
node bin/cli.js create --template showcase --dry-run
```

This parses and validates the config, then prints a preview of what files
would be generated -- without writing anything to disk.

### Full generation test

```bash
node bin/cli.js create --template showcase --output /tmp/test --force
```

Inspect `/tmp/test/<module-code>/` to verify the output. The `--force` flag
overwrites any previous output.

### Testing individual commands

```bash
# Validate a config file
node bin/cli.js validate --config test-configs/showcase.json

# Generate only screens
node bin/cli.js create --config test-configs/showcase.json --output /tmp/test --force --only screens

# List available templates
node bin/cli.js templates --detailed
```

### Debugging

Set `DEBUG=1` to see full stack traces on error:

```bash
DEBUG=1 node bin/cli.js create --template showcase --output /tmp/test --force
```

---

## 9. Common Bugs and How to Avoid Them

This section documents bugs encountered during development. Use it as a
checklist when making changes.

### BUG-010: webpack missing react-i18next external

**Symptom:** `useTranslation()` returns undefined in the generated module.

**Cause:** `react-i18next` was not listed in webpack externals, so the module
bundled its own copy instead of using the host app's singleton.

**Fix:** Ensure `generateWebpackConfig` in `moduleGenerator.js` always
includes `react-i18next` in the externals map.

### BUG-011: Duplicate validation for mobileNumber

**Symptom:** Generated config has two `pattern` keys in the validation block.

**Cause:** The mobileNumber field type has a hardcoded default validation.
When the user also supplied a `validation` block, both rendered.

**Fix:** Wrap the default validation in `{{#unless validation}}`.

### BUG-012: HTML entity encoding in options

**Symptom:** Option names like `"AT&T"` render as `"AT&amp;T"` in configs.

**Cause:** Standard `{{double-stash}}` HTML-encodes output.

**Fix:** Use `{{{triple-stash}}}` for option names and descriptions.

### BUG-013 to BUG-015: Missing field type handling

**Symptom:** Fields of type `multiselectdropdown`, `apidropdown`, or
`component` render with empty populators.

**Cause:** No conditional block for these types in `createConfigGenerator.js`.

**Fix:** Add explicit `{{#if (eq type "xxx")}}` blocks for every supported
field type.

### BUG-016: createUtils missing transformations

**Symptom:** Form data for 13+ field types not mapped correctly to API payload.

**Cause:** `createUtilsGenerator.js` only handled a few basic types.

**Fix:** Add transformation cases for all supported field types.

### BUG-017: toLocalizationKey does not handle spaces/hyphens

**Symptom:** Field names with spaces or hyphens produce mangled localization
keys (e.g., `MODULE_full-name` instead of `MODULE_FULL_NAME`).

**Cause:** Missing `.replace(/[\s-]+/g, '_')` before the camelCase-to-
CONSTANT_CASE conversion.

**Fix:** Add the replacement step in ALL six files that register the
`toLocalizationKey` helper.

### BUG-018: constantCase helper does not handle hyphens

**Symptom:** Module codes with hyphens (e.g., `trade-license`) produce
invalid constant names like `TRADE-LICENSE` instead of `TRADE_LICENSE`.

**Cause:** The `constantCase` Handlebars helper only handled camelCase
boundaries, not hyphens or spaces.

**Fix:** Always use `.replace(/[-\s]/g, '_')` before `.toUpperCase()` in
any code that converts to CONSTANT_CASE.

### BUG-019: CustomisedHooks must be nested

**Symptom:** Hooks fail to register at runtime -- DIGIT framework cannot find
them.

**Cause:** The generated hooks export was a flat object instead of the
required nested structure `{ Hooks: { <entityName>: { ...hooks } } }`.

**Fix:** Ensure `serviceGenerator.js` produces the nested structure.

### BUG-020: Template JSONs wrap config under "config" key

**Symptom:** Validation fails with "module is required" even though
`template.json` clearly contains a `module` block.

**Cause:** `template.json` wraps the config under a `"config"` key.
The CLI must unwrap it.

**Fix:** In `create.js`, after loading the config file:
```js
if (config.config) {
  config = config.config;
}
```

### Circular references in API spec parsing

**Symptom:** `JSON.stringify` throws "Converting circular structure to JSON"
when parsing certain Swagger/OpenAPI specs.

**Cause:** Some specs contain `$ref` chains that create circular references
once resolved.

**Fix:** Use a `WeakSet` to track visited objects during traversal instead of
`JSON.stringify` for cycle detection.

### Full URLs in apiPath from Swagger

**Symptom:** `apiPath` validation fails with "must match pattern ^/.*"
because the parsed value is `https://host/path` instead of `/path`.

**Cause:** The API spec parser extracted the full URL including host.

**Fix:** Parse the URL and extract only `.pathname` before assigning to
`apiPath`.

---

## Appendix: Supported Field Types

The following field types are recognized by the AJV schema and handled by the
config and utils generators:

| Type | Notes |
|---|---|
| `text` | Standard text input |
| `number` | Numeric input |
| `numeric` | Alias for number with specific formatting |
| `date` | Date picker |
| `datetime` | Date + time picker |
| `time` | Time-only picker |
| `email` | Email input with built-in validation |
| `url` | URL input |
| `password` | Masked text input |
| `textarea` | Multi-line text |
| `dropdown` | Single-select dropdown |
| `radio` | Radio button group |
| `checkbox` | Checkbox |
| `toggle` | Toggle switch |
| `multiselect` | Multi-select (tag-based) |
| `multiselectdropdown` | Multi-select dropdown variant |
| `radioordropdown` | Renders as radio or dropdown based on option count |
| `mobileNumber` | Phone input with country code and default validation |
| `amount` | Currency input |
| `locationdropdown` | Location hierarchy dropdown |
| `apidropdown` | Dropdown populated from API endpoint |
| `file` | File upload |
| `component` | Embeds a custom React component |
| `search` | Search-as-you-type field |
| `geolocation` | Geolocation picker |
