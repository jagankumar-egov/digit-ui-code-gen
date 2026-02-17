# DIGIT Module Generator - Field Types Reference

This document provides a comprehensive reference for all supported field types in the DIGIT Module Generator.

---

## Quick Reference Table

| Field Type | Component | Use Case |
|------------|-----------|----------|
| `text` | TextInput | Single-line text input |
| `textarea` | TextArea | Multi-line text input |
| `number` | TextInput (numeric) | Whole numbers |
| `numeric` | TextInput (numeric) | Same as number |
| `amount` | TextInput with prefix | Currency/money values |
| `date` | DatePicker | Date selection |
| `time` | TimePicker | Time selection |
| `datetime` | DateTimePicker | Date and time selection |
| `password` | TextInput (password) | Masked/secret input |
| `email` | TextInput (email) | Email addresses |
| `url` | TextInput (url) | Web URLs |
| `search` | TextInput (search) | Search with icon |
| `geolocation` | TextInput | GPS coordinates |
| `mobileNumber` | MobileNumber | Phone numbers |
| `dropdown` | Dropdown | Single-select list |
| `radio` | RadioButtons | Single-select (few options) |
| `radioordropdown` | Auto-switch | Radio or dropdown based on count |
| `checkbox` | Checkbox | Boolean yes/no |
| `toggle` | Toggle | On/off switch |
| `multiselect` | MultiSelectDropdown | Multiple selections |
| `multiselectdropdown` | MultiSelectDropdown | Same as multiselect |
| `locationdropdown` | LocationDropdown | Hierarchical location |
| `apidropdown` | APIDropdown | API-driven options |
| `file` | FileUpload | File attachments |
| `component` | Custom Component | Complex custom UI |

---

## Detailed Field Type Documentation

### 1. text

**Description:** Standard single-line text input field.

**Configuration:**
```json
{
  "name": "employeeName",
  "type": "text",
  "label": "Employee Name",
  "required": true,
  "description": "Enter the full name",
  "validation": {
    "minLength": 2,
    "maxLength": 100,
    "pattern": "^[a-zA-Z ]+$"
  }
}
```

**Validation Options:**
- `minLength`: Minimum character count
- `maxLength`: Maximum character count
- `pattern`: Regex pattern for validation

---

### 2. textarea

**Description:** Multi-line text input for longer content.

**Configuration:**
```json
{
  "name": "description",
  "type": "textarea",
  "label": "Description",
  "required": true,
  "validation": {
    "maxLength": 2000
  }
}
```

**Best Practices:**
- Use for descriptions, comments, addresses
- Set reasonable maxLength to prevent abuse

---

### 3. number / numeric

**Description:** Numeric input field for whole numbers or decimals.

**Configuration:**
```json
{
  "name": "quantity",
  "type": "number",
  "label": "Quantity",
  "required": true,
  "validation": {
    "min": 0,
    "max": 10000,
    "step": 1
  }
}
```

**Validation Options:**
- `min`: Minimum allowed value
- `max`: Maximum allowed value
- `step`: Increment step (use decimals like 0.01 for currency)

---

### 4. amount

**Description:** Currency/money input with INR prefix (₹).

**Configuration:**
```json
{
  "name": "estimatedCost",
  "type": "amount",
  "label": "Estimated Cost",
  "required": true,
  "validation": {
    "min": 0,
    "max": 100000000,
    "step": 0.01
  }
}
```

**Generated Config:**
```javascript
{
  type: "amount",
  populators: {
    prefix: "₹ ",
    step: "0.01"
  }
}
```

---

### 5. date

**Description:** Date picker for selecting dates.

**Configuration:**
```json
{
  "name": "startDate",
  "type": "date",
  "label": "Start Date",
  "required": true
}
```

**Notes:**
- Uses epoch timestamp internally
- Displayed in locale format

---

### 6. time

**Description:** Time picker for selecting time.

**Configuration:**
```json
{
  "name": "scheduledTime",
  "type": "time",
  "label": "Scheduled Time",
  "required": false
}
```

---

### 7. datetime

**Description:** Combined date and time picker.

**Configuration:**
```json
{
  "name": "appointmentDateTime",
  "type": "datetime",
  "label": "Appointment Date & Time",
  "required": true
}
```

---

### 8. password

**Description:** Masked input for sensitive data.

**Configuration:**
```json
{
  "name": "secretCode",
  "type": "password",
  "label": "Secret Code",
  "required": false,
  "showInView": false,
  "validation": {
    "minLength": 6,
    "maxLength": 20
  }
}
```

**Important:** Set `showInView: false` to prevent display in view screens.

---

### 9. email

**Description:** Email input with built-in validation.

**Configuration:**
```json
{
  "name": "email",
  "type": "email",
  "label": "Email Address",
  "required": true
}
```

**Auto-added Validation:** Email pattern regex is automatically applied.

---

### 10. url

**Description:** URL input for web addresses.

**Configuration:**
```json
{
  "name": "website",
  "type": "url",
  "label": "Website URL",
  "required": false
}
```

---

### 11. search

**Description:** Search input with search icon.

**Configuration:**
```json
{
  "name": "searchKeyword",
  "type": "search",
  "label": "Search",
  "required": false
}
```

---

### 12. geolocation

**Description:** Input for GPS coordinates.

**Configuration:**
```json
{
  "name": "geoCoordinates",
  "type": "geolocation",
  "label": "Geo Location",
  "required": false,
  "validation": {
    "maxLength": 50
  }
}
```

**Expected Format:** "latitude,longitude" (e.g., "12.9716,77.5946")

---

### 13. mobileNumber

**Description:** Phone number input with country code support.

**Configuration:**
```json
{
  "name": "contactNumber",
  "type": "mobileNumber",
  "label": "Contact Number",
  "required": true,
  "validation": {
    "min": 1000000000,
    "max": 9999999999
  }
}
```

**Notes:**
- Validates 10-digit Indian mobile numbers
- min/max validation is required

---

### 14. dropdown

**Description:** Single-select dropdown with options.

**Configuration with Static Options:**
```json
{
  "name": "priority",
  "type": "dropdown",
  "label": "Priority",
  "required": true,
  "options": [
    { "code": "HIGH", "name": "High" },
    { "code": "MEDIUM", "name": "Medium" },
    { "code": "LOW", "name": "Low" }
  ]
}
```

**Configuration with MDMS:**
```json
{
  "name": "department",
  "type": "dropdown",
  "label": "Department",
  "required": true,
  "mdms": {
    "masterName": "Department",
    "moduleName": "common-masters",
    "localePrefix": "COMMON_DEPARTMENT_"
  }
}
```

---

### 15. radio

**Description:** Radio button group for single selection.

**Configuration:**
```json
{
  "name": "gender",
  "type": "radio",
  "label": "Gender",
  "required": true,
  "options": [
    { "code": "MALE", "name": "Male" },
    { "code": "FEMALE", "name": "Female" },
    { "code": "OTHER", "name": "Other" }
  ]
}
```

**Best Practices:**
- Use for 2-4 options
- Use dropdown for more options

---

### 16. radioordropdown

**Description:** Auto-switches between radio and dropdown based on option count.

**Configuration:**
```json
{
  "name": "status",
  "type": "radioordropdown",
  "label": "Status",
  "required": true,
  "options": [
    { "code": "ACTIVE", "name": "Active" },
    { "code": "INACTIVE", "name": "Inactive" },
    { "code": "PENDING", "name": "Pending" }
  ]
}
```

**Behavior:**
- 3 or fewer options → Radio buttons
- More than 3 options → Dropdown

---

### 17. checkbox

**Description:** Boolean checkbox for yes/no values.

**Configuration:**
```json
{
  "name": "isActive",
  "type": "checkbox",
  "label": "Is Active",
  "required": false
}
```

**Value:** Returns `true` or `false`

---

### 18. toggle

**Description:** Toggle switch for on/off settings.

**Configuration:**
```json
{
  "name": "enableNotifications",
  "type": "toggle",
  "label": "Enable Notifications",
  "required": false
}
```

**Use Case:** Settings, preferences, feature flags

---

### 19. multiselect / multiselectdropdown

**Description:** Dropdown allowing multiple selections.

**Configuration:**
```json
{
  "name": "selectedTags",
  "type": "multiselectdropdown",
  "label": "Tags",
  "required": false,
  "options": [
    { "code": "URGENT", "name": "Urgent" },
    { "code": "IMPORTANT", "name": "Important" },
    { "code": "REVIEW", "name": "Needs Review" }
  ]
}
```

**Value:** Returns array of selected codes

---

### 20. locationdropdown

**Description:** Hierarchical location selector (State > District > Ward).

**Configuration:**
```json
{
  "name": "ward",
  "type": "locationdropdown",
  "label": "Ward/Location",
  "required": false,
  "locationtype": "ward",
  "multiSelect": false
}
```

**Generated Config:**
```javascript
{
  type: "locationdropdown",
  populators: {
    type: "ward",
    optionsKey: "i18nKey",
    defaultText: "COMMON_SELECT_WARD",
    selectedText: "COMMON_SELECTED",
    allowMultiSelect: false
  }
}
```

**Options:**
- `locationtype`: "ward", "locality", "city", etc.
- `multiSelect`: Allow multiple location selection

---

### 21. apidropdown

**Description:** Dropdown populated from API endpoint.

**Configuration:**
```json
{
  "name": "assignedUsers",
  "type": "apidropdown",
  "label": "Assigned Users",
  "required": false,
  "apiConfig": {
    "url": "/user/_search",
    "params": { "tenantId": "default" },
    "optionKey": "name",
    "optionValue": "uuid"
  }
}
```

**Use Case:** Dynamic data that changes frequently (users, vendors, etc.)

---

### 22. file

**Description:** File upload field.

**Configuration:**
```json
{
  "name": "attachments",
  "type": "file",
  "label": "Attachments",
  "required": false
}
```

---

### 23. component

**Description:** Custom React component for complex data entry.

**Configuration:**
```json
{
  "name": "milestones",
  "type": "component",
  "label": "Project Milestones",
  "required": false,
  "component": "ProjectMilestonesComponent",
  "key": "milestones"
}
```

**Use Case:** Complex UI that standard fields can't handle:
- Dynamic arrays (add/remove items)
- Nested objects
- Custom validation logic
- Special visualizations

---

## Common Field Properties

All field types support these common properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Field identifier (camelCase) |
| `type` | string | Yes | Field type from list above |
| `label` | string | Yes | Display label |
| `required` | boolean | Yes | Is field mandatory |
| `description` | string | No | Help text/tooltip |
| `searchable` | boolean | No | Include in search screen |
| `filterable` | boolean | No | Include in filters |
| `showInResults` | boolean | No | Show in search results table |
| `showInView` | boolean | No | Show in view screen |
| `showInInboxResults` | boolean | No | Show in inbox results |
| `validation` | object | No | Validation rules |
| `inline` | boolean | No | Display inline with previous field |
| `key` | string | No | Custom key for form data |

---

## Validation Object Properties

| Property | Type | Applicable To | Description |
|----------|------|---------------|-------------|
| `pattern` | string | text, email, url | Regex pattern |
| `minLength` | number | text, textarea, password | Minimum characters |
| `maxLength` | number | text, textarea, password | Maximum characters |
| `min` | number | number, amount, mobileNumber | Minimum value |
| `max` | number | number, amount, mobileNumber | Maximum value |
| `step` | number | number, amount | Increment step |

---

## Example: Complete Field Showcase

See the `showcase` template for a working example of all field types:

```bash
digit-gen create --template showcase
```

This generates a module with all 22+ field types configured and ready for testing.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-02 | Initial field types reference |

