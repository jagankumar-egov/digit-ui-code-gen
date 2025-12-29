#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');
const { createModule } = require('../dist/commands/create');
const { listTemplates } = require('../dist/commands/templates');
const { validateConfig } = require('../dist/commands/validate');
const { generateScreen } = require('../dist/commands/screen');
const { generateUtils } = require('../dist/commands/utils');
const { generateI18n } = require('../dist/commands/i18n');
const { migrateModule } = require('../dist/commands/migrate');
const { diffTemplates } = require('../dist/commands/diff');

// Display banner
console.log(
  chalk.cyan(
    figlet.textSync('DIGIT Gen', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  )
);

console.log(
  boxen(
    chalk.white('🚀 DIGIT Module Generator\n') +
    chalk.gray('Generate micro-ui modules from templates and API specs'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  )
);

program
  .name('digit-gen')
  .description('CLI to generate DIGIT micro-ui modules')
  .version('1.0.0');

// Create command
program
  .command('create')
  .description('Create a new module')
  .option('-n, --name <name>', 'module name')
  .option('-c, --code <code>', 'module code')
  .option('-e, --entity <entity>', 'entity name')
  .option('-a, --api-spec <path>', 'API specification file/URL')
  .option('-t, --template <template>', 'use existing template')
  .option('-s, --screens <screens>', 'comma-separated screen list')
  .option('-o, --output <path>', 'output directory', './packages/modules')
  .option('--config <config>', 'configuration file')
  .option('--force', 'overwrite existing files')
  .option('--dry-run', 'preview generated files without creating them')
  .action(createModule);

// Templates command
program
  .command('templates')
  .alias('list')
  .description('List available templates')
  .option('-d, --detailed', 'show detailed template information')
  .action(listTemplates);

// Validate command
program
  .command('validate')
  .description('Validate configuration file')
  .requiredOption('--config <config>', 'configuration file to validate')
  .action(validateConfig);

// Screen command
program
  .command('screen <type>')
  .description('Generate specific screen type')
  .requiredOption('-e, --entity <entity>', 'entity name')
  .option('--config <config>', 'configuration file')
  .option('-o, --output <path>', 'output directory')
  .action(generateScreen);

// Utils command
program
  .command('utils')
  .description('Generate utility files')
  .requiredOption('-e, --entity <entity>', 'entity name')
  .option('--config <config>', 'configuration file')
  .option('-o, --output <path>', 'output directory')
  .action(generateUtils);

// I18n command
program
  .command('i18n')
  .description('Generate internationalization files')
  .requiredOption('--config <config>', 'configuration file')
  .option('-l, --languages <languages>', 'comma-separated language list', 'en_IN,hi_IN')
  .option('-o, --output <path>', 'output directory')
  .action(generateI18n);

// Migrate command
program
  .command('migrate')
  .description('Migrate existing module to new version')
  .requiredOption('--module <path>', 'path to existing module')
  .option('--version <version>', 'target version', 'latest')
  .option('--backup', 'create backup before migration')
  .action(migrateModule);

// Diff command
program
  .command('diff')
  .description('Compare templates')
  .requiredOption('--template <templates>', 'template names separated by space')
  .action(diffTemplates);

// Global error handler
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}