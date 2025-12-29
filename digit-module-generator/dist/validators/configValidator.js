const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Create AJV instance with formats support
const ajv = new Ajv({
  allErrors: true
});
addFormats(ajv);

// Configuration schema
const moduleConfigSchema = {
  type: 'object',
  properties: {
    module: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1
        },
        code: {
          type: 'string',
          pattern: '^[a-z0-9-]+$',
          minLength: 1
        },
        description: {
          type: 'string',
          minLength: 1
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$'
        }
      },
      required: ['name', 'code', 'description'],
      additionalProperties: false
    },
    entity: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          pattern: '^[A-Z][a-zA-Z0-9]*$',
          minLength: 1
        },
        apiPath: {
          type: 'string',
          pattern: '^/.*',
          minLength: 1
        },
        primaryKey: {
          type: 'string',
          minLength: 1
        },
        displayField: {
          type: 'string',
          minLength: 1
        }
      },
      required: ['name', 'apiPath', 'primaryKey', 'displayField'],
      additionalProperties: false
    },
    screens: {
      type: 'object',
      properties: {
        create: {
          $ref: '#/definitions/screenConfig'
        },
        search: {
          $ref: '#/definitions/screenConfig'
        },
        inbox: {
          $ref: '#/definitions/screenConfig'
        },
        view: {
          $ref: '#/definitions/screenConfig'
        },
        response: {
          $ref: '#/definitions/screenConfig'
        }
      },
      additionalProperties: false,
      minProperties: 1
    },
    fields: {
      type: 'array',
      items: {
        $ref: '#/definitions/fieldConfig'
      },
      minItems: 1
    },
    api: {
      type: 'object',
      properties: {
        create: {
          type: 'string',
          pattern: '^/.*'
        },
        update: {
          type: 'string',
          pattern: '^/.*'
        },
        search: {
          type: 'string',
          pattern: '^/.*'
        },
        view: {
          type: 'string',
          pattern: '^/.*'
        },
        workflow: {
          type: 'string',
          pattern: '^/.*'
        }
      },
      additionalProperties: true
    },
    auth: {
      type: 'object',
      properties: {
        required: {
          type: 'boolean'
        },
        roles: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 1
          },
          minItems: 1
        }
      },
      required: ['required'],
      additionalProperties: false
    },
    workflow: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean'
        },
        businessService: {
          type: 'string',
          minLength: 1
        }
      },
      required: ['enabled'],
      additionalProperties: false
    },
    i18n: {
      type: 'object',
      properties: {
        prefix: {
          type: 'string',
          pattern: '^[A-Z_]+_$'
        },
        generateKeys: {
          type: 'boolean'
        }
      },
      additionalProperties: false
    }
  },
  required: ['module', 'entity', 'screens', 'fields'],
  additionalProperties: true,
  definitions: {
    screenConfig: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean'
        },
        roles: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 1
          }
        }
      },
      required: ['enabled'],
      additionalProperties: true
    },
    fieldConfig: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          pattern: '^[a-zA-Z][a-zA-Z0-9]*$',
          minLength: 1
        },
        type: {
          type: 'string',
          enum: ['text', 'number', 'date', 'datetime', 'email', 'url', 'password', 'textarea', 'dropdown', 'radio', 'checkbox', 'multiselect', 'radioordropdown', 'mobileNumber', 'amount', 'locationdropdown', 'apidropdown', 'file', 'component']
        },
        label: {
          type: 'string',
          minLength: 1
        },
        required: {
          type: 'boolean'
        },
        searchable: {
          type: 'boolean'
        },
        filterable: {
          type: 'boolean'
        },
        showInResults: {
          type: 'boolean'
        },
        showInView: {
          type: 'boolean'
        },
        showInInboxResults: {
          type: 'boolean'
        },
        inboxSearchable: {
          type: 'boolean'
        },
        description: {
          type: 'string'
        },
        key: {
          type: 'string'
        },
        inline: {
          type: 'boolean'
        },
        validation: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string'
            },
            minLength: {
              type: 'number',
              minimum: 0
            },
            maxLength: {
              type: 'number',
              minimum: 1
            },
            min: {
              type: 'number'
            },
            max: {
              type: 'number'
            },
            step: {
              type: 'number',
              minimum: 0
            }
          },
          additionalProperties: false
        },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                minLength: 1
              },
              name: {
                type: 'string',
                minLength: 1
              }
            },
            required: ['code', 'name'],
            additionalProperties: false
          }
        },
        mdms: {
          type: 'object',
          properties: {
            masterName: {
              type: 'string',
              minLength: 1
            },
            moduleName: {
              type: 'string',
              minLength: 1
            },
            localePrefix: {
              type: 'string'
            }
          },
          required: ['masterName', 'moduleName'],
          additionalProperties: false
        }
      },
      required: ['name', 'type', 'label', 'required'],
      additionalProperties: true
    }
  }
};

// Compile schema
const validateConfig = ajv.compile(moduleConfigSchema);
function validateModuleConfig(config) {
  const valid = validateConfig(config);
  if (!valid) {
    const errors = validateConfig.errors.map(error => {
      const path = error.instancePath || 'root';
      return `${path}: ${error.message}`;
    });
    return {
      valid: false,
      errors: errors
    };
  }

  // Additional business logic validations
  const businessErrors = validateBusinessLogic(config);
  return {
    valid: businessErrors.length === 0,
    errors: businessErrors
  };
}
function validateBusinessLogic(config) {
  const errors = [];

  // Check if workflow is enabled but no business service specified
  if (config.workflow?.enabled && !config.workflow.businessService) {
    errors.push('workflow.businessService is required when workflow is enabled');
  }

  // Check if inbox is enabled but workflow is disabled
  if (config.screens?.inbox?.enabled && !config.workflow?.enabled) {
    errors.push('Workflow must be enabled to use inbox screen');
  }

  // Validate field configurations
  if (config.fields) {
    config.fields.forEach((field, index) => {
      // Check dropdown fields have options or MDMS config
      if (['dropdown', 'radio', 'multiselect'].includes(field.type)) {
        if (!field.options && !field.mdms) {
          errors.push(`fields[${index}].${field.name}: dropdown/radio/multiselect fields must have either options or mdms configuration`);
        }
      }

      // Check validation consistency
      if (field.validation) {
        if (field.validation.min !== undefined && field.validation.max !== undefined) {
          if (field.validation.min > field.validation.max) {
            errors.push(`fields[${index}].${field.name}: validation.min cannot be greater than validation.max`);
          }
        }
        if (field.validation.minLength !== undefined && field.validation.maxLength !== undefined) {
          if (field.validation.minLength > field.validation.maxLength) {
            errors.push(`fields[${index}].${field.name}: validation.minLength cannot be greater than validation.maxLength`);
          }
        }
      }

      // Check amount field has proper validation
      if (field.type === 'amount' && field.validation) {
        if (field.validation.min === undefined) {
          errors.push(`fields[${index}].${field.name}: amount fields should have validation.min defined`);
        }
      }

      // Check mobile number field has proper validation
      if (field.type === 'mobileNumber' && field.validation) {
        if (!field.validation.min || !field.validation.max) {
          errors.push(`fields[${index}].${field.name}: mobileNumber fields should have both validation.min and validation.max defined`);
        }
      }
    });

    // Check for duplicate field names
    const fieldNames = config.fields.map(f => f.name);
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate field names found: ${duplicates.join(', ')}`);
    }
  }

  // Validate screen configurations
  if (config.screens) {
    Object.entries(config.screens).forEach(([screenName, screenConfig]) => {
      if (screenConfig.enabled && screenConfig.roles) {
        if (!Array.isArray(screenConfig.roles) || screenConfig.roles.length === 0) {
          errors.push(`screens.${screenName}.roles: must be a non-empty array when screen is enabled`);
        }
      }
    });
  }

  // Validate API paths
  if (config.api) {
    Object.entries(config.api).forEach(([operation, path]) => {
      if (typeof path === 'string' && !path.startsWith('/')) {
        errors.push(`api.${operation}: API paths must start with '/'`);
      }
    });
  }

  // Check auth configuration
  if (config.auth?.required && (!config.auth.roles || config.auth.roles.length === 0)) {
    errors.push('auth.roles: must be defined when authentication is required');
  }

  // Validate i18n prefix format
  if (config.i18n?.prefix) {
    if (!config.i18n.prefix.endsWith('_')) {
      errors.push('i18n.prefix: must end with underscore (_)');
    }
    if (!/^[A-Z_]+_$/.test(config.i18n.prefix)) {
      errors.push('i18n.prefix: must contain only uppercase letters and underscores');
    }
  }
  return errors;
}
function validateFieldType(field) {
  const errors = [];

  // Type-specific validations
  switch (field.type) {
    case 'dropdown':
    case 'radio':
    case 'multiselect':
      if (!field.options && !field.mdms) {
        errors.push('Options or MDMS configuration required for dropdown/radio/multiselect fields');
      }
      break;
    case 'amount':
      if (field.validation && field.validation.min === undefined) {
        errors.push('Amount fields should define minimum value');
      }
      break;
    case 'mobileNumber':
      if (field.validation && (!field.validation.min || !field.validation.max)) {
        errors.push('Mobile number fields should define min and max validation');
      }
      break;
    case 'email':
      if (field.validation && !field.validation.pattern) {
        field.validation = field.validation || {};
        field.validation.pattern = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$';
      }
      break;
    case 'date':
    case 'datetime':
      if (field.validation && (field.validation.minLength || field.validation.maxLength)) {
        errors.push('Date fields should not have length validation');
      }
      break;
  }
  return errors;
}
function validateScreenDependencies(config) {
  const errors = [];

  // Check view screen dependencies
  if (config.screens?.view?.enabled) {
    const hasIdentifierField = config.fields.some(field => field.name === config.entity.primaryKey || field.name === 'id');
    if (!hasIdentifierField) {
      errors.push('View screen requires a primary key field to be defined');
    }
  }

  // Check search screen dependencies
  if (config.screens?.search?.enabled) {
    const hasSearchableFields = config.fields.some(field => field.searchable);
    if (!hasSearchableFields) {
      errors.push('Search screen requires at least one searchable field');
    }
  }

  // Check inbox screen dependencies
  if (config.screens?.inbox?.enabled) {
    if (!config.workflow?.enabled) {
      errors.push('Inbox screen requires workflow to be enabled');
    }
    if (!config.workflow?.businessService) {
      errors.push('Inbox screen requires workflow.businessService to be defined');
    }
  }
  return errors;
}
function validateApiSpecCompatibility(config, apiSpec) {
  const errors = [];
  if (!apiSpec) return errors;

  // Validate entity name exists in API spec
  const entitySchema = apiSpec.components?.schemas?.[config.entity.name] || apiSpec.definitions?.[config.entity.name];
  if (!entitySchema) {
    errors.push(`Entity "${config.entity.name}" not found in API specification`);
    return errors;
  }

  // Validate fields match API schema
  const apiProperties = entitySchema.properties || {};
  const requiredFields = entitySchema.required || [];
  config.fields.forEach(field => {
    if (!apiProperties[field.name]) {
      errors.push(`Field "${field.name}" not found in API schema`);
    } else {
      // Check if required field matches API requirement
      const isRequiredInApi = requiredFields.includes(field.name);
      if (field.required !== isRequiredInApi) {
        errors.push(`Field "${field.name}" required status doesn't match API schema`);
      }
    }
  });
  return errors;
}
module.exports = {
  validateModuleConfig,
  validateFieldType,
  validateScreenDependencies,
  validateApiSpecCompatibility,
  moduleConfigSchema
};