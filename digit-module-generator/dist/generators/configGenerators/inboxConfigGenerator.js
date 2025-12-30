const Handlebars = require('handlebars');
function generateInboxConfig(config) {
  // Register helper to generate localization key
  Handlebars.registerHelper('toLocalizationKey', function (fieldName, prefix) {
    const finalPrefix = prefix || config.i18n?.prefix || 'MODULE_';
    // Convert camelCase to CONSTANT_CASE properly
    const constantCase = fieldName.replace(/([a-z])([A-Z])/g, '$1_$2') // Insert underscore before capitals
    .toUpperCase();
    return `${finalPrefix}${constantCase}`;
  });
  const template = `const {{camelCase entity.name}}InboxConfig = () => {
  return {
    label: "{{i18n.prefix}}INBOX_HEADER",
    postProcessResult: true,
    type: "inbox",
    apiDetails: {
      serviceName: "/inbox/v2/_search",
      requestParam: {},
      requestBody: {
        inbox: {
          processSearchCriteria: {
            businessService: ["{{#if workflow.businessService}}{{workflow.businessService}}{{else}}{{kebabCase entity.name}}-approval{{/if}}"],
            moduleName: "{{kebabCase module.code}}",
          },
          moduleSearchCriteria: {},
        },
      },
      minParametersForSearchForm: 0,
      minParametersForFilterForm: 0,
      masterName: "commonUiConfig",
      moduleName: "{{entity.name}}InboxConfig",
      tableFormJsonPath: "requestBody.inbox",
      filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
      searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    },
    sections: {
      search: {
        uiConfig: {
          headerStyle: null,
          primaryLabel: "ES_COMMON_SEARCH",
          secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
          minReqFields: 1,
          defaultValues: {
{{#each fields}}
{{#if inboxSearchable}}
            {{name}}: "",
{{/if}}
{{/each}}
          },
          fields: [
{{#each fields}}
{{#if inboxSearchable}}
            {
              label: "{{toLocalizationKey name ../i18n.prefix}}",
              type: "{{#if (eq type 'dropdown')}}apidropdown{{else}}{{type}}{{/if}}",
              isMandatory: false,
              disable: false,
{{#if validation.pattern}}
              preProcess: {
                convertStringToRegEx: ["populators.validation.pattern"],
              },
{{/if}}
              populators: {
                name: "{{name}}",
{{#if (eq type 'text')}}
                error: "{{i18n.prefix}}PATTERN_ERR_MSG",
{{#if validation}}
                validation: {
{{#if validation.pattern}}
                  pattern: "{{validation.pattern}}",
{{/if}}
{{#if validation.minLength}}
                  minlength: {{validation.minLength}},
{{/if}}
                },
{{/if}}
{{/if}}
{{#if (eq type 'dropdown')}}
                optionsKey: "name",
                allowMultiSelect: false,
                masterName: "commonUiConfig",
                moduleName: "{{../entity.name}}InboxConfig",
                customfn: "populateReqCriteria",
{{/if}}
              },
            },
{{/if}}
{{/each}}
          ],
        },
        label: "",
        children: {},
        show: true,
      },
      links: {
        uiConfig: {
          links: [
            {
              text: "{{i18n.prefix}}SEARCH_{{constantCase entity.name}}",
              url: "/employee/{{kebabCase module.code}}/search",
              roles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
            },
{{#if screens.create.enabled}}
            {
              text: "{{i18n.prefix}}CREATE_{{constantCase entity.name}}",
              url: "/employee/{{kebabCase module.code}}/create",
              roles: [{{#each screens.create.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
            },
{{/if}}
          ],
          label: "{{i18n.prefix}}MODULE_LABEL",
          logoIcon: {
            component: "{{entity.name}}Icon",
            customClass: "inbox-icon--{{kebabCase entity.name}}",
          },
        },
        children: {},
        show: true,
      },
      filter: {
        uiConfig: {
          type: "filter",
          headerStyle: null,
          primaryLabel: "Filter",
          secondaryLabel: "",
          minReqFields: 1,
          defaultValues: {
{{#if workflow.enabled}}
            assignee: {
              code: "ASSIGNED_TO_ALL",
              name: "{{i18n.prefix}}INBOX_ASSIGNED_TO_ALL",
            },
            state: "",
{{/if}}
{{#each fields}}
{{#if filterable}}
            {{name}}: {{#if (eq type 'multiselect')}}[]{{else}}""{{/if}},
{{/if}}
{{/each}}
          },
          fields: [
{{#if workflow.enabled}}
            {
              label: "",
              type: "radio",
              isMandatory: false,
              disable: false,
              populators: {
                name: "assignee",
                options: [
                  {
                    code: "ASSIGNED_TO_ME",
                    name: "{{i18n.prefix}}INBOX_ASSIGNED_TO_ME",
                  },
                  {
                    code: "ASSIGNED_TO_ALL",
                    name: "{{i18n.prefix}}INBOX_ASSIGNED_TO_ALL",
                  },
                ],
                optionsKey: "name",
                styles: {
                  gap: "1rem",
                  flexDirection: "column",
                },
                innerStyles: {
                  display: "flex",
                },
              },
            },
            {
              label: "COMMON_WORKFLOW_STATES",
              type: "workflowstatesfilter",
              isMandatory: false,
              disable: false,
              populators: {
                name: "state",
                labelPrefix: "WF_{{constantCase entity.name}}_",
                businessService: "{{#if workflow.businessService}}{{workflow.businessService}}{{else}}{{kebabCase entity.name}}-approval{{/if}}",
              },
            },
{{/if}}
{{#each fields}}
{{#if filterable}}
            {
              label: "{{toLocalizationKey name ../i18n.prefix}}",
              type: "{{type}}",
              isMandatory: false,
              disable: false,
              populators: {
                name: "{{name}}",
{{#if (eq type 'locationdropdown')}}
                type: "{{locationtype}}",
                optionsKey: "i18nKey",
                defaultText: "COMMON_SELECT_{{constantCase locationtype}}",
                selectedText: "COMMON_SELECTED",
                allowMultiSelect: {{#if multiSelect}}true{{else}}false{{/if}},
{{/if}}
{{#if (eq type 'dropdown')}}
                optionsKey: "name",
{{#if mdms}}
                mdmsConfig: {
                  masterName: "{{mdms.masterName}}",
                  moduleName: "{{mdms.moduleName}}",
                  localePrefix: "{{mdms.localePrefix}}",
                },
{{/if}}
{{#if options}}
                options: [
{{#each options}}
                  {
                    code: "{{code}}",
                    name: "{{name}}",
                  },
{{/each}}
                ],
{{/if}}
{{/if}}
              },
            },
{{/if}}
{{/each}}
          ],
        },
        label: "ES_COMMON_FILTERS",
        show: true,
      },
      searchResult: {
        label: "",
        uiConfig: {
          columns: [
{{#each fields}}
{{#if showInInboxResults}}
            {
              label: "{{toLocalizationKey name ../i18n.prefix}}",
              jsonPath: "businessObject.{{name}}",
{{#if additionalCustomization}}
              additionalCustomization: true,
{{/if}}
            },
{{/if}}
{{/each}}
{{#if workflow.enabled}}
            {
              label: "COMMON_ASSIGNEE",
              jsonPath: "ProcessInstance.assignes[0].name",
              key: "assignee",
            },
            {
              label: "COMMON_WORKFLOW_STATES",
              jsonPath: "ProcessInstance.state.state",
              additionalCustomization: true,
              key: "state",
            },
            {
              label: "{{i18n.prefix}}SLA",
              jsonPath: "businessObject.serviceSla",
              additionalCustomization: true,
            },
{{/if}}
          ],
          enableGlobalSearch: false,
          enableColumnSort: true,
          resultsJsonPath: "items",
        },
        children: {},
        show: true,
      },
    },
    additionalSections: {},
  };
};

export default {{camelCase entity.name}}InboxConfig;`;
  const compiled = Handlebars.compile(template);
  return compiled(config);
}
module.exports = {
  generateInboxConfig
};