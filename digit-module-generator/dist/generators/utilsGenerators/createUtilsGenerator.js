const Handlebars = require('handlebars');
function generateCreateUtils(config) {
  const template = `/**
 * Transform form data to API format for {{config.entity.name}}
 * @param {Object} formData - Data from FormComposerV2
 * @param {string} tenantId - Current tenant ID
 * @param {Object} userInfo - Current user information
 * @returns {Object} API-compatible request body
 */
export const transform{{config.entity.name}}CreateData = (formData, tenantId, userInfo) => {
  return {
    {{config.entity.name}}: {
      tenantId: tenantId,
      
      // Basic Information
{{#each config.fields}}
{{#if (eq type 'text')}}
      {{name}}: formData.{{name}},
{{/if}}
{{#if (eq type 'number')}}
      {{name}}: formData.{{name}} ? parseInt(formData.{{name}}) : null,
{{/if}}
{{#if (eq type 'amount')}}
      {{name}}: formData.{{name}} ? parseFloat(formData.{{name}}) : 0,
{{/if}}
{{#if (eq type 'date')}}
      {{name}}: formData.{{name}} ? new Date(formData.{{name}}).getTime() : null,
{{/if}}
{{#if (eq type 'dropdown')}}
      {{name}}: formData.{{name}}?.code || formData.{{name}},
{{/if}}
{{#if (eq type 'textarea')}}
      {{name}}: formData.{{name}},
{{/if}}
{{#if (eq type 'mobileNumber')}}
      {{name}}: commonTransformations.formatMobileNumber(formData.{{name}}),
{{/if}}
{{#if (eq type 'email')}}
      {{name}}: formData.{{name}},
{{/if}}
{{#if (eq type 'checkbox')}}
      {{name}}: Boolean(formData.{{name}}),
{{/if}}
{{#if (eq type 'multiselect')}}
      {{name}}: formData.{{name}} ? formData.{{name}}.map(item => 
        typeof item === 'object' && item.code ? item.code : item
      ) : [],
{{/if}}
{{/each}}
      
      // Audit fields
      auditDetails: {
        createdBy: userInfo.uuid,
        createdTime: new Date().getTime(),
        lastModifiedBy: userInfo.uuid,
        lastModifiedTime: new Date().getTime()
      }
    }
  };
};

/**
 * Transform for Update operations
 */
export const transform{{config.entity.name}}UpdateData = (formData, existingEntity, tenantId, userInfo) => {
  const transformed = transform{{config.entity.name}}CreateData(formData, tenantId, userInfo);
  
  // Preserve existing audit and system fields
  return {
    ...transformed,
    {{config.entity.name}}: {
      ...transformed.{{config.entity.name}},
      id: existingEntity.id,
      uuid: existingEntity.uuid,
      {{config.entity.primaryKey}}: existingEntity.{{config.entity.primaryKey}},
      auditDetails: {
        ...existingEntity.auditDetails,
        lastModifiedBy: userInfo.uuid,
        lastModifiedTime: new Date().getTime()
      }
    }
  };
};

{{#if config.workflow.enabled}}
/**
 * Transform for workflow transitions
 */
export const transformWorkflowData = (formData, entityId, tenantId, userInfo) => {
  return {
    ProcessInstances: [{
      businessId: entityId,
      businessService: "{{config.workflow.businessService}}",
      tenantId: tenantId,
      action: formData.workflowAction,
      comment: formData.comments,
      assignees: formData.assignees ? formData.assignees.map(a => ({
        uuid: a.uuid,
        type: a.type || "USER"
      })) : [],
      documents: transformDocuments(formData.documents)
    }]
  };
};
{{/if}}

/**
 * Transform documents array
 */
const transformDocuments = (documents) => {
  if (!documents || !Array.isArray(documents)) return [];
  
  return documents.map(doc => ({
    documentType: doc.documentType?.code || doc.documentType,
    fileStoreId: doc.fileStoreId,
    documentUid: doc.documentUid,
    additionalDetails: doc.additionalDetails || {}
  }));
};

/**
 * Common field transformations
 */
export const commonTransformations = {
  // Date to epoch
  dateToEpoch: (dateString) => {
    return dateString ? new Date(dateString).getTime() : null;
  },
  
  // Extract code from MDMS objects
  extractCode: (mdmsObject) => {
    return mdmsObject && typeof mdmsObject === 'object' ? mdmsObject.code : mdmsObject;
  },
  
  // Handle multi-select
  transformMultiSelect: (multiSelectArray) => {
    if (!Array.isArray(multiSelectArray)) return [];
    return multiSelectArray.map(item => 
      typeof item === 'object' && item.code ? item.code : item
    );
  },
  
  // Format mobile number
  formatMobileNumber: (mobileNumber) => {
    if (!mobileNumber) return null;
    // Remove any non-numeric characters except +
    return mobileNumber.replace(/[^\\d+]/g, '');
  },
  
  // Parse amount
  parseAmount: (amountString) => {
    if (!amountString) return 0;
    // Remove currency symbols and parse
    return parseFloat(amountString.toString().replace(/[^\\d.-]/g, '')) || 0;
  }
};

/**
 * Validation before API call
 */
export const validateTransformedData = (transformedData, requiredFields = []) => {
  const errors = [];
  const entity = transformedData.{{config.entity.name}} || transformedData;
  
  // Check required fields
  requiredFields.forEach(field => {
    const fieldPath = field.split('.');
    let value = entity;
    
    for (const path of fieldPath) {
      value = value && value[path];
    }
    
    if (!value) {
      errors.push(\`\${field} is required\`);
    }
  });
  
  // Additional validations
{{#each config.fields}}
{{#if (eq type 'mobileNumber')}}
  if (entity.{{name}}) {
    const mobile = entity.{{name}};
    if (!/^\\d{10}$/.test(mobile.replace(/^\\+\\d{1,3}/, ''))) {
      errors.push('Invalid mobile number format');
    }
  }
{{/if}}
{{#if (eq type 'email')}}
  if (entity.{{name}}) {
    const email = entity.{{name}};
    if (!/\\S+@\\S+\\.\\S+/.test(email)) {
      errors.push('Invalid email format');
    }
  }
{{/if}}
{{#if (eq type 'amount')}}
  if (entity.{{name}} !== undefined) {
    const amount = parseFloat(entity.{{name}});
    if (isNaN(amount) || amount < 0) {
      errors.push('{{label}} must be a valid positive number');
    }
{{#if validation.max}}
    if (amount > {{validation.max}}) {
      errors.push('{{label}} cannot exceed {{validation.max}}');
    }
{{/if}}
  }
{{/if}}
{{/each}}
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
module.exports = {
  generateCreateUtils
};