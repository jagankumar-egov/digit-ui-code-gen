const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const {
  generateScreens
} = require('../generators/screenGenerators/screenGenerator');
const {
  generateCreateConfig
} = require('../generators/configGenerators/createConfigGenerator');
const {
  generateSearchConfig
} = require('../generators/configGenerators/searchConfigGenerator');
const {
  generateInboxConfig
} = require('../generators/configGenerators/inboxConfigGenerator');
const {
  generateViewConfig
} = require('../generators/configGenerators/viewConfigGenerator');
async function generateScreen(screenType, options) {
  try {
    console.log(chalk.blue(`\n🔧 Generating ${screenType} screen...\n`));

    // Validate screen type
    const validScreenTypes = ['create', 'search', 'inbox', 'view', 'response'];
    if (!validScreenTypes.includes(screenType)) {
      console.log(chalk.red(`❌ Invalid screen type: ${screenType}`));
      console.log(chalk.white(`Valid types: ${validScreenTypes.join(', ')}`));
      return;
    }

    // Load configuration
    let config;
    if (options.config) {
      const configPath = path.resolve(options.config);
      if (!(await fs.pathExists(configPath))) {
        console.log(chalk.red(`❌ Configuration file not found: ${options.config}`));
        return;
      }
      config = await fs.readJson(configPath);
    } else {
      // Generate minimal config for the entity
      config = generateMinimalConfig(options.entity, screenType);
    }

    // Set output directory
    const outputDir = options.output || './generated';
    const entityName = options.entity || config.entity?.name;
    if (!entityName) {
      console.log(chalk.red('❌ Entity name is required. Use --entity or provide config file.'));
      return;
    }
    await fs.ensureDir(outputDir);
    const spinner = ora(`Generating ${screenType} screen for ${entityName}...`).start();
    try {
      // Generate screen component
      const screenContent = await generateScreens(screenType, config);
      if (screenContent) {
        const screenFileName = `${entityName}${screenType.charAt(0).toUpperCase() + screenType.slice(1)}.js`;
        const screenPath = path.join(outputDir, 'pages', 'employee', screenFileName);
        await fs.ensureDir(path.dirname(screenPath));
        await fs.writeFile(screenPath, screenContent);
        console.log(chalk.green(`\n✅ Generated screen: ${screenPath}`));
      }

      // Generate screen configuration
      const configContent = generateScreenConfig(screenType, config);
      if (configContent) {
        const configFileName = `${entityName}${screenType.charAt(0).toUpperCase() + screenType.slice(1)}Config.js`;
        const configPath = path.join(outputDir, 'configs', configFileName);
        await fs.ensureDir(path.dirname(configPath));
        await fs.writeFile(configPath, configContent);
        console.log(chalk.green(`✅ Generated config: ${configPath}`));
      }
      spinner.succeed(`${screenType} screen generated successfully!`);

      // Show next steps
      console.log(chalk.blue('\n📖 Next steps:'));
      console.log(chalk.white('1. Review and customize the generated files'));
      console.log(chalk.white('2. Import the screen component in your module'));
      console.log(chalk.white('3. Add routing configuration'));
      console.log(chalk.white('4. Test the screen functionality'));
    } catch (error) {
      spinner.fail(`Failed to generate ${screenType} screen`);
      throw error;
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error generating screen:'), error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}
function generateMinimalConfig(entityName, screenType) {
  return {
    module: {
      name: `${entityName} Management`,
      code: `${entityName.toLowerCase()}-mgmt`,
      description: `${entityName} management system`,
      version: '1.0.0'
    },
    entity: {
      name: entityName,
      apiPath: `/api/v1`,
      primaryKey: `${entityName.toLowerCase()}Id`,
      displayField: `${entityName.toLowerCase()}Name`
    },
    screens: {
      [screenType]: {
        enabled: true,
        roles: ['ADMIN', 'USER']
      }
    },
    fields: getDefaultFields(entityName),
    api: {
      create: `/${entityName.toLowerCase()}/_create`,
      update: `/${entityName.toLowerCase()}/_update`,
      search: `/${entityName.toLowerCase()}/_search`,
      view: `/${entityName.toLowerCase()}/{id}`
    },
    auth: {
      required: true,
      roles: ['ADMIN', 'USER']
    },
    workflow: {
      enabled: false
    },
    i18n: {
      prefix: `${entityName.toUpperCase()}_`,
      generateKeys: true
    }
  };
}
function getDefaultFields(entityName) {
  return [{
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
    searchable: true,
    showInResults: true,
    showInView: true,
    validation: {
      maxLength: 100
    }
  }, {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    required: false,
    showInView: true,
    validation: {
      maxLength: 500
    }
  }, {
    name: 'status',
    type: 'dropdown',
    label: 'Status',
    required: true,
    filterable: true,
    showInResults: true,
    showInView: true,
    options: [{
      code: 'ACTIVE',
      name: 'Active'
    }, {
      code: 'INACTIVE',
      name: 'Inactive'
    }]
  }];
}
function generateScreenConfig(screenType, config) {
  switch (screenType) {
    case 'create':
      return generateCreateConfig(config);
    case 'search':
      return generateSearchConfig(config);
    case 'inbox':
      return generateInboxConfig(config);
    case 'view':
      return generateViewConfig(config);
    default:
      return null;
  }
}
module.exports = {
  generateScreen
};