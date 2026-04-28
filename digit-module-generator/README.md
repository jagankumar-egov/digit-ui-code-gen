# DIGIT Module Generator

A CLI library to automatically generate DIGIT micro-ui modules based on templates, prompts, and API specifications.

## 🚀 Features

- **Interactive CLI** - Guided prompts for module configuration
- **API Spec Integration** - Generate forms based on OpenAPI/Swagger specs
- **Template-based Generation** - Create, Search, Inbox, View, Response screens
- **DIGIT API Hooks** - Uses proper Digit.Hooks.useCustomAPIHook and useCustomAPIMutationHook patterns
- **Modern React** - React 19, React Router v6, latest DIGIT UI components
- **Configuration Management** - Complete config files for all screen types
- **Role-based Access** - Automatic role configuration
- **Internationalization** - Auto-generate i18n keys with proper localization patterns
- **Validation** - Built-in form validation based on API specs

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g @egovernments/digit-module-generator@1.0.3
```

### Using npx (No Installation Required)
```bash
npx @egovernments/digit-module-generator create
```

### Verify Installation
```bash
digit-gen --version
```

## 🎯 Quick Start

```bash
# Interactive module generation
digit-gen create

# Generate from API spec
digit-gen create --api-spec ./openapi.json

# Generate specific screens only
digit-gen create --screens create,search,view

# Use existing template
digit-gen create --template hrms
```

## 📋 Usage Examples

### 1. Interactive Generation
```bash
$ digit-gen create

? What is your module name? Employee Management
? Module code (kebab-case): employee-mgmt
? Entity name (PascalCase): Employee
? API base path: /employee-service/v1
? Select screens to generate: Create, Search, Inbox, View, Response
? Authentication required? Yes
? Required roles: EMPLOYEE_ADMIN, EMPLOYEE_VIEWER
? Generate with workflow? Yes
? Workflow business service: employee-workflow
```

### 2. API Spec Based Generation
```bash
digit-gen create --api-spec https://api.example.com/swagger.json --entity Employee
```

### 3. Configuration File Based
```bash
digit-gen create --config ./module-config.json
```

## 📄 Configuration File Schema

### module-config.json
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
    "create": {
      "enabled": true,
      "roles": ["EMPLOYEE_ADMIN"],
      "workflow": true
    },
    "search": {
      "enabled": true,
      "roles": ["EMPLOYEE_ADMIN", "EMPLOYEE_VIEWER"],
      "filters": ["department", "status", "dateRange"]
    },
    "inbox": {
      "enabled": true,
      "roles": ["EMPLOYEE_ADMIN"],
      "businessService": "employee-workflow"
    },
    "view": {
      "enabled": true,
      "roles": ["EMPLOYEE_ADMIN", "EMPLOYEE_VIEWER"],
      "sections": ["basic", "contact", "documents", "workflow"]
    },
    "response": {
      "enabled": true,
      "types": ["basic", "workflow"]
    }
  },
  "fields": [
    {
      "name": "employeeName",
      "type": "text",
      "label": "Employee Name",
      "required": true,
      "validation": {
        "pattern": "^[A-Za-z\\s]+$",
        "maxLength": 100
      }
    },
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
    },
    {
      "name": "joiningDate",
      "type": "date",
      "label": "Joining Date",
      "required": true
    },
    {
      "name": "salary",
      "type": "amount",
      "label": "Salary",
      "required": false,
      "validation": {
        "min": 0,
        "max": 1000000
      }
    }
  ],
  "api": {
    "create": "/employee/_create",
    "update": "/employee/_update", 
    "search": "/employee/_search",
    "workflow": "/workflow/_transition"
  },
  "i18n": {
    "prefix": "EMP_",
    "generateKeys": true
  }
}
```

## 🛠️ Generated File Structure

```
packages/modules/your-module/
├── package.json
├── webpack.config.js
├── src/
│   ├── Module.js
│   ├── configs/
│   │   ├── YourEntityCreateConfig.js
│   │   ├── YourEntitySearchConfig.js
│   │   ├── YourEntityInboxConfig.js
│   │   └── YourEntityViewConfig.js
│   ├── pages/
│   │   └── employee/
│   │       ├── YourEntityCreate.js
│   │       ├── YourEntitySearch.js
│   │       ├── YourEntityInbox.js
│   │       ├── YourEntityView.js
│   │       └── YourEntityResponse.js
│   ├── components/
│   │   ├── YourEntityCard.js
│   │   └── YourEntityComponent.js
│   ├── utils/
│   │   ├── createUtils.js
│   │   ├── searchUtils.js
│   │   └── responseUtils.js
│   ├── hooks/
│   │   ├── useYourEntitySearch.js
│   │   └── useYourEntityCreate.js
│   └── services/
│       └── yourEntityService.js
├── localization/
│   ├── en_IN.json
│   └── hi_IN.json
└── README.md
```

## 🔧 CLI Commands

### Create Module
```bash
digit-gen create [options]

Options:
  -n, --name <name>           Module name
  -c, --code <code>          Module code
  -e, --entity <entity>      Entity name
  -a, --api-spec <path>      API specification file/URL
  -t, --template <template>  Use existing template
  -s, --screens <screens>    Comma-separated screen list
  -o, --output <path>        Output directory
  --config <config>          Configuration file
  --force                    Overwrite existing files
  --dry-run                  Preview generated files
```

### List Templates
```bash
digit-gen templates

Available templates:
- hrms              Employee/HR management
- project-mgmt      Project management system
- inventory         Inventory management
- citizen-services  Citizen service applications
- finance           Financial management
- attendance        Attendance management
```

### Validate Configuration
```bash
digit-gen validate --config ./module-config.json
```

### Generate Specific Components
```bash
# Generate only create screen
digit-gen screen create --entity Employee --config ./module-config.json

# Generate only utils
digit-gen utils --entity Employee --config ./module-config.json

# Generate i18n files
digit-gen i18n --config ./module-config.json
```

## 📚 API Specification Integration

### OpenAPI/Swagger Support
The generator can automatically create forms and validations from OpenAPI specifications:

```bash
digit-gen create --api-spec ./employee-api.json --entity Employee
```

### Supported OpenAPI Features:
- **Schema Properties** → Form fields
- **Required Fields** → Validation rules
- **Data Types** → Field types (string→text, number→number, etc.)
- **Enums** → Dropdown options
- **Patterns** → Validation patterns
- **Min/Max Values** → Validation constraints
- **Descriptions** → Field help text

### Example OpenAPI Schema:
```json
{
  "Employee": {
    "type": "object",
    "required": ["name", "department"],
    "properties": {
      "name": {
        "type": "string",
        "pattern": "^[A-Za-z\\s]+$",
        "maxLength": 100,
        "description": "Employee full name"
      },
      "department": {
        "type": "string",
        "enum": ["HR", "IT", "Finance", "Operations"]
      },
      "salary": {
        "type": "number",
        "minimum": 0,
        "maximum": 1000000
      },
      "joiningDate": {
        "type": "string",
        "format": "date"
      }
    }
  }
}
```

## 🔧 Generated Code Architecture

### Modern DIGIT API Patterns
Generated modules follow the latest DIGIT Frontend patterns:

**API Hooks Pattern:**
```javascript
// Generated hooks use proper DIGIT patterns
import { useCreateEmployee, useSearchEmployees } from "./hooks/useEmployee";

const EmployeeCreate = () => {
  const createMutation = useCreateEmployee();
  
  const onSubmit = async (data) => {
    await createMutation.mutate({
      url: "/employee/_create",
      params: { tenantId },
      body: transformCreateEmployeeData(data, tenantId, user),
      config: { enable: true }
    });
  };
};
```

**Search with Custom Hook:**
```javascript
const { data: searchResults, isLoading, revalidate } = useSearchEmployees(
  searchParams,
  tenantId,
  Object.keys(searchParams).length > 0
);
```

### Dependencies & Versions
Generated modules use the latest DIGIT UI versions:
- React: 19.0.0
- @egovernments/digit-ui-components: 2.0.0-dev-19
- @egovernments/digit-ui-react-components: 2.0.0-dev-02
- react-router-dom: 6.25.1
- react-i18next: 15.0.0

### Component Patterns
- **Create Screens**: FormComposerV2 with mutation hooks
- **Search Screens**: CommonScreen with search hooks  
- **View Screens**: CommonScreen with view hooks
- **Routing**: React Router v6 navigation patterns
- **State**: No direct Request calls, only DIGIT hooks

## 🎨 Customization

### Custom Templates
Create custom templates in `~/.digit-gen/templates/`:

```
~/.digit-gen/
└── templates/
    └── my-template/
        ├── template.json
        ├── screens/
        │   ├── create.hbs
        │   ├── search.hbs
        │   └── view.hbs
        └── configs/
            ├── createConfig.hbs
            └── searchConfig.hbs
```

### Template Variables
Available in Handlebars templates:
- `{{moduleName}}` - Module display name
- `{{moduleCode}}` - Module code (kebab-case)
- `{{entityName}}` - Entity name (PascalCase)
- `{{entityCode}}` - Entity code (kebab-case)
- `{{fields}}` - Array of field configurations
- `{{apiEndpoints}}` - API endpoint configurations
- `{{roles}}` - Required roles
- `{{screens}}` - Enabled screens

### Field Types Mapping
```javascript
const fieldTypeMapping = {
  "string": "text",
  "number": "number", 
  "integer": "number",
  "boolean": "checkbox",
  "date": "date",
  "date-time": "datetime",
  "email": "email",
  "uri": "url",
  "enum": "dropdown"
};
```

## 🧪 Testing Generated Modules

Generated modules include basic test files:

```bash
cd packages/modules/your-module
npm test
```

Test files generated:
- `__tests__/YourEntityCreate.test.js`
- `__tests__/YourEntitySearch.test.js`
- `__tests__/utils/createUtils.test.js`

## 🔄 Migration Support

### Upgrade Existing Modules
```bash
digit-gen migrate --module ./packages/modules/old-module --version 2.0
```

### Compare Templates
```bash
digit-gen diff --template old-template new-template
```

## 📖 Examples

### 1. Employee Management Module
```bash
digit-gen create \
  --name "Employee Management" \
  --entity Employee \
  --api-spec ./employee-api.json \
  --screens create,search,inbox,view \
  --roles EMPLOYEE_ADMIN,EMPLOYEE_VIEWER
```

### 2. Project Management Module  
```bash
digit-gen create \
  --template project-mgmt \
  --name "Project Tracker" \
  --entity Project \
  --workflow project-approval
```

### 3. Custom Configuration
```bash
digit-gen create --config ./configs/inventory-module.json
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add templates or improve generator
4. Submit pull request

### Adding New Templates
1. Create template directory in `templates/`
2. Add Handlebars files for screens/configs
3. Update `template.json` with metadata
4. Add to template registry

## 📦 NPM Publishing

### For Maintainers

To publish a new version:

```bash
# 1. Update version in package.json
npm version patch  # or minor/major

# 2. Build the package
npm run build

# 3. Test the package
npm test

# 4. Publish to NPM (requires @egovernments org access)
npm publish --access public

# 5. Tag the release
git tag v$(node -p "require('./package.json').version")
git push --tags
```

### Publishing Checklist

- [ ] All tests pass (`npm test`)
- [ ] Templates are validated
- [ ] README is updated
- [ ] Version is bumped
- [ ] Built package is tested (`npm run build`)
- [ ] All screen patterns work correctly

## 📝 License

MIT License - see LICENSE file

## 🆘 Support

- GitHub Issues: [Report bugs](https://github.com/egovernments/digit-module-generator/issues)
- Documentation: [Full docs](https://digit-module-generator.docs.dev)
- Community: [Discord](https://discord.gg/digit-developers)

## 🎯 Roadmap

- [ ] Visual form builder interface
- [ ] Integration with DIGIT DevOps
- [ ] Advanced workflow templates
- [ ] Multi-tenant configuration
- [ ] Plugin system for custom generators
- [ ] Integration with design system
- [ ] Auto-deployment to DIGIT instances