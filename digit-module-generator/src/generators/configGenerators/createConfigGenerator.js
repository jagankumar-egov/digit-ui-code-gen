const Handlebars = require('handlebars');

function generateCreateConfig(config) {
  // Register helper to generate localization key
  Handlebars.registerHelper('toLocalizationKey', function(fieldName, prefix) {
    const finalPrefix = prefix || config.i18n?.prefix || 'MODULE_';
    const constantCase = fieldName
      .replace(/[\s-]+/g, '_')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toUpperCase();
    return `${finalPrefix}${constantCase}`;
  });

  // Helper to convert to camelCase
  Handlebars.registerHelper('camelCase', function(str) {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  });

  const template = `export const {{camelCase entity.name}}CreateConfig = [
  {
    head: "{{i18n.prefix}}CREATE_TITLE",
    subHead: "{{i18n.prefix}}CREATE_SUBTITLE",
    body: [
{{#each fields}}
      {
{{#if inline}}
        inline: true,
{{/if}}
        label: "{{toLocalizationKey name ../i18n.prefix}}",
        isMandatory: {{#if required}}true{{else}}false{{/if}},
        type: "{{type}}",
        disable: false,
{{#if description}}
        description: "{{{description}}}",
{{/if}}
{{#if key}}
        key: "{{key}}",
{{/if}}
        populators: {
          name: "{{name}}",
          error: "{{toLocalizationKey name ../i18n.prefix}}_ERROR",
{{#if validation}}
          validation: {
{{#if validation.pattern}}
            pattern: {{#if (eq validation.pattern 'regex')}}{{validation.pattern}}{{else}}/{{validation.pattern}}/i{{/if}},
{{/if}}
{{#if validation.minLength}}
            minLength: {{validation.minLength}},
{{/if}}
{{#if validation.maxLength}}
            maxLength: {{validation.maxLength}},
{{/if}}
{{#if validation.min}}
            min: {{validation.min}},
{{/if}}
{{#if validation.max}}
            max: {{validation.max}},
{{/if}}
{{#if validation.step}}
            step: {{validation.step}},
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
              code: "{{{code}}}",
              name: "{{{name}}}",
            },
{{/each}}
          ],
{{/if}}
{{/if}}
{{#if (eq type 'radio')}}
          optionsKey: "name",
{{#if options}}
          options: [
{{#each options}}
            {
              code: "{{{code}}}",
              name: "{{{name}}}",
            },
{{/each}}
          ],
{{/if}}
{{/if}}
{{#if (eq type 'radioordropdown')}}
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
              code: "{{{code}}}",
              name: "{{{name}}}",
            },
{{/each}}
          ],
{{/if}}
{{/if}}
{{#if (eq type 'multiselectdropdown')}}
          optionsKey: "name",
          allowMultiSelect: true,
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
              code: "{{{code}}}",
              name: "{{{name}}}",
            },
{{/each}}
          ],
{{/if}}
{{/if}}
{{#if (eq type 'locationdropdown')}}
          type: "ward",
          optionsKey: "i18nKey",
          defaultText: "COMMON_SELECT_WARD",
          selectedText: "COMMON_SELECTED",
          allowMultiSelect: false,
{{/if}}
{{#if (eq type 'apidropdown')}}
          optionsKey: "{{#if apiConfig.optionKey}}{{{apiConfig.optionKey}}}{{else}}name{{/if}}",
          allowMultiSelect: false,
{{#if apiConfig}}
          url: "{{{apiConfig.url}}}",
          optionValue: "{{#if apiConfig.optionValue}}{{{apiConfig.optionValue}}}{{else}}code{{/if}}",
{{/if}}
{{/if}}
{{#if (eq type 'component')}}
{{#if component}}
          component: "{{{component}}}",
{{/if}}
{{/if}}
{{#if (eq type 'checkbox')}}
          defaultValue: false,
{{/if}}
{{#if (eq type 'toggle')}}
          defaultValue: false,
{{/if}}
{{#if (eq type 'amount')}}
          prefix: "₹ ",
{{#if validation.step}}
          step: "{{validation.step}}",
{{/if}}
{{/if}}
{{#if (eq type 'mobileNumber')}}
{{#unless validation}}
          validation: {
            min: 1000000000,
            max: 9999999999
          },
{{/unless}}
{{/if}}
        },
{{#if preProcess}}
        preProcess: {
{{#each preProcess}}
          "{{@key}}": [
{{#each this}}
            "{{this}}",
{{/each}}
          ],
{{/each}}
        },
{{/if}}
      },
{{/each}}
    ],
  },
{{#if additionalSections}}
{{#each additionalSections}}
  {
    head: "{{head}}",
{{#if subHead}}
    subHead: "{{subHead}}",
{{/if}}
    body: [
{{#each body}}
      {
        label: "{{label}}",
        isMandatory: {{#if required}}true{{else}}false{{/if}},
        type: "{{type}}",
        disable: false,
{{#if description}}
        description: "{{{description}}}",
{{/if}}
        key: "{{key}}",
        populators: {
          name: "{{name}}",
          error: "{{error}}",
{{#if validation}}
          validation: {
{{#each validation}}
            {{@key}}: {{#if (eq @key 'pattern')}}{{this}}{{else}}{{this}}{{/if}},
{{/each}}
          },
{{/if}}
        },
      },
{{/each}}
    ],
  },
{{/each}}
{{/if}}
];

export default {{camelCase entity.name}}CreateConfig;`;

  const compiled = Handlebars.compile(template);
  return compiled(config);
}

module.exports = { generateCreateConfig };