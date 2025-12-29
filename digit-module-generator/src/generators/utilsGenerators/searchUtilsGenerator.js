const Handlebars = require('handlebars');

function generateSearchUtils(config) {
  const template = `/**
 * Transform search form data to API search criteria
 * @param {Object} searchParams - Search form data
 * @param {string} tenantId - Current tenant ID
 * @returns {Object} API search request body
 */
export const transformSearchParams = (searchParams, tenantId) => {
  const searchCriteria = {
    tenantId: tenantId,
{{#each config.fields}}
{{#if searchable}}
{{#if (eq type 'text')}}
    {{name}}: searchParams.{{name}} || null,
{{/if}}
{{#if (eq type 'dropdown')}}
    {{name}}: searchParams.{{name}}?.code || searchParams.{{name}} || null,
{{/if}}
{{#if (eq type 'date')}}
    {{name}}From: searchParams.{{name}}From ? new Date(searchParams.{{name}}From).getTime() : null,
    {{name}}To: searchParams.{{name}}To ? new Date(searchParams.{{name}}To).getTime() : null,
{{/if}}
{{#if (eq type 'mobileNumber')}}
    {{name}}: searchParams.{{name}} || null,
{{/if}}
{{/if}}
{{/each}}
    offset: searchParams.offset || 0,
    limit: searchParams.limit || 10
  };

  // Remove null/undefined values
  Object.keys(searchCriteria).forEach(key => {
    if (searchCriteria[key] === null || searchCriteria[key] === undefined || searchCriteria[key] === '') {
      delete searchCriteria[key];
    }
  });

  return {
    {{config.entity.name}}SearchCriteria: searchCriteria
  };
};

/**
 * Format search results for display
 * @param {Object} apiResponse - API search response
 * @returns {Object} Formatted search results
 */
export const formatSearchResults = (apiResponse) => {
  const entities = apiResponse?.{{config.entity.name}}s || apiResponse?.{{config.entity.name}} || [];
  const totalCount = apiResponse?.totalCount || entities.length;
  
  const formattedResults = entities.map(entity => ({
    id: entity.id,
    {{config.entity.primaryKey}}: entity.{{config.entity.primaryKey}},
{{#each config.fields}}
{{#if showInResults}}
{{#if (eq type 'dropdown')}}
    {{name}}: entity.{{name}}, // Will be transformed in UI based on MDMS data
{{/if}}
{{#if (eq type 'date')}}
    {{name}}: entity.{{name}} ? new Date(entity.{{name}}).toLocaleDateString() : '',
{{/if}}
{{#if (eq type 'amount')}}
    {{name}}: entity.{{name}} ? \`₹ \${entity.{{name}}.toLocaleString()}\` : '',
{{/if}}
{{#unless (or (eq type 'dropdown') (eq type 'date') (eq type 'amount'))}}
    {{name}}: entity.{{name}} || '',
{{/unless}}
{{/if}}
{{/each}}
    status: entity.status,
    actions: entity.id, // Used for action column
    // Additional fields for view linking
    viewPath: \`/employee/{{kebabCase config.module.code}}/view/\${entity.id}\`,
{{#if config.screens.create.enabled}}
    editPath: \`/employee/{{kebabCase config.module.code}}/edit/\${entity.id}\`
{{/if}}
  }));
  
  return {
    results: formattedResults,
    totalCount: totalCount,
    pagination: {
      currentPage: Math.floor((apiResponse?.offset || 0) / (apiResponse?.limit || 10)) + 1,
      pageSize: apiResponse?.limit || 10,
      totalPages: Math.ceil(totalCount / (apiResponse?.limit || 10))
    }
  };
};

/**
 * Build search query for URL/state management
 * @param {Object} searchParams - Current search parameters
 * @returns {Object} URL-compatible search query
 */
export const buildSearchQuery = (searchParams) => {
  const query = {};
  
{{#each config.fields}}
{{#if searchable}}
  if (searchParams.{{name}}) {
{{#if (eq type 'dropdown')}}
    query.{{name}} = typeof searchParams.{{name}} === 'object' ? 
      searchParams.{{name}}.code : searchParams.{{name}};
{{/if}}
{{#if (eq type 'date')}}
    if (searchParams.{{name}}From) query.{{name}}From = searchParams.{{name}}From;
    if (searchParams.{{name}}To) query.{{name}}To = searchParams.{{name}}To;
{{/if}}
{{#unless (eq type 'date')}}
    query.{{name}} = searchParams.{{name}};
{{/unless}}
  }
{{/if}}
{{/each}}
  
  if (searchParams.offset) query.offset = searchParams.offset;
  if (searchParams.limit) query.limit = searchParams.limit;
  
  return query;
};

/**
 * Parse search query from URL parameters
 * @param {Object} urlParams - URL search parameters
 * @returns {Object} Form-compatible search parameters
 */
export const parseSearchQuery = (urlParams) => {
  const searchParams = {};
  
{{#each config.fields}}
{{#if searchable}}
{{#if (eq type 'dropdown')}}
  if (urlParams.{{name}}) {
    searchParams.{{name}} = { code: urlParams.{{name}} };
  }
{{/if}}
{{#if (eq type 'date')}}
  if (urlParams.{{name}}From) searchParams.{{name}}From = urlParams.{{name}}From;
  if (urlParams.{{name}}To) searchParams.{{name}}To = urlParams.{{name}}To;
{{/if}}
{{#unless (or (eq type 'dropdown') (eq type 'date'))}}
  if (urlParams.{{name}}) searchParams.{{name}} = urlParams.{{name}};
{{/unless}}
{{/if}}
{{/each}}
  
  if (urlParams.offset) searchParams.offset = parseInt(urlParams.offset);
  if (urlParams.limit) searchParams.limit = parseInt(urlParams.limit);
  
  return searchParams;
};

/**
 * Validate search parameters
 * @param {Object} searchParams - Search form data
 * @returns {Object} Validation result
 */
export const validateSearchParams = (searchParams) => {
  const errors = [];
  
  // Check if at least one search parameter is provided (if required by config)
{{#if config.screens.search.minSearchFields}}
  const providedParams = Object.values(searchParams).filter(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  if (providedParams.length < {{config.screens.search.minSearchFields}}) {
    errors.push('At least {{config.screens.search.minSearchFields}} search parameter(s) required');
  }
{{/if}}
  
{{#each config.fields}}
{{#if searchable}}
{{#if (eq type 'date')}}
  // Validate date range for {{name}}
  if (searchParams.{{name}}From && searchParams.{{name}}To) {
    const fromDate = new Date(searchParams.{{name}}From);
    const toDate = new Date(searchParams.{{name}}To);
    
    if (fromDate > toDate) {
      errors.push('{{label}} from date cannot be after to date');
    }
  }
{{/if}}
{{#if (eq type 'mobileNumber')}}
  // Validate mobile number for {{name}}
  if (searchParams.{{name}}) {
    const mobile = searchParams.{{name}}.replace(/[^\\d]/g, '');
    if (mobile.length < 10 || mobile.length > 10) {
      errors.push('{{label}} must be 10 digits');
    }
  }
{{/if}}
{{/if}}
{{/each}}
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Get default search parameters
 * @returns {Object} Default search form values
 */
export const getDefaultSearchParams = () => {
  return {
{{#each config.fields}}
{{#if searchable}}
{{#if (eq type 'dropdown')}}
    {{name}}: null,
{{/if}}
{{#if (eq type 'text')}}
    {{name}}: '',
{{/if}}
{{#if (eq type 'date')}}
    {{name}}From: '',
    {{name}}To: '',
{{/if}}
{{#if (eq type 'mobileNumber')}}
    {{name}}: '',
{{/if}}
{{/if}}
{{/each}}
    offset: 0,
    limit: 10
  };
};

/**
 * Reset search parameters to defaults
 * @param {Function} setSearchParams - State setter function
 */
export const resetSearchParams = (setSearchParams) => {
  setSearchParams(getDefaultSearchParams());
};

/**
 * Export configuration for search screen
 */
export const searchConfig = {
  defaultParams: getDefaultSearchParams(),
  minSearchFields: {{#if config.screens.search.minSearchFields}}{{config.screens.search.minSearchFields}}{{else}}0{{/if}},
  searchableFields: [
{{#each config.fields}}
{{#if searchable}}
    '{{name}}',
{{/if}}
{{/each}}
  ],
  resultFields: [
{{#each config.fields}}
{{#if showInResults}}
    '{{name}}',
{{/if}}
{{/each}}
  ]
};`;

  const compiled = Handlebars.compile(template);
  return compiled({ config });
}

module.exports = { generateSearchUtils };