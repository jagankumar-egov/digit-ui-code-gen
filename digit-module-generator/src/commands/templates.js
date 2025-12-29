const chalk = require('chalk');
const boxen = require('boxen');
const { listAvailableTemplates, validateTemplate } = require('../templates/templateManager');

async function listTemplates(options) {
  try {
    console.log(chalk.blue('\n📚 Available Templates\n'));

    const templates = await listAvailableTemplates(options.detailed);
    
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates found.'));
      console.log(chalk.gray('Create custom templates in ~/.digit-gen/templates/ directory'));
      return;
    }

    if (options.detailed) {
      // Show detailed template information
      for (const template of templates) {
        console.log(
          boxen(
            chalk.white.bold(template.displayName) + '\n\n' +
            chalk.gray(template.description) + '\n\n' +
            chalk.blue(`Category: ${template.category}`) + '\n' +
            chalk.blue(`Version: ${template.version}`) + '\n' +
            chalk.blue(`Author: ${template.author}`) + '\n\n' +
            chalk.green(`Usage: digit-gen create --template ${template.name}`),
            {
              padding: 1,
              margin: 1,
              borderStyle: 'round',
              borderColor: 'cyan',
              title: template.name,
              titleAlignment: 'center'
            }
          )
        );
      }
    } else {
      // Show simple list
      console.log(chalk.white('Available templates:\n'));
      
      templates.forEach(template => {
        console.log(chalk.cyan(`  ${template.name.padEnd(20)}`), chalk.gray(template.description));
      });
      
      console.log(chalk.blue('\nFor detailed information, use: digit-gen templates --detailed'));
    }

    // Show usage examples
    console.log(chalk.blue('\n💡 Usage Examples:\n'));
    console.log(chalk.white('  # Use a template'));
    console.log(chalk.gray('  digit-gen create --template hrms --entity Employee\n'));
    
    console.log(chalk.white('  # List detailed template info'));
    console.log(chalk.gray('  digit-gen templates --detailed\n'));
    
    console.log(chalk.white('  # Create custom template'));
    console.log(chalk.gray('  digit-gen create --config my-config.json --save-template my-template'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error listing templates:'), error.message);
    process.exit(1);
  }
}

async function showTemplateInfo(templateName) {
  try {
    const validation = await validateTemplate(templateName);
    
    if (!validation.valid) {
      console.log(chalk.red(`❌ Template "${templateName}" is invalid:`));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
      return;
    }

    console.log(chalk.green(`✅ Template "${templateName}" is valid`));
    
    // Show template structure
    const templates = await listAvailableTemplates(true);
    const template = templates.find(t => t.name === templateName);
    
    if (template) {
      console.log(chalk.blue('\n📋 Template Details:\n'));
      console.log(chalk.white(`Name: ${template.displayName}`));
      console.log(chalk.white(`Description: ${template.description}`));
      console.log(chalk.white(`Category: ${template.category}`));
      console.log(chalk.white(`Version: ${template.version}`));
      console.log(chalk.white(`Author: ${template.author}`));
    }

  } catch (error) {
    console.error(chalk.red(`❌ Error validating template "${templateName}":`, error.message));
  }
}

module.exports = { listTemplates, showTemplateInfo };