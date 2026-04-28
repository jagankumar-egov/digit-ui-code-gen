# DIGIT Module Generator -- Configuration Guide

This document describes the JSON configuration format accepted by the `digit-gen` CLI tool. A valid configuration file drives the generation of a complete DIGIT micro-UI module, including create, search, inbox, view, response, and custom screens.

---

## Table of Contents

1. [Config Structure Overview](#config-structure-overview)
2. [Module Section](#module-section)
3. [Entity Section](#entity-section)
4. [Screens Section](#screens-section)
5. [Fields Section](#fields-section)
6. [API Section](#api-section)
7. [Auth Section](#auth-section)
8. [Workflow Section](#workflow-section)
9. [i18n Section](#i18n-section)
10. [Complete Example](#complete-example)
11. [Validation](#validation)
12. [Business Logic Rules](#business-logic-rules)

---

## Config Structure Overview

The configuration is a JSON object with these top-level keys:

```json
{
  "module": { ... },
  "entity": { ... },
  "screens": { ... },
  "fields": [ ... ],
  "api": { ... },
  "auth": { ... },
  "workflow": { ... },
  "i18n": { ... }
}
```

**Required keys:** `module`, `entity`, `screens`, `fields`

**Optional keys:** `api`, `auth`, `workflow`, `i18n`

> Note: If the config is wrapped inside a template file (as in the built-in templates), it appears under a `"config"` key alongside template metadata like `"name"`, `"description"`, and `"author"`. The validator operates on the inner `config` object.

---

## Module Section

Describes the module being generated.

```json
{
  "module": {
    "name": "Employee Management",
    "code": "employee-mgmt",
    "description": "Comprehensive employee management system",
    "version": "1.0.0"
  }
}
```

| Property      | Type   | Required | Constraints                                      |
|---------------|--------|----------|--------------------------------------------------|
| `name`        | string | Yes      | Minimum length 1. Human-readable module name.    |
| `code`        | string | Yes      | Kebab-case only: lowercase letters, digits, and hyphens. Pattern: `^[a-z0-9-]+$` |
| `description` | string | Yes      | Minimum length 1. Brief description of the module. |
| `version`     | string | No       | Semver format: `MAJOR.MINOR.PATCH`. Pattern: `^\d+\.\d+\.\d+$` |

No additional properties are allowed.

---

## Entity Section

Defines the primary data entity that the module manages.

```json
{
  "entity": {
    "name": "Employee",
    "apiPath": "/employee-service/v1",
    "primaryKey": "employeeId",
    "displayField": "employeeName"
  }
}
```

| Property       | Type   | Required | Constraints                                         |
|----------------|--------|----------|-----------------------------------------------------|
| `name`         | string | Yes      | PascalCase. Pattern: `^[A-Z][a-zA-Z0-9]*$`          |
| `apiPath`      | string | Yes      | Must start with `/`. Pattern: `^/.*`                 |
| `primaryKey`   | string | Yes      | The field name used as the unique identifier.        |
| `displayField` | string | Yes      | The field name shown as the display label in lists.  |

No additional properties are allowed.

---

## Screens Section

Controls which screens are generated and their per-screen configuration. At least one screen must be defined (`minProperties: 1`).

Valid screen types: `create`, `search`, `inbox`, `view`, `response`, `custom`, `landing`

Each screen object has:

| Property  | Type     | Required | Description                                    |
|-----------|----------|----------|------------------------------------------------|
| `enabled` | boolean  | Yes      | Whether to generate this screen.               |
| `roles`   | string[] | No       | Roles allowed to access this screen. If provided when `enabled` is true, must be a non-empty array. |

Screens accept additional properties beyond `enabled` and `roles`, depending on the screen type. The sections below document common extras.

### create

Generates the form for creating a new entity record.

```json
{
  "create": {
    "enabled": true,
    "roles": ["EMPLOYEE_ADMIN", "HR_MANAGER"],
    "workflow": true
  }
}
```

- `workflow` (boolean) -- Whether to trigger a workflow transition on submission.

### search

Generates the search screen with filters and a results table.

```json
{
  "search": {
    "enabled": true,
    "roles": ["EMPLOYEE_ADMIN", "EMPLOYEE_VIEWER"],
    "filters": ["department", "designation", "status"],
    "minSearchFields": 1,
    "showFooter": true
  }
}
```

- `filters` (string[]) -- Field names to use as search filters.
- `minSearchFields` (number) -- Minimum number of fields the user must fill before searching.
- `showFooter` (boolean) -- Whether to show a footer in the results table.

**Dependency:** At least one field in the `fields` array must have `"searchable": true`.

### inbox

Generates a workflow-driven inbox screen showing pending tasks.

```json
{
  "inbox": {
    "enabled": true,
    "roles": ["EMPLOYEE_ADMIN", "HR_MANAGER"],
    "businessService": "employee-onboarding"
  }
}
```

- `businessService` (string) -- The workflow business service name.

**Dependency:** The top-level `workflow` section must have `"enabled": true` and a `businessService` defined.

### view

Generates a detail view screen for a single entity record.

```json
{
  "view": {
    "enabled": true,
    "roles": ["EMPLOYEE_ADMIN", "EMPLOYEE_VIEWER"],
    "sections": ["basic", "contact", "employment"]
  }
}
```

- `sections` (string[]) -- Logical groupings for organizing fields on the view page.

**Dependency:** A field matching the entity's `primaryKey` (or named `id`) must exist in the `fields` array.

### response

Generates the confirmation/success screen shown after form submission.

```json
{
  "response": {
    "enabled": true,
    "types": ["basic", "workflow"]
  }
}
```

- `types` (string[]) -- Types of response screens to generate. Use `"basic"` for standard confirmation, `"workflow"` for workflow-aware responses.

### custom

Generates a self-contained custom screen (no config file needed).

```json
{
  "custom": {
    "enabled": true,
    "roles": ["SHOWCASE_ADMIN"]
  }
}
```

### landing

Generates a landing page with a Card component.

```json
{
  "landing": {
    "enabled": true,
    "roles": ["SHOWCASE_ADMIN", "SHOWCASE_VIEWER"]
  }
}
```

---

## Fields Section

A top-level array of field objects. This is the central definition of all data fields used across screens. Minimum one field is required.

```json
{
  "fields": [
    {
      "name": "employeeName",
      "type": "text",
      "label": "Employee Name",
      "required": true,
      "searchable": true,
      "showInResults": true,
      "showInView": true,
      "validation": {
        "pattern": "^[A-Za-z\\s]+$",
        "maxLength": 100
      }
    }
  ]
}
```

### Field Object Properties

| Property             | Type    | Required | Description                                              |
|----------------------|---------|----------|----------------------------------------------------------|
| `name`               | string  | Yes      | Alphanumeric, starts with a letter. Pattern: `^[a-zA-Z][a-zA-Z0-9]*$`. Must be unique across all fields. |
| `type`               | string  | Yes      | One of the supported field types (see below).            |
| `label`              | string  | Yes      | Human-readable label for the field.                      |
| `required`           | boolean | Yes      | Whether the field is mandatory.                          |
| `searchable`         | boolean | No       | Include this field in the search screen.                 |
| `filterable`         | boolean | No       | Include this field as a search filter.                   |
| `showInResults`      | boolean | No       | Show in search results table columns.                    |
| `showInView`         | boolean | No       | Show on the view detail screen.                          |
| `showInInboxResults` | boolean | No       | Show in inbox results table columns.                     |
| `inboxSearchable`    | boolean | No       | Include this field in inbox search.                      |
| `description`        | string  | No       | Description/help text for the field.                     |
| `key`                | string  | No       | Custom key for data mapping.                             |
| `inline`             | boolean | No       | Render the field inline.                                 |
| `validation`         | object  | No       | Validation rules (see below).                            |
| `options`            | array   | No       | Static options for dropdown/radio/multiselect fields.    |
| `mdms`               | object  | No       | MDMS configuration for dynamic options.                  |

### Supported Field Types

| Type                  | Description                                           |
|-----------------------|-------------------------------------------------------|
| `text`                | Standard single-line text input.                      |
| `number`              | Numeric input for integers.                           |
| `numeric`             | Numeric input (alternative).                          |
| `date`                | Date picker.                                          |
| `datetime`            | Date and time picker.                                 |
| `time`                | Time picker.                                          |
| `email`               | Email input with pattern validation.                  |
| `url`                 | URL input.                                            |
| `password`            | Masked password input.                                |
| `textarea`            | Multi-line text area.                                 |
| `dropdown`            | Single-select dropdown. Requires `options` or `mdms`. |
| `radio`               | Radio button group. Requires `options` or `mdms`.     |
| `checkbox`            | Checkbox for boolean values.                          |
| `toggle`              | Toggle switch for on/off.                             |
| `multiselect`         | Multi-select list. Requires `options` or `mdms`.      |
| `multiselectdropdown` | Multi-select dropdown.                                |
| `radioordropdown`     | Auto-switches between radio (3 or fewer options) and dropdown (more than 3). |
| `mobileNumber`        | Phone number input with digit validation.             |
| `amount`              | Currency/amount input with INR prefix.                |
| `locationdropdown`    | Hierarchical location dropdown (State > District > Ward). |
| `apidropdown`         | Dropdown populated from an API endpoint.              |
| `file`                | File upload.                                          |
| `component`           | Custom React component.                               |
| `search`              | Search input with icon.                               |
| `geolocation`         | Geolocation coordinates input.                        |

### Validation Object

```json
{
  "validation": {
    "pattern": "^[A-Za-z\\s]+$",
    "minLength": 3,
    "maxLength": 100,
    "min": 0,
    "max": 10000,
    "step": 0.01
  }
}
```

| Property    | Type   | Description                                                  |
|-------------|--------|--------------------------------------------------------------|
| `pattern`   | string | Regular expression pattern for input validation.             |
| `minLength` | number | Minimum string length (>= 0).                               |
| `maxLength` | number | Maximum string length (>= 1).                               |
| `min`       | number | Minimum numeric value.                                       |
| `max`       | number | Maximum numeric value.                                       |
| `step`      | number | Step increment for numeric inputs (> 0).                     |

**Constraints:**
- `min` must not be greater than `max`.
- `minLength` must not be greater than `maxLength`.
- `amount` fields should define `validation.min`.
- `mobileNumber` fields should define both `validation.min` and `validation.max`.
- `date` and `datetime` fields should not use `minLength` or `maxLength`.

### Options Array

For `dropdown`, `radio`, `multiselect`, `multiselectdropdown`, and `radioordropdown` fields, provide static options:

```json
{
  "options": [
    { "code": "ACTIVE", "name": "Active" },
    { "code": "INACTIVE", "name": "Inactive" }
  ]
}
```

Each option object requires:
- `code` (string) -- Unique internal code.
- `name` (string) -- Display label.

### MDMS Configuration

For fields that pull options from the DIGIT MDMS service:

```json
{
  "mdms": {
    "masterName": "Department",
    "moduleName": "common-masters",
    "localePrefix": "COMMON_DEPARTMENT_"
  }
}
```

| Property       | Type   | Required | Description                                      |
|----------------|--------|----------|--------------------------------------------------|
| `masterName`   | string | Yes      | MDMS master name.                                |
| `moduleName`   | string | Yes      | MDMS module name.                                |
| `localePrefix` | string | No       | Prefix for i18n localization keys.               |

### Selection Fields Requirement

Fields of type `dropdown`, `radio`, or `multiselect` must provide either an `options` array or an `mdms` configuration. Omitting both will cause a validation error.

---

## API Section

Defines the API endpoints for CRUD operations.

```json
{
  "api": {
    "create": "/employee/_create",
    "update": "/employee/_update",
    "search": "/employee/_search",
    "view": "/employee/{id}",
    "workflow": "/workflow/_transition"
  }
}
```

| Property   | Type   | Required | Constraints                                     |
|------------|--------|----------|-------------------------------------------------|
| `create`   | string | No       | Must start with `/`.                            |
| `update`   | string | No       | Must start with `/`.                            |
| `search`   | string | No       | Must start with `/`.                            |
| `view`     | string | No       | Must start with `/`.                            |
| `workflow`  | string | No       | Must start with `/` or be empty (when workflow is disabled). |

Additional API paths are allowed.

---

## Auth Section

Controls authentication and role-based access.

```json
{
  "auth": {
    "required": true,
    "roles": ["EMPLOYEE_ADMIN", "EMPLOYEE_VIEWER", "HR_MANAGER"]
  }
}
```

| Property   | Type     | Required | Description                                           |
|------------|----------|----------|-------------------------------------------------------|
| `required` | boolean  | Yes      | Whether authentication is required.                   |
| `roles`    | string[] | No       | Allowed roles. **Must be a non-empty array when `required` is `true`.** |

No additional properties are allowed.

---

## Workflow Section

Controls integration with the DIGIT workflow engine.

```json
{
  "workflow": {
    "enabled": true,
    "businessService": "employee-onboarding"
  }
}
```

| Property          | Type    | Required | Description                                       |
|-------------------|---------|----------|---------------------------------------------------|
| `enabled`         | boolean | Yes      | Whether workflow is active.                       |
| `businessService` | string  | No       | The workflow business service name. **Required when `enabled` is `true`.** |

No additional properties are allowed.

**Dependency:** The inbox screen requires workflow to be enabled with a `businessService` defined.

---

## i18n Section

Controls internationalization key generation.

```json
{
  "i18n": {
    "prefix": "EMP_",
    "generateKeys": true
  }
}
```

| Property       | Type    | Required | Description                                            |
|----------------|---------|----------|--------------------------------------------------------|
| `prefix`       | string  | No       | Prefix for generated i18n keys. Must be uppercase letters and underscores, ending with `_`. Pattern: `^[A-Z_]+_$` |
| `generateKeys` | boolean | No       | Whether to auto-generate localization keys.            |

No additional properties are allowed.

---

## Complete Example

Below is a minimal but complete configuration for a project management module:

```json
{
  "module": {
    "name": "Project Tracker",
    "code": "project-tracker",
    "description": "Track and manage projects",
    "version": "1.0.0"
  },
  "entity": {
    "name": "Project",
    "apiPath": "/project-service/v1",
    "primaryKey": "projectId",
    "displayField": "projectName"
  },
  "screens": {
    "create": {
      "enabled": true,
      "roles": ["PROJECT_ADMIN"]
    },
    "search": {
      "enabled": true,
      "roles": ["PROJECT_ADMIN", "PROJECT_VIEWER"],
      "minSearchFields": 1
    },
    "view": {
      "enabled": true,
      "roles": ["PROJECT_ADMIN", "PROJECT_VIEWER"]
    },
    "response": {
      "enabled": true
    }
  },
  "fields": [
    {
      "name": "projectId",
      "type": "text",
      "label": "Project ID",
      "required": true,
      "searchable": true,
      "showInResults": true,
      "showInView": true,
      "validation": {
        "pattern": "^PRJ[0-9]{6}$",
        "maxLength": 9
      }
    },
    {
      "name": "projectName",
      "type": "text",
      "label": "Project Name",
      "required": true,
      "searchable": true,
      "showInResults": true,
      "showInView": true,
      "validation": {
        "minLength": 3,
        "maxLength": 200
      }
    },
    {
      "name": "description",
      "type": "textarea",
      "label": "Description",
      "required": false,
      "showInView": true,
      "validation": {
        "maxLength": 1000
      }
    },
    {
      "name": "startDate",
      "type": "date",
      "label": "Start Date",
      "required": true,
      "showInResults": true,
      "showInView": true
    },
    {
      "name": "budget",
      "type": "amount",
      "label": "Budget",
      "required": true,
      "showInResults": true,
      "showInView": true,
      "validation": {
        "min": 0,
        "max": 100000000
      }
    },
    {
      "name": "status",
      "type": "dropdown",
      "label": "Status",
      "required": true,
      "searchable": true,
      "filterable": true,
      "showInResults": true,
      "showInView": true,
      "options": [
        { "code": "PLANNING", "name": "Planning" },
        { "code": "IN_PROGRESS", "name": "In Progress" },
        { "code": "COMPLETED", "name": "Completed" },
        { "code": "ON_HOLD", "name": "On Hold" }
      ]
    }
  ],
  "api": {
    "create": "/project/_create",
    "update": "/project/_update",
    "search": "/project/_search",
    "view": "/project/{id}",
    "workflow": ""
  },
  "auth": {
    "required": true,
    "roles": ["PROJECT_ADMIN", "PROJECT_VIEWER"]
  },
  "workflow": {
    "enabled": false,
    "businessService": ""
  },
  "i18n": {
    "prefix": "PROJECT_",
    "generateKeys": true
  }
}
```

---

## Validation

Use the `digit-gen validate` command to check your configuration before generating a module:

```bash
digit-gen validate --config myconfig.json
```

This runs both schema validation (via AJV) and business logic checks. On success, it prints a configuration summary showing the module name, entity, enabled screens, field count, auth status, and workflow status.

### Validate Against an API Specification

You can optionally validate your config against an OpenAPI/Swagger spec to check that field names and required status match the API schema:

```bash
digit-gen validate --config myconfig.json --apiSpec openapi.yaml
```

This reports any fields present in the API but missing from your config, and vice versa.

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `module.code` pattern mismatch | Code contains uppercase or spaces | Use kebab-case: `"employee-mgmt"` |
| `entity.name` pattern mismatch | Name is not PascalCase | Capitalize first letter: `"Employee"` |
| `entity.apiPath` pattern mismatch | Path does not start with `/` | Add leading slash: `"/employee-service/v1"` |
| `workflow.businessService is required` | Workflow enabled without service name | Set `businessService` or disable workflow |
| `Workflow must be enabled to use inbox` | Inbox enabled but workflow disabled | Enable workflow or disable inbox |
| `dropdown/radio/multiselect fields must have options or mdms` | Selection field has neither | Add `options` array or `mdms` object |
| `Duplicate field names found` | Two fields share the same `name` | Rename one of the duplicate fields |
| `auth.roles must be defined` | Auth required but no roles listed | Add a non-empty `roles` array |
| `i18n.prefix must end with underscore` | Prefix missing trailing `_` | Use format like `"EMP_"` |
| `validation.min cannot be greater than validation.max` | Inverted min/max | Swap the values |

---

## Business Logic Rules

Beyond schema validation, the following business rules are enforced:

1. **Inbox requires workflow.** If `screens.inbox.enabled` is `true`, then `workflow.enabled` must also be `true` and `workflow.businessService` must be set.

2. **Search requires searchable fields.** If `screens.search.enabled` is `true`, at least one field must have `"searchable": true`.

3. **View requires a primary key field.** If `screens.view.enabled` is `true`, a field matching the entity's `primaryKey` (or named `id`) must exist in the `fields` array.

4. **Auth roles required when auth is required.** If `auth.required` is `true`, `auth.roles` must be a non-empty array.

5. **Selection fields need data sources.** Fields of type `dropdown`, `radio`, or `multiselect` must have either `options` or `mdms`.

6. **No duplicate field names.** Every field `name` in the `fields` array must be unique.

7. **Screen roles must be non-empty.** If a screen has `enabled: true` and a `roles` property, that `roles` array must not be empty.
