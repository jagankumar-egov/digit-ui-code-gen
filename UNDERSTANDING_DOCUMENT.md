# DIGIT Module Generator - Complete Understanding Document

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Directory Structure](#3-directory-structure)
4. [Core Components](#4-core-components)
5. [Data Flow & Sequence Diagrams](#5-data-flow--sequence-diagrams)
6. [Configuration Schema](#6-configuration-schema)
7. [Code Generation Pipeline](#7-code-generation-pipeline)
8. [Detailed File Analysis](#8-detailed-file-analysis)
9. [Templates System](#9-templates-system)
10. [Generated Output Structure](#10-generated-output-structure)
11. [Key Design Patterns](#11-key-design-patterns)
12. [How to Extend](#12-how-to-extend)
13. [Glossary](#13-glossary)

---

## 1. Project Overview

### What is DIGIT Module Generator?

The **DIGIT Module Generator** is a CLI (Command Line Interface) tool that automates the creation of complete DIGIT micro-UI modules. Instead of manually writing boilerplate code for React components, configurations, API services, and utilities, developers can define a JSON configuration or use an OpenAPI specification, and the tool generates all necessary files.

### Purpose & Problem Statement

**Problem**: Creating a new DIGIT module manually requires:
- Writing repetitive boilerplate code
- Setting up consistent project structure
- Creating form configurations, search screens, view screens
- Implementing API integrations
- Setting up internationalization
- Ensuring consistency across modules

**Solution**: This tool automates all of the above by:
- Using JSON configurations to define module structure
- Parsing OpenAPI/Swagger specs to auto-generate field definitions
- Using Handlebars templates to generate consistent React components
- Producing production-ready code that follows DIGIT conventions

### Key Features

| Feature | Description |
|---------|-------------|
| Configuration-Driven | Define your module structure in JSON |
| API Spec Integration | Parse OpenAPI 3.x / Swagger 2.x to auto-generate fields |
| Template System | Pre-built templates (HRMS, Inventory, Project Management) |
| Multiple Screen Types | Create, Search, View, Inbox, Response screens |
| i18n Support | Multi-language support (English, Hindi) |
| Validation | JSON Schema validation with business logic checks |
| Workflow Integration | Built-in workflow support for DIGIT |

---

## 2. Architecture Overview

### High-Level Architecture Diagram

```
                                    ┌─────────────────────────────────────────┐
                                    │           USER INPUT LAYER              │
                                    │  ┌─────────┐ ┌─────────┐ ┌───────────┐ │
                                    │  │  CLI    │ │  Config │ │   API     │ │
                                    │  │ Options │ │  File   │ │   Spec    │ │
                                    │  └────┬────┘ └────┬────┘ └─────┬─────┘ │
                                    └───────┼──────────┼─────────────┼───────┘
                                            │          │             │
                                            ▼          ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLI LAYER (bin/cli.js)                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Commander.js handles argument parsing and routes to command handlers   │   │
│  │  Commands: create | templates | validate | screen | utils | i18n |      │   │
│  │            migrate | diff                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          COMMAND LAYER (src/commands/)                          │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────┐ ┌─────┐ ┌──────┐ ┌─────┐       │
│  │ create.js│ │validate.js│ │screen.js│ │utils.js│ │i18n.js│ │migrate│ │diff.js│ │
│  └────┬─────┘ └─────┬────┘ └────┬───┘ └───┬───┘ └──┬──┘ └───┬──┘ └───┬──┘       │
│       │             │           │         │        │        │        │          │
│       │    Orchestrates loading, validation, and generation                     │
└───────┼─────────────┼───────────┼─────────┼────────┼────────┼────────┼──────────┘
        │             │           │         │        │        │        │
        ▼             ▼           ▼         ▼        ▼        ▼        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CORE SERVICES LAYER                                   │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐        │
│  │   PARSERS          │  │    VALIDATORS      │  │  TEMPLATE MANAGER  │        │
│  │  (apiSpecParser)   │  │  (configValidator) │  │  (templateManager) │        │
│  │                    │  │                    │  │                    │        │
│  │ - Parse OpenAPI    │  │ - JSON Schema      │  │ - Load templates   │        │
│  │ - Parse Swagger    │  │ - Business logic   │  │ - List templates   │        │
│  │ - Extract fields   │  │ - Field validation │  │ - Create custom    │        │
│  └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘        │
└────────────┼────────────────────────┼────────────────────────┼──────────────────┘
             │                        │                        │
             ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         GENERATION LAYER (src/generators/)                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    MODULE GENERATOR (moduleGenerator.js)                 │   │
│  │                      Central orchestrator - 420 lines                    │   │
│  │   Coordinates all sub-generators and manages file output                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│       ┌──────────┬─────────────────┼─────────────────┬──────────┐              │
│       ▼          ▼                 ▼                 ▼          ▼              │
│  ┌─────────┐ ┌─────────┐     ┌─────────┐       ┌─────────┐ ┌─────────┐        │
│  │ Config  │ │ Screen  │     │  Utils  │       │ Service │ │  i18n   │        │
│  │Generators│ │Generators│    │Generators│      │Generators│ │Generator│        │
│  ├─────────┤ ├─────────┤     ├─────────┤       ├─────────┤ ├─────────┤        │
│  │ create  │ │ create  │     │ create  │       │ hooks   │ │ en_IN   │        │
│  │ search  │ │ search  │     │ response│       │endpoints│ │ hi_IN   │        │
│  │ inbox   │ │ inbox   │     │ search  │       └─────────┘ └─────────┘        │
│  │ view    │ │ view    │     └─────────┘                                       │
│  └─────────┘ │ response│                                                       │
│              └─────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OUTPUT LAYER                                       │
│                                                                                 │
│   Generated Module Structure:                                                   │
│   packages/modules/{module-code}/                                               │
│   ├── src/                                                                      │
│   │   ├── Module.js           (Main entry point)                               │
│   │   ├── configs/            (FormComposer configurations)                    │
│   │   ├── pages/employee/     (React screen components)                        │
│   │   ├── hooks/              (API hooks)                                      │
│   │   ├── services/           (API endpoints)                                  │
│   │   └── utils/              (Data transformation utilities)                  │
│   ├── localization/           (i18n JSON files)                                │
│   ├── package.json                                                              │
│   └── webpack.config.js                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INTERACTION MODEL                                │
│                                                                             │
│   User                                                                      │
│    │                                                                        │
│    │  $ digit-gen create --config employee-config.json                     │
│    ▼                                                                        │
│   CLI (bin/cli.js)                                                         │
│    │                                                                        │
│    │  Parses arguments, displays banner                                    │
│    │  Routes to appropriate command handler                                │
│    ▼                                                                        │
│   Command Handler (create.js)                                              │
│    │                                                                        │
│    ├──► Load config from file/template/API spec                            │
│    │    │                                                                   │
│    │    ├── If --config: fs.readJson(configPath)                           │
│    │    ├── If --template: getTemplateConfig(templateName)                 │
│    │    └── If --api-spec: parseApiSpec(specPath, entityName)              │
│    │                                                                        │
│    ├──► Prompt for missing info (inquirer)                                 │
│    │                                                                        │
│    ├──► Validate configuration                                             │
│    │    │                                                                   │
│    │    └── validateModuleConfig(config) → AJV JSON Schema                 │
│    │                                                                        │
│    └──► Generate module                                                    │
│         │                                                                   │
│         └── generateFromConfig(config, outputPath, force)                  │
│              │                                                              │
│              ├── createDirectoryStructure()                                │
│              ├── generatePackageJson()                                     │
│              ├── generateWebpackConfig()                                   │
│              ├── generateMainModule()                                      │
│              ├── generateConfigs()                                         │
│              │    ├── generateCreateConfig()                               │
│              │    ├── generateSearchConfig()                               │
│              │    ├── generateInboxConfig()                                │
│              │    └── generateViewConfig()                                 │
│              ├── generateScreenComponents()                                │
│              │    └── Uses Handlebars templates (*.hbs)                    │
│              ├── generateUtilities()                                       │
│              │    ├── generateCreateUtils()                                │
│              │    ├── generateSearchUtils()                                │
│              │    └── generateResponseUtils()                              │
│              ├── generateServiceFiles()                                    │
│              │    └── generateServices() → hooks + endpoints               │
│              ├── generateInternationalization()                            │
│              │    └── generateI18nFiles()                                  │
│              └── generateReadme()                                          │
│                                                                             │
│   Output: Complete module with all files                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

### Project Root Structure

```
digit-ui-code-gen/
├── README.md                           # Root README (minimal)
├── .gitignore                          # Git ignore rules
│
└── digit-module-generator/             # Main project directory
    │
    ├── bin/
    │   └── cli.js                      # CLI entry point (132 lines)
    │
    ├── src/                            # Source code
    │   ├── commands/                   # CLI command handlers
    │   │   ├── create.js               # Module creation (404 lines)
    │   │   ├── validate.js             # Config validation
    │   │   ├── screen.js               # Screen generation
    │   │   ├── utils.js                # Utils generation
    │   │   ├── i18n.js                 # i18n generation
    │   │   ├── migrate.js              # Module migration
    │   │   ├── diff.js                 # Template comparison
    │   │   └── templates.js            # Template listing
    │   │
    │   ├── generators/                 # Code generation modules
    │   │   ├── moduleGenerator.js      # Main orchestrator (420 lines)
    │   │   ├── i18nGenerator.js        # Internationalization (182 lines)
    │   │   │
    │   │   ├── configGenerators/       # Form configuration generators
    │   │   │   ├── createConfigGenerator.js   # Create form config
    │   │   │   ├── searchConfigGenerator.js   # Search config
    │   │   │   ├── inboxConfigGenerator.js    # Inbox config
    │   │   │   └── viewConfigGenerator.js     # View config
    │   │   │
    │   │   ├── utilsGenerators/        # Utility generators
    │   │   │   ├── createUtilsGenerator.js    # Create/Update transformations
    │   │   │   ├── responseUtilsGenerator.js  # Response handling
    │   │   │   └── searchUtilsGenerator.js    # Search processing
    │   │   │
    │   │   ├── screenGenerators/       # Screen component generators
    │   │   │   └── screenGenerator.js         # Handlebars template processor
    │   │   │
    │   │   ├── serviceGenerators/      # API service generators
    │   │   │   └── serviceGenerator.js        # Hooks and endpoints
    │   │   │
    │   │   └── testGenerators/         # Test file generators
    │   │       └── testGenerator.js
    │   │
    │   ├── parsers/                    # Input parsers
    │   │   └── apiSpecParser.js        # OpenAPI/Swagger parser (385 lines)
    │   │
    │   ├── validators/                 # Validation modules
    │   │   └── configValidator.js      # JSON Schema + business logic (440 lines)
    │   │
    │   └── templates/                  # Template management
    │       ├── templateManager.js      # Template registry (123 lines)
    │       └── screen-templates/       # Handlebars screen templates
    │           ├── create.hbs
    │           ├── search.hbs
    │           ├── inbox.hbs
    │           ├── view.hbs
    │           └── response.hbs
    │
    ├── templates/                      # Pre-built configuration templates
    │   ├── hrms/
    │   │   └── template.json           # HRMS module template
    │   ├── inventory/
    │   │   └── template.json           # Inventory module template
    │   ├── project-mgmt/
    │   │   └── template.json           # Project management template
    │   └── screens/                    # Handlebars templates (duplicate)
    │       ├── create.hbs
    │       ├── search.hbs
    │       ├── inbox.hbs
    │       ├── view.hbs
    │       └── response.hbs
    │
    ├── dist/                           # Compiled JavaScript (babel output)
    │   └── (mirrors src/ structure)
    │
    ├── examples/                       # Usage examples
    │   ├── basic-example.js
    │   └── api-integration-example.js
    │
    ├── docs/
    │   └── README.md                   # Comprehensive documentation
    │
    ├── package.json                    # NPM package configuration
    ├── package-lock.json               # Dependency lock file
    │
    └── Example config files:
        ├── employee-config.json        # Employee module config
        ├── propertytax-config.json     # Property tax config
        ├── trade-license-config.json   # Trade license config
        ├── property-registry-api.yaml  # Sample OpenAPI spec
        └── trade-license-api.yaml      # Sample OpenAPI spec
```

---

## 4. Core Components

### 4.1 CLI Entry Point (`bin/cli.js`)

**Purpose**: Entry point for the command-line interface.

**Key Responsibilities**:
1. Display ASCII banner using `figlet`
2. Register all commands using `commander`
3. Parse command-line arguments
4. Route to appropriate command handlers

**Code Flow**:
```
Start → Display Banner → Register Commands → Parse Arguments → Execute Command
```

**Commands Registered**:
| Command | Description | Handler |
|---------|-------------|---------|
| `create` | Create new module | `createModule()` |
| `templates` / `list` | List available templates | `listTemplates()` |
| `validate` | Validate config file | `validateConfig()` |
| `screen <type>` | Generate specific screen | `generateScreen()` |
| `utils` | Generate utility files | `generateUtils()` |
| `i18n` | Generate i18n files | `generateI18n()` |
| `migrate` | Migrate existing module | `migrateModule()` |
| `diff` | Compare templates | `diffTemplates()` |

---

### 4.2 Create Command (`src/commands/create.js`)

**Purpose**: Main command for creating modules - orchestrates the entire generation process.

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `createModule(options)` | Main entry point, orchestrates generation |
| `promptForConfig(existingConfig, options)` | Interactive prompts for missing config |
| `buildScreensConfig(screens, answers)` | Build screen configuration from answers |
| `getDefaultFields()` | Return default field definitions |
| `getDefaultApiConfig()` | Return default API endpoints |
| `mergeConfigs(base, api)` | Deep merge configuration objects |
| `updateScreensConfig(config, screenList)` | Enable/disable screens |
| `isConfigComplete(config)` | Check if config has all required fields |
| `showPreview(config, outputPath)` | Preview files without creating |

**Flow Diagram**:
```
createModule()
    │
    ├─► Load config from file? ──Yes──► fs.readJson(configPath)
    │          │
    │          No
    │          ▼
    ├─► Use template? ──Yes──► getTemplateConfig(templateName)
    │          │
    │          No
    │          ▼
    ├─► Parse API spec? ──Yes──► parseApiSpec(specPath, entityName)
    │          │
    │          No
    │          ▼
    ├─► Config complete? ──No──► promptForConfig() (interactive)
    │          │
    │         Yes
    │          ▼
    ├─► Override with CLI options
    │          │
    │          ▼
    ├─► validateModuleConfig(config)
    │          │
    │          ├─── Invalid ──► Show errors, exit
    │          │
    │         Valid
    │          ▼
    ├─► Dry run? ──Yes──► showPreview(config, outputPath)
    │          │
    │          No
    │          ▼
    └─► generateFromConfig(config, outputPath, force)
              │
              ▼
         Show success message + next steps
```

---

### 4.3 Module Generator (`src/generators/moduleGenerator.js`)

**Purpose**: Central orchestrator that coordinates all code generation.

**Handlebars Helpers Registered**:
```javascript
pascalCase    // "employeeName" → "EmployeeName"
camelCase     // "employee-name" → "employeeName"
kebabCase     // "EmployeeName" → "employee-name"
constantCase  // "employeeName" → "EMPLOYEE_NAME"
eq            // Equality check: {{#if (eq type 'dropdown')}}
or            // Logical OR
and           // Logical AND
toLocalizationKey  // "employeeName" + "EMPLOYEE_" → "EMPLOYEE_EMPLOYEE_NAME"
```

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `generateFromConfig(config, outputPath, force)` | Main entry, coordinates all generation |
| `createDirectoryStructure(moduleDir)` | Creates folder structure |
| `generatePackageJson(moduleDir, config, result)` | Generate package.json |
| `generateWebpackConfig(moduleDir, config, result)` | Generate webpack.config.js |
| `generateMainModule(moduleDir, config, result)` | Generate src/Module.js |
| `generateConfigs(moduleDir, config, result)` | Generate all form configs |
| `generateScreenComponents(moduleDir, config, result)` | Generate React screens |
| `generateUtilities(moduleDir, config, result)` | Generate utility files |
| `generateServiceFiles(moduleDir, config, result)` | Generate hooks and endpoints |
| `generateInternationalization(moduleDir, config, result)` | Generate i18n files |
| `generateReadme(moduleDir, config, result)` | Generate README.md |

**Generation Sequence**:
```
generateFromConfig()
    │
    ├─1─► Check if module exists (error if exists & !force)
    │
    ├─2─► createDirectoryStructure()
    │         Creates: src/, src/configs/, src/pages/employee/,
    │                  src/components/, src/utils/, src/hooks/,
    │                  src/services/, localization/, __tests__/
    │
    ├─3─► generatePackageJson()
    │         Uses Handlebars template embedded in code
    │         Includes peer dependencies for DIGIT components
    │
    ├─4─► generateWebpackConfig()
    │         Creates basic webpack config for React
    │
    ├─5─► generateMainModule()
    │         Creates Module.js with lazy-loaded components
    │
    ├─6─► generateConfigs()
    │         For each enabled screen:
    │         ├── create → generateCreateConfig()
    │         ├── search → generateSearchConfig()
    │         ├── inbox  → generateInboxConfig()
    │         └── view   → generateViewConfig()
    │
    ├─7─► generateScreenComponents()
    │         For each enabled screen:
    │         └── Compile Handlebars template (*.hbs)
    │
    ├─8─► generateUtilities()
    │         ├── generateCreateUtils()
    │         ├── generateSearchUtils()
    │         └── generateResponseUtils()
    │
    ├─9─► generateServiceFiles()
    │         ├── useEntity.js (hooks)
    │         └── apiEndpoints.js
    │
    ├─10─► generateInternationalization() (if i18n.generateKeys)
    │          ├── en_IN.json
    │          └── hi_IN.json
    │
    └─11─► generateReadme()
              Creates README.md with module info
```

---

### 4.4 API Spec Parser (`src/parsers/apiSpecParser.js`)

**Purpose**: Parse OpenAPI 3.x and Swagger 2.x specifications to extract field definitions.

**Supported Input Formats**:
- Local JSON files
- Local YAML files
- Remote URLs (HTTP/HTTPS)

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `parseApiSpec(specPath, entityName)` | Main entry, loads and parses spec |
| `findEntitySchema(api, entityName)` | Find schema by entity name |
| `generateConfigFromSchema(api, schema, entityName)` | Convert schema to config |
| `extractFields(schema, api, visited)` | Extract field definitions |
| `mapOpenApiTypeToDigitType(spec)` | Map OpenAPI types to DIGIT types |
| `extractFieldValidation(spec)` | Extract validation rules |
| `extractApiEndpoints(api, entityName)` | Find API endpoints |
| `findPrimaryKey(schema)` | Detect primary key field |
| `findDisplayField(schema)` | Detect display field |
| `resolveReference(spec, api)` | Resolve $ref references |

**Type Mapping Table**:
```
OpenAPI Type        Format          →  DIGIT Type
─────────────────────────────────────────────────
string              (none)          →  text
string              date            →  date
string              date-time       →  datetime
string              email           →  email
string              uri/url         →  url
string              password        →  password
string              byte/binary     →  file
string              (maxLength>255) →  textarea
number              (any)           →  number
integer             (any)           →  number
boolean             (any)           →  checkbox
array               (any)           →  multiselect
object              (any)           →  component
enum                (any)           →  dropdown
```

**Parsing Flow**:
```
parseApiSpec(specPath, entityName)
    │
    ├─► Is URL? ──Yes──► axios.get(specPath)
    │       │
    │      No
    │       ▼
    ├─► Read file → Is YAML? ──Yes──► yaml.parse()
    │                   │
    │                  No
    │                   ▼
    │              JSON.parse()
    │
    ├─► SwaggerParser.validate(specContent)
    │
    ├─► findEntitySchema(api, entityName)
    │       │
    │       ├── Check api.components.schemas[entityName]
    │       ├── Check api.definitions[entityName]
    │       └── Try variations: lowercase, Request, Response, DTO
    │
    ├─► Schema found? ──No──► Return getDefaultConfig()
    │       │
    │      Yes
    │       ▼
    └─► generateConfigFromSchema(api, schema, entityName)
            │
            ├── extractFields(schema, api)
            ├── extractApiEndpoints(api, entityName)
            └── Return config object
```

---

### 4.5 Config Validator (`src/validators/configValidator.js`)

**Purpose**: Validate module configuration using JSON Schema and business logic.

**Two-Stage Validation**:
1. **JSON Schema Validation** (using AJV)
2. **Business Logic Validation** (custom rules)

**JSON Schema Structure**:
```
moduleConfigSchema
├── module (required)
│   ├── name: string (minLength: 1)
│   ├── code: string (pattern: ^[a-z0-9-]+$)
│   ├── description: string
│   └── version: string (pattern: ^\d+\.\d+\.\d+$)
│
├── entity (required)
│   ├── name: string (pattern: ^[A-Z][a-zA-Z0-9]*$)  // PascalCase
│   ├── apiPath: string (pattern: ^/.*)
│   ├── primaryKey: string
│   └── displayField: string
│
├── screens (required)
│   ├── create: screenConfig
│   ├── search: screenConfig
│   ├── inbox: screenConfig
│   ├── view: screenConfig
│   └── response: screenConfig
│
├── fields (required, array)
│   └── fieldConfig[]
│       ├── name: string (pattern: ^[a-zA-Z][a-zA-Z0-9]*$)
│       ├── type: enum [text, number, date, dropdown, ...]
│       ├── label: string
│       ├── required: boolean
│       ├── validation: object (optional)
│       ├── options: array (for dropdowns)
│       └── mdms: object (for MDMS dropdowns)
│
├── api (optional)
│   ├── create: string
│   ├── update: string
│   ├── search: string
│   └── view: string
│
├── auth (optional)
│   ├── required: boolean
│   └── roles: string[]
│
├── workflow (optional)
│   ├── enabled: boolean
│   └── businessService: string
│
└── i18n (optional)
    ├── prefix: string (pattern: ^[A-Z_]+_$)
    └── generateKeys: boolean
```

**Business Logic Validations**:
```
validateBusinessLogic(config)
│
├── Workflow enabled → businessService required
├── Inbox enabled → workflow must be enabled
├── Dropdown/radio/multiselect → options OR mdms required
├── validation.min ≤ validation.max
├── validation.minLength ≤ validation.maxLength
├── Amount fields → should have validation.min
├── MobileNumber → should have min/max validation
├── No duplicate field names
├── Enabled screens with roles → roles must be non-empty array
├── API paths → must start with '/'
├── Auth required → roles must be defined
└── i18n.prefix → must end with '_'
```

---

### 4.6 Template Manager (`src/templates/templateManager.js`)

**Purpose**: Manage pre-built configuration templates.

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `getTemplateConfig(templateName)` | Load template configuration |
| `listAvailableTemplates(detailed)` | List all templates |
| `validateTemplate(templateName)` | Validate template structure |
| `createCustomTemplate(templateName, config)` | Create new template |

**Templates Directory**: `digit-module-generator/templates/`

**Template Structure**:
```json
{
  "name": "Human Resource Management System",
  "description": "Complete HRMS module with employee management",
  "version": "1.0.0",
  "author": "JaganKumar <jagan.kumar@egov.org.in>",
  "category": "governance",
  "config": {
    "module": { ... },
    "entity": { ... },
    "screens": { ... },
    "fields": [ ... ],
    "api": { ... },
    "auth": { ... },
    "workflow": { ... },
    "i18n": { ... }
  }
}
```

---

## 5. Data Flow & Sequence Diagrams

### 5.1 Complete Module Generation Sequence

```
┌─────┐     ┌─────────┐     ┌──────────┐     ┌───────────┐     ┌───────────┐
│User │     │  CLI    │     │  Create  │     │ Validator │     │ Generator │
└──┬──┘     └────┬────┘     │  Command │     └─────┬─────┘     └─────┬─────┘
   │             │          └─────┬────┘           │                 │
   │  digit-gen create --config employee.json     │                 │
   │─────────────────────────────────────────────►│                 │
   │             │                 │               │                 │
   │             │  Parse args     │               │                 │
   │             │────────────────►│               │                 │
   │             │                 │               │                 │
   │             │   Load config   │               │                 │
   │             │   from file     │               │                 │
   │             │◄────────────────│               │                 │
   │             │                 │               │                 │
   │             │     Config      │               │                 │
   │             │────────────────►│               │                 │
   │             │                 │               │                 │
   │             │                 │  Validate     │                 │
   │             │                 │───────────────►                 │
   │             │                 │               │                 │
   │             │                 │   Valid/Errors│                 │
   │             │                 │◄───────────────                 │
   │             │                 │               │                 │
   │             │                 │  If valid:    │                 │
   │             │                 │  Generate     │                 │
   │             │                 │───────────────────────────────►│
   │             │                 │               │                 │
   │             │                 │               │     Create      │
   │             │                 │               │     Directories │
   │             │                 │               │     ┌──────────►│
   │             │                 │               │     │           │
   │             │                 │               │     │  Generate │
   │             │                 │               │     │  Files    │
   │             │                 │               │     │◄──────────│
   │             │                 │               │     │           │
   │             │                 │   Files created                 │
   │             │                 │◄───────────────────────────────│
   │             │                 │               │                 │
   │   Success message + file list │               │                 │
   │◄──────────────────────────────│               │                 │
   │             │                 │               │                 │
```

### 5.2 API Spec Parsing Sequence

```
┌─────────┐     ┌───────────┐     ┌─────────────┐     ┌──────────────┐
│ Create  │     │  Parser   │     │  Swagger    │     │   Config     │
│ Command │     │           │     │  Parser Lib │     │  Generator   │
└────┬────┘     └─────┬─────┘     └──────┬──────┘     └──────┬───────┘
     │                │                   │                   │
     │  parseApiSpec(path, entity)        │                   │
     │───────────────►│                   │                   │
     │                │                   │                   │
     │                │   Load file/URL   │                   │
     │                │   (YAML/JSON)     │                   │
     │                │───────────────────│                   │
     │                │                   │                   │
     │                │  validate(spec)   │                   │
     │                │──────────────────►│                   │
     │                │                   │                   │
     │                │    Parsed API     │                   │
     │                │◄──────────────────│                   │
     │                │                   │                   │
     │                │  findEntitySchema(api, entity)        │
     │                │──────────────────────────────────────►│
     │                │                   │                   │
     │                │  extractFields()                      │
     │                │  extractEndpoints()                   │
     │                │  extractValidations()                 │
     │                │◄──────────────────────────────────────│
     │                │                   │                   │
     │   Config object│                   │                   │
     │◄───────────────│                   │                   │
     │                │                   │                   │
```

### 5.3 Screen Generation Sequence

```
┌───────────┐     ┌───────────┐     ┌────────────┐     ┌───────────┐
│  Module   │     │  Screen   │     │ Handlebars │     │   File    │
│ Generator │     │ Generator │     │            │     │  System   │
└─────┬─────┘     └─────┬─────┘     └──────┬─────┘     └─────┬─────┘
      │                 │                   │                 │
      │  For each enabled screen:          │                 │
      │                 │                   │                 │
      │  generateScreens(type, config)     │                 │
      │────────────────►│                   │                 │
      │                 │                   │                 │
      │                 │  Read template    │                 │
      │                 │  (create.hbs)     │                 │
      │                 │──────────────────►│                 │
      │                 │                   │                 │
      │                 │  Template content │                 │
      │                 │◄──────────────────│                 │
      │                 │                   │                 │
      │                 │  compile(template)│                 │
      │                 │──────────────────►│                 │
      │                 │                   │                 │
      │                 │  Execute with     │                 │
      │                 │  config context   │                 │
      │                 │──────────────────►│                 │
      │                 │                   │                 │
      │                 │  Generated code   │                 │
      │                 │◄──────────────────│                 │
      │                 │                   │                 │
      │  Screen content │                   │                 │
      │◄────────────────│                   │                 │
      │                 │                   │                 │
      │  writeFile(path, content)          │                 │
      │──────────────────────────────────────────────────────►│
      │                 │                   │                 │
```

### 5.4 Validation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      VALIDATION FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

                    Input Config
                         │
                         ▼
            ┌────────────────────────┐
            │  JSON Schema Validation │
            │       (AJV)            │
            └────────────┬───────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
            Valid               Invalid
              │                     │
              ▼                     ▼
    ┌─────────────────┐    ┌────────────────┐
    │ Business Logic  │    │ Return errors: │
    │   Validation    │    │ - Path         │
    └────────┬────────┘    │ - Message      │
             │             └────────────────┘
    ┌────────┴────────┐
    │                 │
  Valid           Invalid
    │                 │
    ▼                 ▼
┌──────────┐   ┌────────────────┐
│ Return:  │   │ Return errors: │
│ valid:   │   │ - Workflow     │
│ true     │   │ - Fields       │
│          │   │ - Screens      │
│          │   │ - API paths    │
│          │   │ - Duplicates   │
└──────────┘   └────────────────┘


Business Logic Checks:
├── workflow.enabled && !workflow.businessService → Error
├── screens.inbox.enabled && !workflow.enabled → Error
├── dropdown field without options && !mdms → Error
├── validation.min > validation.max → Error
├── validation.minLength > validation.maxLength → Error
├── Duplicate field names → Error
├── Screen enabled with empty roles → Error
├── API path not starting with '/' → Error
├── auth.required && empty roles → Error
└── i18n.prefix not ending with '_' → Error
```

---

## 6. Configuration Schema

### 6.1 Complete Configuration Example

```json
{
  "module": {
    "name": "Employee Management",
    "code": "employee-mgmt",
    "description": "Employee management system for DIGIT",
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
      "roles": ["ADMIN", "HR_MANAGER"],
      "workflow": true
    },
    "search": {
      "enabled": true,
      "roles": ["ADMIN", "HR_MANAGER", "EMPLOYEE"],
      "filters": ["name", "department", "status"],
      "minSearchFields": 1
    },
    "inbox": {
      "enabled": true,
      "roles": ["ADMIN", "HR_MANAGER"],
      "businessService": "EMPLOYEE_WORKFLOW"
    },
    "view": {
      "enabled": true,
      "roles": ["ADMIN", "HR_MANAGER", "EMPLOYEE"],
      "sections": ["basic", "details"]
    },
    "response": {
      "enabled": true,
      "types": ["basic"]
    }
  },

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
        "minLength": 2,
        "maxLength": 100
      }
    },
    {
      "name": "employeeCode",
      "type": "text",
      "label": "Employee Code",
      "required": true,
      "searchable": true,
      "showInResults": true,
      "showInView": true,
      "validation": {
        "pattern": "^EMP-[0-9]{6}$"
      }
    },
    {
      "name": "department",
      "type": "dropdown",
      "label": "Department",
      "required": true,
      "searchable": true,
      "filterable": true,
      "showInResults": true,
      "showInView": true,
      "options": [
        { "code": "HR", "name": "Human Resources" },
        { "code": "IT", "name": "Information Technology" },
        { "code": "FINANCE", "name": "Finance" },
        { "code": "ADMIN", "name": "Administration" }
      ]
    },
    {
      "name": "designation",
      "type": "dropdown",
      "label": "Designation",
      "required": true,
      "showInView": true,
      "mdms": {
        "masterName": "Designation",
        "moduleName": "common-masters",
        "localePrefix": "DESIGNATION_"
      }
    },
    {
      "name": "joiningDate",
      "type": "date",
      "label": "Joining Date",
      "required": true,
      "showInView": true
    },
    {
      "name": "salary",
      "type": "amount",
      "label": "Salary",
      "required": false,
      "showInView": true,
      "validation": {
        "min": 0,
        "max": 10000000
      }
    },
    {
      "name": "mobileNumber",
      "type": "mobileNumber",
      "label": "Mobile Number",
      "required": true,
      "showInView": true,
      "validation": {
        "min": 1000000000,
        "max": 9999999999
      }
    },
    {
      "name": "email",
      "type": "email",
      "label": "Email Address",
      "required": false,
      "showInView": true
    },
    {
      "name": "status",
      "type": "dropdown",
      "label": "Status",
      "required": true,
      "filterable": true,
      "showInResults": true,
      "showInView": true,
      "options": [
        { "code": "ACTIVE", "name": "Active" },
        { "code": "INACTIVE", "name": "Inactive" },
        { "code": "ON_LEAVE", "name": "On Leave" }
      ]
    }
  ],

  "api": {
    "create": "/employee/_create",
    "update": "/employee/_update",
    "search": "/employee/_search",
    "view": "/employee/{id}",
    "workflow": "/workflow/_transition"
  },

  "auth": {
    "required": true,
    "roles": ["ADMIN", "HR_MANAGER", "EMPLOYEE"]
  },

  "workflow": {
    "enabled": true,
    "businessService": "EMPLOYEE_WORKFLOW"
  },

  "i18n": {
    "prefix": "EMPLOYEE_",
    "generateKeys": true
  }
}
```

### 6.2 Field Types Reference

| Type | Description | Special Properties |
|------|-------------|-------------------|
| `text` | Simple text input | `validation.pattern`, `minLength`, `maxLength` |
| `textarea` | Multi-line text | `validation.maxLength` |
| `number` | Numeric input | `validation.min`, `max`, `step` |
| `date` | Date picker | - |
| `datetime` | Date and time picker | - |
| `email` | Email input | Auto-validates email format |
| `mobileNumber` | Phone number | `validation.min`, `max` |
| `amount` | Currency input | Shows ₹ prefix |
| `dropdown` | Select dropdown | `options[]` or `mdms{}` |
| `radio` | Radio buttons | `options[]` |
| `checkbox` | Checkbox | - |
| `multiselect` | Multi-select | `options[]` |
| `radioordropdown` | Radio or dropdown | Switches based on option count |
| `locationdropdown` | Location picker | Ward selection |
| `apidropdown` | API-fed dropdown | Fetches from API |
| `file` | File upload | - |
| `component` | Custom component | Reference external component |

### 6.3 Field Flags

| Flag | Purpose | Used In |
|------|---------|---------|
| `required` | Field is mandatory | Create form, validation |
| `searchable` | Field appears in search form | Search screen |
| `filterable` | Field can be used as filter | Search screen filters |
| `showInResults` | Field shown in search results | Search result columns |
| `showInView` | Field shown in detail view | View screen |
| `showInInboxResults` | Field shown in inbox | Inbox screen |
| `inboxSearchable` | Field searchable in inbox | Inbox search |
| `inline` | Field displayed inline | Create form layout |

---

## 7. Code Generation Pipeline

### 7.1 Generation Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CODE GENERATION PIPELINE                              │
└─────────────────────────────────────────────────────────────────────────────┘

STAGE 1: SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input Config ──► Create Directory Structure
                       │
                       ▼
                 ┌─────────────────────┐
                 │ packages/modules/   │
                 │ └── {module-code}/  │
                 │     ├── src/        │
                 │     │   ├── configs/│
                 │     │   ├── pages/  │
                 │     │   │   └── employee/
                 │     │   ├── components/
                 │     │   ├── utils/  │
                 │     │   ├── hooks/  │
                 │     │   └── services/
                 │     ├── localization/
                 │     └── __tests__/  │
                 └─────────────────────┘


STAGE 2: BASE FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► Handlebars ──► package.json
       │              │
       │              └─► webpack.config.js
       │
       └─► Handlebars ──► src/Module.js


STAGE 3: CONFIGURATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each enabled screen:

config.screens.create ──► createConfigGenerator ──► {Entity}CreateConfig.js
config.screens.search ──► searchConfigGenerator ──► {Entity}SearchConfig.js
config.screens.inbox  ──► inboxConfigGenerator  ──► {Entity}InboxConfig.js
config.screens.view   ──► viewConfigGenerator   ──► {Entity}ViewConfig.js


STAGE 4: SCREEN COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each enabled screen:

Template (*.hbs) + Config ──► Handlebars.compile() ──► {Entity}{Screen}.js

templates/screens/create.hbs   ──► src/pages/employee/{Entity}Create.js
templates/screens/search.hbs   ──► src/pages/employee/{Entity}Search.js
templates/screens/inbox.hbs    ──► src/pages/employee/{Entity}Inbox.js
templates/screens/view.hbs     ──► src/pages/employee/{Entity}View.js
templates/screens/response.hbs ──► src/pages/employee/{Entity}Response.js


STAGE 5: UTILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► createUtilsGenerator  ──► src/utils/createUtils.js
       │
       ├─► searchUtilsGenerator  ──► src/utils/searchUtils.js
       │
       └─► responseUtilsGenerator ──► src/utils/responseUtils.js


STAGE 6: SERVICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► serviceGenerator ──► src/hooks/use{Entity}.js
                           │
                           └─► src/services/apiEndpoints.js


STAGE 7: INTERNATIONALIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► i18nGenerator ──► localization/en_IN.json
                        │
                        └─► localization/hi_IN.json


STAGE 8: DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► Handlebars ──► README.md
```

### 7.2 Handlebars Template Processing

**How Templates Work**:

1. **Template Loading**: Read `.hbs` file from `templates/screens/`
2. **Helper Registration**: Register custom helpers (pascalCase, camelCase, etc.)
3. **Compilation**: `Handlebars.compile(templateContent)`
4. **Execution**: `compiled({ config })` - pass config as context
5. **Output**: Generated JavaScript code

**Example Template Processing**:

```handlebars
{{!-- Input Template (create.hbs) --}}
import React from "react";
import { FormComposerV2 } from "@egovernments/digit-ui-components";

const {{pascalCase config.entity.name}}Create = () => {
  // Component code...
};

export default {{pascalCase config.entity.name}}Create;
```

```javascript
// With config.entity.name = "Employee"
// Output:

import React from "react";
import { FormComposerV2 } from "@egovernments/digit-ui-components";

const EmployeeCreate = () => {
  // Component code...
};

export default EmployeeCreate;
```

---

## 8. Detailed File Analysis

### 8.1 Config Generators

#### Create Config Generator (`createConfigGenerator.js`)

**Purpose**: Generate FormComposerV2 configuration for create/edit forms.

**Output Structure**:
```javascript
export const config = [
  {
    head: "EMPLOYEE_CREATE_TITLE",      // Section header
    subHead: "EMPLOYEE_CREATE_SUBTITLE", // Section subtitle
    body: [
      {
        label: "EMPLOYEE_EMPLOYEE_NAME",  // Field label key
        isMandatory: true,                // Required flag
        type: "text",                     // Field type
        disable: false,
        populators: {
          name: "employeeName",           // Field name
          error: "EMPLOYEE_EMPLOYEE_NAME_ERROR",
          validation: {
            pattern: /^[A-Za-z\s]+$/i,
            minLength: 2,
            maxLength: 100
          }
        }
      },
      // ... more fields
    ]
  }
];
```

#### Search Config Generator (`searchConfigGenerator.js`)

**Purpose**: Generate InboxSearchComposer configuration for search screens.

**Output Structure**:
```javascript
const employeeSearchConfig = () => {
  return {
    headerLabel: "EMPLOYEE_SEARCH_EMPLOYEES",
    type: "search",
    actionLabel: "EMPLOYEE_ADD_EMPLOYEE",
    actionRole: "ADMIN",
    actionLink: "employee-mgmt/create",
    apiDetails: {
      serviceName: "/employee/_search",
      requestParam: {},
      requestBody: {
        apiOperation: "SEARCH",
        Employee: {}
      },
      minParametersForSearchForm: 1,
      // ... more config
    },
    sections: {
      search: {
        uiConfig: {
          fields: [
            // Search form fields
          ]
        }
      },
      searchResult: {
        uiConfig: {
          columns: [
            // Result table columns
          ]
        }
      }
    }
  };
};
```

### 8.2 Screen Templates

#### Create Screen Template (`create.hbs`)

**Generated Component Features**:
- Uses `FormComposerV2` from DIGIT components
- Integrates with custom mutation hooks
- Handles form submission with data transformation
- Navigates to response page on success
- Shows loading state during API call

#### Search Screen Template (`search.hbs`)

**Generated Component Features**:
- Uses `InboxSearchComposer` from DIGIT components
- Role-based "Create" button visibility
- Dynamic configuration from search config
- Navigation to create screen

### 8.3 Service Generator

**Generates Two Files**:

1. **`use{Entity}.js`** (Hooks File):
   - `useCreate{Entity}()` - Mutation hook for creation
   - `useUpdate{Entity}()` - Mutation hook for updates
   - `useSearch{Entity}s()` - Query hook for search
   - `useGet{Entity}ById()` - Query hook for single item
   - `use{Entity}Workflow()` - Workflow mutation (if enabled)
   - `transform` functions for data mapping

2. **`apiEndpoints.js`**:
   - Centralized endpoint definitions
   - Common endpoints (MDMS, Workflow, File Upload)
   - URL builder utility

### 8.4 i18n Generator

**Generates Localization Keys For**:
- Module names and descriptions
- Screen titles (Create, Search, View, Inbox)
- Action labels (Submit, Cancel, Save, etc.)
- Success/error messages
- Field labels and error messages
- Status labels
- Pagination labels
- Workflow labels (if enabled)

**Languages Supported**:
- `en_IN` (English - India)
- `hi_IN` (Hindi - India)

---

## 9. Templates System

### 9.1 Pre-built Templates

| Template | Description | Entity | Fields Count |
|----------|-------------|--------|--------------|
| `hrms` | Human Resource Management | Employee | 20+ fields |
| `inventory` | Inventory Management | Asset | 15+ fields |
| `project-mgmt` | Project Management | Project | 12+ fields |

### 9.2 HRMS Template Structure

```json
{
  "name": "Human Resource Management System",
  "description": "Complete HRMS module...",
  "version": "1.0.0",
  "category": "governance",
  "config": {
    "module": {
      "name": "HRMS",
      "code": "hrms",
      "description": "Human Resource Management System"
    },
    "entity": {
      "name": "Employee",
      "apiPath": "/egov-hrms/employees",
      "primaryKey": "code",
      "displayField": "name"
    },
    "fields": [
      // Personal Info
      { "name": "employeeId", "type": "text", ... },
      { "name": "employeeName", "type": "text", ... },
      { "name": "dateOfBirth", "type": "date", ... },
      { "name": "gender", "type": "dropdown", ... },

      // Contact Info
      { "name": "mobileNumber", "type": "mobileNumber", ... },
      { "name": "email", "type": "email", ... },

      // Employment Info
      { "name": "department", "type": "dropdown", ... },
      { "name": "designation", "type": "dropdown", ... },
      { "name": "joiningDate", "type": "date", ... },
      { "name": "employmentStatus", "type": "dropdown", ... },
      { "name": "salary", "type": "amount", ... }
      // ... and more
    ]
  }
}
```

### 9.3 Creating Custom Templates

**Location**: Place in `~/.digit-gen/templates/` or `templates/`

**Required Structure**:
```
my-template/
└── template.json
```

**Template File Format**:
```json
{
  "name": "My Custom Template",
  "description": "Description of what this template provides",
  "version": "1.0.0",
  "author": "Your Name <email@example.com>",
  "category": "custom",
  "config": {
    // Full configuration object (same as config file)
  }
}
```

---

## 10. Generated Output Structure

### 10.1 Complete Module Output

For `digit-gen create --config employee-config.json`:

```
packages/modules/employee-mgmt/
│
├── package.json                    # NPM package with dependencies
├── webpack.config.js               # Webpack configuration
├── README.md                       # Module documentation
│
├── src/
│   ├── Module.js                   # Main module export with lazy loading
│   │
│   ├── configs/
│   │   ├── EmployeeCreateConfig.js # Create form configuration
│   │   ├── EmployeeSearchConfig.js # Search configuration
│   │   ├── EmployeeInboxConfig.js  # Inbox configuration
│   │   └── EmployeeViewConfig.js   # View configuration
│   │
│   ├── pages/
│   │   └── employee/
│   │       ├── EmployeeCreate.js   # Create screen component
│   │       ├── EmployeeSearch.js   # Search screen component
│   │       ├── EmployeeInbox.js    # Inbox screen component
│   │       ├── EmployeeView.js     # View screen component
│   │       └── EmployeeResponse.js # Response screen component
│   │
│   ├── hooks/
│   │   └── useEmployee.js          # API hooks (CRUD operations)
│   │
│   ├── services/
│   │   └── apiEndpoints.js         # API endpoint definitions
│   │
│   ├── utils/
│   │   ├── createUtils.js          # Data transformation for create/update
│   │   ├── searchUtils.js          # Search data processing
│   │   └── responseUtils.js        # Response handling utilities
│   │
│   └── components/                 # (Empty, for custom components)
│
├── localization/
│   ├── en_IN.json                  # English translations
│   └── hi_IN.json                  # Hindi translations
│
└── __tests__/
    ├── components/                 # Component tests
    └── utils/                      # Utility tests
```

### 10.2 Generated File Examples

#### Module.js
```javascript
import React from "react";
import { CommonScreen } from "@egovernments/digit-ui-components";
import EmployeeCreate from "./pages/employee/EmployeeCreate";
import EmployeeSearch from "./pages/employee/EmployeeSearch";
// ... other imports

const EmployeeModule = ({ stateCode, userType, tenantId }) => {
  const moduleCode = "EMPLOYEE_MGMT";
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({
    stateCode, moduleCode, language
  });

  if (isLoading) {
    return <Loader />;
  }

  return <CommonScreen {...{ stateCode, userType, tenantId, moduleCode, data: store }} />;
};

const EmployeeModuleComponents = {
  EmployeeModule,
  EmployeeCreate: React.lazy(() => import("./pages/employee/EmployeeCreate")),
  EmployeeSearch: React.lazy(() => import("./pages/employee/EmployeeSearch")),
  // ... other lazy-loaded components
};

export { EmployeeModuleComponents };
```

#### useEmployee.js (Hooks)
```javascript
// API Request Configurations
export const employeeRequestConfigs = {
  create: {
    url: "/employee/_create",
    params: {},
    body: {},
    config: { enable: false }
  },
  search: {
    url: "/employee/_search",
    params: {},
    body: {},
    config: {
      enable: false,
      select: (data) => data?.Employees || []
    }
  }
  // ... more configs
};

// Hooks
export const useCreateEmployee = () => {
  return Digit.Hooks.useCustomAPIMutationHook(employeeRequestConfigs.create);
};

export const useSearchEmployees = (searchCriteria = {}, tenantId, enabled = true) => {
  const requestConfig = {
    ...employeeRequestConfigs.search,
    params: { tenantId, ...searchCriteria },
    body: {
      EmployeeSearchCriteria: { tenantId, ...searchCriteria }
    },
    config: {
      ...employeeRequestConfigs.search.config,
      enable: enabled
    }
  };
  return Digit.Hooks.useCustomAPIHook(requestConfig);
};

// Data transformation
export const transformCreateEmployeeData = (formData, tenantId, userInfo) => {
  return {
    Employee: {
      ...formData,
      tenantId,
      auditDetails: {
        createdBy: userInfo?.uuid,
        createdTime: Date.now(),
        lastModifiedBy: userInfo?.uuid,
        lastModifiedTime: Date.now()
      }
    }
  };
};
```

---

## 11. Key Design Patterns

### 11.1 Configuration-Driven Architecture

The entire system is driven by configuration objects. This pattern allows:
- **Declarative Module Definition**: Define what you want, not how to build it
- **Consistency**: Same configuration produces same output
- **Extensibility**: Add new features by extending configuration schema
- **Validation**: Configurations can be validated before generation

### 11.2 Template Engine Pattern (Handlebars)

Using Handlebars for code generation provides:
- **Separation of Concerns**: Templates define structure, data provides content
- **Reusability**: Same template with different data = different outputs
- **Maintainability**: Update template once, affects all generated code
- **Custom Helpers**: Extend template capabilities with JavaScript functions

### 11.3 Generator Pattern

Each generator is responsible for a specific type of output:
```
ModuleGenerator
├── ConfigGenerator (Abstract)
│   ├── CreateConfigGenerator
│   ├── SearchConfigGenerator
│   ├── InboxConfigGenerator
│   └── ViewConfigGenerator
├── ScreenGenerator
├── UtilsGenerator
├── ServiceGenerator
└── I18nGenerator
```

### 11.4 Plugin Architecture

The system supports extensibility through:
- **Custom Templates**: Add new templates in templates directory
- **Custom Field Types**: Define new field types with custom rendering
- **Custom Validators**: Add business-specific validation rules

### 11.5 DIGIT Framework Patterns

Generated code follows DIGIT conventions:
- **FormComposerV2**: Standard form component with configuration
- **InboxSearchComposer**: Standard search interface
- **useCustomAPIHook**: Standard API integration pattern
- **useCustomAPIMutationHook**: Standard mutation pattern
- **Localization**: Standard i18n key naming conventions

---

## 12. How to Extend

### 12.1 Adding a New Field Type

1. **Update Validator** (`configValidator.js`):
```javascript
// Add to fieldConfig type enum
type: {
  enum: [
    // ... existing types
    'newFieldType'
  ]
}
```

2. **Update Config Generator** (`createConfigGenerator.js`):
```handlebars
{{#if (eq type 'newFieldType')}}
  // Add template for new field type
  customConfig: { ... }
{{/if}}
```

3. **Update Type Mapping** (`apiSpecParser.js`):
```javascript
const typeMap = {
  // ... existing mappings
  'customOpenApiType': 'newFieldType'
};
```

### 12.2 Adding a New Screen Type

1. **Create Template**: `templates/screens/newscreen.hbs`

2. **Create Config Generator**: `src/generators/configGenerators/newScreenConfigGenerator.js`

3. **Update Module Generator**:
```javascript
// In generateConfigs()
case 'newscreen':
  configContent = generateNewScreenConfig(config);
  break;
```

4. **Update Schema** (`configValidator.js`):
```javascript
screens: {
  properties: {
    // ... existing
    newscreen: { $ref: '#/definitions/screenConfig' }
  }
}
```

### 12.3 Adding a New Template

1. **Create Template Directory**: `templates/my-template/`

2. **Create Configuration**: `templates/my-template/template.json`
```json
{
  "name": "My New Template",
  "description": "Description of template",
  "version": "1.0.0",
  "category": "custom",
  "config": {
    // Full configuration
  }
}
```

3. **Use Template**:
```bash
digit-gen create --template my-template --entity MyEntity
```

### 12.4 Adding Business Validations

Add to `validateBusinessLogic()` in `configValidator.js`:

```javascript
function validateBusinessLogic(config) {
  const errors = [];

  // Add custom validation
  if (config.customField && !config.relatedField) {
    errors.push('relatedField is required when customField is set');
  }

  return errors;
}
```

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **DIGIT** | Digital Infrastructure for Governance, Impact & Transformation - eGov's platform |
| **Micro-UI** | Modular UI architecture where each module is independently deployable |
| **FormComposerV2** | DIGIT component for building configuration-driven forms |
| **InboxSearchComposer** | DIGIT component for search and list interfaces |
| **MDMS** | Master Data Management Service - centralized configuration service |
| **Handlebars** | Template engine used for code generation |
| **AJV** | Another JSON Validator - JSON Schema validation library |
| **OpenAPI** | Specification for describing REST APIs (formerly Swagger) |
| **Tenant** | Multi-tenant isolation unit in DIGIT (typically a ULB) |
| **ULB** | Urban Local Body - municipality or city administration |
| **Workflow** | Business process management in DIGIT |
| **BusinessService** | Workflow configuration identifier |
| **i18n** | Internationalization - multi-language support |
| **PascalCase** | Naming convention: `EmployeeName` |
| **camelCase** | Naming convention: `employeeName` |
| **kebab-case** | Naming convention: `employee-name` |
| **CONSTANT_CASE** | Naming convention: `EMPLOYEE_NAME` |

---

## Quick Reference Commands

```bash
# Create module from config
digit-gen create --config ./employee-config.json

# Create from template
digit-gen create --template hrms --entity Employee

# Create from API spec
digit-gen create --api-spec ./swagger.yaml --entity User

# Interactive mode
digit-gen create

# Preview without creating
digit-gen create --config ./config.json --dry-run

# List templates
digit-gen templates --detailed

# Validate configuration
digit-gen validate --config ./config.json

# Generate specific screen
digit-gen screen create --entity Employee --config ./config.json

# Generate utilities
digit-gen utils --entity Employee --config ./config.json

# Generate i18n
digit-gen i18n --config ./config.json --languages en_IN,hi_IN
```

---

## Document Information

- **Version**: 1.0
- **Last Updated**: January 2026
- **Author**: Generated from codebase analysis
- **Source**: digit-ui-code-gen repository

---

*This document provides a complete understanding of the DIGIT Module Generator codebase. For specific implementation details, refer to the source files mentioned in each section.*
