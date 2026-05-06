/**
 * serviceGenerator.js — API service layer generator
 *
 * Generates two files into src/services/:
 *
 *   {Entity}Service.js
 *     A service class with methods: create, update, search, getById.
 *     Each method calls Digit.CustomService with the appropriate endpoint.
 *     If config.workflow.enabled, a processWorkflow method is also generated.
 *     Transform functions are NOT inlined here — they are re-exported from
 *     utils/transformers.js to keep the service thin and the transforms reusable.
 *
 *   apiEndpoints.js
 *     A constants file exporting all API endpoint paths derived from config.api.*
 *     Centralising endpoints here avoids scattering hardcoded URLs across screens.
 *
 * Handlebars helpers are registered on the singleton here — same set as moduleGenerator.
 * They must stay in sync across all files that register helpers.
 */
const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs-extra');

// ─── Handlebars Helpers ───────────────────────────────────────────────────────
// Mirror of helpers in moduleGenerator.js — keep in sync.
Handlebars.registerHelper('pascalCase', str => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
});
Handlebars.registerHelper('camelCase', str => {
  if (!str) return '';
  const pascal = str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});
Handlebars.registerHelper('constantCase', str => {
  if (!str) return '';
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toUpperCase();
});

/**
 * Generate API service files for module
 * @param {Object} config - Module configuration
 * @param {string} outputDir - Output directory path
 */
async function generateServices(config, outputDir) {
  console.log('📡 Generating API hooks...');
  const hooksDir = path.join(outputDir, 'src', 'hooks');
  await fs.ensureDir(hooksDir);

  // Generate main hooks file
  const hooksContent = generateMainService(config);
  await fs.writeFile(path.join(hooksDir, `use${config.entity.name}.js`), hooksContent);

  // Also create a services directory for backwards compatibility
  const servicesDir = path.join(outputDir, 'src', 'services');
  await fs.ensureDir(servicesDir);

  // Generate API endpoints file
  const endpointsContent = generateApiEndpoints(config);
  await fs.writeFile(path.join(servicesDir, 'apiEndpoints.js'), endpointsContent);
  console.log('✅ API hooks generated successfully');
}
function generateMainService(config) {
  const template = `/**
 * {{config.entity.name}} Hooks
 * Generated API hooks for {{config.module.name}}
 * Uses DIGIT useCustomAPIHook and useCustomAPIMutationHook patterns
 */

import ENDPOINTS from "../services/apiEndpoints";

// API Request Configurations
export const {{camelCase config.entity.name}}RequestConfigs = {
  create: {
    url: ENDPOINTS.{{constantCase config.entity.name}}.CREATE,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  },

  update: {
    url: ENDPOINTS.{{constantCase config.entity.name}}.UPDATE,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  },

  search: {
    url: ENDPOINTS.{{constantCase config.entity.name}}.SEARCH,
    params: {},
    body: {},
    config: {
      enable: false,
      select: (data) => data?.{{config.entity.name}}s || [],
    },
  },

  view: {
    url: ENDPOINTS.{{constantCase config.entity.name}}.VIEW,
    params: {},
    body: {},
    config: {
      enable: false,
      select: (data) => data?.{{config.entity.name}}s?.[0] || {},
    },
  },

{{#if config.workflow.enabled}}
  workflow: {
    url: ENDPOINTS.COMMON.WORKFLOW,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  },
{{/if}}
};

/**
 * Hook for creating {{config.entity.name}}
 * @returns {Object} mutation object with mutate function
 */
export const useCreate{{config.entity.name}} = () => {
  return Digit.Hooks.useCustomAPIMutationHook({{camelCase config.entity.name}}RequestConfigs.create);
};

/**
 * Hook for updating {{config.entity.name}}
 * @returns {Object} mutation object with mutate function
 */
export const useUpdate{{config.entity.name}} = () => {
  return Digit.Hooks.useCustomAPIMutationHook({{camelCase config.entity.name}}RequestConfigs.update);
};

/**
 * Hook for searching {{config.entity.name}}s
 * @param {Object} searchCriteria - Search parameters
 * @param {string} tenantId - Tenant ID
 * @param {boolean} enabled - Whether to enable the query
 * @returns {Object} query result with data, isLoading, error, etc.
 */
export const useSearch{{config.entity.name}}s = (searchCriteria = {}, tenantId, enabled = true) => {
  const requestConfig = {
    ...{{camelCase config.entity.name}}RequestConfigs.search,
    params: { tenantId, ...searchCriteria },
    body: {
      {{config.entity.name}}SearchCriteria: {
        tenantId,
        ...searchCriteria
      }
    },
    config: {
      ...{{camelCase config.entity.name}}RequestConfigs.search.config,
      enable: enabled,
    },
  };
  
  return Digit.Hooks.useCustomAPIHook(requestConfig);
};

/**
 * Hook for getting {{config.entity.name}} by ID
 * @param {string} id - {{config.entity.name}} ID
 * @param {string} tenantId - Tenant ID
 * @param {boolean} enabled - Whether to enable the query
 * @returns {Object} query result with data, isLoading, error, etc.
 */
export const useGet{{config.entity.name}}ById = (id, tenantId, enabled = true) => {
  const requestConfig = {
    ...{{camelCase config.entity.name}}RequestConfigs.view,
    params: { tenantId, id },
    body: {
      {{config.entity.name}}SearchCriteria: {
        tenantId,
        id: [id]
      }
    },
    config: {
      ...{{camelCase config.entity.name}}RequestConfigs.view.config,
      enable: enabled && !!id,
    },
  };
  
  return Digit.Hooks.useCustomAPIHook(requestConfig);
};

{{#if config.workflow.enabled}}
/**
 * Hook for workflow transitions
 * @returns {Object} mutation object for workflow operations
 */
export const use{{config.entity.name}}Workflow = () => {
  return Digit.Hooks.useCustomAPIMutationHook({{camelCase config.entity.name}}RequestConfigs.workflow);
};
{{/if}}

// Re-export transforms from utils for backwards compatibility
// The actual transform logic lives in ../utils/transformers.js
export { transformCreateData as transformCreate{{config.entity.name}}Data, transformUpdateData as transformUpdate{{config.entity.name}}Data, transformSearchResponse as transformSearch{{config.entity.name}}Response, transformViewResponse as transformView{{config.entity.name}}Response } from '../utils/transformers';

// Export all hooks
export default {
  useCreate{{config.entity.name}},
  useUpdate{{config.entity.name}},
  useSearch{{config.entity.name}}s,
  useGet{{config.entity.name}}ById,
{{#if config.workflow.enabled}}
  use{{config.entity.name}}Workflow,
{{/if}}
  {{camelCase config.entity.name}}RequestConfigs
};`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
function generateApiEndpoints(config) {
  const template = `/**
 * API Endpoints Configuration
 * Generated for {{config.module.name}}
 */

const API_BASE = "{{config.entity.apiPath}}";

export const ENDPOINTS = {
  // {{config.entity.name}} Endpoints
  {{constantCase config.entity.name}}: {
    CREATE: "{{config.api.create}}",
    UPDATE: "{{config.api.update}}",
    SEARCH: "{{config.api.search}}",
    VIEW: "{{config.api.view}}",
    DELETE: "{{#if config.api.delete}}{{config.api.delete}}{{else}}/entity/_delete{{/if}}"
  },

  // Common Endpoints
  COMMON: {
    MDMS: "/egov-mdms-service/v1/_search",
    WORKFLOW: "/egov-workflow-v2/egov-wf/process/_transition",
    FILE_UPLOAD: "/filestore/v1/files",
    USER_SEARCH: "/user/v1/_search"
  },

  // Localization
  LOCALIZATION: {
    MESSAGES: "/localization/messages/v1/_search"
  }
};

export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(\`{\${key}}\`, params[key]);
  });
  
  return url;
};

export default ENDPOINTS;`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
module.exports = {
  generateServices
};