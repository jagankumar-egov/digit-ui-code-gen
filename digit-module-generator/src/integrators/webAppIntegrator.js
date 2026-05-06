/**
 * webAppIntegrator.js — Auto-integration with micro-ui/web host app
 *
 * After `digit-gen create` generates a module, this integrator patches the host app
 * so the module is immediately registered and visible in the browser.
 *
 * Two files in the host app are patched:
 *
 *   1. {webDir}/package.json
 *      Adds the module as a local workspace dependency:
 *        "@egovernments/digit-ui-module-{code}": "1.0.0"
 *      Version "1.0.0" must match the module's own package.json version.
 *      Without this, yarn install fails trying to resolve the package from npm registry.
 *
 *   2. {webDir}/src/index.js
 *      Adds the module to enabledModules[] array and calls init{Entity}Components()
 *      in the try-catch block just before setIsReady(true).
 *
 * All three exported functions (integrateWithWebApp, deintegrateFromWebApp, isIntegrated)
 * are IDEMPOTENT — safe to call multiple times without creating duplicate entries.
 *
 * deintegrateFromWebApp is called by the `create --force` flow (when output is inside
 * micro-ui/web and --only is not set) to clean up stale entries before regeneration.
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Patches micro-ui/web to register the generated module.
 * Idempotent — skips if the module is already registered.
 *
 * @param {Object} config  - Validated module config
 * @param {string} webDir  - Path to the micro-ui/web directory
 */
async function integrateWithWebApp(config, webDir) {
  const moduleCode        = config.module.code;
  const entityName        = config.entity.name;
  const packageName       = `@egovernments/digit-ui-module-${moduleCode}`;
  const initFnName        = `init${entityName}Components`;
  const enabledModuleName = toPascalCase(moduleCode);

  console.log(chalk.blue(`\n🔗 Integrating module into ${webDir}...\n`));

  await updateWebPackageJson(webDir, packageName);
  await updateWebIndexJs(webDir, packageName, initFnName, enabledModuleName);

  console.log(chalk.green(`\n✅ Integration complete!`));
  console.log(chalk.blue(`\n📖 Next steps:`));
  console.log(chalk.white(`1. cd ${webDir} && yarn install   (links the new workspace package)`));
  console.log(chalk.white(`2. Build module: cd packages/modules/${moduleCode} && yarn build:dev`));
  console.log(chalk.white(`3. Start host:   yarn start`));
}

/**
 * Removes a module's integration entries from micro-ui/web.
 * Cleans up package.json dependency and index.js registrations.
 * Safe to call even if entries don't exist.
 */
async function deintegrateFromWebApp(config, webDir) {
  const moduleCode        = config.module.code;
  const entityName        = config.entity.name;
  const packageName       = `@egovernments/digit-ui-module-${moduleCode}`;
  const initFnName        = `init${entityName}Components`;
  const enabledModuleName = toPascalCase(moduleCode);

  let changed = false;

  // 1. Remove from web/package.json
  const pkgPath = path.join(webDir, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    if (pkg.dependencies && pkg.dependencies[packageName]) {
      delete pkg.dependencies[packageName];
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      console.log(chalk.green(`✅ Removed ${packageName} from web/package.json`));
      changed = true;
    }
  }

  // 2. Remove from web/src/index.js
  const indexPath = path.join(webDir, 'src', 'index.js');
  if (await fs.pathExists(indexPath)) {
    let content = await fs.readFile(indexPath, 'utf8');
    const before = content;

    // Remove the enabledModules entry (handles ", "Name"" and ""Name"," and ""Name"")
    content = content.replace(
      new RegExp(`,?\\s*"${enabledModuleName}"\\s*,?`, 'g'),
      match => {
        // If it was "X","Y" remove ,Y — if it was "Y","X" remove Y, — if only "Y" remove it
        if (match.startsWith(',') && match.endsWith(',')) return ','; // middle item
        return '';
      }
    );
    // Clean up any double commas left behind
    content = content.replace(/,(\s*),/g, ',');
    // Clean up trailing comma before ]
    content = content.replace(/,(\s*)\]/g, '$1]');

    // Remove the try-catch block for this module (from "try {" to closing "}")
    // Matches: try { ... initXxxComponents ... } catch { ... }
    const tryBlockRegex = new RegExp(
      `\\s*try \\{[^}]*const \\{ ${initFnName} \\} = await import\\("${packageName.replace(/\//g, '\\/')}"\\)[^}]*${initFnName}\\(\\);[\\s\\S]*?\\} catch \\(error\\) \\{[^}]*\\}\\n?`,
      'g'
    );
    content = content.replace(tryBlockRegex, '\n');

    if (content !== before) {
      await fs.writeFile(indexPath, content);
      console.log(chalk.green(`✅ Removed ${initFnName} from web/src/index.js`));
      changed = true;
    }
  }

  if (!changed) {
    console.log(chalk.gray(`   (no integration entries found for ${moduleCode} — nothing to clean)`));
  }
}

/**
 * Checks if a module is already integrated in the web app.
 * Returns true if the package is listed in web/package.json dependencies.
 */
async function isIntegrated(config, webDir) {
  const packageName = `@egovernments/digit-ui-module-${config.module.code}`;
  const pkgPath = path.join(webDir, 'package.json');
  if (!(await fs.pathExists(pkgPath))) return false;
  const pkg = await fs.readJson(pkgPath);
  return !!(pkg.dependencies && pkg.dependencies[packageName]);
}

/**
 * Adds the module package to web/package.json dependencies.
 */
async function updateWebPackageJson(webDir, packageName) {
  const pkgPath = path.join(webDir, 'package.json');

  if (!(await fs.pathExists(pkgPath))) {
    console.log(chalk.yellow(`⚠️  package.json not found at ${pkgPath} — skipping`));
    return;
  }

  const pkg = await fs.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies || {};

  if (pkg.dependencies[packageName]) {
    console.log(chalk.gray(`   (${packageName} already in package.json — skipped)`));
    return;
  }

  pkg.dependencies[packageName] = '0.0.0';
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  console.log(chalk.green(`✅ Added ${packageName} to web/package.json`));
}

/**
 * Patches web/src/index.js to register the module.
 */
async function updateWebIndexJs(webDir, packageName, initFnName, moduleName) {
  const indexPath = path.join(webDir, 'src', 'index.js');

  if (!(await fs.pathExists(indexPath))) {
    console.log(chalk.yellow(`⚠️  src/index.js not found at ${indexPath} — skipping`));
    return;
  }

  let content = await fs.readFile(indexPath, 'utf8');

  if (content.includes(initFnName)) {
    console.log(chalk.gray(`   (${initFnName} already registered — skipped)`));
    return;
  }

  // 1. Append to enabledModules array
  content = content.replace(
    /(const enabledModules\s*=\s*\[)([^\]]*?)(\])/,
    (_match, open, inner, close) => {
      const trimmed = inner.trimEnd();
      const needsComma = trimmed.length > 0 && !trimmed.endsWith(',');
      return `${open}${trimmed}${needsComma ? ',' : ''}"${moduleName}"${close}`;
    }
  );

  // 2. Insert try-catch block before setIsReady(true)
  const newBlock = [
    `      try {`,
    `        const { ${initFnName} } = await import("${packageName}")`,
    `        ${initFnName}();`,
    `      } catch (error) {`,
    `        console.log("Error loading ${moduleName} module:", error);`,
    `      }`,
    ``,
  ].join('\n');

  content = content.replace(
    /^(\s+setIsReady\(true\);)/m,
    `${newBlock}$1`
  );

  await fs.writeFile(indexPath, content);
  console.log(chalk.green(`✅ Registered ${initFnName} in web/src/index.js`));
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

module.exports = { integrateWithWebApp, deintegrateFromWebApp, isIntegrated };
