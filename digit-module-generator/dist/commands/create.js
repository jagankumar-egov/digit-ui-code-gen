/**
 * create.js — `digit-gen create` command implementation
 *
 * Entry point for generating a complete DIGIT micro-UI module.
 *
 * Three input modes (combinable):
 *   --template <name>   Pre-built template (hrms, inventory, project-mgmt, showcase)
 *   --config <file>     Custom JSON config file
 *   --api-spec <file>   OpenAPI/Swagger spec — fields and API endpoints are derived automatically
 *
 * Flow:
 *   1. Load config (template / JSON file / API spec, or interactive prompt)
 *   2. Merge inputs — api-spec fields are merged into template/config base
 *   3. Validate with AJV + business logic (configValidator)
 *   4. Optionally show --dry-run preview
 *   5. Call generateFromConfig (moduleGenerator orchestrator)
 *   6. Prompt user: "Integrate with micro-ui/web?" → webAppIntegrator
 *
 * Key flags:
 *   --force    Overwrite existing module. When output is inside micro-ui/web and
 *              --only is NOT set, deintegrates the module first to clear stale entries,
 *              then re-integrates after generation.
 *   --only     Partial generation (e.g. --only screens,configs). Skips deintegration
 *              since the host-app registration is still valid.
 *   --dry-run  Print what would be generated without writing any files.
 *   --output   Custom output directory (default: ./micro-ui/web/packages/modules/)
 */
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const {
  generateFromConfig
} = require('../generators/moduleGenerator');
const {
  parseApiSpec
} = require('../parsers/apiSpecParser');
const {
  validateModuleConfig
} = require('../validators/configValidator');
const {
  getTemplateConfig
} = require('../templates/templateManager');
const {
  integrateWithWebApp,
  deintegrateFromWebApp,
  isIntegrated
} = require('../integrators/webAppIntegrator');

/**
 * Main handler for the `digit-gen create` command.
 * Orchestrates config loading, validation, generation, and optional web-app integration.
 *
 * @param {Object} options - Commander.js parsed options
 * @param {string} [options.config]    - Path to JSON config file
 * @param {string} [options.template]  - Template name to use as base
 * @param {string} [options.apiSpec]   - Path to OpenAPI spec file or URL
 * @param {string} [options.entity]    - Entity name (required for api-spec mode)
 * @param {string} [options.output]    - Output directory path
 * @param {boolean} [options.force]    - Overwrite existing module
 * @param {string} [options.only]      - Comma-separated categories to regenerate
 * @param {boolean} [options.dryRun]   - Preview only, no files written
 */
async function createModule(options) {
  try {
    console.log(chalk.blue('\n🚀 Starting module generation...\n'));
    let config = {};

    // Load config from file if provided
    if (options.config) {
      const configPath = path.resolve(options.config);
      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
        // Unwrap if config is nested under a "config" key (template format)
        if (config.config) {
          config = config.config;
        }
        console.log(chalk.green(`✅ Loaded configuration from ${options.config}`));
      } else {
        console.log(chalk.red(`❌ Configuration file not found: ${options.config}`));
        return;
      }
    }

    // Use template config if specified
    if (options.template) {
      const templateConfig = await getTemplateConfig(options.template);
      config = {
        ...templateConfig,
        ...config
      };
      console.log(chalk.green(`✅ Using template: ${options.template}`));
    }

    // Parse API specification if provided
    if (options.apiSpec) {
      console.log(chalk.blue('📄 Parsing API specification...'));
      const apiConfig = await parseApiSpec(options.apiSpec, options.entity);
      if (apiConfig) {
        config = mergeConfigs(config, apiConfig);
        console.log(chalk.green('✅ API specification parsed successfully'));
      }
    }

    // Interactive prompts if not all info provided
    if (!config.module || !isConfigComplete(config)) {
      config = await promptForConfig(config, options);
    }

    // Override with CLI options
    if (options.name) config.module.name = options.name;
    if (options.code) config.module.code = options.code;
    if (options.entity) config.entity.name = options.entity;
    if (options.screens) {
      const screenList = options.screens.split(',').map(s => s.trim());
      updateScreensConfig(config, screenList);
    }

    // Validate configuration
    console.log(chalk.blue('\n🔍 Validating configuration...'));
    const validation = validateModuleConfig(config);
    if (!validation.valid) {
      console.log(chalk.red('❌ Configuration validation failed:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
      return;
    }
    console.log(chalk.green('✅ Configuration is valid'));

    // Show preview if dry run
    if (options.dryRun) {
      await showPreview(config, options.output);
      return;
    }

    // If --force (full regeneration, not partial --only), clean up stale integration entries
    if (options.force && !options.only) {
      const resolvedOutput = path.resolve(options.output);
      const defaultWebDir = path.resolve('./micro-ui/web');
      if (resolvedOutput.startsWith(defaultWebDir)) {
        const alreadyIntegrated = await isIntegrated(config, defaultWebDir);
        if (alreadyIntegrated) {
          console.log(chalk.yellow('\n⚠️  Detected stale integration entries — cleaning up before regeneration...'));
          await deintegrateFromWebApp(config, defaultWebDir);
        }
      }
    }

    // Generate module
    console.log(chalk.blue('\n⚙️  Generating module files...'));
    const spinner = ora('Creating module structure...').start();
    try {
      const result = await generateFromConfig(config, options.output, options.force, {
        only: options.only
      });
      spinner.succeed('Module generated successfully!');
      console.log(chalk.green('\n🎉 Module generation completed!\n'));
      console.log(chalk.white('📁 Files created:'));
      result.files.forEach(file => {
        console.log(chalk.gray(`   ${file}`));
      });

      // Auto-detect micro-ui/web directory, then ask to integrate
      const defaultWebDir = './micro-ui/web';
      const defaultWebDirExists = await fs.pathExists(path.join(defaultWebDir, 'src', 'index.js'));
      const integrationMessage = defaultWebDirExists ? `Integrate this module into the host app? (found at ${defaultWebDir})` : 'Integrate this module into the micro-ui/web host app?';
      const {
        shouldIntegrate
      } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldIntegrate',
        message: integrationMessage,
        default: defaultWebDirExists
      }]);
      if (shouldIntegrate) {
        let resolvedWebDir = path.resolve(defaultWebDir);

        // Only ask for path if auto-detected dir doesn't exist
        if (!defaultWebDirExists) {
          const {
            webDir
          } = await inquirer.prompt([{
            type: 'input',
            name: 'webDir',
            message: 'Path to micro-ui/web directory:',
            validate: async input => {
              const resolved = path.resolve(input);
              const exists = await fs.pathExists(path.join(resolved, 'src', 'index.js'));
              return exists || `No src/index.js found at ${resolved} — is this the right path?`;
            }
          }]);
          resolvedWebDir = path.resolve(webDir);
        }
        await integrateWithWebApp(config, resolvedWebDir);
      } else {
        console.log(chalk.blue('\n📖 Next steps:'));
        console.log(chalk.white('1. Navigate to your module directory'));
        console.log(chalk.white('2. Run npm install to install dependencies'));
        console.log(chalk.white('3. Update the generated configs as needed'));
        console.log(chalk.white('4. Test your module integration'));
      }
      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`   ${warning}`));
        });
      }
    } catch (error) {
      spinner.fail('Module generation failed');
      throw error;
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error creating module:'), error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}
async function promptForConfig(existingConfig = {}, options = {}) {
  const questions = [];

  // Module information
  if (!existingConfig.module?.name) {
    questions.push({
      type: 'input',
      name: 'moduleName',
      message: 'What is your module name?',
      default: options.name,
      validate: input => input.length > 0 || 'Module name is required'
    });
  }
  if (!existingConfig.module?.code) {
    questions.push({
      type: 'input',
      name: 'moduleCode',
      message: 'Module code (kebab-case):',
      default: answers => answers.moduleName ? answers.moduleName.toLowerCase().replace(/\s+/g, '-') : options.code,
      validate: input => /^[a-z0-9-]+$/.test(input) || 'Code must be kebab-case (lowercase, hyphens only)'
    });
  }

  // Entity information
  if (!existingConfig.entity?.name) {
    questions.push({
      type: 'input',
      name: 'entityName',
      message: 'Entity name (PascalCase):',
      default: options.entity,
      validate: input => /^[A-Z][a-zA-Z0-9]*$/.test(input) || 'Entity name must be PascalCase'
    });
  }
  if (!existingConfig.entity?.apiPath) {
    questions.push({
      type: 'input',
      name: 'apiBasePath',
      message: 'API base path:',
      default: '/api/v1',
      validate: input => input.startsWith('/') || 'API path must start with /'
    });
  }

  // Screen selection
  if (!existingConfig.screens) {
    questions.push({
      type: 'checkbox',
      name: 'screens',
      message: 'Select screens to generate:',
      choices: [{
        name: 'Create',
        value: 'create',
        checked: true
      }, {
        name: 'Search',
        value: 'search',
        checked: true
      }, {
        name: 'Inbox',
        value: 'inbox',
        checked: true
      }, {
        name: 'View',
        value: 'view',
        checked: true
      }, {
        name: 'Response',
        value: 'response',
        checked: true
      }],
      validate: input => input.length > 0 || 'At least one screen must be selected'
    });
  }

  // Authentication and roles
  questions.push({
    type: 'confirm',
    name: 'requireAuth',
    message: 'Authentication required?',
    default: true
  });
  questions.push({
    type: 'input',
    name: 'roles',
    message: 'Required roles (comma-separated):',
    default: 'ADMIN,USER',
    when: answers => answers.requireAuth,
    validate: input => input.trim().length > 0 || 'At least one role is required'
  });

  // Workflow (required if inbox screen is selected)
  questions.push({
    type: 'confirm',
    name: 'hasWorkflow',
    message: answers => {
      const screens = answers.screens || [];
      if (screens.includes('inbox')) return 'Generate with workflow? (required for inbox screen)';
      return 'Generate with workflow?';
    },
    default: answers => (answers.screens || []).includes('inbox')
  });
  questions.push({
    type: 'input',
    name: 'workflowBusinessService',
    message: 'Workflow business service name:',
    when: answers => answers.hasWorkflow,
    validate: input => input.trim().length > 0 || 'Business service name is required'
  });

  // Get answers
  const answers = await inquirer.prompt(questions);

  // Build configuration object
  const config = {
    module: {
      name: answers.moduleName || existingConfig.module?.name,
      code: answers.moduleCode || existingConfig.module?.code,
      description: `${answers.moduleName || existingConfig.module?.name} management system`,
      version: '1.0.0',
      ...existingConfig.module
    },
    entity: {
      name: answers.entityName || existingConfig.entity?.name,
      apiPath: answers.apiBasePath || existingConfig.entity?.apiPath,
      primaryKey: `${(answers.entityName || existingConfig.entity?.name).toLowerCase()}Id`,
      displayField: `${(answers.entityName || existingConfig.entity?.name).toLowerCase()}Name`,
      ...existingConfig.entity
    },
    screens: buildScreensConfig(answers.screens || Object.keys(existingConfig.screens || {}), answers),
    fields: existingConfig.fields || getDefaultFields(),
    api: existingConfig.api || getDefaultApiConfig(),
    auth: {
      required: answers.requireAuth,
      roles: answers.roles ? answers.roles.split(',').map(r => r.trim()) : []
    },
    workflow: answers.hasWorkflow ? {
      enabled: true,
      businessService: answers.workflowBusinessService
    } : {
      enabled: false
    },
    i18n: {
      prefix: `${answers.entityName?.toUpperCase() || existingConfig.entity?.name?.toUpperCase()}_`,
      generateKeys: true,
      ...existingConfig.i18n
    },
    ...existingConfig
  };
  return config;
}
function buildScreensConfig(screens, answers) {
  const config = {};
  screens.forEach(screen => {
    config[screen] = {
      enabled: true,
      roles: answers.roles ? answers.roles.split(',').map(r => r.trim()) : ['ADMIN']
    };

    // Screen-specific configuration
    switch (screen) {
      case 'create':
        config[screen].workflow = answers.hasWorkflow;
        break;
      case 'search':
        config[screen].filters = ['status', 'dateRange'];
        break;
      case 'inbox':
        config[screen].businessService = answers.workflowBusinessService;
        break;
      case 'view':
        config[screen].sections = ['basic', 'details'];
        break;
      case 'response':
        config[screen].types = ['basic'];
        break;
    }
  });
  return config;
}
function getDefaultFields() {
  return [{
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
    validation: {
      pattern: '^[A-Za-z\\s]+$',
      maxLength: 100
    }
  }, {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    required: false
  }, {
    name: 'status',
    type: 'dropdown',
    label: 'Status',
    required: true,
    options: [{
      code: 'ACTIVE',
      name: 'Active'
    }, {
      code: 'INACTIVE',
      name: 'Inactive'
    }]
  }];
}
function getDefaultApiConfig() {
  return {
    create: '/_create',
    update: '/_update',
    search: '/_search',
    workflow: '/workflow/_transition'
  };
}
function mergeConfigs(base, api) {
  // Deep merge configuration objects
  return {
    ...base,
    ...api,
    fields: [...(base.fields || []), ...(api.fields || [])],
    api: {
      ...(base.api || {}),
      ...(api.api || {})
    }
  };
}
function updateScreensConfig(config, screenList) {
  if (!config.screens) config.screens = {};

  // Disable all screens first
  Object.keys(config.screens).forEach(screen => {
    config.screens[screen].enabled = false;
  });

  // Enable selected screens
  screenList.forEach(screen => {
    if (!config.screens[screen]) {
      config.screens[screen] = {
        enabled: true,
        roles: ['ADMIN']
      };
    } else {
      config.screens[screen].enabled = true;
    }
  });
}
function isConfigComplete(config) {
  return config.module?.name && config.module?.code && config.entity?.name && config.screens && Object.keys(config.screens).length > 0;
}
async function showPreview(config, outputPath) {
  const moduleDir = path.join(outputPath, config.module.code);

  // Config summary
  console.log(chalk.blue('\n📊 Configuration Summary:\n'));
  console.log(chalk.white(`   Module:   ${config.module.name} (${config.module.code})`));
  console.log(chalk.white(`   Entity:   ${config.entity.name}`));
  console.log(chalk.white(`   API Path: ${config.entity.apiPath || '/api/v1'}`));
  const enabledScreens = Object.keys(config.screens || {}).filter(s => config.screens[s].enabled);
  console.log(chalk.white(`   Screens:  ${enabledScreens.join(', ') || 'none'}`));
  const createFields = config.screens?.create?.fields || [];
  const searchFields = config.screens?.search?.fields || [];
  console.log(chalk.white(`   Fields:   ${createFields.length} create, ${searchFields.length} search`));
  console.log(chalk.white(`   Auth:     ${config.auth?.required ? `yes (${(config.auth.roles || []).join(', ')})` : 'no'}`));
  console.log(chalk.white(`   Workflow: ${config.workflow?.enabled ? 'yes' : 'no'}`));
  console.log(chalk.white(`   i18n:     ${config.i18n?.generateKeys ? 'yes' : 'no'}`));

  // File list
  console.log(chalk.blue('\n📋 Files to be generated:\n'));
  const files = ['package.json', 'webpack.config.js', 'src/Module.js', 'README.md'];

  // Add screen files
  Object.keys(config.screens || {}).forEach(screen => {
    if (config.screens[screen].enabled) {
      const name = config.entity.name;
      const screenKey = screen.charAt(0).toUpperCase() + screen.slice(1);
      if (!['response', 'custom'].includes(screen)) {
        files.push(`src/configs/${name}${screenKey}Config.js`);
      }
      files.push(`src/pages/employee/${name}${screenKey}.js`);
    }
  });
  files.push('src/pages/employee/index.js');
  files.push('src/configs/UICustomizations.js');
  files.push(`src/components/${config.entity.name}Card.js`);

  // Add utility files
  files.push('src/utils/createUtils.js');
  files.push('src/utils/searchUtils.js');
  files.push('src/utils/responseUtils.js');
  files.push('src/utils/transformers.js');
  files.push('src/utils/formatters.js');
  files.push('src/utils/validators.js');

  // Add service files
  files.push(`src/services/${config.entity.name}Service.js`);
  files.push('src/services/apiEndpoints.js');

  // Add hooks
  files.push('src/hooks/index.js');
  files.push(`src/hooks/use${config.entity.name}.js`);

  // Add i18n files
  if (config.i18n?.generateKeys) {
    files.push('localization/en_IN.json');
    files.push('localization/hi_IN.json');
  }
  files.forEach(file => {
    console.log(chalk.gray(`   ${file}`));
  });
  console.log(chalk.blue(`\n📁 Total files: ${files.length}`));
  console.log(chalk.white(`   Output: ${moduleDir}`));
  console.log(chalk.yellow('\n⚠️  Dry run — no files created. Remove --dry-run to generate.'));
}
module.exports = {
  createModule
};