const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

async function migrateModule(options) {
  try {
    console.log(chalk.blue('\n🔄 Starting module migration...\n'));

    const modulePath = path.resolve(options.module);
    
    // Validate module path
    if (!(await fs.pathExists(modulePath))) {
      console.log(chalk.red(`❌ Module path not found: ${modulePath}`));
      return;
    }

    // Check if it's a valid DIGIT module
    const packageJsonPath = path.join(modulePath, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      console.log(chalk.red('❌ Not a valid module: package.json not found'));
      return;
    }

    const packageJson = await fs.readJson(packageJsonPath);
    console.log(chalk.green(`✅ Found module: ${packageJson.name}`));

    // Create backup if requested
    if (options.backup) {
      await createBackup(modulePath, packageJson.name);
    }

    const targetVersion = options.version || 'latest';
    const spinner = ora(`Migrating module to version ${targetVersion}...`).start();

    try {
      // Analyze current module structure
      const analysis = await analyzeModule(modulePath);
      
      // Determine migration steps
      const migrationSteps = determineMigrationSteps(analysis, targetVersion);
      
      if (migrationSteps.length === 0) {
        spinner.info('Module is already up to date');
        return;
      }

      // Execute migration steps
      for (const step of migrationSteps) {
        spinner.text = `Executing: ${step.description}`;
        await executeMigrationStep(step, modulePath, analysis);
      }

      // Update package.json version
      await updatePackageVersion(packageJsonPath, targetVersion);

      spinner.succeed('Module migration completed successfully!');

      // Show migration summary
      showMigrationSummary(migrationSteps, analysis);

    } catch (error) {
      spinner.fail('Module migration failed');
      throw error;
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error migrating module:'), error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

async function createBackup(modulePath, moduleName) {
  const backupDir = path.join(path.dirname(modulePath), `${path.basename(modulePath)}_backup_${Date.now()}`);
  
  console.log(chalk.blue(`📦 Creating backup: ${backupDir}`));
  
  await fs.copy(modulePath, backupDir, {
    filter: (src) => {
      // Exclude node_modules and build artifacts
      const relativePath = path.relative(modulePath, src);
      return !relativePath.includes('node_modules') && 
             !relativePath.includes('dist') && 
             !relativePath.includes('.git');
    }
  });
  
  console.log(chalk.green(`✅ Backup created: ${backupDir}`));
  return backupDir;
}

async function analyzeModule(modulePath) {
  const analysis = {
    path: modulePath,
    packageJson: null,
    hasWebpack: false,
    hasTests: false,
    configFiles: [],
    pageFiles: [],
    utilFiles: [],
    componentFiles: [],
    version: null,
    framework: 'unknown'
  };

  // Read package.json
  const packageJsonPath = path.join(modulePath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    analysis.packageJson = await fs.readJson(packageJsonPath);
    analysis.version = analysis.packageJson.version;
  }

  // Check for webpack config
  analysis.hasWebpack = await fs.pathExists(path.join(modulePath, 'webpack.config.js'));

  // Check for tests
  analysis.hasTests = await fs.pathExists(path.join(modulePath, '__tests__')) ||
                     await fs.pathExists(path.join(modulePath, 'src/__tests__'));

  // Find configuration files
  const configsPath = path.join(modulePath, 'src/configs');
  if (await fs.pathExists(configsPath)) {
    const configFiles = await fs.readdir(configsPath);
    analysis.configFiles = configFiles.filter(file => file.endsWith('.js'));
  }

  // Find page files
  const pagesPath = path.join(modulePath, 'src/pages');
  if (await fs.pathExists(pagesPath)) {
    const pageFiles = await fs.readdir(pagesPath, { recursive: true });
    analysis.pageFiles = pageFiles.filter(file => file.endsWith('.js'));
  }

  // Find utility files
  const utilsPath = path.join(modulePath, 'src/utils');
  if (await fs.pathExists(utilsPath)) {
    const utilFiles = await fs.readdir(utilsPath);
    analysis.utilFiles = utilFiles.filter(file => file.endsWith('.js'));
  }

  // Determine framework version
  if (analysis.packageJson?.dependencies) {
    if (analysis.packageJson.dependencies['@egovernments/digit-ui-components']) {
      analysis.framework = 'digit-ui-components';
    } else if (analysis.packageJson.dependencies['@egovernments/digit-ui-react-components']) {
      analysis.framework = 'digit-ui-react-components';
    }
  }

  return analysis;
}

function determineMigrationSteps(analysis, targetVersion) {
  const steps = [];

  // Version-specific migration steps
  if (!analysis.hasTests) {
    steps.push({
      type: 'add-tests',
      description: 'Add test files and configuration',
      priority: 1
    });
  }

  if (!analysis.hasWebpack) {
    steps.push({
      type: 'add-webpack',
      description: 'Add webpack configuration',
      priority: 2
    });
  }

  // Framework migration
  if (analysis.framework === 'digit-ui-react-components') {
    steps.push({
      type: 'migrate-framework',
      description: 'Migrate to digit-ui-components',
      priority: 3
    });
  }

  // Config file updates
  if (analysis.configFiles.length > 0) {
    steps.push({
      type: 'update-configs',
      description: 'Update configuration files',
      priority: 4
    });
  }

  // Package.json updates
  steps.push({
    type: 'update-package',
    description: 'Update package.json dependencies',
    priority: 5
  });

  return steps.sort((a, b) => a.priority - b.priority);
}

async function executeMigrationStep(step, modulePath, analysis) {
  switch (step.type) {
    case 'add-tests':
      await addTestFiles(modulePath, analysis);
      break;
      
    case 'add-webpack':
      await addWebpackConfig(modulePath);
      break;
      
    case 'migrate-framework':
      await migrateFramework(modulePath, analysis);
      break;
      
    case 'update-configs':
      await updateConfigFiles(modulePath, analysis);
      break;
      
    case 'update-package':
      await updatePackageDependencies(modulePath, analysis);
      break;
      
    default:
      console.log(chalk.yellow(`⚠️  Unknown migration step: ${step.type}`));
  }
}

async function addTestFiles(modulePath, analysis) {
  const testsDir = path.join(modulePath, '__tests__');
  await fs.ensureDir(testsDir);

  // Create basic test structure
  const testSetup = `import '@testing-library/jest-dom';

// Global test setup for ${analysis.packageJson?.name || 'module'}
global.Digit = {
  ULBService: {
    getCurrentTenantId: () => 'test-tenant'
  },
  UserService: {
    getUser: () => ({ info: { uuid: 'test-user' } })
  }
};`;

  await fs.writeFile(path.join(testsDir, 'setup.js'), testSetup);

  // Create Jest config
  const jestConfig = `module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  transform: {
    '^.+\\\\.(js|jsx)$': 'babel-jest'
  },
  testMatch: ['<rootDir>/__tests__/**/*.(test|spec).(js|jsx)']
};`;

  await fs.writeFile(path.join(modulePath, 'jest.config.js'), jestConfig);
}

async function addWebpackConfig(modulePath) {
  const webpackConfig = `const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/Module.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  externals: {
    react: 'react',
    'react-dom': 'react-dom'
  }
};`;

  await fs.writeFile(path.join(modulePath, 'webpack.config.js'), webpackConfig);
}

async function migrateFramework(modulePath, analysis) {
  const packageJsonPath = path.join(modulePath, 'package.json');
  const packageJson = analysis.packageJson;

  // Update dependencies
  if (packageJson.dependencies['@egovernments/digit-ui-react-components']) {
    delete packageJson.dependencies['@egovernments/digit-ui-react-components'];
    packageJson.dependencies['@egovernments/digit-ui-components'] = '^0.0.2';
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Update import statements in files
  const srcPath = path.join(modulePath, 'src');
  await updateImports(srcPath);
}

async function updateImports(dirPath) {
  const files = await fs.readdir(dirPath, { recursive: true });
  
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const filePath = path.join(dirPath, file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Replace old import with new one
      content = content.replace(
        /@egovernments\/digit-ui-react-components/g,
        '@egovernments/digit-ui-components'
      );
      
      await fs.writeFile(filePath, content);
    }
  }
}

async function updateConfigFiles(modulePath, analysis) {
  // Update config files to use new patterns
  const configsPath = path.join(modulePath, 'src/configs');
  
  for (const configFile of analysis.configFiles) {
    const filePath = path.join(configsPath, configFile);
    let content = await fs.readFile(filePath, 'utf8');
    
    // Update any deprecated configuration patterns
    content = content.replace(/FormComposerV2/g, 'FormComposerV2');
    content = content.replace(/CommonScreen/g, 'CommonScreen');
    
    await fs.writeFile(filePath, content);
  }
}

async function updatePackageDependencies(modulePath, analysis) {
  const packageJsonPath = path.join(modulePath, 'package.json');
  const packageJson = analysis.packageJson;

  // Update to latest stable versions
  const latestDependencies = {
    '@egovernments/digit-ui-components': '^0.0.2',
    'react': '^17.0.2',
    'react-dom': '^17.0.2',
    'react-router-dom': '^5.3.0',
    'react-i18next': '^11.15.3'
  };

  Object.assign(packageJson.dependencies || {}, latestDependencies);

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function updatePackageVersion(packageJsonPath, targetVersion) {
  const packageJson = await fs.readJson(packageJsonPath);
  
  if (targetVersion !== 'latest') {
    packageJson.version = targetVersion;
  } else {
    // Increment patch version
    const [major, minor, patch] = packageJson.version.split('.').map(Number);
    packageJson.version = `${major}.${minor}.${patch + 1}`;
  }
  
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

function showMigrationSummary(migrationSteps, analysis) {
  console.log(chalk.blue('\n📋 Migration Summary:\n'));
  
  console.log(chalk.white(`Module: ${analysis.packageJson?.name}`));
  console.log(chalk.white(`Previous Version: ${analysis.version}`));
  console.log(chalk.white(`Framework: ${analysis.framework}`));
  
  console.log(chalk.green('\n✅ Completed Steps:'));
  migrationSteps.forEach(step => {
    console.log(chalk.gray(`   • ${step.description}`));
  });
  
  console.log(chalk.blue('\n📖 Next Steps:'));
  console.log(chalk.white('1. Review the migrated files'));
  console.log(chalk.white('2. Run npm install to update dependencies'));
  console.log(chalk.white('3. Run tests to ensure everything works'));
  console.log(chalk.white('4. Update any custom code as needed'));
}

module.exports = { migrateModule };