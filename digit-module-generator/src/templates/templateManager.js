/**
 * templateManager.js — Pre-built template management
 *
 * Manages the 4 pre-built domain templates shipped with digit-gen:
 *   hrms         - Human Resource Management System
 *   inventory    - Inventory / stock management
 *   project-mgmt - Project management
 *   showcase     - All 22 field types demo (used for testing)
 *
 * Each template lives in templates/{name}/template.json.
 * The template.json is a complete module config that is loaded as-is
 * and passed to generateFromConfig — no merging or defaults needed.
 *
 * Templates provide a quick bootstrap: instead of writing a config from scratch,
 * teams start from a domain template and customize fields/screens as needed.
 */
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

// Template author — shown in template listings
const AUTHOR = 'JaganKumar <jagan.kumar@egov.org.in>';

/**
 * Loads and returns the config from a named template's template.json.
 * Throws if the template directory or config file does not exist.
 *
 * @param {string} templateName - Template directory name (e.g. "hrms")
 * @returns {Object} Parsed template config ready for generateFromConfig
 */
async function getTemplateConfig(templateName) {
  const templateDir = path.join(TEMPLATES_DIR, templateName);
  const configFile = path.join(templateDir, 'template.json');
  
  if (!(await fs.pathExists(configFile))) {
    throw new Error(`Template "${templateName}" not found`);
  }
  
  const templateData = await fs.readJson(configFile);
  return templateData.config;
}

async function listAvailableTemplates(detailed = false) {
  if (!(await fs.pathExists(TEMPLATES_DIR))) {
    return [];
  }
  
  const templateDirs = await fs.readdir(TEMPLATES_DIR);
  const templates = [];
  
  for (const dir of templateDirs) {
    const templateDir = path.join(TEMPLATES_DIR, dir);
    const configFile = path.join(templateDir, 'template.json');
    
    if (await fs.pathExists(configFile)) {
      const templateData = await fs.readJson(configFile);
      
      if (detailed) {
        templates.push({
          name: dir,
          displayName: templateData.name,
          description: templateData.description,
          version: templateData.version,
          category: templateData.category,
          author: templateData.author
        });
      } else {
        templates.push({
          name: dir,
          description: templateData.description
        });
      }
    }
  }
  
  return templates;
}

async function validateTemplate(templateName) {
  const templateDir = path.join(TEMPLATES_DIR, templateName);
  const configFile = path.join(templateDir, 'template.json');
  
  if (!(await fs.pathExists(configFile))) {
    return {
      valid: false,
      errors: [`Template configuration file not found: ${configFile}`]
    };
  }
  
  try {
    const templateData = await fs.readJson(configFile);
    const errors = [];
    
    // Validate required fields
    if (!templateData.name) errors.push('Template name is required');
    if (!templateData.description) errors.push('Template description is required');
    if (!templateData.config) errors.push('Template config is required');
    
    // Validate config structure
    if (templateData.config) {
      if (!templateData.config.module) errors.push('Module configuration is required');
      if (!templateData.config.entity) errors.push('Entity configuration is required');
      if (!templateData.config.screens) errors.push('Screens configuration is required');
      if (!templateData.config.fields || !Array.isArray(templateData.config.fields)) {
        errors.push('Fields configuration is required and must be an array');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [`Invalid JSON in template configuration: ${error.message}`]
    };
  }
}

async function createCustomTemplate(templateName, config) {
  const templateDir = path.join(TEMPLATES_DIR, templateName);
  await fs.ensureDir(templateDir);
  
  const templateData = {
    name: config.displayName || templateName,
    description: config.description || 'Custom template',
    version: '1.0.0',
    author: config.author || AUTHOR,
    category: config.category || 'custom',
    config: config
  };
  
  const configFile = path.join(templateDir, 'template.json');
  await fs.writeJson(configFile, templateData, { spaces: 2 });
  
  return templateDir;
}

module.exports = {
  getTemplateConfig,
  listAvailableTemplates,
  validateTemplate,
  createCustomTemplate,
  TEMPLATES_DIR
};