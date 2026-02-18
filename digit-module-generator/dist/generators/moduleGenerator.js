const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
const glob = require('glob');
const chalk = require('chalk');
const {
  generateCreateConfig
} = require('./configGenerators/createConfigGenerator');
const {
  generateSearchConfig
} = require('./configGenerators/searchConfigGenerator');
const {
  generateInboxConfig
} = require('./configGenerators/inboxConfigGenerator');
const {
  generateViewConfig
} = require('./configGenerators/viewConfigGenerator');
const {
  generateCreateUtils
} = require('./utilsGenerators/createUtilsGenerator');
const {
  generateResponseUtils
} = require('./utilsGenerators/responseUtilsGenerator');
const {
  generateSearchUtils
} = require('./utilsGenerators/searchUtilsGenerator');
const {
  generateScreens
} = require('./screenGenerators/screenGenerator');
const {
  generateServices
} = require('./serviceGenerators/serviceGenerator');
const {
  generateI18nFiles
} = require('./i18nGenerator');

// Register Handlebars helpers
Handlebars.registerHelper('pascalCase', str => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
});
Handlebars.registerHelper('camelCase', str => {
  const pascal = Handlebars.helpers.pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});
Handlebars.registerHelper('kebabCase', str => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
});
Handlebars.registerHelper('constantCase', str => {
  return str.replace(/[A-Z]/g, letter => `_${letter}`).replace(/^_/, '').toUpperCase();
});
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('or', (a, b) => a || b);
Handlebars.registerHelper('and', (a, b) => a && b);
Handlebars.registerHelper('json', context => JSON.stringify(context || []));
Handlebars.registerHelper('toLocalizationKey', function (fieldName, prefix) {
  const finalPrefix = prefix || 'MODULE_';
  // Convert spaces/hyphens to underscores, then camelCase to CONSTANT_CASE
  const constantCase = fieldName.replace(/[\s-]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  return `${finalPrefix}${constantCase}`;
});
async function generateFromConfig(config, outputPath, force = false) {
  const moduleDir = path.join(outputPath, config.module.code);
  const result = {
    files: [],
    warnings: []
  };

  // Check if module already exists
  if ((await fs.pathExists(moduleDir)) && !force) {
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

  // Generate UICustomizations config
  await generateUICustomizations(moduleDir, config, result);

  // Generate screen components
  await generateScreenComponents(moduleDir, config, result);

  // Generate employee router (pages/employee/index.js)
  await generateEmployeeRouter(moduleDir, config, result);

  // Generate module card (home page card component)
  await generateModuleCard(moduleDir, config, result);

  // Generate utility files
  await generateUtilities(moduleDir, config, result);

  // Generate service files
  await generateServiceFiles(moduleDir, config, result);

  // Generate hooks index (hooks/index.js with CustomisedHooks)
  await generateHooksIndex(moduleDir, config, result);

  // Generate i18n files
  if (config.i18n?.generateKeys) {
    await generateInternationalization(moduleDir, config, result);
  }

  // Generate README
  await generateReadme(moduleDir, config, result);
  return result;
}
async function createDirectoryStructure(moduleDir) {
  const directories = ['src', 'src/configs', 'src/pages', 'src/pages/employee', 'src/components', 'src/utils', 'src/hooks', 'src/services', 'localization', '__tests__', '__tests__/components', '__tests__/utils'];
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
    "@egovernments/digit-ui-svg-components": "2.0.0-dev-01",
    "@egovernments/digit-ui-components": "2.0.0-dev-31"
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
  const kebabCode = config.module.code.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '').toLowerCase();
  const template = `const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/Module.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      name: "@egovernments/digit-ui-module-${kebabCode}",
      type: "umd",
    },
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
    'react-i18next': 'react-i18next',
    '@egovernments/digit-ui-components': '@egovernments/digit-ui-components',
    '@egovernments/digit-ui-svg-components': '@egovernments/digit-ui-svg-components',
    'styled-components': 'styled-components'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};`;
  await fs.writeFile(path.join(moduleDir, 'webpack.config.js'), template);
  result.files.push('webpack.config.js');
}
async function generateMainModule(moduleDir, config, result) {
  const entityName = config.entity.name;

  // Screen component mappings (same as router, for imports)
  const screenMappings = {
    create: {
      file: `${entityName}Create`,
      component: `${entityName}Create`
    },
    search: {
      file: `${entityName}Search`,
      component: `Search${entityName}`
    },
    view: {
      file: `${entityName}View`,
      component: `${entityName}ViewDetails`
    },
    inbox: {
      file: `${entityName}Inbox`,
      component: `${entityName}Inbox`
    },
    response: {
      file: `${entityName}Response`,
      component: `${entityName}Response`
    },
    custom: {
      file: `${entityName}Custom`,
      component: `${entityName}Custom`
    }
  };
  const enabledScreens = Object.entries(config.screens).filter(([type, sc]) => sc.enabled && screenMappings[type]).map(([type]) => type);

  // Build screen component imports
  const screenImports = enabledScreens.map(type => {
    const m = screenMappings[type];
    return `import ${m.component} from "./pages/employee/${m.file}";`;
  }).join('\n');

  // Build componentsToRegister entries
  const screenRegistrations = enabledScreens.map(type => {
    const m = screenMappings[type];
    return `  ${m.component},`;
  }).join('\n');
  const kebabCode = config.module.code.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '').toLowerCase();
  const constantCode = config.module.code.replace(/[-\s]/g, '_').replace(/[A-Z]/g, letter => `_${letter}`).replace(/^_/, '').toUpperCase();
  const content = `import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Loader, ErrorBoundary } from "@egovernments/digit-ui-components";
import { CustomisedHooks } from "./hooks";
import { UICustomizations } from "./configs/UICustomizations";
import ${entityName}Card from "./components/${entityName}Card";
${screenImports}

const EmployeeApp = React.lazy(() => import("./pages/employee"));

const ${entityName}Module = React.memo(({ stateCode, userType, tenants }) => {
  const tenantId = Digit?.ULBService?.getCurrentTenantId();
  const location = useLocation();
  const moduleCode = ["${kebabCode}"];

  const path = useMemo(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 3) {
      return "/" + pathParts.slice(0, 3).join("/");
    }
    return "/" + window?.contextPath + "/employee/${kebabCode}";
  }, [location.pathname]);

  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({ stateCode, moduleCode, language });

  if (isLoading) {
    return <Loader page={true} variant={"PageLoader"} />;
  }

  return (
    <ErrorBoundary moduleName="${constantCode}">
      <EmployeeApp
        path={path}
        stateCode={stateCode}
        userType={userType}
      />
    </ErrorBoundary>
  );
});

const componentsToRegister = {
  ${entityName}Module,
  ${entityName}Card,
${screenRegistrations}
};

const overrideHooks = () => {
  Object.keys(CustomisedHooks).map((ele) => {
    if (ele === "Hooks") {
      Object.keys(CustomisedHooks[ele]).map((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).map((method) => {
          setupHooks(hook, method, CustomisedHooks[ele][hook][method]);
        });
      });
    } else if (ele === "Utils") {
      Object.keys(CustomisedHooks[ele]).map((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).map((method) => {
          setupHooks(hook, method, CustomisedHooks[ele][hook][method], false);
        });
      });
    } else {
      Object.keys(CustomisedHooks[ele]).map((method) => {
        setupLibraries(ele, method, CustomisedHooks[ele][method]);
      });
    }
  });
};

const setupHooks = (HookName, HookFunction, method, isHook = true) => {
  window.Digit = window.Digit || {};
  window.Digit[isHook ? "Hooks" : "Utils"] = window.Digit[isHook ? "Hooks" : "Utils"] || {};
  window.Digit[isHook ? "Hooks" : "Utils"][HookName] = window.Digit[isHook ? "Hooks" : "Utils"][HookName] || {};
  window.Digit[isHook ? "Hooks" : "Utils"][HookName][HookFunction] = method;
};

const setupLibraries = (Library, service, method) => {
  window.Digit = window.Digit || {};
  window.Digit[Library] = window.Digit[Library] || {};
  window.Digit[Library][service] = method;
};

const updateCustomConfigs = () => {
  setupLibraries("Customizations", "commonUiConfig", { ...window?.Digit?.Customizations?.commonUiConfig, ...UICustomizations });
};

const init${entityName}Components = () => {
  overrideHooks();
  updateCustomConfigs();
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};

export { init${entityName}Components };
`;
  await fs.writeFile(path.join(moduleDir, 'src/Module.js'), content);
  result.files.push('src/Module.js');
}
async function generateEmployeeRouter(moduleDir, config, result) {
  // Map screen types to their component import names and file names
  const screenMappings = {
    create: {
      file: `${config.entity.name}Create`,
      component: `${config.entity.name}Create`
    },
    search: {
      file: `${config.entity.name}Search`,
      component: `Search${config.entity.name}`
    },
    view: {
      file: `${config.entity.name}View`,
      component: `${config.entity.name}ViewDetails`
    },
    inbox: {
      file: `${config.entity.name}Inbox`,
      component: `${config.entity.name}Inbox`
    },
    response: {
      file: `${config.entity.name}Response`,
      component: `${config.entity.name}Response`
    },
    custom: {
      file: `${config.entity.name}Custom`,
      component: `${config.entity.name}Custom`
    }
  };
  const enabledScreens = Object.entries(config.screens).filter(([type, screenConfig]) => screenConfig.enabled && screenMappings[type]).map(([screenType]) => screenType);

  // Build imports
  const imports = enabledScreens.map(screenType => {
    const mapping = screenMappings[screenType];
    return `import ${mapping.component} from "./${mapping.file}";`;
  }).join('\n');

  // Build routes
  const routes = enabledScreens.map(screenType => {
    const mapping = screenMappings[screenType];
    return `        <Route path="${screenType}" element={<${mapping.component} />} />`;
  }).join('\n');
  const moduleCode = config.module.code;
  const constantModuleCode = moduleCode.replace(/[-\s]/g, '_').toUpperCase();
  const content = `import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppContainer } from "@egovernments/digit-ui-react-components";
import { BreadCrumb } from "@egovernments/digit-ui-components";
${imports}

const ${config.entity.name}BreadCrumb = ({ location, defaultPath }) => {
  const { t } = useTranslation();
  const pathVar = location.pathname.replace(defaultPath + "/", "").split("?")?.[0];

  const crumbs = [
    {
      internalLink: "/" + window?.contextPath + "/employee",
      content: t("HOME"),
      show: true,
    },
    {
      internalLink: "",
      content: t("${constantModuleCode}_" + pathVar.toUpperCase().replace(/-/g, "_")),
      show: true,
    },
  ];

  return <BreadCrumb crumbs={crumbs} />;
};

const App = ({ path, stateCode, userType }) => {
  const location = useLocation();

  return (
    <React.Fragment>
      <div className="wbh-header-container">
        <${config.entity.name}BreadCrumb location={location} defaultPath={path} />
      </div>
      <AppContainer>
        <Routes>
${routes}
        </Routes>
      </AppContainer>
    </React.Fragment>
  );
};

export default React.memo(App);
`;
  await fs.writeFile(path.join(moduleDir, 'src/pages/employee/index.js'), content);
  result.files.push('src/pages/employee/index.js');
}
async function generateModuleCard(moduleDir, config, result) {
  const entityName = config.entity.name;
  const kebabCode = config.module.code.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '').toLowerCase();
  const constantModuleCode = config.module.code.replace(/[-\s]/g, '_').toUpperCase();
  const roles = config.screens.landing?.roles || config.auth?.roles || ['ADMIN'];

  // Build links based on enabled screens (excluding landing itself)
  const enabledScreens = Object.entries(config.screens).filter(([type, sc]) => sc.enabled && type !== 'landing' && type !== 'response').map(([type]) => type);
  const links = enabledScreens.map(screenType => {
    return `    {
      label: t("${constantModuleCode}_${screenType.toUpperCase()}"),
      link: \`/\${window?.contextPath}/employee/${kebabCode}/${screenType}\`,
      roles: ${JSON.stringify(roles)},
    }`;
  }).join(',\n');
  const content = `import { useTranslation } from "react-i18next";
import React from "react";
import { EmployeeModuleCard } from "@egovernments/digit-ui-react-components";

const ROLES = ${JSON.stringify(roles)};

const ${entityName}Card = () => {
  if (!Digit.Utils.didEmployeeHasAtleastOneRole(ROLES)) {
    return null;
  }

  const { t } = useTranslation();

  let links = [
${links}
  ];

  links = links.filter((link) =>
    link?.roles && link?.roles?.length > 0
      ? Digit.Utils.didEmployeeHasAtleastOneRole(link.roles)
      : true
  );

  const propsForModuleCard = {
    Icon: "Collection",
    moduleName: t("${constantModuleCode}_MODULE_NAME"),
    kpis: [],
    links: links,
  };

  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default ${entityName}Card;
`;
  const componentsDir = path.join(moduleDir, 'src/components');
  await fs.ensureDir(componentsDir);
  await fs.writeFile(path.join(componentsDir, `${entityName}Card.js`), content);
  result.files.push(`src/components/${entityName}Card.js`);
}
async function generateHooksIndex(moduleDir, config, result) {
  const entityName = config.entity.name;
  const camelEntity = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const hookNames = [`useCreate${entityName}`, `useUpdate${entityName}`, `useSearch${entityName}s`, `useGet${entityName}ById`];
  if (config.workflow && config.workflow.enabled) {
    hookNames.push(`use${entityName}Workflow`);
  }
  const content = `import {
  ${hookNames.join(',\n  ')}
} from "./use${entityName}";

const ${camelEntity}Hooks = {
  ${hookNames.join(',\n  ')}
};

export const CustomisedHooks = {
  Hooks: {
    ${camelEntity}: ${camelEntity}Hooks,
  },
  Utils: {},
};
`;
  await fs.writeFile(path.join(moduleDir, 'src/hooks/index.js'), content);
  result.files.push('src/hooks/index.js');
}
async function generateUICustomizations(moduleDir, config, result) {
  const content = `/**
 * UI Customizations for ${config.module.name}
 * Add search config customizations here
 * Each key should match a search config name used in InboxSearchComposer
 *
 * Example:
 * export const UICustomizations = {
 *   ${config.entity.name}SearchConfig: {
 *     preProcess: (data) => { return data; },
 *     additionalCustomizations: (row, key, column, value, t) => {
 *       switch (key) { default: return value; }
 *     },
 *   },
 * };
 */

export const UICustomizations = {};
`;
  await fs.writeFile(path.join(moduleDir, 'src/configs/UICustomizations.js'), content);
  result.files.push('src/configs/UICustomizations.js');
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

  // Screen types that go in pages/employee/ (landing is a Card component, handled separately)
  const pageScreenTypes = ['create', 'search', 'view', 'inbox', 'response', 'custom'];
  for (const [screenType, screenConfig] of Object.entries(config.screens)) {
    if (!screenConfig.enabled || !pageScreenTypes.includes(screenType)) continue;
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