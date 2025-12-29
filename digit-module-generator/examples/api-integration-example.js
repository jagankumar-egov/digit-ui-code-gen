#!/usr/bin/env node

/**
 * API Integration Example
 * 
 * This example demonstrates how to generate modules from OpenAPI/Swagger
 * specifications and integrate with existing APIs.
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🔌 DIGIT Module Generator - API Integration Example');
console.log('===================================================\n');

async function runApiExample() {
  try {
    // Create sample OpenAPI specification
    console.log('📝 Step 1: Creating Sample OpenAPI Specification\n');
    
    const openApiSpec = createSampleOpenApiSpec();
    const specPath = './examples/sample-api.json';
    
    await fs.writeJson(specPath, openApiSpec, { spaces: 2 });
    console.log(`📄 Created OpenAPI spec: ${specPath}\n`);

    // Generate module from API spec
    console.log('📝 Step 2: Generating Module from OpenAPI Specification\n');
    
    await runCommand('digit-gen', [
      'create',
      '--api-spec', specPath,
      '--entity', 'User',
      '--output', './examples/generated/api-user-mgmt',
      '--force'
    ]);

    console.log('✅ User management module generated from API spec!\n');

    // Create advanced API spec with complex schemas
    console.log('📝 Step 3: Creating Advanced OpenAPI Specification\n');
    
    const advancedSpec = createAdvancedOpenApiSpec();
    const advancedSpecPath = './examples/advanced-api.json';
    
    await fs.writeJson(advancedSpecPath, advancedSpec, { spaces: 2 });
    console.log(`📄 Created advanced OpenAPI spec: ${advancedSpecPath}\n`);

    // Generate complex module
    console.log('📝 Step 4: Generating Complex Module from Advanced API\n');
    
    await runCommand('digit-gen', [
      'create',
      '--api-spec', advancedSpecPath,
      '--entity', 'Order',
      '--screens', 'create,search,view,response',
      '--output', './examples/generated/api-order-mgmt',
      '--force'
    ]);

    console.log('✅ Order management module generated from advanced API spec!\n');

    // Validate generated configuration against API spec
    console.log('📝 Step 5: Validating Configuration Against API Specification\n');
    
    await runCommand('digit-gen', [
      'validate',
      '--config', './examples/generated/api-order-mgmt/module-config.json',
      '--api-spec', advancedSpecPath
    ]);

    console.log('✅ Configuration validated against API specification!\n');

    // Generate API client
    console.log('📝 Step 6: Generating API Service Integration\n');
    
    const serviceIntegration = createApiServiceIntegration();
    const servicePath = './examples/generated/api-integration-service.js';
    
    await fs.writeFile(servicePath, serviceIntegration);
    console.log(`📄 Created API service integration: ${servicePath}\n`);

    // Show integration guide
    showIntegrationGuide();

  } catch (error) {
    console.error('❌ Error running API integration example:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, { 
      stdio: 'inherit',
      cwd: __dirname 
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

function createSampleOpenApiSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'Simple user management API for demonstration'
    },
    servers: [
      {
        url: 'https://api.example.com/v1',
        description: 'Production server'
      }
    ],
    paths: {
      '/users': {
        post: {
          summary: 'Create a new user',
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponse' }
                }
              }
            }
          }
        },
        get: {
          summary: 'Search users',
          parameters: [
            {
              name: 'name',
              in: 'query',
              schema: { type: 'string' }
            },
            {
              name: 'email',
              in: 'query',
              schema: { type: 'string', format: 'email' }
            },
            {
              name: 'status',
              in: 'query',
              schema: { 
                type: 'string',
                enum: ['ACTIVE', 'INACTIVE']
              }
            }
          ],
          responses: {
            '200': {
              description: 'Users retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      },
                      totalCount: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/users/{id}': {
        get: {
          summary: 'Get user by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'User details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              pattern: '^[A-Za-z\\s]+$',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            phone: {
              type: 'string',
              pattern: '^[0-9]{10}$',
              description: 'User mobile number'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'USER', 'MANAGER'],
              description: 'User role'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              default: 'ACTIVE',
              description: 'User status'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'User date of birth'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            },
            profilePicture: {
              type: 'string',
              format: 'uri',
              description: 'Profile picture URL'
            }
          }
        },
        UserCreateRequest: {
          type: 'object',
          required: ['name', 'email', 'role'],
          properties: {
            name: { $ref: '#/components/schemas/User/properties/name' },
            email: { $ref: '#/components/schemas/User/properties/email' },
            phone: { $ref: '#/components/schemas/User/properties/phone' },
            role: { $ref: '#/components/schemas/User/properties/role' },
            dateOfBirth: { $ref: '#/components/schemas/User/properties/dateOfBirth' }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            message: { type: 'string' }
          }
        }
      }
    }
  };
}

function createAdvancedOpenApiSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Advanced Order Management API',
      version: '2.0.0',
      description: 'Complex order management system with nested objects and relationships'
    },
    servers: [
      {
        url: 'https://api.orders.com/v2'
      }
    ],
    paths: {
      '/orders': {
        post: {
          summary: 'Create order',
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OrderCreateRequest' }
              }
            }
          }
        },
        get: {
          summary: 'Search orders',
          parameters: [
            { name: 'customerId', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/OrderStatus' } },
            { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } }
          ]
        }
      }
    },
    components: {
      schemas: {
        Order: {
          type: 'object',
          required: ['customerInfo', 'items', 'totalAmount'],
          properties: {
            id: { type: 'string' },
            orderNumber: {
              type: 'string',
              pattern: '^ORD-[0-9]{8}$',
              description: 'Order reference number'
            },
            customerInfo: { $ref: '#/components/schemas/CustomerInfo' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
              minItems: 1,
              maxItems: 50
            },
            totalAmount: {
              type: 'number',
              minimum: 0.01,
              maximum: 1000000,
              multipleOf: 0.01,
              description: 'Total order amount'
            },
            currency: {
              type: 'string',
              enum: ['USD', 'EUR', 'INR'],
              default: 'INR'
            },
            status: { $ref: '#/components/schemas/OrderStatus' },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            billingAddress: { $ref: '#/components/schemas/Address' },
            orderDate: {
              type: 'string',
              format: 'date-time'
            },
            deliveryDate: {
              type: 'string',
              format: 'date'
            },
            notes: {
              type: 'string',
              maxLength: 1000
            },
            metadata: {
              type: 'object',
              additionalProperties: true
            }
          }
        },
        CustomerInfo: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$'
            },
            customerType: {
              type: 'string',
              enum: ['INDIVIDUAL', 'BUSINESS']
            }
          }
        },
        OrderItem: {
          type: 'object',
          required: ['productId', 'quantity', 'unitPrice'],
          properties: {
            productId: { type: 'string' },
            productName: { type: 'string' },
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 1000
            },
            unitPrice: {
              type: 'number',
              minimum: 0.01,
              multipleOf: 0.01
            },
            discount: {
              type: 'number',
              minimum: 0,
              maximum: 100
            },
            taxRate: {
              type: 'number',
              minimum: 0,
              maximum: 50
            }
          }
        },
        Address: {
          type: 'object',
          required: ['street', 'city', 'country'],
          properties: {
            street: { type: 'string', maxLength: 200 },
            city: { type: 'string', maxLength: 100 },
            state: { type: 'string', maxLength: 100 },
            country: { type: 'string', minLength: 2, maxLength: 2 },
            postalCode: {
              type: 'string',
              pattern: '^[0-9]{5,6}$'
            }
          }
        },
        OrderStatus: {
          type: 'string',
          enum: [
            'DRAFT',
            'PENDING',
            'CONFIRMED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
            'REFUNDED'
          ]
        },
        OrderCreateRequest: {
          allOf: [
            { $ref: '#/components/schemas/Order' },
            {
              type: 'object',
              properties: {
                id: false,
                orderNumber: false,
                status: false
              }
            }
          ]
        }
      }
    }
  };
}

function createApiServiceIntegration() {
  return `/**
 * API Service Integration Example
 * 
 * This file demonstrates how to integrate generated modules with
 * actual API endpoints and handle authentication, error handling,
 * and data transformation.
 */

import axios from 'axios';

// API Client Configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://api.example.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    
    // Add tenant ID from current context
    const tenantId = Digit.ULBService.getCurrentTenantId();
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      Digit.Utils.toast.error('You do not have permission to perform this action');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      Digit.Utils.toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

/**
 * User Service - Generated from OpenAPI spec
 */
export class UserService {
  
  static async create(userData) {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
  
  static async search(searchParams) {
    try {
      const response = await apiClient.get('/users', { params: searchParams });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
  
  static async getById(id) {
    try {
      const response = await apiClient.get(\`/users/\${id}\`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
  
  static async update(id, userData) {
    try {
      const response = await apiClient.put(\`/users/\${id}\`, userData);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
  
  static async delete(id) {
    try {
      const response = await apiClient.delete(\`/users/\${id}\`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
  
  static handleApiError(error) {
    const message = error.response?.data?.message || 
                   error.response?.statusText || 
                   error.message || 
                   'An unexpected error occurred';
    
    return new Error(message);
  }
}

/**
 * Integration with generated utility functions
 */
export class IntegratedUserService {
  
  static async createUser(formData, tenantId, userInfo) {
    // Use generated transformation utility
    const transformedData = transformUserCreateData(formData, tenantId, userInfo);
    
    // Validate before API call
    const validation = validateTransformedData(transformedData, [
      'name', 'email', 'role'
    ]);
    
    if (!validation.isValid) {
      throw new Error(\`Validation failed: \${validation.errors.join(', ')}\`);
    }
    
    // Call API
    return await UserService.create(transformedData);
  }
  
  static async searchUsers(searchParams, tenantId) {
    // Use generated search utility
    const apiSearchParams = transformSearchParams(searchParams, tenantId);
    
    // Call API
    const response = await UserService.search(apiSearchParams);
    
    // Format results using generated utility
    return formatSearchResults(response);
  }
}

/**
 * React Hook for API integration
 */
export const useUserAPI = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info;
  
  const createUser = async (formData) => {
    return await IntegratedUserService.createUser(formData, tenantId, userInfo);
  };
  
  const searchUsers = async (searchParams) => {
    return await IntegratedUserService.searchUsers(searchParams, tenantId);
  };
  
  const getUser = async (id) => {
    return await UserService.getById(id);
  };
  
  return {
    createUser,
    searchUsers,
    getUser
  };
};

/**
 * Error boundary for API errors
 */
export class APIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('API Error:', error, errorInfo);
    
    // Log to monitoring service
    if (window.analytics) {
      window.analytics.track('API Error', {
        error: error.message,
        stack: error.stack,
        errorInfo
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="api-error-fallback">
          <h2>Something went wrong with the API</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

/**
 * Configuration for different environments
 */
export const apiConfig = {
  development: {
    baseURL: 'http://localhost:3001/api/v1',
    timeout: 30000,
    retries: 3
  },
  staging: {
    baseURL: 'https://staging-api.example.com/v1',
    timeout: 15000,
    retries: 2
  },
  production: {
    baseURL: 'https://api.example.com/v1',
    timeout: 10000,
    retries: 1
  }
};

// Initialize API client based on environment
const env = process.env.NODE_ENV || 'development';
const config = apiConfig[env];

if (config) {
  Object.assign(apiClient.defaults, config);
}

export default apiClient;`;
}

function showIntegrationGuide() {
  console.log('\n🎉 API Integration Example Completed!');
  console.log('=====================================\n');
  
  console.log('📁 Generated Files:');
  console.log('   📄 examples/sample-api.json                  - Basic OpenAPI specification');
  console.log('   📄 examples/advanced-api.json                - Advanced OpenAPI specification');
  console.log('   📂 examples/generated/api-user-mgmt/         - Module from basic API spec');
  console.log('   📂 examples/generated/api-order-mgmt/        - Module from advanced API spec');
  console.log('   📄 examples/generated/api-integration-service.js - API service integration\n');
  
  console.log('🔌 API Integration Features Demonstrated:');
  console.log('   ✅ OpenAPI/Swagger specification parsing');
  console.log('   ✅ Automatic field type mapping');
  console.log('   ✅ Validation rule extraction');
  console.log('   ✅ Complex nested object handling');
  console.log('   ✅ Enum and constraint support');
  console.log('   ✅ Authentication and error handling');
  console.log('   ✅ Environment-specific configuration\n');
  
  console.log('📖 Integration Steps:');
  console.log('   1. ✅ Create OpenAPI specification');
  console.log('   2. ✅ Generate module from API spec');
  console.log('   3. ✅ Validate configuration against spec');
  console.log('   4. ✅ Create API service integration');
  console.log('   5. 🔄 Test API endpoints');
  console.log('   6. 🔄 Deploy and monitor\n');
  
  console.log('🚀 Next Steps:');
  console.log('   • Update API endpoints in service integration');
  console.log('   • Add authentication tokens and headers');
  console.log('   • Implement error handling and retries');
  console.log('   • Add API response caching');
  console.log('   • Set up API monitoring and logging');
  console.log('   • Write integration tests\n');
  
  console.log('💡 Advanced Features:');
  console.log('   • Use --api-spec with remote URLs');
  console.log('   • Generate multiple entities from one spec');
  console.log('   • Customize field mappings and transformations');
  console.log('   • Integrate with API gateways and proxies');
  console.log('   • Handle versioned APIs and backward compatibility\n');
  
  console.log('🔗 Resources:');
  console.log('   📚 OpenAPI Specification: https://swagger.io/specification/');
  console.log('   🛠️  API Design Guide: https://digit-api-design.docs.dev');
  console.log('   📖 Integration Docs: https://digit-module-generator.docs.dev/api-integration');
}

// Run the example if this file is executed directly
if (require.main === module) {
  runApiExample();
}

module.exports = { runApiExample };