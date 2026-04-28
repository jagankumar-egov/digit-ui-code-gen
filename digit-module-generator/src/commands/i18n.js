/**
 * i18n command — `digit-gen i18n`
 *
 * Standalone internationalization file generator.
 * Produces one JSON translation file per requested language plus a
 * config.js that registers them with react-i18next.
 *
 * Generated key categories (all prefixed with config.i18n.prefix):
 *   MODULE_NAME / MODULE_DESCRIPTION
 *   <SCREEN>_HEADING / <SCREEN>_DESCRIPTION / <SCREEN>_SUBMIT / etc.
 *   <FIELD_NAME> / <FIELD_NAME>_REQUIRED / <FIELD_NAME>_INVALID_FORMAT
 *   <FIELD_NAME>_<OPTION_CODE>   (for dropdown static options)
 *   CREATED_SUCCESSFULLY / CREATION_FAILED / WORKFLOW_* / ...
 *
 * Language support:
 *   en_IN  — labels returned as-is from the config
 *   hi_IN  — common terms translated via a built-in lookup table;
 *             untranslated terms fall back to the English label
 *   other  — treated the same as en_IN (passthrough)
 *
 * Output:
 *   <output>/localization/<lang>.json   — one file per language
 *   <output>/localization/config.js     — lazy-import resource map + helper
 *
 * Usage:
 *   digit-gen i18n --config module-config.json --languages en_IN,hi_IN
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Entry point for `digit-gen i18n`.
 *
 * @param {Object} options
 * @param {string} options.config     - Path to the module config JSON
 * @param {string} options.languages  - Comma-separated locale codes (e.g. "en_IN,hi_IN")
 * @param {string} [options.output]   - Output directory (default: ./generated)
 */
async function generateI18n(options) {
  try {
    console.log(chalk.blue('\n🌐 Generating internationalization files...\n'));

    // Load configuration
    const configPath = path.resolve(options.config);
    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red(`❌ Configuration file not found: ${options.config}`));
      return;
    }

    const config = await fs.readJson(configPath);
    
    // Parse languages
    const languages = options.languages.split(',').map(lang => lang.trim());
    
    // Set output directory
    const outputDir = options.output || './generated';
    const localizationDir = path.join(outputDir, 'localization');
    
    await fs.ensureDir(localizationDir);

    const spinner = ora('Generating i18n files...').start();

    try {
      const generatedFiles = [];

      // Generate files for each language
      for (const language of languages) {
        const i18nContent = generateI18nContent(config, language);
        const fileName = `${language}.json`;
        const filePath = path.join(localizationDir, fileName);
        
        await fs.writeFile(filePath, JSON.stringify(i18nContent, null, 2));
        generatedFiles.push(filePath);
      }

      // Generate i18n configuration file
      const configContent = generateI18nConfig(config, languages);
      const configPath = path.join(localizationDir, 'config.js');
      await fs.writeFile(configPath, configContent);
      generatedFiles.push(configPath);

      spinner.succeed('i18n files generated successfully!');

      console.log(chalk.green('\n✅ Generated i18n files:'));
      generatedFiles.forEach(file => {
        console.log(chalk.gray(`   ${file}`));
      });

      // Show usage information
      console.log(chalk.blue('\n📖 Usage:\n'));
      console.log(chalk.white('1. Copy files to your module\'s localization directory'));
      console.log(chalk.white('2. Register the translations in your module'));
      console.log(chalk.white('3. Use translation keys in your components:'));
      console.log(chalk.gray(`   const { t } = useTranslation();`));
      console.log(chalk.gray(`   <label>{t("${config.i18n?.prefix || 'PREFIX_'}FIELD_LABEL")}</label>`));

    } catch (error) {
      spinner.fail('Failed to generate i18n files');
      throw error;
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating i18n files:'), error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

function generateI18nContent(config, language) {
  const prefix = config.i18n?.prefix || `${config.entity.name.toUpperCase()}_`;
  const keys = {};
  
  // Module level keys
  keys[`${prefix}MODULE_NAME`] = config.module.name;
  keys[`${prefix}MODULE_DESCRIPTION`] = config.module.description;
  
  // Screen level keys
  Object.keys(config.screens || {}).forEach(screenType => {
    if (config.screens[screenType].enabled) {
      const screenPrefix = `${prefix}${screenType.toUpperCase()}_`;
      
      switch (screenType) {
        case 'create':
          keys[`${screenPrefix}HEADING`] = `Create ${config.entity.name}`;
          keys[`${screenPrefix}DESCRIPTION`] = `Create a new ${config.entity.name.toLowerCase()}`;
          keys[`${screenPrefix}SUBMIT`] = 'Submit';
          keys[`${screenPrefix}SUBMIT_SUCCESS`] = `${config.entity.name} created successfully`;
          keys[`${screenPrefix}SUBMIT_FAILED`] = `Failed to create ${config.entity.name.toLowerCase()}`;
          break;
          
        case 'search':
          keys[`${screenPrefix}HEADER`] = `Search ${config.entity.name}`;
          keys[`${screenPrefix}PLACEHOLDER`] = `Search ${config.entity.name.toLowerCase()}...`;
          keys[`${screenPrefix}NO_RESULTS`] = 'No results found';
          keys[`${screenPrefix}RESULTS_COUNT`] = 'results found';
          break;
          
        case 'inbox':
          keys[`${screenPrefix}HEADER`] = `${config.entity.name} Inbox`;
          keys[`${screenPrefix}ASSIGNED_TO_ME`] = 'Assigned to me';
          keys[`${screenPrefix}ASSIGNED_TO_ALL`] = 'All assignments';
          break;
          
        case 'view':
          keys[`${screenPrefix}HEADER`] = `${config.entity.name} Details`;
          keys[`${screenPrefix}EDIT`] = 'Edit';
          keys[`${screenPrefix}TAKE_ACTION`] = 'Take Action';
          keys[`${screenPrefix}DOWNLOAD_PDF`] = 'Download PDF';
          keys[`${screenPrefix}PRINT`] = 'Print';
          break;
          
        case 'response':
          keys[`${screenPrefix}SUCCESS_MESSAGE`] = 'Operation completed successfully';
          keys[`${screenPrefix}ERROR_MESSAGE`] = 'Operation failed';
          keys[`${screenPrefix}VIEW_DETAILS`] = 'View Details';
          keys[`${screenPrefix}CREATE_ANOTHER`] = `Create Another ${config.entity.name}`;
          keys[`${screenPrefix}SEARCH`] = `Search ${config.entity.name}`;
          break;
      }
    }
  });
  
  // Field level keys
  config.fields?.forEach(field => {
    const fieldKey = `${prefix}${field.name.toUpperCase()}`;
    keys[fieldKey] = getLocalizedFieldLabel(field.label, language);
    
    if (field.description) {
      keys[`${fieldKey}_DESCRIPTION`] = getLocalizedFieldDescription(field.description, language);
    }
    
    // Validation messages
    if (field.required) {
      keys[`${fieldKey}_REQUIRED`] = `${field.label} is required`;
    }
    
    if (field.validation?.pattern) {
      keys[`${fieldKey}_INVALID_FORMAT`] = `Invalid ${field.label.toLowerCase()} format`;
    }
    
    // Options for dropdown fields
    if (field.options) {
      field.options.forEach(option => {
        const optionKey = `${prefix}${field.name.toUpperCase()}_${option.code}`;
        keys[optionKey] = getLocalizedOptionLabel(option.name, language);
      });
    }
  });
  
  // Common keys
  keys[`${prefix}CREATED_SUCCESSFULLY`] = `${config.entity.name} created successfully`;
  keys[`${prefix}UPDATED_SUCCESSFULLY`] = `${config.entity.name} updated successfully`;
  keys[`${prefix}DELETED_SUCCESSFULLY`] = `${config.entity.name} deleted successfully`;
  keys[`${prefix}CREATION_FAILED`] = `Failed to create ${config.entity.name.toLowerCase()}`;
  keys[`${prefix}UPDATE_FAILED`] = `Failed to update ${config.entity.name.toLowerCase()}`;
  keys[`${prefix}DELETE_FAILED`] = `Failed to delete ${config.entity.name.toLowerCase()}`;
  keys[`${prefix}LOADING`] = 'Loading...';
  keys[`${prefix}NO_DATA`] = 'No data available';
  keys[`${prefix}CONFIRM_DELETE`] = `Are you sure you want to delete this ${config.entity.name.toLowerCase()}?`;
  keys[`${prefix}REFERENCE_NUMBER`] = 'Reference Number';
  keys[`${prefix}SUBMITTED_DATE`] = 'Submitted Date';
  keys[`${prefix}GO_BACK`] = 'Go Back';
  keys[`${prefix}CREATE_NEW`] = `Create New ${config.entity.name}`;
  
  // Workflow keys
  if (config.workflow?.enabled) {
    keys[`${prefix}WORKFLOW_SECTION`] = 'Workflow';
    keys[`${prefix}CURRENT_STATE`] = 'Current State';
    keys[`${prefix}ACTION_TAKEN`] = 'Action Taken';
    keys[`${prefix}ASSIGNED_TO`] = 'Assigned To';
    keys[`${prefix}COMMENTS`] = 'Comments';
    keys[`${prefix}DUE_DATE`] = 'Due Date';
    keys[`${prefix}WORKFLOW_TIMELINE`] = 'Workflow Timeline';
    keys[`${prefix}POSSIBLE_ACTIONS`] = 'Possible Actions';
    keys[`${prefix}WORKFLOW_ACTION_SUCCESSFUL`] = 'Workflow action completed successfully';
    keys[`${prefix}WORKFLOW_ACTION_FAILED`] = 'Workflow action failed';
  }
  
  return keys;
}

function getLocalizedFieldLabel(label, language) {
  // For now, return the original label
  // In a real implementation, you might have translation logic based on language
  switch (language) {
    case 'hi_IN':
      return translateToHindi(label);
    default:
      return label;
  }
}

function getLocalizedFieldDescription(description, language) {
  switch (language) {
    case 'hi_IN':
      return translateToHindi(description);
    default:
      return description;
  }
}

function getLocalizedOptionLabel(label, language) {
  switch (language) {
    case 'hi_IN':
      return translateToHindi(label);
    default:
      return label;
  }
}

function translateToHindi(text) {
  // Basic translation map for common terms
  const translations = {
    'Name': 'नाम',
    'Description': 'विवरण',
    'Status': 'स्थिति',
    'Active': 'सक्रिय',
    'Inactive': 'निष्क्रिय',
    'Create': 'बनाएं',
    'Search': 'खोजें',
    'View': 'देखें',
    'Edit': 'संपादित करें',
    'Delete': 'हटाएं',
    'Submit': 'सबमिट करें',
    'Cancel': 'रद्द करें',
    'Save': 'सेव करें',
    'Loading': 'लोड हो रहा है',
    'Required': 'आवश्यक'
  };
  
  return translations[text] || text;
}

function generateI18nConfig(config, languages) {
  return `// i18n configuration for ${config.entity.name} module

export const localizationConfig = {
  moduleName: '${config.module.code}',
  languages: [${languages.map(lang => `'${lang}'`).join(', ')}],
  defaultLanguage: '${languages[0]}',
  fallbackLanguage: 'en_IN',
  
  // Translation files mapping
  resources: {
${languages.map(lang => `    '${lang}': () => import('./${lang}.json')`).join(',\n')}
  },
  
  // Namespace for this module's translations
  namespace: '${config.i18n?.prefix || config.entity.name.toUpperCase()}'
};

export default localizationConfig;

// Helper function to get translation key with prefix
export const getTranslationKey = (key) => {
  const prefix = '${config.i18n?.prefix || config.entity.name.toUpperCase() + '_'}';
  return \`\${prefix}\${key}\`;
};

// Common translation keys
export const TRANSLATION_KEYS = {
  MODULE_NAME: getTranslationKey('MODULE_NAME'),
  CREATE_HEADING: getTranslationKey('CREATE_HEADING'),
  SEARCH_HEADER: getTranslationKey('SEARCH_HEADER'),
  VIEW_HEADER: getTranslationKey('VIEW_HEADER'),
  CREATED_SUCCESSFULLY: getTranslationKey('CREATED_SUCCESSFULLY'),
  CREATION_FAILED: getTranslationKey('CREATION_FAILED'),
  LOADING: getTranslationKey('LOADING'),
  NO_DATA: getTranslationKey('NO_DATA')
};
`;
}

module.exports = { generateI18n };