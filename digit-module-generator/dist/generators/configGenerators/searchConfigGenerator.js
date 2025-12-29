const Handlebars = require('handlebars');
function generateSearchConfig(config) {
  // Register helper to generate localization key
  Handlebars.registerHelper('toLocalizationKey', function (fieldName, prefix) {
    const finalPrefix = prefix || config.i18n?.prefix || 'MODULE_';
    // Convert camelCase to CONSTANT_CASE properly
    const constantCase = fieldName.replace(/([a-z])([A-Z])/g, '$1_$2') // Insert underscore before capitals
    .toUpperCase();
    return `${finalPrefix}${constantCase}`;
  });
  const template = `export const searchConfig = {
  headerLabel: "{{i18n.prefix}}SEARCH_HEADER",
  type: "search",
  actions: {
    actionLabel: "{{i18n.prefix}}CREATE_NEW",
    actionRoles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
    actionLink: "{{kebabCase module.code}}/create",
  },
  apiDetails: {
    serviceName: \`{{entity.apiPath}}{{api.search}}\`,
    requestParam: {},
    requestBody: {
      {{entity.name}}SearchCriteria: {},
    },
    minParametersForSearchForm: {{#if screens.search.minSearchFields}}{{screens.search.minSearchFields}}{{else}}0{{/if}},
    masterName: "commonUiConfig",
    moduleName: "{{entity.name}}SearchConfig",
    tableFormJsonPath: "requestBody.{{entity.name}}SearchCriteria",
    filterFormJsonPath: "requestBody.{{entity.name}}SearchCriteria.filters",
    searchFormJsonPath: "requestBody.{{entity.name}}SearchCriteria.search",
  },
  sections: {
    search: {
      uiConfig: {
        headerStyle: null,
        formClassName: "{{kebabCase entity.name}}-search-form",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: {{#if screens.search.minSearchFields}}{{screens.search.minSearchFields}}{{else}}1{{/if}},
        defaultValues: {
{{#each fields}}
{{#if searchable}}
          {{name}}: {{#if (eq type 'dropdown')}}""{{else if (eq type 'date')}}"" {{else}}""{{/if}},
{{/if}}
{{/each}}
        },
        fields: [
{{#each fields}}
{{#if searchable}}
          {
            label: "{{toLocalizationKey name ../i18n.prefix}}",
            type: "{{type}}",
            isMandatory: false,
            disable: false,
{{#if validation.pattern}}
            preProcess: {
              convertStringToRegEx: ["populators.validation.pattern"],
            },
{{/if}}
            populators: {
              name: "{{name}}",
{{#if validation}}
              validation: {
{{#if validation.pattern}}
                pattern: "{{validation.pattern}}",
{{/if}}
{{#if validation.minLength}}
                minlength: {{validation.minLength}},
{{/if}}
{{#if validation.maxLength}}
                maxlength: {{validation.maxLength}},
{{/if}}
              },
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
{{#if (eq type 'apidropdown')}}
              optionsKey: "name",
              allowMultiSelect: false,
              masterName: "commonUiConfig",
              moduleName: "{{../entity.name}}SearchConfig",
{{/if}}
            },
          },
{{/if}}
{{/each}}
        ],
      },
      label: "",
      show: true,
    },
    searchResult: {
      uiConfig: {
        columns: [
{{#each fields}}
{{#if showInResults}}
          {
            label: "{{toLocalizationKey name ../i18n.prefix}}",
            jsonPath: "{{resultPath}}{{name}}",
{{#if link}}
            link: true,
            buttonProps: {
              size: "medium",
              icon: "RemoveRedEyeIcon",
            }
{{else if additionalCustomization}}
            additionalCustomization: true,
{{/if}}
          },
{{/if}}
{{/each}}
          {
            label: "COMMON_ACTION",
            jsonPath: "{{entity.primaryKey}}",
            additionalCustomization: true,
            key: "actions",
          },
        ],
        enableGlobalSearch: true,
        enableColumnSort: true,
        resultsJsonPath: "{{entity.name}}s",
        defaultSortAsc: true,
      },
      show: true,
    },
  },
  footerProps: {
    showFooter: {{#if screens.search.showFooter}}true{{else}}false{{/if}},
{{#if auth.roles}}
    allowedRolesForFooter: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
{{/if}}
    actionFields: [
      {
        label: "{{i18n.prefix}}GO_BACK",
        icon: "ArrowBack",
        isSuffix: false,
        variation: "secondary",
        allowedRoles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
      },
      {
        label: "{{i18n.prefix}}CREATE_NEW",
        icon: "ArrowForward",
        isSuffix: true,
        variation: "primary",
        allowedRoles: [{{#each auth.roles}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
      },
    ],
    setactionFieldsToRight: true,
    className: "{{kebabCase entity.name}}-search-footer",
    style: {},
  },
};

export default searchConfig;`;
  const compiled = Handlebars.compile(template);
  return compiled(config);
}
module.exports = {
  generateSearchConfig
};