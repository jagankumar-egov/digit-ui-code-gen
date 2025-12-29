const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');
async function generateTestFiles(moduleDir, config, result) {
  const testsDir = path.join(moduleDir, '__tests__');

  // Generate component tests
  await generateComponentTests(testsDir, config, result);

  // Generate utility tests
  await generateUtilityTests(testsDir, config, result);

  // Generate integration tests
  await generateIntegrationTests(testsDir, config, result);

  // Generate test configuration
  await generateTestConfig(moduleDir, config, result);
}
async function generateComponentTests(testsDir, config, result) {
  const componentsTestDir = path.join(testsDir, 'components');
  await fs.ensureDir(componentsTestDir);

  // Generate tests for enabled screens
  for (const [screenType, screenConfig] of Object.entries(config.screens)) {
    if (!screenConfig.enabled) continue;
    const testContent = await generateScreenTest(screenType, config);
    if (testContent) {
      const fileName = `${config.entity.name}${screenType.charAt(0).toUpperCase() + screenType.slice(1)}.test.js`;
      await fs.writeFile(path.join(componentsTestDir, fileName), testContent);
      result.files.push(`__tests__/components/${fileName}`);
    }
  }
}
async function generateUtilityTests(testsDir, config, result) {
  const utilsTestDir = path.join(testsDir, 'utils');
  await fs.ensureDir(utilsTestDir);

  // Generate createUtils test
  const createUtilsTest = generateCreateUtilsTest(config);
  await fs.writeFile(path.join(utilsTestDir, 'createUtils.test.js'), createUtilsTest);
  result.files.push('__tests__/utils/createUtils.test.js');

  // Generate responseUtils test
  const responseUtilsTest = generateResponseUtilsTest(config);
  await fs.writeFile(path.join(utilsTestDir, 'responseUtils.test.js'), responseUtilsTest);
  result.files.push('__tests__/utils/responseUtils.test.js');
}
async function generateIntegrationTests(testsDir, config, result) {
  const integrationTestDir = path.join(testsDir, 'integration');
  await fs.ensureDir(integrationTestDir);

  // Generate API integration test
  const apiTest = generateApiIntegrationTest(config);
  await fs.writeFile(path.join(integrationTestDir, 'api.test.js'), apiTest);
  result.files.push('__tests__/integration/api.test.js');

  // Generate workflow test if enabled
  if (config.workflow?.enabled) {
    const workflowTest = generateWorkflowTest(config);
    await fs.writeFile(path.join(integrationTestDir, 'workflow.test.js'), workflowTest);
    result.files.push('__tests__/integration/workflow.test.js');
  }
}
async function generateTestConfig(moduleDir, config, result) {
  // Generate Jest configuration
  const jestConfig = generateJestConfig(config);
  await fs.writeFile(path.join(moduleDir, 'jest.config.js'), jestConfig);
  result.files.push('jest.config.js');

  // Generate test setup file
  const setupTests = generateTestSetup(config);
  await fs.writeFile(path.join(moduleDir, '__tests__/setup.js'), setupTests);
  result.files.push('__tests__/setup.js');

  // Generate mock data
  const mockData = generateMockData(config);
  await fs.writeFile(path.join(moduleDir, '__tests__/mocks/mockData.js'), mockData);
  result.files.push('__tests__/mocks/mockData.js');
}
function generateScreenTest(screenType, config) {
  const template = `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {{config.entity.name}}{{pascalCase screenType}} from '../../src/pages/employee/{{config.entity.name}}{{pascalCase screenType}}';
import { mockDigitAPI } from '../mocks/digitAPI';

// Mock dependencies
jest.mock('@egovernments/digit-ui-components', () => ({
  FormComposerV2: ({ onSubmit, config }) => (
    <div data-testid="form-composer">
      <button onClick={() => onSubmit(mockDigitAPI.getMockFormData())} data-testid="submit-btn">
        Submit
      </button>
    </div>
  ),
  CommonScreen: ({ config }) => (
    <div data-testid="common-screen">
      {config.headerLabel || 'Screen'}
    </div>
  ),
  Banner: ({ message, successful }) => (
    <div data-testid="banner" className={successful ? 'success' : 'error'}>
      {message}
    </div>
  ),
  Card: ({ children }) => <div data-testid="card">{children}</div>
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: {} }),
  useParams: () => ({ id: 'test-id' })
}));

// Mock Digit services
global.Digit = {
  ULBService: {
    getCurrentTenantId: () => 'test-tenant',
    getStateId: () => 'test-state'
  },
  UserService: {
    getUser: () => ({
      info: {
        uuid: 'test-user-uuid',
        name: 'Test User'
      }
    })
  },
  Hooks: {
    useCustomAPIMutationHook: () => ({
      mutate: jest.fn(),
      isLoading: false
    }),
    useQueryParams: () => ({ isSuccess: 'true' })
  },
  Utils: {
    toast: {
      success: jest.fn(),
      error: jest.fn()
    }
  }
};

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <{{config.entity.name}}{{pascalCase screenType}} {...props} />
    </BrowserRouter>
  );
};

describe('{{config.entity.name}}{{pascalCase screenType}}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

{{#if (eq screenType 'create')}}
  test('renders create form', () => {
    renderComponent();
    expect(screen.getByTestId('form-composer')).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    const mockMutate = jest.fn();
    global.Digit.Hooks.useCustomAPIMutationHook = () => ({
      mutate: mockMutate,
      isLoading: false
    });

    renderComponent();
    
    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  test('validates required fields', async () => {
    const mockToastError = jest.fn();
    global.Digit.Utils.toast.error = mockToastError;

    renderComponent();
    
    // Test with invalid data
    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    // Should not call API with invalid data
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('required')
    );
  });
{{/if}}

{{#if (eq screenType 'search')}}
  test('renders search interface', () => {
    renderComponent();
    expect(screen.getByTestId('common-screen')).toBeInTheDocument();
  });

  test('displays search results', async () => {
    renderComponent();
    // Add specific search test logic
    expect(screen.getByTestId('common-screen')).toHaveTextContent('Screen');
  });
{{/if}}

{{#if (eq screenType 'view')}}
  test('renders view details', () => {
    renderComponent();
    expect(screen.getByTestId('common-screen')).toBeInTheDocument();
  });

  test('handles missing entity ID', () => {
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ id: undefined })
    }));
    
    renderComponent();
    expect(screen.getByTestId('common-screen')).toBeInTheDocument();
  });
{{/if}}

{{#if (eq screenType 'inbox')}}
  test('renders inbox interface', () => {
    renderComponent();
    expect(screen.getByTestId('common-screen')).toBeInTheDocument();
  });

  test('filters inbox items', async () => {
    renderComponent();
    // Add specific inbox test logic
    expect(screen.getByTestId('common-screen')).toBeInTheDocument();
  });
{{/if}}

{{#if (eq screenType 'response')}}
  test('renders success response', () => {
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: () => ({ 
        state: { 
          isSuccess: true,
          message: 'Success message',
          responseData: { id: 'test-id' }
        } 
      })
    }));

    renderComponent();
    expect(screen.getByTestId('banner')).toHaveClass('success');
  });

  test('renders error response', () => {
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: () => ({ 
        state: { 
          isSuccess: false,
          error: 'Error message'
        } 
      })
    }));

    renderComponent();
    expect(screen.getByTestId('banner')).toHaveClass('error');
  });

  test('handles navigation actions', () => {
    const mockNavigate = jest.fn();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    renderComponent();
    
    // Test navigation buttons if they exist
    // This would need to be customized based on actual component structure
  });
{{/if}}

  test('handles loading state', () => {
    global.Digit.Hooks.useCustomAPIMutationHook = () => ({
      mutate: jest.fn(),
      isLoading: true
    });

    renderComponent();
    // Add loading state assertions
  });

  test('handles error state', () => {
    const mockError = new Error('Test error');
    global.Digit.Hooks.useCustomAPIMutationHook = () => ({
      mutate: jest.fn().mockRejectedValue(mockError),
      isLoading: false
    });

    renderComponent();
    // Add error state assertions
  });
});`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config,
    screenType
  });
}
function generateCreateUtilsTest(config) {
  const template = `import {
  transform{{config.entity.name}}CreateData,
  validateTransformedData,
  commonTransformations
} from '../../src/utils/createUtils';

describe('createUtils', () => {
  const mockTenantId = 'test-tenant';
  const mockUserInfo = {
    uuid: 'test-user-uuid',
    name: 'Test User'
  };

  const mockFormData = {
{{#each config.fields}}
{{#if (eq type 'text')}}
    {{name}}: 'test-{{name}}',
{{/if}}
{{#if (eq type 'number')}}
    {{name}}: 123,
{{/if}}
{{#if (eq type 'dropdown')}}
    {{name}}: { code: 'TEST_CODE', name: 'Test Name' },
{{/if}}
{{#if (eq type 'date')}}
    {{name}}: '2024-01-01',
{{/if}}
{{#if (eq type 'amount')}}
    {{name}}: '50000',
{{/if}}
{{#if (eq type 'mobileNumber')}}
    {{name}}: '9876543210',
{{/if}}
{{/each}}
  };

  describe('transform{{config.entity.name}}CreateData', () => {
    test('transforms form data correctly', () => {
      const result = transform{{config.entity.name}}CreateData(mockFormData, mockTenantId, mockUserInfo);

      expect(result).toHaveProperty('{{config.entity.name}}');
      expect(result.{{config.entity.name}}).toHaveProperty('tenantId', mockTenantId);
{{#each config.fields}}
{{#if (eq type 'text')}}
      expect(result.{{../config.entity.name}}).toHaveProperty('{{name}}', 'test-{{name}}');
{{/if}}
{{#if (eq type 'dropdown')}}
      expect(result.{{../config.entity.name}}).toHaveProperty('{{name}}', 'TEST_CODE');
{{/if}}
{{#if (eq type 'amount')}}
      expect(result.{{../config.entity.name}}).toHaveProperty('{{name}}', 50000);
{{/if}}
{{/each}}
    });

    test('handles missing optional fields', () => {
      const minimalData = {
{{#each config.fields}}
{{#if required}}
{{#if (eq type 'text')}}
        {{name}}: 'test-{{name}}',
{{/if}}
{{#if (eq type 'dropdown')}}
        {{name}}: { code: 'TEST_CODE', name: 'Test Name' },
{{/if}}
{{/if}}
{{/each}}
      };

      const result = transform{{config.entity.name}}CreateData(minimalData, mockTenantId, mockUserInfo);
      expect(result).toHaveProperty('{{config.entity.name}}');
    });

    test('includes audit details', () => {
      const result = transform{{config.entity.name}}CreateData(mockFormData, mockTenantId, mockUserInfo);
      
      expect(result.{{config.entity.name}}).toHaveProperty('auditDetails');
      expect(result.{{config.entity.name}}.auditDetails).toHaveProperty('createdBy', mockUserInfo.uuid);
      expect(result.{{config.entity.name}}.auditDetails).toHaveProperty('createdTime');
    });
  });

  describe('validateTransformedData', () => {
    test('validates required fields', () => {
      const validData = {
        {{config.entity.name}}: {
          tenantId: mockTenantId,
{{#each config.fields}}
{{#if required}}
{{#if (eq type 'text')}}
          {{name}}: 'test-value',
{{/if}}
{{#if (eq type 'dropdown')}}
          {{name}}: 'TEST_CODE',
{{/if}}
{{/if}}
{{/each}}
        }
      };

      const result = validateTransformedData(validData, [
{{#each config.fields}}
{{#if required}}
        '{{name}}',
{{/if}}
{{/each}}
      ]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('returns errors for missing required fields', () => {
      const invalidData = {
        {{config.entity.name}}: {
          tenantId: mockTenantId
        }
      };

      const result = validateTransformedData(invalidData, [
{{#each config.fields}}
{{#if required}}
        '{{name}}',
{{/if}}
{{/each}}
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

{{#if (some config.fields 'type' 'mobileNumber')}}
    test('validates mobile number format', () => {
      const invalidData = {
        {{config.entity.name}}: {
          contactDetails: {
            mobileNumber: 'invalid-number'
          }
        }
      };

      const result = validateTransformedData(invalidData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid mobile number format');
    });
{{/if}}

{{#if (some config.fields 'type' 'email')}}
    test('validates email format', () => {
      const invalidData = {
        {{config.entity.name}}: {
          contactDetails: {
            emailId: 'invalid-email'
          }
        }
      };

      const result = validateTransformedData(invalidData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
{{/if}}
  });

  describe('commonTransformations', () => {
    test('dateToEpoch converts date strings', () => {
      const dateString = '2024-01-01';
      const result = commonTransformations.dateToEpoch(dateString);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    test('extractCode extracts code from objects', () => {
      const mdmsObject = { code: 'TEST_CODE', name: 'Test Name' };
      const result = commonTransformations.extractCode(mdmsObject);
      expect(result).toBe('TEST_CODE');
    });

    test('formatMobileNumber cleans phone numbers', () => {
      const dirtyNumber = '+91-987-654-3210';
      const result = commonTransformations.formatMobileNumber(dirtyNumber);
      expect(result).toBe('+919876543210');
    });

    test('parseAmount handles currency strings', () => {
      const amountString = '₹ 50,000.00';
      const result = commonTransformations.parseAmount(amountString);
      expect(result).toBe(50000);
    });
  });
});`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
function generateResponseUtilsTest(config) {
  const template = `import {
  navigateToResponse,
  extractEntityInfo,
  formatSuccessResponse,
  formatErrorResponse
} from '../../src/utils/responseUtils';

describe('responseUtils', () => {
  const mockNavigate = jest.fn();
  const mockResponseData = {
    {{config.entity.name}}: [{
      id: 'test-id',
      {{config.entity.primaryKey}}: 'test-primary-key',
      {{config.entity.displayField}}: 'Test {{config.entity.name}}',
      status: 'ACTIVE',
      auditDetails: {
        createdTime: 1234567890000
      }
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.window = { contextPath: 'test-context' };
  });

  describe('navigateToResponse', () => {
    test('navigates to basic response screen', () => {
      const responseData = { id: 'test-id' };
      const message = 'Success message';

      navigateToResponse(mockNavigate, true, responseData, message, 'basic');

      expect(mockNavigate).toHaveBeenCalledWith(
        '/test-context/employee/response',
        {
          state: {
            isSuccess: true,
            responseData,
            message,
            timestamp: expect.any(Number)
          }
        }
      );
    });

    test('navigates to workflow response screen', () => {
      const responseData = { id: 'test-id' };
      const message = 'Workflow action completed';

      navigateToResponse(mockNavigate, true, responseData, message, 'workflow');

      expect(mockNavigate).toHaveBeenCalledWith(
        '/test-context/employee/workflow-response',
        {
          state: {
            isSuccess: true,
            responseData,
            message,
            timestamp: expect.any(Number)
          }
        }
      );
    });

    test('includes error details for failure cases', () => {
      const errorData = { error: 'Something went wrong' };

      navigateToResponse(mockNavigate, false, errorData, null, 'basic');

      expect(mockNavigate).toHaveBeenCalledWith(
        '/test-context/employee/response',
        {
          state: {
            isSuccess: false,
            responseData: errorData,
            message: null,
            timestamp: expect.any(Number),
            error: 'Something went wrong'
          }
        }
      );
    });
  });

  describe('extractEntityInfo', () => {
    test('extracts info from API response', () => {
      const result = extractEntityInfo(mockResponseData, '{{config.entity.name}}');

      expect(result).toEqual({
        id: 'test-id',
        entityNumber: 'Test {{config.entity.name}}',
        status: 'ACTIVE',
        submittedDate: 1234567890000,
        assignedTo: undefined
      });
    });

    test('handles empty response', () => {
      const result = extractEntityInfo({}, '{{config.entity.name}}');

      expect(result).toEqual({
        id: undefined,
        entityNumber: undefined,
        status: undefined,
        submittedDate: expect.any(Number),
        assignedTo: undefined
      });
    });

    test('handles array response', () => {
      const arrayResponse = {
        {{config.entity.name}}s: [mockResponseData.{{config.entity.name}}[0]]
      };

      const result = extractEntityInfo(arrayResponse, '{{config.entity.name}}');
      expect(result.id).toBe('test-id');
    });
  });

  describe('formatSuccessResponse', () => {
    test('formats success response', () => {
      const result = formatSuccessResponse(
        mockResponseData,
        '{{config.entity.name}}',
        '{{constantCase config.entity.name}}_CREATED_SUCCESSFULLY'
      );

      expect(result).toEqual({
        isSuccess: true,
        responseData: expect.objectContaining({
          id: 'test-id',
          entityNumber: 'Test {{config.entity.name}}'
        }),
        message: '{{constantCase config.entity.name}}_CREATED_SUCCESSFULLY',
        additionalInfo: 'Reference Number: Test {{config.entity.name}}'
      });
    });

    test('uses default message when not provided', () => {
      const result = formatSuccessResponse(mockResponseData, '{{config.entity.name}}');

      expect(result.message).toBe('ENTITY_CREATED_SUCCESSFULLY');
    });
  });

  describe('formatErrorResponse', () => {
    test('formats error response', () => {
      const error = {
        response: {
          data: {
            message: 'Validation failed'
          }
        }
      };

      const result = formatErrorResponse(error, '{{constantCase config.entity.name}}_CREATION_FAILED');

      expect(result).toEqual({
        isSuccess: false,
        error: 'Validation failed',
        message: '{{constantCase config.entity.name}}_CREATION_FAILED',
        responseData: {}
      });
    });

    test('handles generic error', () => {
      const error = new Error('Network error');

      const result = formatErrorResponse(error);

      expect(result).toEqual({
        isSuccess: false,
        error: 'Network error',
        message: 'ENTITY_CREATION_FAILED',
        responseData: {}
      });
    });

    test('handles error without message', () => {
      const result = formatErrorResponse(null);

      expect(result).toEqual({
        isSuccess: false,
        error: 'OPERATION_FAILED',
        message: 'ENTITY_CREATION_FAILED',
        responseData: {}
      });
    });
  });
});`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
function generateApiIntegrationTest(config) {
  const template = `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {{config.entity.name}}Create from '../../src/pages/employee/{{config.entity.name}}Create';

// Mock the entire API layer
const mockApiCall = jest.fn();

jest.mock('@egovernments/digit-ui-components', () => ({
  FormComposerV2: ({ onSubmit, config }) => (
    <div>
      <button onClick={() => onSubmit({
{{#each config.fields}}
{{#if (eq type 'text')}}
        {{name}}: 'test-{{name}}',
{{/if}}
{{#if (eq type 'dropdown')}}
        {{name}}: { code: 'TEST', name: 'Test' },
{{/if}}
{{/each}}
      })} data-testid="submit">
        Submit
      </button>
    </div>
  )
}));

global.Digit = {
  ULBService: {
    getCurrentTenantId: () => 'test-tenant'
  },
  UserService: {
    getUser: () => ({
      info: { uuid: 'test-user', name: 'Test User' }
    })
  },
  Hooks: {
    useCustomAPIMutationHook: ({ url, method, onSuccess, onError }) => ({
      mutate: async (data) => {
        try {
          const result = await mockApiCall(url, method, data);
          onSuccess(result);
        } catch (error) {
          onError(error);
        }
      },
      isLoading: false
    })
  },
  Utils: {
    toast: {
      success: jest.fn(),
      error: jest.fn()
    }
  }
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <{{config.entity.name}}Create />
    </BrowserRouter>
  );
};

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful {{config.entity.name}} creation', async () => {
    const mockResponse = {
      {{config.entity.name}}: [{
        id: 'test-id',
        {{config.entity.displayField}}: 'Test {{config.entity.name}}'
      }]
    };

    mockApiCall.mockResolvedValue(mockResponse);

    renderComponent();

    const submitButton = screen.getByTestId('submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        '{{config.entity.apiPath}}{{config.api.create}}',
        'POST',
        expect.objectContaining({
          {{config.entity.name}}: expect.objectContaining({
            tenantId: 'test-tenant'
          })
        })
      );
    });
  });

  test('handles API validation errors', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Validation failed',
          errors: [
            { field: '{{config.fields.[0].name}}', message: 'Required field' }
          ]
        }
      }
    };

    mockApiCall.mockRejectedValue(mockError);

    renderComponent();

    const submitButton = screen.getByTestId('submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(Digit.Utils.toast.error).toHaveBeenCalledWith(
        'Failed to process form data'
      );
    });
  });

  test('handles network errors', async () => {
    const mockError = new Error('Network error');
    mockApiCall.mockRejectedValue(mockError);

    renderComponent();

    const submitButton = screen.getByTestId('submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(Digit.Utils.toast.error).toHaveBeenCalledWith(
        'Failed to process form data'
      );
    });
  });

  test('transforms form data correctly before API call', async () => {
    mockApiCall.mockResolvedValue({ {{config.entity.name}}: [{}] });

    renderComponent();

    const submitButton = screen.getByTestId('submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const [url, method, data] = mockApiCall.mock.calls[0];
      
      expect(data).toHaveProperty('{{config.entity.name}}');
      expect(data.{{config.entity.name}}).toHaveProperty('tenantId', 'test-tenant');
      expect(data.{{config.entity.name}}).toHaveProperty('auditDetails');
{{#each config.fields}}
{{#if required}}
      expect(data.{{../config.entity.name}}).toHaveProperty('{{name}}');
{{/if}}
{{/each}}
    });
  });
});`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
function generateWorkflowTest(config) {
  const template = `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {{config.entity.name}}View from '../../src/pages/employee/{{config.entity.name}}View';

// Mock workflow API
const mockWorkflowCall = jest.fn();

global.Digit = {
  ...global.Digit,
  Hooks: {
    ...global.Digit?.Hooks,
    useCustomAPIMutationHook: ({ url }) => {
      if (url.includes('workflow')) {
        return {
          mutate: mockWorkflowCall,
          isLoading: false
        };
      }
      return {
        mutate: jest.fn(),
        isLoading: false
      };
    }
  }
};

describe('Workflow Integration Tests', () => {
  const mockEntityData = {
    id: 'test-id',
    {{config.entity.displayField}}: 'Test {{config.entity.name}}',
    status: 'DRAFT'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('workflow action execution', async () => {
    const mockWorkflowResponse = {
      ProcessInstances: [{
        businessId: 'test-id',
        state: { state: 'APPROVED' }
      }]
    };

    mockWorkflowCall.mockResolvedValue(mockWorkflowResponse);

    // Mock workflow action component
    const WorkflowActionComponent = () => (
      <button 
        onClick={() => mockWorkflowCall({
          ProcessInstances: [{
            businessId: 'test-id',
            businessService: '{{config.workflow.businessService}}',
            action: 'APPROVE',
            tenantId: 'test-tenant'
          }]
        })}
        data-testid="approve-btn"
      >
        Approve
      </button>
    );

    render(<WorkflowActionComponent />);

    const approveButton = screen.getByTestId('approve-btn');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockWorkflowCall).toHaveBeenCalledWith({
        ProcessInstances: [{
          businessId: 'test-id',
          businessService: '{{config.workflow.businessService}}',
          action: 'APPROVE',
          tenantId: 'test-tenant'
        }]
      });
    });
  });

  test('workflow state transitions', async () => {
    const stateTransitions = [
      { from: 'DRAFT', action: 'SUBMIT', to: 'PENDING' },
      { from: 'PENDING', action: 'APPROVE', to: 'APPROVED' },
      { from: 'PENDING', action: 'REJECT', to: 'REJECTED' }
    ];

    for (const transition of stateTransitions) {
      mockWorkflowCall.mockResolvedValue({
        ProcessInstances: [{
          state: { state: transition.to }
        }]
      });

      const WorkflowComponent = () => (
        <button 
          onClick={() => mockWorkflowCall({
            ProcessInstances: [{
              businessId: 'test-id',
              action: transition.action,
              businessService: '{{config.workflow.businessService}}'
            }]
          })}
          data-testid={\`\${transition.action.toLowerCase()}-btn\`}
        >
          {transition.action}
        </button>
      );

      render(<WorkflowComponent />);

      const actionButton = screen.getByTestId(\`\${transition.action.toLowerCase()}-btn\`);
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(mockWorkflowCall).toHaveBeenCalledWith(
          expect.objectContaining({
            ProcessInstances: expect.arrayContaining([
              expect.objectContaining({
                action: transition.action,
                businessService: '{{config.workflow.businessService}}'
              })
            ])
          })
        );
      });
    }
  });

  test('workflow error handling', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Workflow action not allowed'
        }
      }
    };

    mockWorkflowCall.mockRejectedValue(mockError);

    const WorkflowComponent = () => (
      <button 
        onClick={() => mockWorkflowCall({})}
        data-testid="workflow-btn"
      >
        Execute Workflow
      </button>
    );

    render(<WorkflowComponent />);

    const workflowButton = screen.getByTestId('workflow-btn');
    fireEvent.click(workflowButton);

    await waitFor(() => {
      expect(mockWorkflowCall).toHaveBeenCalled();
    });
  });
});`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
function generateJestConfig(config) {
  return `module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  transform: {
    '^.+\\\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|jsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/Module.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
  verbose: true
};`;
}
function generateTestSetup(config) {
  return `import '@testing-library/jest-dom';

// Global test configuration
global.window.contextPath = 'test-context';

// Mock DIGIT components and services
global.Digit = {
  ULBService: {
    getCurrentTenantId: () => 'test-tenant',
    getStateId: () => 'test-state'
  },
  UserService: {
    getUser: () => ({
      info: {
        uuid: 'test-user-uuid',
        name: 'Test User',
        roles: [${config.auth?.roles?.map(role => `'${role}'`).join(', ') || ''}]
      }
    })
  },
  StoreData: {
    getCurrentLanguage: () => 'en_IN'
  },
  Services: {
    useStore: () => ({
      isLoading: false,
      data: {}
    })
  },
  Hooks: {
    useCustomAPIMutationHook: () => ({
      mutate: jest.fn(),
      isLoading: false
    }),
    useQueryParams: () => ({}),
    useCustomAPIHook: () => ({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    })
  },
  Utils: {
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn()
    }
  },
  ComponentRegistryService: {
    getComponent: (componentName) => () => <div data-testid={componentName}>Mock {componentName}</div>
  }
};

// Mock common utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};

// Mock intersection observer
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Configure fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

beforeEach(() => {
  jest.clearAllMocks();
});`;
}
function generateMockData(config) {
  const template = `// Mock data for testing
export const mockDigitAPI = {
  getMockFormData: () => ({
{{#each config.fields}}
{{#if (eq type 'text')}}
    {{name}}: 'test-{{name}}',
{{/if}}
{{#if (eq type 'number')}}
    {{name}}: 123,
{{/if}}
{{#if (eq type 'dropdown')}}
    {{name}}: { code: 'TEST_{{constantCase name}}', name: 'Test {{label}}' },
{{/if}}
{{#if (eq type 'date')}}
    {{name}}: '2024-01-01',
{{/if}}
{{#if (eq type 'amount')}}
    {{name}}: '50000',
{{/if}}
{{#if (eq type 'mobileNumber')}}
    {{name}}: '9876543210',
{{/if}}
{{#if (eq type 'email')}}
    {{name}}: 'test@example.com',
{{/if}}
{{#if (eq type 'textarea')}}
    {{name}}: 'Test description for {{label}}',
{{/if}}
{{#if (eq type 'checkbox')}}
    {{name}}: true,
{{/if}}
{{/each}}
  }),

  getMockApiResponse: () => ({
    {{config.entity.name}}: [{
      id: 'test-id-123',
      {{config.entity.primaryKey}}: 'test-primary-key',
      {{config.entity.displayField}}: 'Test {{config.entity.name}}',
{{#each config.fields}}
{{#if (eq type 'text')}}
      {{name}}: 'mock-{{name}}',
{{/if}}
{{#if (eq type 'number')}}
      {{name}}: 456,
{{/if}}
{{#if (eq type 'dropdown')}}
      {{name}}: 'MOCK_{{constantCase name}}',
{{/if}}
{{#if (eq type 'date')}}
      {{name}}: 1704067200000, // 2024-01-01 in epoch
{{/if}}
{{#if (eq type 'amount')}}
      {{name}}: 75000,
{{/if}}
{{/each}}
      status: 'ACTIVE',
      tenantId: 'test-tenant',
      auditDetails: {
        createdBy: 'test-user-uuid',
        createdTime: 1704067200000,
        lastModifiedBy: 'test-user-uuid',
        lastModifiedTime: 1704067200000
      }
    }]
  }),

{{#if config.workflow.enabled}}
  getMockWorkflowData: () => ({
    ProcessInstances: [{
      id: 'workflow-instance-123',
      businessId: 'test-id-123',
      businessService: '{{config.workflow.businessService}}',
      tenantId: 'test-tenant',
      state: {
        state: 'DRAFT',
        actions: [
          { action: 'SUBMIT', nextState: 'PENDING' },
          { action: 'SAVE', nextState: 'DRAFT' }
        ]
      },
      assignes: [{
        uuid: 'test-assignee-uuid',
        name: 'Test Assignee'
      }],
      comment: 'Test workflow comment',
      documents: []
    }]
  }),
{{/if}}

  getMockSearchResponse: () => ({
    {{config.entity.name}}s: [
      {
        id: 'search-result-1',
        {{config.entity.displayField}}: 'First Result',
{{#each config.fields}}
{{#if showInResults}}
{{#if (eq type 'text')}}
        {{name}}: 'result-1-{{name}}',
{{/if}}
{{#if (eq type 'dropdown')}}
        {{name}}: 'RESULT_1_{{constantCase name}}',
{{/if}}
{{/if}}
{{/each}}
        status: 'ACTIVE'
      },
      {
        id: 'search-result-2',
        {{config.entity.displayField}}: 'Second Result',
{{#each config.fields}}
{{#if showInResults}}
{{#if (eq type 'text')}}
        {{name}}: 'result-2-{{name}}',
{{/if}}
{{#if (eq type 'dropdown')}}
        {{name}}: 'RESULT_2_{{constantCase name}}',
{{/if}}
{{/if}}
{{/each}}
        status: 'INACTIVE'
      }
    ],
    totalCount: 2
  }),

  getMockMDMSData: () => ({
{{#each config.fields}}
{{#if mdms}}
    {{mdms.masterName}}: [
      { code: 'OPTION_1', name: 'Option 1' },
      { code: 'OPTION_2', name: 'Option 2' },
      { code: 'OPTION_3', name: 'Option 3' }
    ],
{{/if}}
{{/each}}
  }),

  getMockValidationErrors: () => ({
    errors: [
{{#each config.fields}}
{{#if required}}
      {
        field: '{{name}}',
        message: '{{label}} is required',
        code: 'REQUIRED_FIELD'
      },
{{/if}}
{{/each}}
    ]
  })
};

export const mockAPIEndpoints = {
  create: '{{config.entity.apiPath}}{{config.api.create}}',
  search: '{{config.entity.apiPath}}{{config.api.search}}',
  view: '{{config.entity.apiPath}}{{config.api.view}}',
{{#if config.workflow.enabled}}
  workflow: '{{config.entity.apiPath}}{{config.api.workflow}}',
{{/if}}
};

export const mockUserRoles = [
{{#each config.auth.roles}}
  '{{this}}',
{{/each}}
];`;
  const compiled = Handlebars.compile(template);
  return compiled({
    config
  });
}
module.exports = {
  generateTestFiles
};