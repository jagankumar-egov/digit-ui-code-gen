# DIGIT Module Generator - Complete Technical Understanding Guide

> A comprehensive technical guide for developers and users to understand the complete architecture, flow, and implementation details of the DIGIT Module Generator.

---

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Architecture Overview](#2-architecture-overview)
- [3. Directory Structure](#3-directory-structure)
- [4. Core Components](#4-core-components)
- [5. Data Flow & Sequence Diagrams](#5-data-flow--sequence-diagrams)
- [6. Configuration Schema](#6-configuration-schema)
- [7. Code Generation Pipeline](#7-code-generation-pipeline)
- [8. Detailed File Analysis](#8-detailed-file-analysis)
- [9. Templates System](#9-templates-system)
- [10. Generated Output Structure](#10-generated-output-structure)
- [11. Key Design Patterns](#11-key-design-patterns)
- [12. How to Extend](#12-how-to-extend)
- [13. Quick Reference](#13-quick-reference)
- [14. Glossary](#14-glossary)

---

## 1. Introduction

### What is DIGIT Module Generator?

The **DIGIT Module Generator** is a powerful CLI (Command Line Interface) tool that automates the creation of complete DIGIT micro-UI modules. It transforms JSON configurations or OpenAPI specifications into production-ready React components, API services, and utilities.

### Problem Statement

Creating a new DIGIT module manually requires:
- Writing repetitive boilerplate code
- Setting up consistent project structure
- Creating form configurations, search screens, view screens
- Implementing API integrations
- Setting up internationalization
- Ensuring consistency across modules

### Solution

This tool automates all of the above by:
- Using JSON configurations to define module structure
- Parsing OpenAPI/Swagger specs to auto-generate field definitions
- Using Handlebars templates to generate consistent React components
- Producing production-ready code that follows DIGIT conventions

### Key Features

| Feature | Description |
|---------|-------------|
| **Configuration-Driven** | Define your module structure in JSON |
| **API Spec Integration** | Parse OpenAPI 3.x / Swagger 2.x to auto-generate fields |
| **Template System** | Pre-built templates (HRMS, Inventory, Project Management) |
| **Multiple Screen Types** | Create, Search, View, Inbox, Response screens |
| **i18n Support** | Multi-language support (English, Hindi) |
| **Validation** | JSON Schema validation with business logic checks |
| **Workflow Integration** | Built-in workflow support for DIGIT |

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
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌───────┐        │
│  │ create.js│ │validate.js│ │screen.js│ │utils.js│ │ i18n.js│ │diff.js│        │
│  └────┬─────┘ └─────┬────┘ └────┬────┘ └───┬────┘ └───┬────┘ └───┬───┘        │
│       │             │           │          │          │          │             │
│       │    Orchestrates loading, validation, and generation                    │
└───────┼─────────────┼───────────┼──────────┼──────────┼──────────┼─────────────┘
        │             │           │          │          │          │
        ▼             ▼           ▼          ▼          ▼          ▼
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
├── README.md                           # Root README
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
    │   │   │   ├── createConfigGenerator.js
    │   │   │   ├── searchConfigGenerator.js
    │   │   │   ├── inboxConfigGenerator.js
    │   │   │   └── viewConfigGenerator.js
    │   │   │
    │   │   ├── utilsGenerators/        # Utility generators
    │   │   │   ├── createUtilsGenerator.js
    │   │   │   ├── responseUtilsGenerator.js
    │   │   │   └── searchUtilsGenerator.js
    │   │   │
    │   │   ├── screenGenerators/       # Screen component generators
    │   │   │   └── screenGenerator.js
    │   │   │
    │   │   ├── serviceGenerators/      # API service generators
    │   │   │   └── serviceGenerator.js
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
    │   └── screens/                    # Handlebars templates
    │       ├── create.hbs
    │       ├── search.hbs
    │       ├── inbox.hbs
    │       ├── view.hbs
    │       └── response.hbs
    │
    ├── dist/                           # Compiled JavaScript (babel output)
    │
    ├── examples/                       # Usage examples
    │   ├── basic-example.js
    │   └── api-integration-example.js
    │
    ├── docs/
    │   ├── README.md                   # User documentation
    │   └── UNDERSTANDING_README.md     # This file
    │
    ├── package.json                    # NPM package configuration
    │
    └── Example config files:
        ├── employee-config.json
        ├── propertytax-config.json
        ├── trade-license-config.json
        ├── property-registry-api.yaml
        └── trade-license-api.yaml
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
    │
    ├─4─► generateWebpackConfig()
    │
    ├─5─► generateMainModule()
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
```

---

### 4.4 API Spec Parser (`src/parsers/apiSpecParser.js`)

**Purpose**: Parse OpenAPI 3.x and Swagger 2.x specifications to extract field definitions.

**Supported Input Formats**:
- Local JSON files
- Local YAML files
- Remote URLs (HTTP/HTTPS)

**Type Mapping Table**:

| OpenAPI Type | Format | DIGIT Type |
|--------------|--------|------------|
| `string` | (none) | `text` |
| `string` | `date` | `date` |
| `string` | `date-time` | `datetime` |
| `string` | `email` | `email` |
| `string` | `uri/url` | `url` |
| `string` | `password` | `password` |
| `string` | `byte/binary` | `file` |
| `string` | (maxLength>255) | `textarea` |
| `number` | (any) | `number` |
| `integer` | (any) | `number` |
| `boolean` | (any) | `checkbox` |
| `array` | (any) | `multiselect` |
| `object` | (any) | `component` |
| `enum` | (any) | `dropdown` |

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
│   ├── name: string (pattern: ^[A-Z][a-zA-Z0-9]*$)
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
│
├── api (optional)
├── auth (optional)
├── workflow (optional)
└── i18n (optional)
```

**Business Logic Validations**:
- Workflow enabled → businessService required
- Inbox enabled → workflow must be enabled
- Dropdown/radio/multiselect → options OR mdms required
- validation.min ≤ validation.max
- validation.minLength ≤ validation.maxLength
- No duplicate field names
- API paths → must start with '/'
- i18n.prefix → must end with '_'

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
```

### 5.2 Validation Flow

```
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
└──────────┘   └────────────────┘
```

---

## 6. Configuration Schema

### Complete Configuration Example

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
        { "code": "FINANCE", "name": "Finance" }
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

### Field Types Reference

| Type | Description | Special Properties |
|------|-------------|-------------------|
| `text` | Simple text input | `validation.pattern`, `minLength`, `maxLength` |
| `textarea` | Multi-line text | `validation.maxLength` |
| `number` | Numeric input | `validation.min`, `max`, `step` |
| `date` | Date picker | - |
| `datetime` | Date and time picker | - |
| `email` | Email input | Auto-validates email format |
| `mobileNumber` | Phone number | `validation.min`, `max` |
| `amount` | Currency input | Shows prefix |
| `dropdown` | Select dropdown | `options[]` or `mdms{}` |
| `radio` | Radio buttons | `options[]` |
| `checkbox` | Checkbox | - |
| `multiselect` | Multi-select | `options[]` |
| `radioordropdown` | Radio or dropdown | Switches based on option count |
| `locationdropdown` | Location picker | Ward selection |
| `apidropdown` | API-fed dropdown | Fetches from API |
| `file` | File upload | - |
| `component` | Custom component | Reference external component |

### Field Flags

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

### Generation Pipeline Overview

```
STAGE 1: SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input Config ──► Create Directory Structure
                       │
                       ▼
                 packages/modules/{module-code}/
                 ├── src/
                 │   ├── configs/
                 │   ├── pages/employee/
                 │   ├── components/
                 │   ├── utils/
                 │   ├── hooks/
                 │   └── services/
                 ├── localization/
                 └── __tests__/


STAGE 2: BASE FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► Handlebars ──► package.json
       │              └─► webpack.config.js
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
       ├─► searchUtilsGenerator  ──► src/utils/searchUtils.js
       └─► responseUtilsGenerator ──► src/utils/responseUtils.js


STAGE 6: SERVICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► serviceGenerator ──► src/hooks/use{Entity}.js
                           └─► src/services/apiEndpoints.js


STAGE 7: INTERNATIONALIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► i18nGenerator ──► localization/en_IN.json
                        └─► localization/hi_IN.json


STAGE 8: DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Config ──► Handlebars ──► README.md
```

---

## 8. Detailed File Analysis

### Config Generators

#### Create Config Generator
Generates FormComposerV2 configuration for create/edit forms with field validation, MDMS integration, and proper localization keys.

#### Search Config Generator
Generates InboxSearchComposer configuration with search form fields, result columns, and API integration.

### Screen Templates

#### Create Screen Template (`create.hbs`)
- Uses `FormComposerV2` from DIGIT components
- Integrates with custom mutation hooks
- Handles form submission with data transformation
- Navigates to response page on success

#### Search Screen Template (`search.hbs`)
- Uses `InboxSearchComposer` from DIGIT components
- Role-based "Create" button visibility
- Dynamic configuration from search config

### Service Generator

Generates two files:

1. **`use{Entity}.js`** (Hooks File):
   - `useCreate{Entity}()` - Mutation hook for creation
   - `useUpdate{Entity}()` - Mutation hook for updates
   - `useSearch{Entity}s()` - Query hook for search
   - `useGet{Entity}ById()` - Query hook for single item
   - `use{Entity}Workflow()` - Workflow mutation (if enabled)
   - Transform functions for data mapping

2. **`apiEndpoints.js`**:
   - Centralized endpoint definitions
   - Common endpoints (MDMS, Workflow, File Upload)
   - URL builder utility

### i18n Generator

Generates localization keys for:
- Module names and descriptions
- Screen titles (Create, Search, View, Inbox)
- Action labels (Submit, Cancel, Save, etc.)
- Success/error messages
- Field labels and error messages
- Status labels
- Workflow labels (if enabled)

**Languages Supported**: `en_IN`, `hi_IN`

---

## 9. Templates System

### Pre-built Templates

| Template | Description | Entity | Fields Count |
|----------|-------------|--------|--------------|
| `hrms` | Human Resource Management | Employee | 20+ fields |
| `inventory` | Inventory Management | Asset | 15+ fields |
| `project-mgmt` | Project Management | Project | 12+ fields |

### Creating Custom Templates

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

---

## 11. Key Design Patterns

### Configuration-Driven Architecture
- **Declarative Module Definition**: Define what you want, not how to build it
- **Consistency**: Same configuration produces same output
- **Extensibility**: Add new features by extending configuration schema
- **Validation**: Configurations can be validated before generation

### Template Engine Pattern (Handlebars)
- **Separation of Concerns**: Templates define structure, data provides content
- **Reusability**: Same template with different data = different outputs
- **Maintainability**: Update template once, affects all generated code
- **Custom Helpers**: Extend template capabilities with JavaScript functions

### Generator Pattern
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

### DIGIT Framework Patterns
- **FormComposerV2**: Standard form component with configuration
- **InboxSearchComposer**: Standard search interface
- **useCustomAPIHook**: Standard API integration pattern
- **useCustomAPIMutationHook**: Standard mutation pattern
- **Localization**: Standard i18n key naming conventions

---

## 12. How to Extend

### Adding a New Field Type

1. **Update Validator** (`configValidator.js`):
```javascript
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

### Adding a New Screen Type

1. Create Template: `templates/screens/newscreen.hbs`
2. Create Config Generator: `src/generators/configGenerators/newScreenConfigGenerator.js`
3. Update Module Generator to handle the new screen type
4. Update Schema in `configValidator.js`

### Adding a New Template

1. Create Template Directory: `templates/my-template/`
2. Create Configuration: `templates/my-template/template.json`
3. Use: `digit-gen create --template my-template --entity MyEntity`

---

## 13. Quick Reference

### CLI Commands

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

### Command Options

| Command | Options |
|---------|---------|
| `create` | `-n, --name`, `-c, --code`, `-e, --entity`, `-a, --api-spec`, `-t, --template`, `-s, --screens`, `-o, --output`, `--config`, `--force`, `--dry-run` |
| `templates` | `-d, --detailed` |
| `validate` | `--config` (required) |
| `screen` | `-e, --entity` (required), `--config`, `-o, --output` |
| `utils` | `-e, --entity` (required), `--config`, `-o, --output` |
| `i18n` | `--config` (required), `-l, --languages`, `-o, --output` |
| `migrate` | `--module` (required), `--version`, `--backup` |
| `diff` | `--template` (required) |

---

## 14. Glossary

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

## Document Information

| Property | Value |
|----------|-------|
| **Version** | 1.0 |
| **Last Updated** | January 2026 |
| **Repository** | digit-ui-code-gen |

---

> This document provides a complete understanding of the DIGIT Module Generator codebase. For specific implementation details, refer to the source files mentioned in each section.
