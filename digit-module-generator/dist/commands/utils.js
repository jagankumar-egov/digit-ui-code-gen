const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const {
  generateCreateUtils
} = require('../generators/utilsGenerators/createUtilsGenerator');
const {
  generateResponseUtils
} = require('../generators/utilsGenerators/responseUtilsGenerator');
const {
  generateSearchUtils
} = require('../generators/utilsGenerators/searchUtilsGenerator');
async function generateUtils(options) {
  try {
    console.log(chalk.blue('\n⚙️  Generating utility files...\n'));

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
      // Generate minimal config
      config = generateMinimalUtilsConfig(options.entity);
    }
    const entityName = options.entity || config.entity?.name;
    if (!entityName) {
      console.log(chalk.red('❌ Entity name is required. Use --entity or provide config file.'));
      return;
    }

    // Set output directory
    const outputDir = options.output || './generated';
    const utilsDir = path.join(outputDir, 'utils');
    await fs.ensureDir(utilsDir);
    const spinner = ora(`Generating utility files for ${entityName}...`).start();
    try {
      const generatedFiles = [];

      // Generate createUtils.js
      const createUtilsContent = generateCreateUtils(config);
      const createUtilsPath = path.join(utilsDir, 'createUtils.js');
      await fs.writeFile(createUtilsPath, createUtilsContent);
      generatedFiles.push(createUtilsPath);

      // Generate responseUtils.js
      const responseUtilsContent = generateResponseUtils(config);
      const responseUtilsPath = path.join(utilsDir, 'responseUtils.js');
      await fs.writeFile(responseUtilsPath, responseUtilsContent);
      generatedFiles.push(responseUtilsPath);

      // Generate searchUtils.js
      const searchUtilsContent = generateSearchUtils(config);
      const searchUtilsPath = path.join(utilsDir, 'searchUtils.js');
      await fs.writeFile(searchUtilsPath, searchUtilsContent);
      generatedFiles.push(searchUtilsPath);

      // Generate index.js for easy imports
      const indexContent = generateUtilsIndex(config);
      const indexPath = path.join(utilsDir, 'index.js');
      await fs.writeFile(indexPath, indexContent);
      generatedFiles.push(indexPath);
      spinner.succeed('Utility files generated successfully!');
      console.log(chalk.green('\n✅ Generated utility files:'));
      generatedFiles.forEach(file => {
        console.log(chalk.gray(`   ${file}`));
      });

      // Show usage examples
      console.log(chalk.blue('\n📖 Usage Examples:\n'));
      console.log(chalk.white('Import in your components:'));
      console.log(chalk.gray(`import { transform${entityName}CreateData, validateTransformedData } from './utils/createUtils';`));
      console.log(chalk.gray(`import { navigateToResponse, formatSuccessResponse } from './utils/responseUtils';`));
      console.log(chalk.white('\nUse in form submission:'));
      console.log(chalk.gray(`const transformedData = transform${entityName}CreateData(formData, tenantId, userInfo);`));
      console.log(chalk.gray(`const validation = validateTransformedData(transformedData, requiredFields);`));
    } catch (error) {
      spinner.fail('Failed to generate utility files');
      throw error;
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error generating utilities:'), error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}
function generateMinimalUtilsConfig(entityName) {
  return {
    module: {
      name: `${entityName} Management`,
      code: `${entityName.toLowerCase()}-mgmt`
    },
    entity: {
      name: entityName,
      apiPath: `/api/v1`,
      primaryKey: `${entityName.toLowerCase()}Id`,
      displayField: `${entityName.toLowerCase()}Name`
    },
    fields: [{
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true
    }, {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      required: false
    }, {
      name: 'status',
      type: 'dropdown',
      label: 'Status',
      required: true
    }],
    api: {
      create: `/${entityName.toLowerCase()}/_create`,
      update: `/${entityName.toLowerCase()}/_update`,
      search: `/${entityName.toLowerCase()}/_search`
    },
    i18n: {
      prefix: `${entityName.toUpperCase()}_`
    }
  };
}
function generateUtilsIndex(config) {
  const entityName = config.entity.name;
  return `// Utility functions for ${config.entity.name} module

// Create utilities
export {
  transform${entityName}CreateData,
  transform${entityName}UpdateData,
  validateTransformedData,
  commonTransformations
} from './createUtils';

// Response utilities
export {
  navigateToResponse,
  extractEntityInfo,
  formatSuccessResponse,
  formatErrorResponse
} from './responseUtils';

// Search utilities
export {
  transformSearchParams,
  formatSearchResults,
  buildSearchQuery
} from './searchUtils';

// Re-export commonly used transformations
export { commonTransformations as transform } from './createUtils';
`;
}
module.exports = {
  generateUtils
};