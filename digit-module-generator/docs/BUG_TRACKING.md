# Bug Tracking Sheet - DIGIT Module Generator

## Overview
This document tracks all identified bugs, their status, and fixes for the DIGIT Module Generator CLI tool.

---

## Bug Summary

| Bug ID | Category | Status | Priority | Description |
|--------|----------|--------|----------|-------------|
| BUG-001 | Template | ✅ CLOSED | High | Export name mismatch in createConfigGenerator |
| BUG-002 | Template | ✅ CLOSED | High | Import path case mismatch (camelCase vs PascalCase) |
| BUG-003 | Template | ✅ CLOSED | Medium | isMandatory outputs nothing when undefined |
| BUG-004 | Template | ✅ CLOSED | High | search.hbs uses digit-ui-react-components |
| BUG-005 | Template | ✅ CLOSED | High | view.hbs uses digit-ui-react-components |
| BUG-006 | Template | ✅ CLOSED | Medium | inbox.hbs - no issues found (verified OK) |
| BUG-007 | Module | ✅ CLOSED | Low | Module.js missing Loader import |
| BUG-008 | Generator | ✅ CLOSED | High | package.json template has react-components in peerDeps |
| BUG-009 | Generator | ✅ CLOSED | Medium | webpack.config.js has react-components in externals |
| BUG-010 | Generator | ✅ CLOSED | High | webpack.config.js missing react-i18next in externals |
| BUG-011 | Generator | ✅ CLOSED | Medium | Duplicate validation block for mobileNumber fields |
| BUG-012 | Generator | ✅ CLOSED | Medium | HTML entity encoding in option names (& → &amp;) |
| BUG-013 | Generator | ✅ CLOSED | High | multiselectdropdown missing options/optionsKey in config |
| BUG-014 | Generator | ✅ CLOSED | High | apidropdown missing apiConfig properties in config |
| BUG-015 | Generator | ✅ CLOSED | Medium | component field missing component property in config |
| BUG-016 | Generator | ✅ CLOSED | High | createUtils.js missing transformations for many field types |
| BUG-017 | Generator | ✅ CLOSED | Medium | toLocalizationKey helper doesn't handle spaces/hyphens |

---

## Detailed Bug Reports

### BUG-001: Export name mismatch in createConfigGenerator
**Status:** ✅ CLOSED (Fixed: 2026-01-23)
**Priority:** High
**File:** `src/generators/configGenerators/createConfigGenerator.js`

**Issue:**
Generated config files exported `config` instead of `{entityName}CreateConfig`, causing import errors in screen components.

**Error:**
```
export 'employeeCreateConfig' (imported as 'employeeCreateConfig') was not found in '../../configs/EmployeeCreateConfig'
```

**Fix:**
Changed template to use `{{camelCase entity.name}}CreateConfig` for export name.

---

### BUG-002: Import path case mismatch
**Status:** ✅ CLOSED (Fixed: 2026-01-23)
**Priority:** High
**Files:** `templates/screens/search.hbs`, `templates/screens/inbox.hbs`

**Issue:**
Import statements used camelCase for config file paths, but files are generated with PascalCase.

**Error:**
```
Module not found: Can't resolve '../../configs/employeeSearchConfig'
```

**Fix:**
Updated templates to use `{{pascalCase config.entity.name}}` for config import paths.

---

### BUG-003: isMandatory outputs nothing when undefined
**Status:** ✅ CLOSED (Fixed: 2026-01-23)
**Priority:** Medium
**File:** `src/generators/configGenerators/createConfigGenerator.js`

**Issue:**
When `isMandatory` is not specified in config, the template outputs nothing instead of `false`.

**Fix:**
Added conditional: `isMandatory: {{#if isMandatory}}true{{else}}false{{/if}}`

---

### BUG-004: search.hbs uses digit-ui-react-components
**Status:** ✅ CLOSED (Fixed: 2026-02-02)
**Priority:** High
**File:** `templates/screens/search.hbs`

**Issue:**
Template imports from deprecated `@egovernments/digit-ui-react-components`:
```javascript
import { Header, Loader, Button, AddFilled } from "@egovernments/digit-ui-react-components";
```

**Expected:**
All imports should use `@egovernments/digit-ui-components` only.

**Fix Applied:**
Updated search.hbs to use correct imports:
```javascript
import { InboxSearchComposer, Button } from "@egovernments/digit-ui-components";
```

---

### BUG-005: view.hbs uses digit-ui-react-components
**Status:** ✅ CLOSED (Fixed: 2026-02-02)
**Priority:** High
**File:** `templates/screens/view.hbs`

**Issue:**
Template imports from deprecated `@egovernments/digit-ui-react-components`:
```javascript
import { Header, ViewComposer } from "@egovernments/digit-ui-react-components";
```

**Expected:**
All imports should use `@egovernments/digit-ui-components` only.

**Fix Applied:**
Updated view.hbs to use correct imports:
```javascript
import { Loader, ViewComposer } from "@egovernments/digit-ui-components";
```

---

### BUG-006: inbox.hbs import audit
**Status:** ✅ CLOSED (Verified: 2026-02-02)
**Priority:** Medium
**File:** `templates/screens/inbox.hbs`

**Issue:**
Need to audit for any digit-ui-react-components imports.

**Result:**
✅ Audited - inbox.hbs already uses only `@egovernments/digit-ui-components`. No changes needed.
```javascript
import { InboxSearchComposer } from "@egovernments/digit-ui-components";
```

---

### BUG-007: Module.js missing Loader import
**Status:** ✅ CLOSED (Fixed: 2026-02-02)
**Priority:** Low
**File:** Generated `Module.js` files

**Issue:**
Module.js uses `<Loader />` component but doesn't import it.

**Error:**
```
'Loader' is not defined
```

**Fix Applied:**
Updated moduleGenerator.js to include Loader import in generated Module.js:
```javascript
import { CommonScreen, Loader } from "@egovernments/digit-ui-components";
```

---

### BUG-008: package.json template has react-components in peerDependencies
**Status:** ✅ CLOSED (Fixed: 2026-02-02)
**Priority:** High
**File:** `src/generators/moduleGenerator.js` (line 132)

**Issue:**
Generated package.json includes `@egovernments/digit-ui-react-components` in peerDependencies:
```javascript
"@egovernments/digit-ui-react-components": "2.0.0-dev-08",
```

**Expected:**
Should only list `@egovernments/digit-ui-components` as dependency.

**Fix Applied:**
Removed react-components from peerDependencies. Now only includes:
```javascript
"@egovernments/digit-ui-svg-components": "2.0.0-dev-01",
"@egovernments/digit-ui-components": "2.0.0-dev-31"
```

---

### BUG-009: webpack.config.js has react-components in externals
**Status:** ✅ CLOSED (Fixed: 2026-02-02)
**Priority:** Medium
**File:** `src/generators/moduleGenerator.js` (line 200)

**Issue:**
Generated webpack.config.js includes react-components in externals:
```javascript
'@egovernments/digit-ui-react-components': '@egovernments/digit-ui-react-components'
```

**Expected:**
Should only reference `@egovernments/digit-ui-components`.

**Fix Applied:**
Updated externals to only reference digit-ui-components:
```javascript
externals: {
  react: 'react',
  'react-dom': 'react-dom',
  'react-router-dom': 'react-router-dom',
  '@egovernments/digit-ui-components': '@egovernments/digit-ui-components'
}
```

---

### BUG-010: webpack.config.js missing react-i18next in externals
**Status:** ✅ CLOSED (Fixed: 2026-02-09)
**Priority:** High
**File:** `src/generators/moduleGenerator.js`

**Issue:**
Generated webpack.config.js does not include `react-i18next` in externals. Since all screen components import `useTranslation` from `react-i18next`, webpack fails to resolve it during build.

**Error:**
```
Module not found: Error: Can't resolve 'react-i18next'
```

**Fix Applied:**
Added `'react-i18next': 'react-i18next'` to the externals object in the webpack config template.

---

### BUG-011: Duplicate validation block for mobileNumber fields
**Status:** ✅ CLOSED (Fixed: 2026-02-09)
**Priority:** Medium
**File:** `src/generators/configGenerators/createConfigGenerator.js`

**Issue:**
When a mobileNumber field has validation defined in the config JSON, the generated config outputs two `validation:` blocks — one from the generic validation handler, and one from the mobileNumber-specific handler.

**Fix Applied:**
Wrapped the mobileNumber default validation with `{{#unless validation}}` so it only outputs when no validation is already defined.

---

### BUG-012: HTML entity encoding in option names
**Status:** ✅ CLOSED (Fixed: 2026-02-09)
**Priority:** Medium
**Files:** All config generators (createConfigGenerator.js, searchConfigGenerator.js, inboxConfigGenerator.js)

**Issue:**
Handlebars double-stash `{{}}` HTML-encodes special characters. Option names like "Food & Beverages" become "Food &amp; Beverages" in generated code.

**Fix Applied:**
Changed option `code` and `name` fields to use triple-stash `{{{code}}}` and `{{{name}}}` to output raw unescaped values. Also fixed `description` fields.

---

### BUG-013: multiselectdropdown missing options/optionsKey in config
**Status:** ✅ CLOSED (Fixed: 2026-02-09)
**Priority:** High
**File:** `src/generators/configGenerators/createConfigGenerator.js`

**Issue:**
The `multiselectdropdown` field type was not handled in the createConfig template. Generated configs for multiselect fields were missing `optionsKey`, `allowMultiSelect`, and `options` properties.

**Fix Applied:**
Added dedicated `{{#if (eq type 'multiselectdropdown')}}` block with proper options, optionsKey, allowMultiSelect, and mdms support.

---

### BUG-014: apidropdown missing apiConfig properties in config
**Status:** ✅ CLOSED (Fixed: 2026-02-09)
**Priority:** High
**File:** `src/generators/configGenerators/createConfigGenerator.js`

**Issue:**
The `apidropdown` field type was not handled. Generated configs were missing `url`, `optionsKey`, and `optionValue` properties needed for API-driven dropdowns.

**Fix Applied:**
Added dedicated `{{#if (eq type 'apidropdown')}}` block that outputs `url`, `optionsKey`, `optionValue`, and `allowMultiSelect` from the field's `apiConfig`.

---

### BUG-015: component field missing component property in config
**Status:** ✅ CLOSED (Fixed: 2026-02-09)
**Priority:** Medium
**File:** `src/generators/configGenerators/createConfigGenerator.js`

**Issue:**
The `component` field type was not handled. Generated configs were missing the `component` property needed to reference the custom React component.

**Fix Applied:**
Added `{{#if (eq type 'component')}}` block that outputs the `component` property. Also added `checkbox` and `toggle` default value handling.

---

### BUG-016: createUtils.js missing transformations for many field types
**Status:** ✅ CLOSED (Fixed: 2026-02-09)
**Priority:** High
**File:** `src/generators/utilsGenerators/createUtilsGenerator.js`

**Issue:**
The createUtils template only handled: text, number, amount, date, dropdown, textarea, mobileNumber, email, checkbox, multiselect. Missing transformations for: radio, radioordropdown, toggle, multiselectdropdown, locationdropdown, apidropdown, time, password, search, geolocation, numeric, url, component.

**Fix Applied:**
Added transformation handlers for all missing field types:
- `toggle` → Boolean
- `radio`, `radioordropdown`, `locationdropdown`, `apidropdown` → code extraction
- `multiselectdropdown` → array of codes
- `time`, `password`, `search`, `geolocation`, `url`, `component` → pass-through
- `numeric` → parseInt

---

## Components Migration Guide

### From digit-ui-react-components to digit-ui-components

| Old Import | New Import | Notes |
|------------|------------|-------|
| `Header` | `Header` or `HeaderComponent` | Check digit-ui-components exports |
| `Loader` | `Loader` | Available in digit-ui-components |
| `Button` | `Button` | Available in digit-ui-components |
| `AddFilled` | `AddFilled` | Check SVG components package |
| `ViewComposer` | `ViewComposer` | May need alternative |

---

## Testing Checklist

- [x] Generate employee-mgmt module - ✅ verified (2026-02-02)
- [x] Generate inventory-mgmt module - ✅ verified (2026-02-02)
- [x] Generate project-mgmt module - ✅ verified (2026-02-02)
- [x] All imports resolve correctly (templates verified)
- [x] All exports match expected names (BUG-001, BUG-002 fixed)
- [x] No references to digit-ui-react-components in generated code (all templates migrated)

**All tests passed!** 🎉

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-23 | 0.1.0 | Initial bug tracking document created |
| 2026-01-23 | 0.1.1 | Fixed BUG-001, BUG-002, BUG-003 |
| 2026-02-02 | 0.2.0 | Fixed BUG-004, BUG-005, BUG-007, BUG-008, BUG-009. Verified BUG-006. All bugs now CLOSED |
| 2026-02-09 | 0.3.0 | Fixed BUG-010 through BUG-016. All field types now generate correctly. All templates compile successfully |
| 2026-02-17 | 0.4.0 | Week 4 complete. Added custom and landing screen templates. Fixed BUG-017. 7 screen types now supported |

---

## Completed Tasks (Week 2)

All Week 2 dependency migration tasks have been completed:

- [x] Audit all templates for digit-ui-react-components usage
- [x] Update search.hbs - replace react-components imports
- [x] Update view.hbs - replace react-components imports
- [x] Update inbox.hbs - verify and fix imports (was already correct)
- [x] Update create.hbs - uses digit-ui-components
- [x] Update response.hbs - uses digit-ui-components
- [x] Update package.json template to remove react-components dependency
- [x] Update webpack.config.js externals
- [x] Update Module.js template with correct Loader import
- [x] Test all templates with new dependencies - ✅ verified (2026-02-02)

---

## Testing Checklist (Updated 2026-02-09)

- [x] Generate employee-mgmt module - ✅ verified
- [x] Generate inventory-mgmt module - ✅ verified
- [x] Generate project-mgmt module - ✅ verified (webpack build passes)
- [x] Generate field-showcase module - ✅ verified (webpack build passes)
- [x] All imports resolve correctly
- [x] All exports match expected names
- [x] No references to digit-ui-react-components
- [x] All 22 field types generate correct config
- [x] webpack build succeeds for all generated modules
- [x] Generate custom screen standalone - ✅ verified
- [x] Generate landing screen standalone - ✅ verified
- [x] Generate showcase with custom+landing - ✅ verified (webpack build passes)
- [x] Generate employee-mgmt (hrms) - ✅ verified (webpack build passes, no regressions)

**All tests passed!**

---

### BUG-017: toLocalizationKey helper doesn't handle spaces/hyphens
**Status:** ✅ CLOSED (Fixed: 2026-02-17)
**Priority:** Medium
**Files:** All generators (moduleGenerator.js, screenGenerator.js, createConfigGenerator.js, searchConfigGenerator.js, inboxConfigGenerator.js, viewConfigGenerator.js)

**Issue:**
The `toLocalizationKey` Handlebars helper only handled camelCase to CONSTANT_CASE conversion. Module names with spaces (e.g., "Field Showcase") produced invalid localization keys with spaces: `SHOWCASE_FIELD SHOWCASE` instead of `SHOWCASE_FIELD_SHOWCASE`.

**Fix Applied:**
Added `.replace(/[\s-]+/g, '_')` before the camelCase conversion in all 6 files that register the `toLocalizationKey` helper.

---

## Next Steps (Week 5+)

1. ~~Run end-to-end build tests on all templates~~ ✅ Done
2. ~~Verify generated modules compile without errors~~ ✅ Done
3. ~~Create showcase template with ALL field types~~ ✅ Done
4. ~~Fix all field type generation issues~~ ✅ Done
5. ~~Independent Screen Generation (Week 4)~~ ✅ Done
6. ~~Add custom and landing page screen templates~~ ✅ Done
7. Begin Week 5 tasks: Interactive Mode & Advanced Features
