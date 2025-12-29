const fs = require('fs-extra');
const axios = require('axios');
const yaml = require('yaml');
const SwaggerParser = require('swagger-parser');
const chalk = require('chalk');

async function parseApiSpec(specPath, entityName) {
  try {
    console.log(chalk.blue(`📄 Loading API specification from: ${specPath}`));
    
    // Load spec content
    let specContent;
    if (specPath.startsWith('http://') || specPath.startsWith('https://')) {
      const response = await axios.get(specPath);
      specContent = response.data;
    } else {
      const content = await fs.readFile(specPath, 'utf8');
      specContent = specPath.endsWith('.yaml') || specPath.endsWith('.yml') ? 
        yaml.parse(content) : JSON.parse(content);
    }

    // Parse and validate spec
    const api = await SwaggerParser.validate(specContent);
    console.log(chalk.green(`✅ API specification validated successfully`));

    // Extract schema for the entity
    const entitySchema = findEntitySchema(api, entityName);
    if (!entitySchema) {
      console.log(chalk.yellow(`⚠️  Entity schema '${entityName}' not found in API spec`));
      return getDefaultConfig(entityName);
    }

    // Generate configuration from schema
    const config = generateConfigFromSchema(api, entitySchema, entityName);
    console.log(chalk.green(`✅ Generated configuration for ${entityName}`));
    
    return config;

  } catch (error) {
    console.error(chalk.red(`❌ Error parsing API specification: ${error.message}`));
    console.log(chalk.yellow(`⚠️  Falling back to default configuration`));
    return getDefaultConfig(entityName);
  }
}

function findEntitySchema(api, entityName) {
  // Look in components/schemas first (OpenAPI 3.x)
  if (api.components?.schemas?.[entityName]) {
    return api.components.schemas[entityName];
  }

  // Look in definitions (Swagger 2.x)
  if (api.definitions?.[entityName]) {
    return api.definitions[entityName];
  }

  // Try variations of the name
  const variations = [
    entityName,
    entityName.toLowerCase(),
    entityName.toUpperCase(),
    `${entityName}Request`,
    `${entityName}Response`,
    `Create${entityName}Request`,
    `${entityName}DTO`
  ];

  for (const variation of variations) {
    if (api.components?.schemas?.[variation]) {
      return api.components.schemas[variation];
    }
    if (api.definitions?.[variation]) {
      return api.definitions[variation];
    }
  }

  return null;
}

function generateConfigFromSchema(api, schema, entityName) {
  const fields = extractFields(schema, api);
  const apiEndpoints = extractApiEndpoints(api, entityName);
  
  return {
    entity: {
      name: entityName,
      apiPath: apiEndpoints.basePath || '/api/v1',
      primaryKey: findPrimaryKey(schema) || `${entityName.toLowerCase()}Id`,
      displayField: findDisplayField(schema) || `${entityName.toLowerCase()}Name`
    },
    fields: fields,
    api: apiEndpoints,
    validations: extractValidations(schema),
    metadata: {
      generatedFrom: 'apiSpec',
      apiVersion: api.info?.version,
      apiTitle: api.info?.title
    }
  };
}

function extractFields(schema, api, visited = new Set()) {
  if (!schema || !schema.properties) return [];
  
  // Prevent infinite recursion
  const schemaId = schema.$ref || JSON.stringify(schema);
  if (visited.has(schemaId)) return [];
  visited.add(schemaId);
  
  const fields = [];
  
  for (const [fieldName, fieldSpec] of Object.entries(schema.properties)) {
    // Resolve references
    const resolvedSpec = resolveReference(fieldSpec, api);
    
    const field = {
      name: fieldName,
      type: mapOpenApiTypeToDigitType(resolvedSpec),
      label: generateLabel(fieldName),
      required: schema.required?.includes(fieldName) || false,
      description: resolvedSpec.description || ''
    };

    // Add validation rules
    const validation = extractFieldValidation(resolvedSpec);
    if (Object.keys(validation).length > 0) {
      field.validation = validation;
    }

    // Handle enums as dropdown options
    if (resolvedSpec.enum) {
      field.type = 'dropdown';
      field.options = resolvedSpec.enum.map(value => ({
        code: value,
        name: generateLabel(value.toString())
      }));
    }

    // Handle object properties for MDMS dropdowns
    if (resolvedSpec.type === 'object' && resolvedSpec.properties) {
      // Check if it looks like an MDMS reference
      if (resolvedSpec.properties.code && resolvedSpec.properties.name) {
        field.type = 'dropdown';
        field.mdms = {
          masterName: generateLabel(fieldName),
          moduleName: 'common-masters',
          localePrefix: `${fieldName.toUpperCase()}_`
        };
      }
    }

    // Handle array types
    if (resolvedSpec.type === 'array') {
      const itemType = resolvedSpec.items?.type;
      if (itemType === 'string' && resolvedSpec.items?.enum) {
        field.type = 'multiselect';
        field.options = resolvedSpec.items.enum.map(value => ({
          code: value,
          name: generateLabel(value.toString())
        }));
      }
    }

    fields.push(field);
  }
  
  return fields;
}

function mapOpenApiTypeToDigitType(spec) {
  const { type, format } = spec;
  
  const typeMap = {
    'string': 'text',
    'number': 'number',
    'integer': 'number',
    'boolean': 'checkbox',
    'array': 'multiselect',
    'object': 'component'
  };
  
  // Handle format-specific mappings
  if (type === 'string') {
    switch (format) {
      case 'date':
        return 'date';
      case 'date-time':
        return 'datetime';
      case 'email':
        return 'email';
      case 'uri':
      case 'url':
        return 'url';
      case 'password':
        return 'password';
      case 'byte':
      case 'binary':
        return 'file';
      default:
        // Check for text length to determine if textarea
        if (spec.maxLength && spec.maxLength > 255) {
          return 'textarea';
        }
        return 'text';
    }
  }
  
  return typeMap[type] || 'text';
}

function extractFieldValidation(spec) {
  const validation = {};
  
  // String validations
  if (spec.pattern) {
    validation.pattern = spec.pattern;
  }
  if (spec.minLength !== undefined) {
    validation.minLength = spec.minLength;
  }
  if (spec.maxLength !== undefined) {
    validation.maxLength = spec.maxLength;
  }
  
  // Number validations
  if (spec.minimum !== undefined) {
    validation.min = spec.minimum;
  }
  if (spec.maximum !== undefined) {
    validation.max = spec.maximum;
  }
  if (spec.multipleOf !== undefined) {
    validation.step = spec.multipleOf;
  }
  
  return validation;
}

function extractApiEndpoints(api, entityName) {
  const endpoints = {
    basePath: api.servers?.[0]?.url || api.basePath || '/api/v1'
  };
  
  // Find paths that match entity operations
  const entityPath = findEntityPath(api.paths, entityName);
  
  if (entityPath) {
    const basePath = entityPath.replace(/\{[^}]+\}/g, ''); // Remove path parameters
    
    endpoints.create = `${basePath}/_create`;
    endpoints.update = `${basePath}/_update`;
    endpoints.search = `${basePath}/_search`;
    endpoints.view = `${basePath}/{id}`;
  }
  
  return endpoints;
}

function findEntityPath(paths, entityName) {
  const entityLower = entityName.toLowerCase();
  const entityPlural = `${entityLower}s`;
  
  // Look for paths that match entity name
  for (const pathKey of Object.keys(paths)) {
    const pathLower = pathKey.toLowerCase();
    if (pathLower.includes(entityLower) || pathLower.includes(entityPlural)) {
      return pathKey;
    }
  }
  
  return null;
}

function resolveReference(spec, api) {
  if (!spec.$ref) return spec;
  
  const refPath = spec.$ref.replace('#/', '').split('/');
  let resolved = api;
  
  for (const segment of refPath) {
    resolved = resolved[segment];
    if (!resolved) break;
  }
  
  return resolved || spec;
}

function findPrimaryKey(schema) {
  if (!schema.properties) return null;
  
  // Look for common primary key patterns
  const pkCandidates = ['id', 'uuid', 'code'];
  
  for (const candidate of pkCandidates) {
    if (schema.properties[candidate]) {
      return candidate;
    }
  }
  
  return null;
}

function findDisplayField(schema) {
  if (!schema.properties) return null;
  
  // Look for common display field patterns
  const displayCandidates = ['name', 'title', 'label', 'description'];
  
  for (const candidate of displayCandidates) {
    if (schema.properties[candidate]) {
      return candidate;
    }
  }
  
  return null;
}

function generateLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function extractValidations(schema) {
  const validations = {};
  
  if (schema.required) {
    validations.required = schema.required;
  }
  
  return validations;
}

function getDefaultConfig(entityName) {
  return {
    entity: {
      name: entityName,
      apiPath: '/api/v1',
      primaryKey: `${entityName.toLowerCase()}Id`,
      displayField: `${entityName.toLowerCase()}Name`
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        validation: {
          maxLength: 100
        }
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Description',
        required: false
      },
      {
        name: 'status',
        type: 'dropdown',
        label: 'Status',
        required: true,
        options: [
          { code: 'ACTIVE', name: 'Active' },
          { code: 'INACTIVE', name: 'Inactive' }
        ]
      }
    ],
    api: {
      create: '/_create',
      update: '/_update', 
      search: '/_search',
      view: '/{id}'
    },
    metadata: {
      generatedFrom: 'default',
      note: 'Generated with default configuration due to API spec parsing issues'
    }
  };
}

module.exports = {
  parseApiSpec
};