const Handlebars = require('handlebars');
function generateResponseUtils(config) {
  const template = `/**
 * Navigate to response screen with state data
 * @param {Object} navigate - React Router navigate function
 * @param {boolean} isSuccess - Success/failure status
 * @param {Object} responseData - API response data
 * @param {string} message - Custom message
 * @param {string} responseType - Type of response screen
 */
export const navigateToResponse = (
  navigate, 
  isSuccess, 
  responseData = {}, 
  message = null, 
  responseType = "basic"
) => {
  const basePath = \`/\${window.contextPath}/employee\`;
  
  const stateData = {
    isSuccess,
    responseData,
    message,
    timestamp: new Date().getTime()
  };

  // Add error details if failure
  if (!isSuccess && responseData?.error) {
    stateData.error = responseData.error.message || responseData.error;
  }

  // Different response screen routes
  const responseRoutes = {
    basic: \`\${basePath}/{{kebabCase config.module.code}}/response\`,
    panel: \`\${basePath}/{{kebabCase config.module.code}}/panel-response\`, 
    workflow: \`\${basePath}/{{kebabCase config.module.code}}/workflow-response\`
  };

  navigate(responseRoutes[responseType] || responseRoutes.basic, { 
    state: stateData 
  });
};

/**
 * Extract entity information from API response
 */
export const extractEntityInfo = (apiResponse, entityType = "{{config.entity.name}}") => {
  const entities = apiResponse?.[entityType] || apiResponse?.\`\${entityType}s\` || [];
  const entity = Array.isArray(entities) ? entities[0] : entities;
  
  return {
    id: entity?.id || entity?.uuid,
    {{config.entity.primaryKey}}: entity?.{{config.entity.primaryKey}},
    {{config.entity.displayField}}: entity?.{{config.entity.displayField}},
    status: entity?.status || entity?.applicationStatus,
    submittedDate: entity?.auditDetails?.createdTime || new Date().getTime(),
    assignedTo: entity?.assignee?.name
  };
};

/**
 * Format success response data
 */
export const formatSuccessResponse = (apiResponse, entityType = "{{config.entity.name}}", customMessage = null) => {
  const entityInfo = extractEntityInfo(apiResponse, entityType);
  
  return {
    isSuccess: true,
    responseData: entityInfo,
    message: customMessage || "{{config.i18n.prefix}}CREATED_SUCCESSFULLY",
    additionalInfo: entityInfo["{{config.entity.displayField}}"] ? 
      "Reference: " + entityInfo["{{config.entity.displayField}}"] : ""
  };
};

/**
 * Format error response data  
 */
export const formatErrorResponse = (error, customMessage = null) => {
  return {
    isSuccess: false,
    error: error?.response?.data?.message || error?.message || "OPERATION_FAILED",
    message: customMessage || "{{config.i18n.prefix}}CREATION_FAILED",
    responseData: {}
  };
};

{{#if config.workflow.enabled}}
/**
 * Format workflow response data
 */
export const formatWorkflowResponse = (workflowResponse, action, customMessage = null) => {
  const processInstance = workflowResponse?.ProcessInstances?.[0];
  
  return {
    isSuccess: true,
    workflowData: {
      businessId: processInstance?.businessId,
      currentState: processInstance?.state?.state,
      action: action,
      assignedTo: processInstance?.assignes?.[0]?.name,
      comments: processInstance?.comment,
      businessService: "{{config.workflow.businessService}}",
      timeline: processInstance?.auditDetails || []
    },
    message: customMessage || \`{{config.i18n.prefix}}WORKFLOW_ACTION_SUCCESSFUL\`
  };
};
{{/if}}

/**
 * Handle API error and navigate to appropriate response
 */
export const handleApiError = (navigate, error, defaultMessage = null) => {
  console.error('API Error:', error);
  
  const errorResponse = formatErrorResponse(error, defaultMessage);
  
  // Show toast notification
  if (typeof Digit !== 'undefined' && Digit.Utils?.toast?.error) {
    Digit.Utils.toast.error(errorResponse.error);
  }
  
  // Navigate to error response if navigation is provided
  if (navigate) {
    navigateToResponse(navigate, false, {}, errorResponse.error, 'basic');
  }
  
  return errorResponse;
};

/**
 * Handle API success and navigate to appropriate response
 */
export const handleApiSuccess = (navigate, response, entityType, successMessage = null) => {
  console.log('API Success:', response);
  
  const successResponse = formatSuccessResponse(response, entityType, successMessage);
  
  // Show toast notification
  if (typeof Digit !== 'undefined' && Digit.Utils?.toast?.success) {
    Digit.Utils.toast.success(successResponse.message);
  }
  
  // Navigate to success response if navigation is provided
  if (navigate) {
    navigateToResponse(navigate, true, successResponse.responseData, successResponse.message, 'basic');
  }
  
  return successResponse;
};

/**
 * Generic API call wrapper with response handling
 */
export const makeApiCall = async (apiFunction, navigate, entityType = "{{config.entity.name}}") => {
  try {
    const response = await apiFunction();
    return handleApiSuccess(navigate, response, entityType);
  } catch (error) {
    return handleApiError(navigate, error);
  }
};`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
module.exports = {
  generateResponseUtils
};