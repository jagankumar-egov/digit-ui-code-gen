# Field Types Reference

This document covers all supported field types in the `digit-gen` module generator. Each field type maps to a DIGIT UI component rendered by `FormComposerV2`.

---

## Field Types Overview

| Type | DIGIT Component | Category | Description |
|------|----------------|----------|-------------|
| `text` | TextInput | Text Input | Standard single-line text input |
| `numeric` | TextInput (type=numeric) | Text Input | Numeric text input variant |
| `number` | TextInput (type=number) | Text Input | Number input with spinner controls |
| `date` | TextInput (type=date) | Text Input | Date picker input |
| `time` | TextInput (type=time) | Text Input | Time picker input |
| `password` | TextInput (type=password) | Text Input | Masked password input |
| `search` | TextInput (type=search) | Text Input | Search input with icon |
| `geolocation` | TextInput (type=geolocation) | Text Input | Geolocation coordinates input |
| `email` | TextInput (type=email) | Text Input | Email input with built-in pattern |
| `url` | TextInput (type=url) | Text Input | URL input |
| `amount` | TextInput (type=amount) | Text Input | Currency input with INR prefix |
| `textarea` | TextArea | Text Input | Multi-line text area |
| `dropdown` | Dropdown | Selection | Single-select dropdown |
| `radio` | RadioButtons | Selection | Radio button group |
| `radioordropdown` | RadioButtons or Dropdown | Selection | Auto-switches based on options count |
| `multiselectdropdown` | MultiSelectDropdown | Selection | Multi-select dropdown |
| `toggle` | Toggle | Boolean | On/off toggle switch |
| `checkbox` | CheckBox | Boolean | Boolean checkbox |
| `mobileNumber` | MobileNumber | Specialized | Phone number input with default validation |
| `locationdropdown` | LocationDropdown | Specialized | Boundary hierarchy picker (State > District > Ward) |
| `apidropdown` | Dropdown (API-sourced) | Specialized | Dropdown populated from API endpoint |
| `component` | Custom React Component | Specialized | Renders a user-defined React component |

---

## Text Input Types

These types all render as `TextInput` variants in DIGIT's FormComposerV2. They differ by the `type` property passed to the component, which controls browser input behavior (keyboard, validation hints, etc.).

### text

Standard single-line text input.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "demoName",
  "type": "text",
  "label": "Demo Name",
  "required": true,
  "description": "Standard text input field",
  "validation": {
    "pattern": "^[a-zA-Z ]+$",
    "minLength": 3,
    "maxLength": 100
  }
}
```

### numeric

Numeric text input variant. Behaves like `text` but with numeric input semantics.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "score",
  "type": "numeric",
  "label": "Score",
  "required": false,
  "validation": {
    "min": 0,
    "max": 100
  }
}
```

### number

Number input with spinner controls, used for whole numbers.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "quantity",
  "type": "number",
  "label": "Quantity",
  "required": true,
  "description": "Numeric input for whole numbers",
  "validation": {
    "min": 0,
    "max": 10000
  }
}
```

### amount

Currency/amount input. Automatically adds an INR prefix to the field. Supports `step` for decimal precision.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation` (including `step`), `inline`, `key`

**Generated config adds:**
- `prefix: "Rs "` in populators

```json
{
  "name": "price",
  "type": "amount",
  "label": "Price",
  "required": true,
  "description": "Currency/amount field with INR prefix",
  "validation": {
    "min": 0,
    "max": 10000000,
    "step": 0.01
  }
}
```

### date

Date picker input. Should not use `minLength`/`maxLength` validation (enforced by config validator).

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `inline`, `key`

```json
{
  "name": "startDate",
  "type": "date",
  "label": "Start Date",
  "required": true,
  "description": "Date picker field"
}
```

### time

Time picker input.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `inline`, `key`

```json
{
  "name": "scheduledTime",
  "type": "time",
  "label": "Scheduled Time",
  "required": false,
  "description": "Time picker field"
}
```

### password

Masked input for sensitive data.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "password",
  "type": "password",
  "label": "Secret Code",
  "required": false,
  "description": "Password/masked input field",
  "validation": {
    "minLength": 6,
    "maxLength": 20
  }
}
```

### search

Text input with a search icon. Useful for keyword/filter fields.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "searchKeyword",
  "type": "search",
  "label": "Search Keyword",
  "required": false,
  "description": "Search input with icon"
}
```

### geolocation

Geolocation coordinates input field.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "geoCoordinates",
  "type": "geolocation",
  "label": "Geo Coordinates",
  "required": false,
  "description": "Geolocation coordinates input",
  "validation": {
    "maxLength": 50
  }
}
```

### email

Email input with built-in pattern validation. If no pattern is provided in validation, the config validator automatically applies: `^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$`.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "contactEmail",
  "type": "email",
  "label": "Contact Email",
  "required": true,
  "validation": {
    "maxLength": 100
  }
}
```

### url

URL input field.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "website",
  "type": "url",
  "label": "Website URL",
  "required": false,
  "validation": {
    "maxLength": 255
  }
}
```

---

## Multi-line Text

### textarea

Multi-line text area for longer content. Maps to the `TextArea` component.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

```json
{
  "name": "longDescription",
  "type": "textarea",
  "label": "Long Description",
  "required": true,
  "description": "Multi-line text area for longer content",
  "validation": {
    "maxLength": 2000
  }
}
```

---

## Selection Types

### dropdown

Single-select dropdown. Options can come from a static list or from MDMS (Master Data Management Service).

**Required properties:** `name`, `type`, `label`, `required`, and one of `options` or `mdms`

**Optional properties:** `description`, `validation`, `inline`, `key`

**Generated config adds:**
- `optionsKey: "name"` in populators

**With static options:**

```json
{
  "name": "category",
  "type": "dropdown",
  "label": "Category",
  "required": true,
  "description": "Single-select dropdown with static options",
  "options": [
    { "code": "ELECTRONICS", "name": "Electronics" },
    { "code": "FURNITURE", "name": "Furniture" },
    { "code": "CLOTHING", "name": "Clothing" }
  ]
}
```

**With MDMS data source:**

```json
{
  "name": "department",
  "type": "dropdown",
  "label": "Department",
  "required": true,
  "description": "Dropdown with MDMS data source",
  "mdms": {
    "masterName": "Department",
    "moduleName": "common-masters",
    "localePrefix": "COMMON_DEPARTMENT_"
  }
}
```

### radio

Radio button group for selecting one option from a small set (typically 2-4 options).

**Required properties:** `name`, `type`, `label`, `required`, `options`

**Optional properties:** `description`, `inline`, `key`

**Generated config adds:**
- `optionsKey: "name"` in populators

```json
{
  "name": "priority",
  "type": "radio",
  "label": "Priority Level",
  "required": true,
  "description": "Radio button selection (up to 3-4 options)",
  "options": [
    { "code": "HIGH", "name": "High Priority" },
    { "code": "MEDIUM", "name": "Medium Priority" },
    { "code": "LOW", "name": "Low Priority" }
  ]
}
```

### radioordropdown

Adaptive selection that automatically switches between `RadioButtons` (when 3 or fewer options) and `Dropdown` (when more than 3 options). Supports both static options and MDMS.

**Required properties:** `name`, `type`, `label`, `required`, and one of `options` or `mdms`

**Optional properties:** `description`, `inline`, `key`

**Generated config adds:**
- `optionsKey: "name"` in populators

```json
{
  "name": "status",
  "type": "radioordropdown",
  "label": "Status",
  "required": true,
  "description": "Auto-switches between radio (<=3 options) and dropdown (>3 options)",
  "options": [
    { "code": "ACTIVE", "name": "Active" },
    { "code": "INACTIVE", "name": "Inactive" },
    { "code": "PENDING", "name": "Pending" },
    { "code": "ARCHIVED", "name": "Archived" }
  ]
}
```

### multiselectdropdown

Dropdown allowing multiple selections. Maps to `MultiSelectDropdown` component.

**Required properties:** `name`, `type`, `label`, `required`, and one of `options` or `mdms`

**Optional properties:** `description`, `inline`, `key`

**Generated config adds:**
- `optionsKey: "name"` in populators
- `allowMultiSelect: true` in populators

```json
{
  "name": "selectedTags",
  "type": "multiselectdropdown",
  "label": "Tags",
  "required": false,
  "description": "Multi-select dropdown allowing multiple selections",
  "options": [
    { "code": "URGENT", "name": "Urgent" },
    { "code": "IMPORTANT", "name": "Important" },
    { "code": "REVIEW", "name": "Needs Review" },
    { "code": "APPROVED", "name": "Approved" },
    { "code": "FEATURED", "name": "Featured" }
  ]
}
```

---

## Boolean Types

### checkbox

Boolean checkbox field. Defaults to `false`.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `inline`, `key`

**Generated config adds:**
- `defaultValue: false` in populators

```json
{
  "name": "isActive",
  "type": "checkbox",
  "label": "Is Active",
  "required": false,
  "description": "Checkbox for boolean values (yes/no)"
}
```

### toggle

On/off toggle switch. Defaults to `false`.

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `inline`, `key`

**Generated config adds:**
- `defaultValue: false` in populators

```json
{
  "name": "enableNotifications",
  "type": "toggle",
  "label": "Enable Notifications",
  "required": false,
  "description": "Toggle switch for on/off settings"
}
```

---

## Specialized Types

### mobileNumber

Phone number input with built-in 10-digit validation. If no `validation` block is provided in the config JSON, the generator automatically adds default min/max validation for Indian mobile numbers (10 digits).

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `validation`, `inline`, `key`

**Default validation (auto-applied when no validation is specified):**
```
min: 1000000000
max: 9999999999
```

```json
{
  "name": "mobileNumber",
  "type": "mobileNumber",
  "label": "Mobile Number",
  "required": true,
  "description": "Phone number with validation (10 digits)",
  "validation": {
    "min": 1000000000,
    "max": 9999999999
  }
}
```

Note: If you provide your own `validation` block, the default is not applied. This prevents duplicate validation rules in the generated config.

### locationdropdown

Hierarchical boundary location picker. Renders a `LocationDropdown` component that supports the DIGIT boundary hierarchy (State > District > Ward).

**Required properties:** `name`, `type`, `label`, `required`

**Optional properties:** `description`, `locationtype`, `multiSelect`, `inline`, `key`

**Generated config adds:**
- `type: "ward"` in populators
- `optionsKey: "i18nKey"` in populators
- `defaultText: "COMMON_SELECT_WARD"` in populators
- `selectedText: "COMMON_SELECTED"` in populators
- `allowMultiSelect: false` in populators

```json
{
  "name": "ward",
  "type": "locationdropdown",
  "label": "Ward/Location",
  "required": false,
  "description": "Location dropdown with hierarchical selection (State > District > Ward)",
  "locationtype": "ward",
  "multiSelect": false
}
```

### apidropdown

Dropdown whose options are fetched from a REST API endpoint at runtime. Requires an `apiConfig` object.

**Required properties:** `name`, `type`, `label`, `required`, `apiConfig`

**Optional properties:** `description`, `inline`, `key`

**apiConfig properties:**

| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| `url` | Yes | -- | API endpoint path (e.g., `/user/_search`) |
| `params` | No | -- | Query parameters object |
| `optionKey` | No | `"name"` | Property to display as the option label |
| `optionValue` | No | `"code"` | Property to use as the option value |

**Generated config adds:**
- `optionsKey` from `apiConfig.optionKey` (defaults to `"name"`)
- `allowMultiSelect: false` in populators
- `url` from `apiConfig.url`
- `optionValue` from `apiConfig.optionValue` (defaults to `"code"`)

```json
{
  "name": "assignedUsers",
  "type": "apidropdown",
  "label": "Assigned Users",
  "required": false,
  "description": "Dropdown populated from API endpoint",
  "apiConfig": {
    "url": "/user/_search",
    "params": { "tenantId": "default" },
    "optionKey": "name",
    "optionValue": "uuid"
  }
}
```

### component

Renders a custom React component. Use this when the built-in field types do not cover your use case. The `component` property must match the name of a registered React component.

**Required properties:** `name`, `type`, `label`, `required`, `component`, `key`

**Optional properties:** `description`, `inline`

**Generated config adds:**
- `component` in populators (the component name string)

```json
{
  "name": "customData",
  "type": "component",
  "label": "Custom Data Component",
  "required": false,
  "description": "Custom React component for complex data entry",
  "component": "CustomDataComponent",
  "key": "customData"
}
```

---

## Validation Options

All field types that accept validation use the same `validation` object structure. The properties available depend on the field type.

| Property | Type | Applicable To | Description |
|----------|------|---------------|-------------|
| `pattern` | string (regex) | text, numeric, password, search, email, url | Regular expression pattern for input validation. Written without delimiters in JSON; the generator wraps it as `/pattern/i`. |
| `minLength` | number (>= 0) | text, textarea, password, search, email, url | Minimum character length |
| `maxLength` | number (>= 1) | text, textarea, password, search, email, url, geolocation | Maximum character length |
| `min` | number | number, numeric, amount, mobileNumber | Minimum numeric value |
| `max` | number | number, numeric, amount, mobileNumber | Maximum numeric value |
| `step` | number (> 0) | amount | Decimal step precision (e.g., `0.01` for currency) |

**Example with multiple validation rules:**

```json
{
  "name": "demoId",
  "type": "text",
  "label": "Demo ID",
  "required": true,
  "validation": {
    "pattern": "^DEMO[0-9]{6}$",
    "maxLength": 10
  }
}
```

**Validation rules enforced by the config validator:**

- `min` cannot be greater than `max`.
- `minLength` cannot be greater than `maxLength`.
- For `mobileNumber`, if no `validation` is provided, the generator auto-applies `min: 1000000000` and `max: 9999999999`.
- For `email`, if no `pattern` is provided, the validator auto-applies `^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$`.
- For `date` and `datetime`, do not use `minLength`/`maxLength` -- the validator will flag this as an error.
- For `amount`, `validation.min` should be defined (validator warns if missing).

---

## Options Format

Field types that present a list of choices (`dropdown`, `radio`, `radioordropdown`, `multiselectdropdown`) use the same options format.

Each option is an object with two required properties:

```json
{
  "code": "OPTION_CODE",
  "name": "Display Label"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `code` | string | Yes | Machine-readable value stored when selected |
| `name` | string | Yes | Human-readable label displayed to the user |

**Example options array:**

```json
"options": [
  { "code": "ELECTRONICS", "name": "Electronics" },
  { "code": "FURNITURE", "name": "Furniture" },
  { "code": "CLOTHING", "name": "Clothing" }
]
```

**Alternative: MDMS data source**

Instead of static options, `dropdown`, `radioordropdown`, and `multiselectdropdown` can fetch options from DIGIT's Master Data Management Service (MDMS):

```json
"mdms": {
  "masterName": "Department",
  "moduleName": "common-masters",
  "localePrefix": "COMMON_DEPARTMENT_"
}
```

| Property | Required | Description |
|----------|----------|-------------|
| `masterName` | Yes | MDMS master name |
| `moduleName` | Yes | MDMS module name |
| `localePrefix` | No | Prefix for i18n locale keys |

When `mdms` is provided, the generated config includes an `mdmsConfig` block in the populators, and options are fetched at runtime from MDMS.

**Validation note:** `dropdown`, `radio`, and `multiselect` fields must have either `options` or `mdms` defined. The config validator will reject the config if neither is present.

---

## Common Field Properties

Every field in the `fields` array shares these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Field identifier (camelCase, alphanumeric). Must match `^[a-zA-Z][a-zA-Z0-9]*$`. |
| `type` | string | Yes | One of the supported field types listed in the overview table. |
| `label` | string | Yes | Display label (also used for i18n key generation). |
| `required` | boolean | Yes | Whether the field is mandatory in the form. |
| `description` | string | No | Help text displayed below the field. Uses triple-stash `{{{description}}}` in templates for raw output. |
| `key` | string | No | Custom key for the field in form data. Required for `component` type. |
| `inline` | boolean | No | When `true`, the field renders inline (side-by-side layout). |
| `searchable` | boolean | No | Makes the field available as a search filter in the search screen. |
| `filterable` | boolean | No | Makes the field available as a filter in search/inbox screens. |
| `showInResults` | boolean | No | Shows the field as a column in search results table. |
| `showInView` | boolean | No | Shows the field in the detail view screen. |
| `showInInboxResults` | boolean | No | Shows the field as a column in inbox results table. |
| `inboxSearchable` | boolean | No | Makes the field searchable within the inbox screen. |
| `validation` | object | No | Validation rules (see Validation Options section). |
| `options` | array | No | Static options for selection types (see Options Format section). |
| `mdms` | object | No | MDMS configuration for selection types. |
| `apiConfig` | object | No | API configuration for `apidropdown` type. |
| `component` | string | No | React component name for `component` type. |
| `preProcess` | object | No | Pre-processing hooks applied before rendering. |

---

## Additional Sections

Beyond the main `fields` array, you can define `additionalSections` in the config to create separate form sections with their own heading. Each section contains its own `body` array of fields:

```json
"additionalSections": [
  {
    "head": "SHOWCASE_ADDITIONAL_SECTION",
    "subHead": "SHOWCASE_ADDITIONAL_SECTION_DESC",
    "body": [
      {
        "name": "additionalNotes",
        "type": "textarea",
        "label": "Additional Notes",
        "key": "additionalNotes",
        "required": false,
        "error": "SHOWCASE_ADDITIONAL_NOTES_ERROR",
        "validation": {
          "maxLength": 500
        }
      }
    ]
  }
]
```

Fields in `additionalSections` require explicit `key` and `error` properties (the localization key for validation errors), whereas fields in the main `fields` array have these auto-generated by the template.

---

## Showcase Template

To generate a working example with all field types, use the showcase template:

```bash
digit-gen create --template showcase
```

This generates a module named "Field Showcase" with every supported field type configured and ready for testing. The template is located at `templates/showcase/template.json`.
