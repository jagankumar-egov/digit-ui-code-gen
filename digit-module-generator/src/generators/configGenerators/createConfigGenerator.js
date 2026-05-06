/**
 * Create Config Generator
 *
 * Generates {Entity}CreateConfig.js — the FormComposer field schema for the create screen.
 * FormComposer reads this config to render labeled fields, validation rules, and populators.
 *
 * Output structure:
 *   export const {camelEntity}CreateConfig = [
 *     { head, subHead, body: [ ...fieldDefinitions ] },
 *     ...additionalSections
 *   ]
 *
 * Each field definition includes:
 *   label, isMandatory, key, type, populators (component-specific options/API config)
 *
 * BUG-012: option label/description values use triple-stash {{{...}}} to prevent
 *   Handlebars HTML-encoding &, <, > characters in option names.
 * BUG-011: mobileNumber's default validation block is wrapped in {{#unless validation}}
 *   so it isn't duplicated when the config already provides a validation object.
 */
const Handlebars = require('handlebars');

/**
 * Generates the source code for {Entity}CreateConfig.js.
 *
 * @param {Object} config - Validated module config
 * @returns {string} ES module source code as a string
 */
function generateCreateConfig(config) {
  // toLocalizationKey is registered on the Handlebars singleton so the template can call it.
  // Closes over config.i18n.prefix as a fallback when no explicit prefix arg is passed.
  Handlebars.registerHelper("toLocalizationKey", function (fieldName, prefix) {
    const finalPrefix = prefix || config.i18n?.prefix || "MODULE_";
    const constantCase = fieldName
      .replace(/[\s-]+/g, "_")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toUpperCase();
    return `${finalPrefix}${constantCase}`;
  });

  // Helper to convert to camelCase
  Handlebars.registerHelper("camelCase", function (str) {
    if (!str) return "";
    return str.charAt(0).toLowerCase() + str.slice(1);
  });

  Handlebars.registerHelper("addAnchors", function (pattern) {
    if (!pattern) return "";

    // If already has anchors, return as is
    if (pattern.startsWith("^") && pattern.endsWith("$")) {
      return pattern;
    }

    return `^${pattern}$`;
  });

  // Filter out fields that are only for filtering (not in any create section)
  const createSections = config.screens?.create?.sections;
  let sectionFieldNames = null;
  if (createSections && Array.isArray(createSections)) {
    sectionFieldNames = new Set();
    createSections.forEach((s) => {
      if (s.fields) s.fields.forEach((f) => sectionFieldNames.add(f));
    });
  }

  // Filter fields: exclude filterable-only fields not assigned to any create section
  if (sectionFieldNames) {
    config.fields = config.fields.filter((f) => sectionFieldNames.has(f.name));
  }

  // Build sections array for the template
  if (createSections && Array.isArray(createSections)) {
    const fieldMap = {};
    config.fields.forEach((f) => {
      fieldMap[f.name] = f;
    });
    config._sections = createSections.map((s) => ({
      head: s.i18nKey || s.head,
      fields: (s.fields || []).map((name) => fieldMap[name]).filter(Boolean),
    }));
  }

  const template = `export const {{camelCase entity.name}}CreateConfig = [
{{#if _sections}}
{{#each _sections}}
  {
    head: "{{{head}}}",
    body: [
{{#each fields}}
      {
{{#if inline}}
        inline: true,
{{/if}}
        label: "{{toLocalizationKey name ../../i18n.prefix}}",
        isMandatory: {{#if required}}true{{else}}false{{/if}},
        type: "{{#if (eq type 'multiselectdropdown')}}dropdown{{else}}{{type}}{{/if}}",
        disable: false,
{{#if description}}
        description: "{{{description}}}",
{{/if}}
        key: "{{#if key}}{{key}}{{else}}{{name}}{{/if}}",
        populators: {
          name: "{{name}}",
          error: "{{toLocalizationKey name ../../i18n.prefix}}_ERROR",
          required: {{#if required}}true{{else}}false{{/if}},
{{#if validation}}
          validation: {
{{#if validation.pattern}}
            pattern: "{{{addAnchors validation.pattern}}}",
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
            { code: "{{{code}}}", name: "{{{name}}}" },
{{/each}}
          ],
{{/if}}
{{/if}}
{{#if (eq type 'radio')}}
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
            { code: "{{{code}}}", name: "{{{name}}}" },
{{/each}}
          ],
{{/if}}
{{/if}}
{{#if (eq type 'multiselectdropdown')}}
          optionsKey: "name",
          allowMultiselect: true,
          isDropdownWithChip: true,
          chipsKey: "name",
          isSearchable: true,
          addSelectAllCheck: true,
          disablePortal: true,
{{#if mdms}}
          mdmsConfig: {
            masterName: "{{mdms.masterName}}",
            moduleName: "{{mdms.moduleName}}",
            localePrefix: "{{mdms.localePrefix}}",
          },
{{/if}}
{{/if}}
{{#if (eq type 'password')}}
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
      },
{{/each}}
    ],
  },
{{/each}}
{{else}}
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
        type: "{{#if (eq type 'multiselectdropdown')}}dropdown{{else}}{{type}}{{/if}}",
        disable: false,
{{#if description}}
        description: "{{{description}}}",
{{/if}}
        key: "{{#if key}}{{key}}{{else}}{{name}}{{/if}}",
        populators: {
          name: "{{name}}",
          error: "{{toLocalizationKey name ../i18n.prefix}}_ERROR",
          required: {{#if required}}true{{else}}false{{/if}},
{{#if validation}}
          validation: {
{{#if validation.pattern}}
            pattern: "{{{addAnchors validation.pattern}}}",
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
          allowMultiselect: true,
          isDropdownWithChip: true,
          chipsKey: "name",
          isSearchable: true,
          addSelectAllCheck: true,
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
          allowMultiselect: false,
{{/if}}
{{#if (eq type 'apidropdown')}}
          optionsKey: "{{#if apiConfig.optionKey}}{{{apiConfig.optionKey}}}{{else}}name{{/if}}",
          allowMultiselect: false,
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
        type: "{{#if (eq type 'multiselectdropdown')}}dropdown{{else}}{{type}}{{/if}}",
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
{{/if}}
];

export default {{camelCase entity.name}}CreateConfig;`;

  const compiled = Handlebars.compile(template);
  return compiled(config);
}

module.exports = { generateCreateConfig };