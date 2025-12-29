const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { validateModuleConfig } = require('../validators/configValidator');
const { parseApiSpec } = require('../parsers/apiSpecParser');

async function validateConfig(options) {
  try {
    console.log(chalk.blue('\n🔍 Validating configuration...\n'));

    const configPath = path.resolve(options.config);
    
    // Check if config file exists
    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red(`❌ Configuration file not found: ${configPath}`));
      return;
    }

    // Load and parse configuration
    let config;
    try {
      config = await fs.readJson(configPath);
      console.log(chalk.green(`✅ Configuration file loaded successfully`));
    } catch (error) {
      console.log(chalk.red(`❌ Invalid JSON in configuration file: ${error.message}`));
      return;
    }

    // Validate schema and business logic
    const validation = validateModuleConfig(config);
    
    if (validation.valid) {
      console.log(chalk.green('\n✅ Configuration validation passed!\n'));
      
      // Show configuration summary
      showConfigSummary(config);
      
      // Validate API spec if provided
      if (options.apiSpec) {
        console.log(chalk.blue('\n📄 Validating against API specification...\n'));
        await validateAgainstApiSpec(config, options.apiSpec);
      }
      
    } else {
      console.log(chalk.red('\n❌ Configuration validation failed:\n'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
      
      // Provide suggestions
      provideSuggestions(validation.errors, config);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error validating configuration:'), error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

function showConfigSummary(config) {
  console.log(chalk.white('📋 Configuration Summary:'));
  console.log(chalk.gray('  ─────────────────────────────────────'));
  console.log(chalk.white(`  Module: ${config.module.name} (${config.module.code})`));
  console.log(chalk.white(`  Entity: ${config.entity.name}`));
  console.log(chalk.white(`  API Path: ${config.entity.apiPath}`));
  
  // Show enabled screens
  const enabledScreens = Object.entries(config.screens || {})
    .filter(([_, screenConfig]) => screenConfig.enabled)
    .map(([screenName, _]) => screenName);
  console.log(chalk.white(`  Screens: ${enabledScreens.join(', ')}`));
  
  // Show field count
  console.log(chalk.white(`  Fields: ${config.fields?.length || 0}`));
  
  // Show auth info
  if (config.auth?.required) {
    console.log(chalk.white(`  Authentication: Required (${config.auth.roles?.length || 0} roles)`));
  } else {
    console.log(chalk.white(`  Authentication: Not required`));
  }
  
  // Show workflow info
  if (config.workflow?.enabled) {
    console.log(chalk.white(`  Workflow: Enabled (${config.workflow.businessService || 'no service specified'})`));
  } else {
    console.log(chalk.white(`  Workflow: Disabled`));
  }
  
  console.log('');
}

async function validateAgainstApiSpec(config, apiSpecPath) {
  try {
    // Parse API specification
    const apiConfig = await parseApiSpec(apiSpecPath, config.entity.name);
    
    // Compare fields
    const configFieldNames = config.fields.map(f => f.name);
    const apiFieldNames = apiConfig.fields?.map(f => f.name) || [];
    
    // Find missing fields
    const missingInConfig = apiFieldNames.filter(name => !configFieldNames.includes(name));
    const missingInApi = configFieldNames.filter(name => !apiFieldNames.includes(name));
    
    if (missingInConfig.length === 0 && missingInApi.length === 0) {
      console.log(chalk.green('✅ Configuration matches API specification'));
    } else {
      if (missingInConfig.length > 0) {
        console.log(chalk.yellow(`⚠️  Fields in API but missing in config: ${missingInConfig.join(', ')}`));
      }
      if (missingInApi.length > 0) {
        console.log(chalk.yellow(`⚠️  Fields in config but missing in API: ${missingInApi.join(', ')}`));
      }
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ API specification validation failed: ${error.message}`));
  }
}

function provideSuggestions(errors, config) {
  console.log(chalk.blue('\n💡 Suggestions to fix issues:\n'));
  
  errors.forEach(error => {
    if (error.includes('module.code')) {
      console.log(chalk.blue('  • Module code must be in kebab-case (lowercase with hyphens)'));
      console.log(chalk.gray('    Example: "employee-management" instead of "Employee Management"'));
    }
    
    if (error.includes('entity.name')) {
      console.log(chalk.blue('  • Entity name must be in PascalCase'));
      console.log(chalk.gray('    Example: "Employee" instead of "employee"'));
    }
    
    if (error.includes('entity.apiPath')) {
      console.log(chalk.blue('  • API path must start with forward slash'));
      console.log(chalk.gray('    Example: "/employee-service/v1" instead of "employee-service/v1"'));
    }
    
    if (error.includes('workflow') && error.includes('businessService')) {
      console.log(chalk.blue('  • When workflow is enabled, businessService must be specified'));
      console.log(chalk.gray('    Example: "employee-approval" or "project-workflow"'));
    }
    
    if (error.includes('dropdown') && error.includes('options')) {
      console.log(chalk.blue('  • Dropdown fields need either static options or MDMS configuration'));
      console.log(chalk.gray('    Add "options" array or "mdms" configuration to dropdown fields'));
    }
    
    if (error.includes('i18n.prefix')) {
      console.log(chalk.blue('  • i18n prefix must be uppercase and end with underscore'));
      console.log(chalk.gray('    Example: "EMP_" instead of "emp" or "EMP"'));
    }
    
    if (error.includes('validation.min') && error.includes('validation.max')) {
      console.log(chalk.blue('  • Validation min value cannot be greater than max value'));
      console.log(chalk.gray('    Check your field validation configuration'));
    }
    
    if (error.includes('roles') && error.includes('array')) {
      console.log(chalk.blue('  • Roles must be specified as an array of strings'));
      console.log(chalk.gray('    Example: ["ADMIN", "USER"] instead of "ADMIN,USER"'));
    }
  });
  
  // General suggestions based on config
  if (!config.auth?.required) {
    console.log(chalk.blue('  • Consider enabling authentication for production use'));
  }
  
  if (!config.workflow?.enabled && config.screens?.inbox?.enabled) {
    console.log(chalk.blue('  • Inbox screen requires workflow to be enabled'));
  }
  
  const searchableFields = config.fields?.filter(f => f.searchable)?.length || 0;
  if (config.screens?.search?.enabled && searchableFields === 0) {
    console.log(chalk.blue('  • Search screen needs at least one field marked as searchable'));
  }
  
  console.log(chalk.blue('\n📖 For more help, check the documentation or examples.'));
}

module.exports = { validateConfig };