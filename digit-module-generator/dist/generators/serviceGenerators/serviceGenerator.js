const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs-extra');

// Register Handlebars helpers
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
  return str.replace(/[A-Z]/g, letter => `_${letter}`).replace(/^_/, '').toUpperCase();
});

/**
 * Generate API service files for module
 * @param {Object} config - Module configuration
 * @param {string} outputDir - Output directory path
 */
async function generateServices(config, outputDir) {
  console.log('📡 Generating API services...');
  const servicesDir = path.join(outputDir, 'src', 'services');
  await fs.ensureDir(servicesDir);

  // Generate main service file
  const serviceContent = generateMainService(config);
  await fs.writeFile(path.join(servicesDir, `${config.entity.name}Service.js`), serviceContent);

  // Generate API endpoints file
  const endpointsContent = generateApiEndpoints(config);
  await fs.writeFile(path.join(servicesDir, 'apiEndpoints.js'), endpointsContent);
  console.log('✅ API services generated successfully');
}
function generateMainService(config) {
  const template = `/**
 * {{config.entity.name}} Service
 * Generated API service for {{config.module.name}}
 */

import { Request } from "@egovernments/digit-ui-libraries";

// API Endpoints
const API_ENDPOINTS = {
  CREATE: "{{config.api.create}}",
  UPDATE: "{{config.api.update}}",
  SEARCH: "{{config.api.search}}",
  VIEW: "{{config.api.view}}"
};

/**
 * Create {{config.entity.name}}
 * @param {Object} data - {{config.entity.name}} data
 * @param {Object} userInfo - Current user information
 * @param {string} tenantId - Tenant ID
 */
export const create{{config.entity.name}} = async (data, userInfo, tenantId) => {
  const requestBody = {
    {{config.entity.name}}: {
      ...data,
      tenantId,
      auditDetails: {
        createdBy: userInfo?.uuid,
        createdTime: Date.now(),
        lastModifiedBy: userInfo?.uuid,
        lastModifiedTime: Date.now()
      }
    }
  };

  const response = await Request({
    url: API_ENDPOINTS.CREATE,
    data: requestBody,
    useCache: false,
    userService: true,
    params: { tenantId }
  });

  return response;
};

/**
 * Update {{config.entity.name}}
 * @param {Object} data - Updated {{config.entity.name}} data
 * @param {Object} userInfo - Current user information
 * @param {string} tenantId - Tenant ID
 */
export const update{{config.entity.name}} = async (data, userInfo, tenantId) => {
  const requestBody = {
    {{config.entity.name}}: {
      ...data,
      tenantId,
      auditDetails: {
        ...data.auditDetails,
        lastModifiedBy: userInfo?.uuid,
        lastModifiedTime: Date.now()
      }
    }
  };

  const response = await Request({
    url: API_ENDPOINTS.UPDATE,
    data: requestBody,
    useCache: false,
    userService: true,
    params: { tenantId }
  });

  return response;
};

/**
 * Search {{config.entity.name}}s
 * @param {Object} searchCriteria - Search parameters
 * @param {string} tenantId - Tenant ID
 */
export const search{{config.entity.name}}s = async (searchCriteria, tenantId) => {
  const response = await Request({
    url: API_ENDPOINTS.SEARCH,
    data: {
      {{config.entity.name}}SearchCriteria: {
        ...searchCriteria,
        tenantId
      }
    },
    useCache: false,
    userService: true,
    params: { tenantId }
  });

  return response;
};

/**
 * Get {{config.entity.name}} by ID
 * @param {string} id - {{config.entity.name}} ID
 * @param {string} tenantId - Tenant ID
 */
export const get{{config.entity.name}}ById = async (id, tenantId) => {
  const response = await Request({
    url: API_ENDPOINTS.VIEW.replace('{id}', id),
    useCache: false,
    userService: true,
    params: { tenantId }
  });

  return response;
};

{{#if config.workflow.enabled}}
/**
 * Submit {{config.entity.name}} to workflow
 * @param {Object} workflowData - Workflow submission data
 * @param {string} tenantId - Tenant ID
 */
export const submitToWorkflow = async (workflowData, tenantId) => {
  const response = await Request({
    url: "/egov-workflow-v2/egov-wf/process/_transition",
    data: {
      ProcessInstances: [
        {
          ...workflowData,
          tenantId,
          businessService: "{{config.workflow.businessService}}"
        }
      ]
    },
    useCache: false,
    userService: true,
    params: { tenantId }
  });

  return response;
};
{{/if}}

// Export all service functions
export default {
  create{{config.entity.name}},
  update{{config.entity.name}},
  search{{config.entity.name}}s,
  get{{config.entity.name}}ById{{#if config.workflow.enabled}},
  submitToWorkflow{{/if}}
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