# DIGIT Module Generator Documentation

Welcome to the comprehensive documentation for DIGIT Module Generator - your one-stop solution for creating DIGIT micro-ui modules.

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Templates](#templates)
5. [Configuration](#configuration)
6. [CLI Commands](#cli-commands)
7. [Examples](#examples)
8. [API Spec Integration](#api-spec-integration)
9. [Customization](#customization)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

Get up and running in under 5 minutes:

```bash
# Install the generator
npm install -g digit-module-generator

# Generate your first module
digit-gen create --template hrms --entity Employee

# Or use interactive mode
digit-gen create
```

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g digit-module-generator
```

### Local Project Installation
```bash
npm install digit-module-generator --save-dev
npx digit-gen create
```

### System Requirements
- Node.js >= 14.0.0
- npm >= 6.0.0
- Git (optional, for version control)

## 🧠 Core Concepts

### Module Structure
Every generated module follows the standard DIGIT structure:

```
packages/modules/your-module/
├── src/
│   ├── Module.js              # Main module export
│   ├── configs/               # Screen configurations
│   ├── pages/employee/        # Screen components
│   ├── utils/                 # Data transformation utilities
│   ├── services/              # API service functions
│   └── components/            # Reusable components
├── localization/              # Internationalization files
├── __tests__/                 # Test files
├── package.json
└── webpack.config.js
```

### Screen Types
The generator supports five main screen types:

1. **Create** - Form-based data entry screens
2. **Search** - Search and filter interfaces
3. **Inbox** - Workflow-based task lists
4. **View** - Detail display screens
5. **Response** - Success/error acknowledgment screens

### Configuration-Driven Generation
Everything is driven by configuration objects that define:
- Entity structure and fields
- Screen behavior and validation
- API endpoints and data mapping
- User roles and permissions
- Workflow integration

## 🎨 Templates

### Available Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| `hrms` | Human Resource Management | Employee management, attendance tracking |
| `project-mgmt` | Project Management | Project tracking, resource allocation |
| `inventory` | Inventory Management | Asset tracking, stock management |
| `citizen-services` | Citizen Services | Public service applications |
| `finance` | Financial Management | Budget tracking, financial transactions |

### Using Templates

```bash
# List available templates
digit-gen templates

# Use a specific template
digit-gen create --template hrms --entity Employee

# Get template details
digit-gen templates --detailed
```

### Creating Custom Templates

Create your own template in `~/.digit-gen/templates/my-template/`:

```json
{
  "name": "My Custom Template",
  "description": "Template for my specific use case",
  "version": "1.0.0",
  "category": "custom",
  "config": {
    "module": { /* module config */ },
    "entity": { /* entity config */ },
    "fields": [ /* field definitions */ ]
  }
}
```

## ⚙️ Configuration

### Basic Configuration File

```json
{
  "module": {
    "name": "Employee Management",
    "code": "employee-mgmt",
    "description": "Employee management system",
    "version": "1.0.0"
  },
  "entity": {
    "name": "Employee",
    "apiPath": "/employee-service/v1",
    "primaryKey": "employeeId",
    "displayField": "employeeName"
  },
  "screens": {
    "create": { "enabled": true, "roles": ["ADMIN"] },
    "search": { "enabled": true, "roles": ["ADMIN", "USER"] },
    "view": { "enabled": true, "roles": ["ADMIN", "USER"] }
  },
  "fields": [
    {
      "name": "employeeName",
      "type": "text",
      "label": "Employee Name",
      "required": true,
      "searchable": true,
      "showInResults": true
    }
  ]
}
```

### Field Types and Options

#### Text Fields
```json
{
  "name": "description",
  "type": "text",
  "label": "Description",
  "required": false,
  "validation": {
    "maxLength": 500,
    "pattern": "^[A-Za-z\\s]+$"
  }
}
```

#### Dropdown Fields
```json
{
  "name": "department",
  "type": "dropdown",
  "label": "Department",
  "required": true,
  "mdms": {
    "masterName": "Department",
    "moduleName": "common-masters",
    "localePrefix": "DEPT_"
  }
}
```

#### Date Fields
```json
{
  "name": "joiningDate",
  "type": "date",
  "label": "Joining Date",
  "required": true,
  "showInView": true
}
```

#### Amount Fields
```json
{
  "name": "salary",
  "type": "amount",
  "label": "Salary",
  "validation": {
    "min": 0,
    "max": 1000000
  }
}
```

## 🛠️ CLI Commands

### Create Command
Generate complete modules or specific components:

```bash
# Interactive creation
digit-gen create

# From template
digit-gen create --template hrms --entity Employee

# From API spec
digit-gen create --api-spec ./swagger.json --entity User

# From configuration
digit-gen create --config ./my-config.json

# Specific screens only
digit-gen create --screens create,search --entity Project

# Dry run (preview only)
digit-gen create --dry-run
```

### Templates Command
Manage and explore templates:

```bash
# List all templates
digit-gen templates

# Detailed template information
digit-gen templates --detailed

# Validate a template
digit-gen validate --config ./template.json
```

### Screen Command
Generate individual screens:

```bash
# Generate create screen
digit-gen screen create --entity Employee --config ./config.json

# Generate search screen
digit-gen screen search --entity Project

# Generate view screen
digit-gen screen view --entity Asset --output ./custom-dir
```

### Utils Command
Generate utility files:

```bash
# Generate all utils
digit-gen utils --entity Employee --config ./config.json

# Generate specific utils
digit-gen utils --entity Project --output ./utils-dir
```

### Validation Command
Validate configurations:

```bash
# Validate config file
digit-gen validate --config ./my-config.json

# Validate against API spec
digit-gen validate --config ./config.json --api-spec ./swagger.json
```

### Internationalization Command
Generate i18n files:

```bash
# Generate i18n for multiple languages
digit-gen i18n --config ./config.json --languages en_IN,hi_IN

# Generate for specific language
digit-gen i18n --config ./config.json --languages hi_IN
```

### Migration Command
Migrate existing modules:

```bash
# Migrate to latest version
digit-gen migrate --module ./old-module

# Migrate with backup
digit-gen migrate --module ./old-module --backup

# Migrate to specific version
digit-gen migrate --module ./old-module --version 2.0.0
```

### Diff Command
Compare templates:

```bash
# Compare two templates
digit-gen diff --template "hrms project-mgmt"
```

## 📖 Examples

### Example 1: Employee Management System

```bash
# Create employee management module
digit-gen create --template hrms --entity Employee
```

This generates a complete HRMS module with:
- Employee creation form with personal details
- Employee search with filters
- Employee detail view
- Workflow integration for employee onboarding
- Role-based access control

### Example 2: Project Tracking System

```bash
# Create project management module
digit-gen create --template project-mgmt --entity Project
```

Features include:
- Project creation with timeline and budget
- Advanced search with date ranges
- Project dashboard view
- Document management
- Resource allocation tracking

### Example 3: Custom Configuration

```json
{
  "module": {
    "name": "Vehicle Management",
    "code": "vehicle-mgmt"
  },
  "entity": {
    "name": "Vehicle",
    "apiPath": "/vehicle-service/v1"
  },
  "fields": [
    {
      "name": "registrationNumber",
      "type": "text",
      "label": "Registration Number",
      "required": true,
      "validation": { "pattern": "^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$" }
    },
    {
      "name": "vehicleType",
      "type": "dropdown",
      "label": "Vehicle Type",
      "required": true,
      "options": [
        { "code": "CAR", "name": "Car" },
        { "code": "BIKE", "name": "Bike" },
        { "code": "TRUCK", "name": "Truck" }
      ]
    }
  ]
}
```

### Example 4: API Spec Integration

```bash
# Generate from OpenAPI specification
digit-gen create --api-spec https://api.example.com/swagger.json --entity User
```

Automatically extracts:
- Field definitions from schema
- Validation rules from constraints
- API endpoints from paths
- Data types and formats

## 🔌 API Spec Integration

### Supported Formats
- OpenAPI 3.x (JSON/YAML)
- Swagger 2.x (JSON/YAML)
- Local files or remote URLs

### Automatic Field Generation

The generator maps OpenAPI types to DIGIT field types:

| OpenAPI Type | DIGIT Type | Notes |
|--------------|------------|-------|
| `string` | `text` | Default string input |
| `string(date)` | `date` | Date picker |
| `string(email)` | `email` | Email input with validation |
| `number` | `number` | Numeric input |
| `integer` | `number` | Integer input |
| `boolean` | `checkbox` | Boolean checkbox |
| `enum` | `dropdown` | Select dropdown |
| `array` | `multiselect` | Multi-select field |

### Validation Extraction
- `required` fields → mandatory form fields
- `pattern` → regex validation
- `minLength`/`maxLength` → length constraints
- `minimum`/`maximum` → numeric constraints

### Example API Usage

```bash
# From local OpenAPI file
digit-gen create --api-spec ./employee-api.yaml --entity Employee

# From remote API
digit-gen create --api-spec https://api.company.com/v1/swagger.json --entity User

# With custom entity name
digit-gen create --api-spec ./api.json --entity CustomEntity
```

## 🎯 Customization

### Custom Field Types

Extend the generator with custom field types:

```javascript
// In your custom template
{
  "name": "coordinates",
  "type": "geoLocation",
  "label": "Location",
  "component": "GeoLocationPicker"
}
```

### Custom Validation

Add business-specific validation:

```json
{
  "name": "panNumber",
  "type": "text",
  "label": "PAN Number",
  "validation": {
    "pattern": "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
    "customValidator": "validatePAN"
  }
}
```

### Screen Customization

Customize screen behavior:

```json
{
  "screens": {
    "create": {
      "enabled": true,
      "roles": ["ADMIN"],
      "workflow": true,
      "customActions": ["SAVE_DRAFT", "SUBMIT"],
      "sections": ["basic", "advanced", "documents"]
    }
  }
}
```

### Component Overrides

Override generated components:

```javascript
// In your module
const CustomCreateComponent = () => {
  // Your custom implementation
};

// Export with same name to override
export { CustomCreateComponent as EmployeeCreate };
```

## ✅ Best Practices

### Configuration Management
1. **Version Control**: Keep configuration files in version control
2. **Environment-specific**: Use different configs for dev/staging/prod
3. **Validation**: Always validate configs before generation
4. **Documentation**: Document custom fields and validation rules

### Field Design
1. **Consistent Naming**: Use consistent field naming conventions
2. **Proper Validation**: Add appropriate validation for data quality
3. **User Experience**: Consider field ordering and grouping
4. **Accessibility**: Include proper labels and descriptions

### Screen Design
1. **Role-based Access**: Implement proper role-based permissions
2. **Responsive Design**: Ensure screens work on all devices
3. **Performance**: Optimize for large datasets
4. **Error Handling**: Provide clear error messages

### Testing
1. **Generated Tests**: Review and enhance generated test files
2. **Integration Tests**: Add API integration tests
3. **User Journey Tests**: Test complete user workflows
4. **Accessibility Tests**: Ensure compliance with accessibility standards

### Deployment
1. **Build Process**: Set up proper build and deployment pipeline
2. **Environment Variables**: Use environment-specific configurations
3. **Monitoring**: Implement logging and monitoring
4. **Documentation**: Maintain updated deployment documentation

## 🔧 Troubleshooting

### Common Issues

#### Template Not Found
```bash
Error: Template "my-template" not found
```
**Solution**: Check available templates with `digit-gen templates`

#### Configuration Validation Failed
```bash
❌ Configuration validation failed:
  • entity.name: must be PascalCase
```
**Solution**: Fix validation errors in configuration file

#### API Spec Parsing Failed
```bash
❌ Error parsing API specification
```
**Solutions**:
- Verify API spec is valid JSON/YAML
- Check if entity exists in the specification
- Ensure API spec follows OpenAPI/Swagger format

#### Permission Denied
```bash
Error: EACCES: permission denied
```
**Solutions**:
- Use `sudo` for global installation (not recommended)
- Use `npx` instead of global installation
- Fix npm permissions: `npm config set prefix ~/.npm-global`

#### Module Generation Failed
```bash
❌ Error creating module: Module directory already exists
```
**Solution**: Use `--force` flag to overwrite or choose different output directory

### Debug Mode
Enable debug mode for detailed error information:

```bash
DEBUG=1 digit-gen create --config ./my-config.json
```

### Getting Help

1. **Documentation**: Check this documentation
2. **Examples**: Look at generated examples
3. **GitHub Issues**: Report bugs on GitHub
4. **Community**: Join the DIGIT developer community

### Frequently Asked Questions

**Q: Can I modify generated files?**
A: Yes, but consider using configuration options or custom templates for reusability.

**Q: How do I add custom components?**
A: Create custom components and reference them in field configurations with `type: "component"`.

**Q: Can I use with existing DIGIT modules?**
A: Yes, generate in separate directory and integrate manually.

**Q: How do I handle breaking changes?**
A: Use the migration command to update existing modules.

**Q: Can I contribute templates?**
A: Yes! Submit pull requests with new templates following the template structure.

---

## 📞 Support

- **Documentation**: [Full Documentation](https://digit-module-generator.docs.dev)
- **GitHub**: [Report Issues](https://github.com/egovernments/digit-module-generator/issues)
- **Community**: [Discord](https://discord.gg/digit-developers)
- **Email**: [Support](mailto:support@egovernments.org)

---

Made with ❤️ by the eGovernments Foundation team