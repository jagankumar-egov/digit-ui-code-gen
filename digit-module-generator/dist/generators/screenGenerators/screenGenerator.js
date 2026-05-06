/**
 * Screen Generator
 *
 * Compiles Handlebars (.hbs) templates from templates/screens/ into React component strings.
 * Called by moduleGenerator.js for each enabled screen type.
 *
 * Supported screen types (one .hbs template per type):
 *   create   → FormComposer-based create form
 *   search   → InboxSearchComposer-based search + results table
 *   view     → KeyValuePair-based read-only detail view
 *   inbox    → InboxSearchComposer-based workflow inbox with filters
 *   response → Success/failure acknowledgement screen
 *   custom   → Blank canvas React component for custom use
 *
 * If a template file does not exist for the requested screen type, returns null
 * (warns but does not throw) so generation can continue for other screens.
 *
 * IMPORTANT: Handlebars is a singleton — helpers registered here are GLOBAL.
 * These same helpers are registered in moduleGenerator.js and all 4 config generators.
 * All registrations MUST stay in sync, especially toLocalizationKey (BUG-017 fix).
 */

const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

// ─── Handlebars Helpers ───────────────────────────────────────────────────────
// Registered globally here so .hbs templates can use them at compile time.
// These mirror the helpers in moduleGenerator.js — keep them in sync.

// "employeeName" → "EmployeeName"
Handlebars.registerHelper('pascalCase', str => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
});

// "EmployeeName" → "employeeName"
Handlebars.registerHelper('camelCase', str => {
  if (!str) return '';
  const pascal = str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

// "EmployeeName" → "employee-name"
Handlebars.registerHelper('kebabCase', str => {
  if (!str) return '';
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '').toLowerCase();
});

// "employeeName" → "EMPLOYEE_NAME"
Handlebars.registerHelper('constantCase', str => {
  if (!str) return '';
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toUpperCase();
});

// "HRMS" → "hrms"
Handlebars.registerHelper('lowerCase', str => {
  if (!str) return '';
  return str.toLowerCase();
});

// Logical helpers used in {{#if (eq type 'text')}} style conditionals in .hbs templates
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('or', (a, b) => a || b);
Handlebars.registerHelper('and', (a, b) => a && b);

// Serializes arrays/objects for use in template output (e.g. defaultValues props)
Handlebars.registerHelper('json', context => JSON.stringify(context || []));

/**
 * Converts a field name to a DIGIT localization key.
 * BUG-017 fix: handles spaces and hyphens before camelCase conversion.
 *   "employee name"  → "HR_EMPLOYEE_NAME"
 *   "employee-type"  → "HR_EMPLOYEE_TYPE"
 *   "employeeName"   → "HR_EMPLOYEE_NAME"
 *
 * NOTE: Also registered in moduleGenerator.js and all 4 config generators.
 * All registrations must stay in sync.
 */
Handlebars.registerHelper('toLocalizationKey', function (fieldName, prefix) {
  if (!fieldName) return '';
  const finalPrefix = prefix || 'MODULE_';
  const constantCase = fieldName.replace(/[\s-]+/g, '_') // spaces/hyphens → underscore
  .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase → snake_case
  .toUpperCase();
  return `${finalPrefix}${constantCase}`;
});

/**
 * Compiles a Handlebars screen template and returns the React component source.
 *
 * @param {string} screenType - One of: create, search, view, inbox, response, custom
 * @param {Object} config     - Validated module config passed as template context
 * @returns {string|null}     - Compiled React component string, or null if template missing
 */
async function generateScreens(screenType, config) {
  const templatesDir = path.join(__dirname, '../../templates/screens');
  const templateFile = path.join(templatesDir, `${screenType}.hbs`);

  // Return null instead of throwing — lets the caller skip missing screen types gracefully
  if (!(await fs.pathExists(templateFile))) {
    console.warn(`Template not found for screen type: ${screenType}`);
    return null;
  }
  const templateContent = await fs.readFile(templateFile, 'utf8');

  // Compile the .hbs file and render with config as the template data context
  const compiled = Handlebars.compile(templateContent);
  return compiled({
    config
  });
}
module.exports = {
  generateScreens
};