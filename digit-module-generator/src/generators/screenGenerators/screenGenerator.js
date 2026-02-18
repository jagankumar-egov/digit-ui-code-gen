const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

// Register Handlebars helpers
Handlebars.registerHelper('pascalCase', (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
});

Handlebars.registerHelper('camelCase', (str) => {
  if (!str) return '';
  const pascal = str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

Handlebars.registerHelper('kebabCase', (str) => {
  if (!str) return '';
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '').toLowerCase();
});

Handlebars.registerHelper('constantCase', (str) => {
  if (!str) return '';
  return str.replace(/[A-Z]/g, letter => `_${letter}`).replace(/^_/, '').toUpperCase();
});

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('or', (a, b) => a || b);
Handlebars.registerHelper('and', (a, b) => a && b);
Handlebars.registerHelper('json', (context) => JSON.stringify(context || []));

Handlebars.registerHelper('toLocalizationKey', function(fieldName, prefix) {
  if (!fieldName) return '';
  const finalPrefix = prefix || 'MODULE_';
  const constantCase = fieldName
    .replace(/[\s-]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
  return `${finalPrefix}${constantCase}`;
});

async function generateScreens(screenType, config) {
  const templatesDir = path.join(__dirname, '../../templates/screens');
  const templateFile = path.join(templatesDir, `${screenType}.hbs`);
  
  // Check if template exists
  if (!(await fs.pathExists(templateFile))) {
    console.warn(`Template not found for screen type: ${screenType}`);
    return null;
  }
  
  // Read template
  const templateContent = await fs.readFile(templateFile, 'utf8');
  
  // Compile and render with proper context
  const compiled = Handlebars.compile(templateContent);
  return compiled({ config });
}

module.exports = { generateScreens };