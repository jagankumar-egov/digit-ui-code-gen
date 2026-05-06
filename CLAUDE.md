# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CLI tool (`digit-gen`) that generates DIGIT micro-UI React modules from JSON configuration. Built with Commander.js, Handlebars templates, and AJV validation. Published as `@egovernments/digit-module-generator`.

## Commands

All commands run from `digit-module-generator/`:

```bash
npm run build           # Babel transpile src/ → dist/ (with --copy-files)
npm run dev             # Build in watch mode
npm test                # Jest
npm run test:watch      # Jest watch
npm run lint            # ESLint on src/**/*.js
npm start               # Run CLI (node bin/cli.js)
```

Run a single test file:
```bash
npm test -- path/to/test.js
```

Test generation with a pre-built template:
```bash
npm start create -- --template hrms --entity TestEntity --output ./test-output
npm start create -- --template showcase --dry-run
```

Other useful CLI commands:
```bash
npm start validate -- --config path/to/config.json            # Validate a config file
npm start templates                                            # List available templates
npm start screen -- --type create --config config.json        # Generate a single screen
npm start create -- --template hrms --only screens,configs    # Partial regeneration
npm start create -- --force --config employee-config.json     # Force overwrite + re-integrate
```

**Build before test:** Always run `npm run build` after modifying `src/` files — `bin/cli.js` requires from `../dist/`, not `src/` directly.

## Building generated module dist/

Generated modules (e.g. `micro-ui/web/packages/modules/health-hrms/`) must be separately webpack-built. Use the module's own webpack binary to avoid a webpack 5.106.x cache bug where `yarn build:dev` emits `[compared for emit]` and skips writing files to disk:

```bash
cd micro-ui/web/packages/modules/{module-name}
npm install                                                        # first time only
rm -rf node_modules/.cache dist
node_modules/.bin/webpack --config webpack.config.js --output-path $(pwd)/dist
```

`yarn build:dev` from inside the module directory resolves webpack from the parent `micro-ui/web/node_modules/` (v5.106.x) which has this bug. The module's local `node_modules/.bin/webpack` (v5.104.x) works correctly. All generated `webpack.config.js` files include `cache: false` to mitigate this.

## Architecture

**Generation pipeline:**

```
bin/cli.js (Commander.js)
  → src/commands/create.js
      1. Load config (file / --template / --api-spec)
      2. Interactive prompts for missing fields (inquirer)
      3. Override with CLI flags
      4. Validate (configValidator.js — AJV + business rules)
      5. --dry-run exits here
      6. --force without --only → deintegrate stale entries first
      → moduleGenerator.generateFromConfig()
          base:     package.json, webpack.config.js, Module.js
          configs:  createConfigGenerator, searchConfigGenerator, inboxConfigGenerator, viewConfigGenerator
          screens:  screenGenerator (.hbs → React) + Router + Card
          utils:    createUtils, searchUtils, responseUtils
          services: API hooks files + apiEndpoints.js
          hooks:    hooks index (CustomisedHooks)
          i18n:     en_IN.json, hi_IN.json
      → webAppIntegrator (optional prompt after generation)
```

Key source paths (all under `digit-module-generator/`):

- `bin/cli.js` — CLI entry point
- `src/commands/` — 8 commands: create, templates, validate, screen, utils, i18n, migrate, diff
- `src/generators/moduleGenerator.js` — Main orchestrator (~48KB)
- `src/generators/configGenerators/` — FormComposer/InboxSearchComposer config objects (create, search, inbox, view)
- `src/generators/screenGenerators/screenGenerator.js` — Compiles `.hbs` → React components
- `src/generators/utilsGenerators/` — Data transformation utilities (create, search, response)
- `src/generators/serviceGenerators/serviceGenerator.js` — API hooks/service layer + `apiEndpoints.js`
- `src/generators/testGenerators/testGenerator.js` — Test file generator
- `src/generators/i18nGenerator.js` — Localization JSON files
- `src/validators/configValidator.js` — AJV schema + business logic validation
- `src/parsers/apiSpecParser.js` — OpenAPI/Swagger spec → config conversion
- `src/integrators/webAppIntegrator.js` — Auto-patches micro-ui/web after generation
- `src/templates/templateManager.js` — Loads pre-built templates from `templates/`
- `src/templates/screens/*.hbs` — 6 Handlebars screen templates: create, search, view, inbox, response, custom
- `templates/` — Pre-built domain templates: hrms, health-hrms, inventory, project-mgmt, showcase

Generated modules output to `micro-ui/web/packages/modules/{code}/` with pages under `src/pages/employee/` (DIGIT convention for admin portal).

## Critical Implementation Details

**Handlebars singleton behavior:** Helpers are registered globally. Config generators run BEFORE screen generators and will override any same-named helpers. The `toLocalizationKey` helper is registered in 6 files (moduleGenerator, screenGenerator, 4 config generators) — all must stay in sync. It must handle spaces/hyphens: `.replace(/[\s-]+/g, '_')` before camelCase conversion.

**`lowerCase` helper:** Registered only in `screenGenerator.js`. Used in screen templates for navigation route paths — `{{lowerCase config.entity.name}}` produces `hrms` from `HRMS`. This is necessary because DIGIT mounts modules by entity name (e.g. `HRMSModule` → `/hrms/*`), not module code (`health-hrms`).

**`constantCase` helper:** Fixed in all 3 generator files (moduleGenerator, screenGenerator, serviceGenerator) to correctly handle all-caps inputs like `HRMS` → `HRMS` (not `_H_R_M_S`). Uses two-pass regex: `([a-z0-9])([A-Z])` then `([A-Z]+)([A-Z][a-z])`.

**Navigation paths in generated screens:** Always use `/${window?.contextPath}/employee/...` prefix. The `window.contextPath` is set at runtime by the host app (e.g. `workbench-ui`). Missing this prefix causes redirects to fall back to home.

**DIGIT module routing:** DIGIT core maps `enabledModules[i]` → looks for `{enabledModules[i]}Module` in `Digit.ComponentRegistryService`. The generator registers `${entityName}Module` (e.g. `HRMSModule`). So `enabledModules` must contain the entity name (e.g. `"HRMS"`), not PascalCase of module code (e.g. `"HealthHrms"`), for routes to work. All internal screen navigations use `{{lowerCase config.entity.name}}` (e.g. `hrms`) to match the mount path.

**Template escaping:** Use `{{{triple-stash}}}` for raw output (option names, descriptions). Double `{{}}` HTML-encodes, which breaks generated code.

**Field types:** 22 types supported. Each new field type requires explicit handling in `createConfigGenerator` AND `createUtilsGenerator`. The `custom` screen type is self-contained (no config file needed) — handled by `default: continue` in `generateConfigs`.

**Validation pattern:** configValidator runs two stages — AJV schema validation then business logic checks (e.g., inbox requires `workflow.enabled: true`, apiDropdown requires `apiConfig.url`, no duplicate field names within a screen). All errors are accumulated before return, not fail-fast.

**Auto-integration:** `webAppIntegrator` is idempotent. It adds the module as a workspace dependency (`0.0.0`) and registers `init{Entity}Components()` in `index.js` wrapped in try-catch. `react-i18next` must be in webpack externals (host app provides it).

**mobileNumber default validation:** Must be wrapped in `{{#unless validation}}` in templates to avoid duplicate validation rules.

**Template JSON structure:** Each `templates/{name}/template.json` wraps the module config: `{ name, description, version, config: { module, entity, screens[], fields[], api, i18n } }`. The `create` command unwraps the `config` key automatically — both flat and wrapped formats are accepted.

**`--only` flag:** Enables partial regeneration by category. Valid categories: `base`, `configs`, `screens`, `utils`, `services`, `hooks`, `i18n`. When `--only` is used, deintegration is skipped (existing host-app registration remains valid).

**`--force` without `--only`:** Deintegrates the module from the host app first, then regenerates, then re-integrates. Use this to avoid stale workspace dependencies or duplicate init calls.

**API endpoints:** Screens and services use `ENDPOINTS.{ENTITY}.CREATE/UPDATE/SEARCH` (from generated `src/services/apiEndpoints.js`) instead of hardcoded URL strings. `constantCase` of entity name is the key (e.g. `ENDPOINTS.HRMS.CREATE`).

**react-query v5 API:** Generated hooks use `isPending` (not `isLoading`) and `mutateAsync` (not `mutate`) — react-query v5 renamed these.

**API spec parsing:** `apiSpecParser.js` uses a WeakSet circular-ref guard when dereferencing `$ref` pointers. OpenAPI type mapping: `string` → text, `integer/number` → number, `boolean` → toggle, `string + enum` → dropdown, `string + format=date` → date, `string + format=email` → email.

## Sample Configs & API Specs (in `digit-module-generator/`)

Real-world configs for manual testing:
- `employee-config.json`, `propertytax-config.json`, `trade-license-config.json`
- `property-registry-api.yaml` (58KB), `trade-license-api.yaml` (52KB) — OpenAPI specs for `--api-spec` testing

## Documentation (in `docs/`)

| File | Purpose |
|------|---------|
| `DEVELOPER_GUIDE.md` | Architecture deep-dive & extension guide |
| `CONFIGURATION_GUIDE.md` | Full config schema reference |
| `FIELD_TYPES_REFERENCE.md` | All 22 field types with examples |
| `TESTING_GUIDE.md` | Testing generated modules end-to-end |
| `BUG_TRACKING.md` | Known issues, fixes, and regression notes |
| `USER_GUIDE.md` | End-user tutorial |
