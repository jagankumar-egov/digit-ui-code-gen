const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
const glob = require('glob');
const chalk = require('chalk');
const { generateCreateConfig } = require('./configGenerators/createConfigGenerator');
const { generateSearchConfig } = require('./configGenerators/searchConfigGenerator');
const { generateInboxConfig } = require('./configGenerators/inboxConfigGenerator');
const { generateViewConfig } = require('./configGenerators/viewConfigGenerator');
const { generateCreateUtils } = require('./utilsGenerators/createUtilsGenerator');
const { generateResponseUtils } = require('./utilsGenerators/responseUtilsGenerator');
const { generateSearchUtils } = require('./utilsGenerators/searchUtilsGenerator');
const { generateScreens } = require('./screenGenerators/screenGenerator');
const { generateServices } = require('./serviceGenerators/serviceGenerator');
const { generateI18nFiles } = require('./i18nGenerator');

// Register Handlebars helpers
Handlebars.registerHelper('pascalCase', (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
});

Handlebars.registerHelper('camelCase', (str) => {
  const pascal = Handlebars.helpers.pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

Handlebars.registerHelper('kebabCase', (str) => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
});

Handlebars.registerHelper('constantCase', (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter}`).replace(/^_/, '').toUpperCase();
});

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('or', (a, b) => a || b);
Handlebars.registerHelper('and', (a, b) => a && b);

Handlebars.registerHelper('toLocalizationKey', function(fieldName, prefix) {
  const finalPrefix = prefix || 'MODULE_';
  // Convert camelCase to CONSTANT_CASE properly
  const constantCase = fieldName
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Insert underscore before capitals
    .toUpperCase();
  return `${finalPrefix}${constantCase}`;
});

async function generateFromConfig(config, outputPath, force = false) {
  const moduleDir = path.join(outputPath, config.module.code);
  const result = { files: [], warnings: [] };

  // Check if module already exists
  if (await fs.pathExists(moduleDir) && !force) {
    throw new Error(`Module directory already exists: ${moduleDir}. Use --force to overwrite.`);
  }

  // Create module directory structure
  await createDirectoryStructure(moduleDir);

  // Generate package.json
  await generatePackageJson(moduleDir, config, result);

  // Generate webpack config
  await generateWebpackConfig(moduleDir, config, result);

  // Generate main Module.js
  await generateMainModule(moduleDir, config, result);

  // Generate configs for enabled screens
  await generateConfigs(moduleDir, config, result);

  // Generate screen components
  await generateScreenComponents(moduleDir, config, result);

  // Generate utility files
  await generateUtilities(moduleDir, config, result);

  // Generate service files
  await generateServiceFiles(moduleDir, config, result);

  // Generate i18n files
  if (config.i18n?.generateKeys) {
    await generateInternationalization(moduleDir, config, result);
  }

  // Generate README
  await generateReadme(moduleDir, config, result);

  return result;
}

async function createDirectoryStructure(moduleDir) {
  const directories = [
    'src',
    'src/configs',
    'src/pages',
    'src/pages/employee',
    'src/components',
    'src/utils',
    'src/hooks',
    'src/services',
    'localization',
    '__tests__',
    '__tests__/components',
    '__tests__/utils'
  ];

  for (const dir of directories) {
    await fs.ensureDir(path.join(moduleDir, dir));
  }
}

async function generatePackageJson(moduleDir, config, result) {
  const template = `{
  "name": "@egovernments/digit-ui-module-{{kebabCase module.code}}",
  "version": "{{module.version}}",
  "description": "{{module.description}}",
  "main": "dist/index.js",
  "scripts": {
    "build": "cross-env NODE_ENV=production webpack --config webpack.config.js",
    "build:dev": "cross-env NODE_ENV=development webpack --config webpack.config.js",
    "build:analyze": "NODE_ENV=production webpack --config webpack.config.js --analyze",
    "publish:components": "npm publish --tag console-v0.5"
  },
  "peerDependencies": {
    "@tanstack/react-query": "^5.62.16",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-router-dom": "6.25.1",
    "react-i18next": "15.0.0",
    "styled-components": "5.x",
    "@egovernments/digit-ui-react-components": "2.0.0-dev-02",
    "@egovernments/digit-ui-svg-components": "2.0.0-dev-01",
    "@egovernments/digit-ui-components": "2.0.0-dev-19"
  },
  "devDependencies": {
    "@babel/core": "^7.23.3",
    "@babel/preset-env": "^7.23.3",
    "@babel/preset-react": "^7.23.3",
    "@tanstack/react-query": "^5.62.16",
    "babel-loader": "^9.1.3",
    "babel-plugin-transform-remove-console": "^6.9.4",
    "core-js": "^3.33.0",
    "cross-env": "7.0.3",
    "css-loader": "^6.8.1",
    "lint-staged": "12.3.7",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-router-dom": "6.25.1",
    "webpack": "^5.97.1",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.1",
    "@types/react-redux": "^7.1.33"
  },
  "files": [
    "dist"
  ]
}`;

  const compiled = Handlebars.compile(template);
  const content = compiled(config);
  
  await fs.writeFile(path.join(moduleDir, 'package.json'), content);
  result.files.push('package.json');
}

async function generateWebpackConfig(moduleDir, config, result) {
  const template = `const path = require('path');

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
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  externals: {
    react: 'react',
    'react-dom': 'react-dom',
    'react-router-dom': 'react-router-dom',
    '@egovernments/digit-ui-react-components': '@egovernments/digit-ui-react-components'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};`;

  await fs.writeFile(path.join(moduleDir, 'webpack.config.js'), template);
  result.files.push('webpack.config.js');
}

async function generateMainModule(moduleDir, config, result) {
  const template = `import React from "react";
import { CommonScreen } from "@egovernments/digit-ui-components";
{{#each screens}}
{{#if enabled}}
import {{../entity.name}}{{pascalCase @key}} from "./pages/employee/{{../entity.name}}{{pascalCase @key}}";
{{/if}}
{{/each}}

const {{entity.name}}Module = ({ stateCode, userType, tenantId }) => {
  const moduleCode = "{{constantCase module.code}}";
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({ stateCode, moduleCode, language });

  if (isLoading) {
    return <Loader />;
  }

  return <CommonScreen {...{ stateCode, userType, tenantId, moduleCode, data: store }} />;
};

const {{entity.name}}ModuleComponents = {
  {{entity.name}}Module,
{{#each screens}}
{{#if enabled}}
  {{../entity.name}}{{pascalCase @key}}: React.lazy(() => import("./pages/employee/{{../entity.name}}{{pascalCase @key}}")),
{{/if}}
{{/each}}
};

export { {{entity.name}}ModuleComponents };`;

  const compiled = Handlebars.compile(template);
  const content = compiled(config);
  
  await fs.writeFile(path.join(moduleDir, 'src/Module.js'), content);
  result.files.push('src/Module.js');
}

async function generateConfigs(moduleDir, config, result) {
  const configsDir = path.join(moduleDir, 'src/configs');
  
  for (const [screenType, screenConfig] of Object.entries(config.screens)) {
    if (!screenConfig.enabled) continue;
    
    let configContent = '';
    const fileName = `${config.entity.name}${screenType.charAt(0).toUpperCase() + screenType.slice(1)}Config.js`;
    
    switch (screenType) {
      case 'create':
        configContent = generateCreateConfig(config);
        break;
      case 'search':
        configContent = generateSearchConfig(config);
        break;
      case 'inbox':
        configContent = generateInboxConfig(config);
        break;
      case 'view':
        configContent = generateViewConfig(config);
        break;
      default:
        continue;
    }
    
    await fs.writeFile(path.join(configsDir, fileName), configContent);
    result.files.push(`src/configs/${fileName}`);
  }
}

async function generateScreenComponents(moduleDir, config, result) {
  const screensDir = path.join(moduleDir, 'src/pages/employee');
  
  for (const [screenType, screenConfig] of Object.entries(config.screens)) {
    if (!screenConfig.enabled) continue;
    
    const screenContent = await generateScreens(screenType, config);
    if (screenContent) {
      const fileName = `${config.entity.name}${screenType.charAt(0).toUpperCase() + screenType.slice(1)}.js`;
      await fs.writeFile(path.join(screensDir, fileName), screenContent);
      result.files.push(`src/pages/employee/${fileName}`);
    }
  }
}

async function generateUtilities(moduleDir, config, result) {
  const utilsDir = path.join(moduleDir, 'src/utils');
  
  // Generate createUtils.js
  const createUtilsContent = generateCreateUtils(config);
  await fs.writeFile(path.join(utilsDir, 'createUtils.js'), createUtilsContent);
  result.files.push('src/utils/createUtils.js');
  
  // Generate searchUtils.js  
  const searchUtilsContent = generateSearchUtils(config);
  await fs.writeFile(path.join(utilsDir, 'searchUtils.js'), searchUtilsContent);
  result.files.push('src/utils/searchUtils.js');
  
  // Generate responseUtils.js
  const responseUtilsContent = generateResponseUtils(config);
  await fs.writeFile(path.join(utilsDir, 'responseUtils.js'), responseUtilsContent);
  result.files.push('src/utils/responseUtils.js');
}

async function generateServiceFiles(moduleDir, config, result) {
  const servicesDir = path.join(moduleDir, 'src/services');
  await fs.ensureDir(servicesDir);
  
  // Generate services with the correct parameters
  await generateServices(config, moduleDir);
  result.files.push(`src/services/${config.entity.name}Service.js`);
  result.files.push('src/services/apiEndpoints.js');
}

async function generateInternationalization(moduleDir, config, result) {
  const localizationDir = path.join(moduleDir, 'localization');
  
  const languages = ['en_IN', 'hi_IN'];
  
  for (const lang of languages) {
    // generateI18nFiles is async, so await it
    await generateI18nFiles(config, moduleDir, [lang]);
    result.files.push(`localization/${lang}.json`);
  }
}

async function generateReadme(moduleDir, config, result) {
  const template = `# {{module.name}}

{{module.description}}

## Features

{{#each screens}}
{{#if enabled}}
- {{pascalCase @key}} Screen
{{/if}}
{{/each}}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Configuration

### Required Roles
{{#each auth.roles}}
- {{this}}
{{/each}}

### API Endpoints
{{#each api}}
- {{@key}}: {{this}}
{{/each}}

## Generated Files

This module was generated using digit-module-generator.

- **Version**: {{module.version}}
- **Entity**: {{entity.name}}
- **Screens**: {{#each screens}}{{#if enabled}}{{@key}}, {{/if}}{{/each}}

## Customization

You can customize the generated files to match your specific requirements:

1. Update field configurations in \`src/configs/\`
2. Modify screen components in \`src/pages/employee/\`
3. Adjust API transformations in \`src/utils/\`
4. Update service endpoints in \`src/services/\`

## Support

For issues and questions:
- Check the DIGIT documentation
- Report bugs in the repository
- Join the community discussions
`;

  const compiled = Handlebars.compile(template);
  const content = compiled(config);
  
  await fs.writeFile(path.join(moduleDir, 'README.md'), content);
  result.files.push('README.md');
}

module.exports = {
  generateFromConfig
};