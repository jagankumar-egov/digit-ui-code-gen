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
  const template = `const {{camelCase entity.name}}SearchConfig = () => {
  return {
    headerLabel: "{{toLocalizationKey 'SEARCH' i18n.prefix}}{{constantCase entity.name}}S",
    type: "search",
    actionLabel: "{{toLocalizationKey 'ADD' i18n.prefix}}{{constantCase entity.name}}",
    actionRole: "{{#if auth.roles}}{{auth.roles.[0]}}{{else}}EMPLOYEE{{/if}}",
    actionLink: "{{kebabCase module.code}}/create",
    apiDetails: {
      serviceName: "{{api.search}}",
      requestParam: {},
      requestBody: {
        apiOperation: "SEARCH",
        {{entity.name}}: {},
      },
      minParametersForSearchForm: {{#if screens.search.minSearchFields}}{{screens.search.minSearchFields}}{{else}}1{{/if}},
      masterName: "commonUiConfig",
      moduleName: "Search{{pascalCase entity.name}}Config",
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody.{{entity.name}}",
      searchFormJsonPath: "requestBody.{{entity.name}}",
    },
  sections: {
    search: {
      uiConfig: {
        headerStyle: null,
        formClassName: "custom-both-clear-search",
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
      children: {},
      show: true,
    },
    searchResult: {
      label: "",
      uiConfig: {
        columns: [
{{#each fields}}
{{#if showInResults}}
          {
            label: "{{toLocalizationKey name ../i18n.prefix}}",
            jsonPath: "{{name}}",
{{#if additionalCustomization}}
            additionalCustomization: true,
{{/if}}
          },
{{/if}}
{{/each}}
        ],
        enableGlobalSearch: false,
        enableColumnSort: true,
        resultsJsonPath: "{{entity.name}}",
      },
      children: {},
      show: true,
    },
  },
  additionalSections: {},
  };
};

export default {{camelCase entity.name}}SearchConfig;`;
  const compiled = Handlebars.compile(template);
  return compiled(config);
}
module.exports = {
  generateSearchConfig
};