/**
 * View Config Generator
 *
 * Generates {Entity}ViewConfig.js — the config for the read-only view/detail screen.
 * The view screen uses DIGIT's KeyValuePair component to display entity field values.
 *
 * Only fields with `showInView: true` appear in the view config.
 * The config includes the API endpoint (entity.apiPath + api.view) and the
 * primaryKey used to fetch the entity by ID from the URL param.
 *
 * If config.workflow.enabled is true, a workflow timeline section is also included
 * to show the approval history below the entity details.
 */
const Handlebars = require('handlebars');

/**
 * Generates the source code for {Entity}ViewConfig.js.
 *
 * @param {Object} config - Validated module config
 * @returns {string} ES module source code as a string
 */
function generateViewConfig(config) {
  // Registered on the Handlebars singleton — same helper as all other config generators
  Handlebars.registerHelper('toLocalizationKey', function (fieldName, prefix) {
    const finalPrefix = prefix || config.i18n?.prefix || 'MODULE_';
    const constantCase = fieldName.replace(/[\s-]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
    return `${finalPrefix}${constantCase}`;
  });
  const template = `export const viewConfig = {
  headerLabel: "{{i18n.prefix}}VIEW_HEADER",
  type: "view",
  apiDetails: {
    serviceName: \`{{entity.apiPath}}{{api.view}}\`,
    requestParam: {
      {{entity.primaryKey}}: "PLACEHOLDER_ID",
    },
    requestBody: {},
    masterName: "commonUiConfig",
    moduleName: "{{entity.name}}ViewConfig",
    responseJsonPath: "{{entity.name}}s[0]",
  },
  sections: {
{{#each screens.view.sections}}
    {{this}}: {
      uiConfig: {
        label: "{{i18n.prefix}}{{constantCase this}}_SECTION",
        fields: [
{{#each ../fields}}
{{#if (or (eq ../this 'basic') showInView)}}
          {
            label: "{{toLocalizationKey name ../../../i18n.prefix}}",
            jsonPath: "{{name}}",
{{#if (eq type 'dropdown')}}
            additionalCustomization: true,
            transform: {
              code: "{{name}}.code",
              name: "{{name}}.name",
            },
{{/if}}
{{#if (eq type 'date')}}
            transform: {
              format: "DD/MM/YYYY",
            },
{{/if}}
{{#if (eq type 'amount')}}
            transform: {
              prefix: "₹ ",
              format: "currency",
            },
{{/if}}
          },
{{/if}}
{{/each}}
        ],
      },
      show: true,
    },
{{/each}}
{{#if workflow.enabled}}
    workflow: {
      uiConfig: {
        label: "{{i18n.prefix}}WORKFLOW_SECTION",
        isWorkflowComponent: true,
        businessService: "{{#if workflow.businessService}}{{workflow.businessService}}{{else}}{{kebabCase entity.name}}-approval{{/if}}",
        workflowJsonPath: "ProcessInstance",
      },
      show: true,
    },
{{/if}}
{{#if documents.enabled}}
    documents: {
      uiConfig: {
        label: "{{i18n.prefix}}DOCUMENTS_SECTION",
        isDocumentComponent: true,
        documentsJsonPath: "documents",
        allowedFileTypes: ["PDF", "DOC", "DOCX", "JPG", "JPEG", "PNG"],
        maxFileSize: 5,
      },
      show: true,
    },
{{/if}}
  },
  actionProps: {
    actions: [
{{#if screens.create.enabled}}
      {
        label: "{{i18n.prefix}}EDIT",
        variation: "secondary",
        icon: "Edit",
        roles: [{{#each screens.create.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
        redirectionUrl: {
          pathname: "/employee/{{kebabCase module.code}}/edit",
          state: {},
        },
      },
{{/if}}
{{#if workflow.enabled}}
      {
        label: "{{i18n.prefix}}TAKE_ACTION",
        variation: "primary",
        icon: "CheckCircle",
        roles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
        redirectionUrl: {
          pathname: "/employee/{{kebabCase module.code}}/action",
          state: {},
        },
      },
{{/if}}
    ],
    actionKey: "{{entity.primaryKey}}",
    menuActions: [
      {
        label: "{{i18n.prefix}}DOWNLOAD_PDF",
        icon: "GetApp",
        roles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
        action: "download",
      },
      {
        label: "{{i18n.prefix}}PRINT",
        icon: "Print",
        roles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
        action: "print",
      },
    ],
  },
  footerProps: {
    showFooter: true,
    allowedRolesForFooter: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
    actionFields: [
      {
        label: "{{i18n.prefix}}GO_BACK",
        icon: "ArrowBack",
        isSuffix: false,
        variation: "secondary",
        allowedRoles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
        redirectionUrl: {
          pathname: "/employee/{{kebabCase module.code}}/search",
          state: {},
        },
      },
{{#if screens.create.enabled}}
      {
        label: "{{i18n.prefix}}CREATE_NEW",
        icon: "Add",
        isSuffix: true,
        variation: "primary",
        allowedRoles: [{{#each screens.create.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
        redirectionUrl: {
          pathname: "/employee/{{kebabCase module.code}}/create",
          state: {},
        },
      },
{{/if}}
    ],
    setactionFieldsToRight: true,
    className: "{{kebabCase entity.name}}-view-footer",
    style: {},
  },
};

export default viewConfig;`;
  const compiled = Handlebars.compile(template);
  return compiled(config);
}
module.exports = {
  generateViewConfig
};