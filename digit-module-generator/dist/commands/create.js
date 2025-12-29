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
async function createModule(options) {
  try {
    console.log(chalk.blue('\n🚀 Starting module generation...\n'));
    let config = {};

    // Load config from file if provided
    if (options.config) {
      const configPath = path.resolve(options.config);
      if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
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
      config = mergeConfigs(config, apiConfig);
      console.log(chalk.green('✅ API specification parsed successfully'));
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

    // Generate module
    console.log(chalk.blue('\n⚙️  Generating module files...'));
    const spinner = ora('Creating module structure...').start();
    try {
      const result = await generateFromConfig(config, options.output, options.force);
      spinner.succeed('Module generated successfully!');
      console.log(chalk.green('\n🎉 Module generation completed!\n'));
      console.log(chalk.white('📁 Files created:'));
      result.files.forEach(file => {
        console.log(chalk.gray(`   ${file}`));
      });
      console.log(chalk.blue('\n📖 Next steps:'));
      console.log(chalk.white('1. Navigate to your module directory'));
      console.log(chalk.white('2. Run npm install to install dependencies'));
      console.log(chalk.white('3. Update the generated configs as needed'));
      console.log(chalk.white('4. Test your module integration'));
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

  // Workflow
  questions.push({
    type: 'confirm',
    name: 'hasWorkflow',
    message: 'Generate with workflow?',
    default: false
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
  console.log(chalk.blue('\n📋 Preview of files to be generated:\n'));
  const moduleDir = path.join(outputPath, config.module.code);
  const files = ['package.json', 'webpack.config.js', 'src/Module.js', 'README.md'];

  // Add screen files
  Object.keys(config.screens).forEach(screen => {
    if (config.screens[screen].enabled) {
      files.push(`src/configs/${config.entity.name}${screen}Config.js`);
      files.push(`src/pages/employee/${config.entity.name}${screen}.js`);
    }
  });

  // Add utility files
  files.push('src/utils/createUtils.js');
  files.push('src/utils/searchUtils.js');
  files.push('src/utils/responseUtils.js');

  // Add service files
  files.push(`src/services/${config.entity.name.toLowerCase()}Service.js`);

  // Add i18n files
  if (config.i18n?.generateKeys) {
    files.push('localization/en_IN.json');
    files.push('localization/hi_IN.json');
  }
  files.forEach(file => {
    console.log(chalk.gray(`   ${path.join(moduleDir, file)}`));
  });
  console.log(chalk.blue(`\n📁 Total files: ${files.length}`));
  console.log(chalk.yellow('\n⚠️  This is a preview. Use --dry-run=false to generate files.'));
}
module.exports = {
  createModule
};