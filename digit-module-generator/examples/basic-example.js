#!/usr/bin/env node

/**
 * Basic Example: Employee Management System
 * 
 * This example demonstrates how to create a complete employee management
 * module using the DIGIT Module Generator.
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🚀 DIGIT Module Generator - Basic Example');
console.log('=========================================\n');

async function runExample() {
  try {
    // Example 1: Create from template
    console.log('📝 Example 1: Creating Employee Management Module from Template\n');
    
    await runCommand('digit-gen', [
      'create',
      '--template', 'hrms',
      '--entity', 'Employee',
      '--output', './examples/generated/employee-mgmt',
      '--force'
    ]);

    console.log('✅ Employee management module created successfully!\n');

    // Example 2: Create custom module with configuration
    console.log('📝 Example 2: Creating Custom Module with Configuration\n');
    
    const customConfig = createCustomConfig();
    const configPath = './examples/vehicle-config.json';
    
    await fs.writeJson(configPath, customConfig, { spaces: 2 });
    console.log(`📄 Created configuration file: ${configPath}`);

    await runCommand('digit-gen', [
      'create',
      '--config', configPath,
      '--output', './examples/generated/vehicle-mgmt',
      '--force'
    ]);

    console.log('✅ Vehicle management module created successfully!\n');

    // Example 3: Generate specific screens
    console.log('📝 Example 3: Generating Specific Screens Only\n');
    
    await runCommand('digit-gen', [
      'screen', 'create',
      '--entity', 'Project',
      '--output', './examples/generated/project-create',
      '--force'
    ]);

    await runCommand('digit-gen', [
      'screen', 'search', 
      '--entity', 'Project',
      '--output', './examples/generated/project-search',
      '--force'
    ]);

    console.log('✅ Project screens created successfully!\n');

    // Example 4: Generate utilities
    console.log('📝 Example 4: Generating Utility Functions\n');

    const utilsConfig = createUtilsConfig();
    const utilsConfigPath = './examples/utils-config.json';
    
    await fs.writeJson(utilsConfigPath, utilsConfig, { spaces: 2 });

    await runCommand('digit-gen', [
      'utils',
      '--entity', 'Document',
      '--config', utilsConfigPath,
      '--output', './examples/generated/document-utils'
    ]);

    console.log('✅ Document utilities created successfully!\n');

    // Example 5: Generate i18n files
    console.log('📝 Example 5: Generating Internationalization Files\n');

    await runCommand('digit-gen', [
      'i18n',
      '--config', configPath,
      '--languages', 'en_IN,hi_IN',
      '--output', './examples/generated/i18n'
    ]);

    console.log('✅ Internationalization files created successfully!\n');

    // Show summary
    showSummary();

  } catch (error) {
    console.error('❌ Error running example:', error.message);
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

function createCustomConfig() {
  return {
    module: {
      name: 'Vehicle Management',
      code: 'vehicle-mgmt',
      description: 'Comprehensive vehicle management system',
      version: '1.0.0'
    },
    entity: {
      name: 'Vehicle',
      apiPath: '/vehicle-service/v1',
      primaryKey: 'vehicleId',
      displayField: 'registrationNumber'
    },
    screens: {
      create: {
        enabled: true,
        roles: ['VEHICLE_ADMIN', 'FLEET_MANAGER']
      },
      search: {
        enabled: true,
        roles: ['VEHICLE_ADMIN', 'VEHICLE_VIEWER', 'FLEET_MANAGER'],
        filters: ['vehicleType', 'status', 'registrationDate'],
        minSearchFields: 1,
        showFooter: true
      },
      view: {
        enabled: true,
        roles: ['VEHICLE_ADMIN', 'VEHICLE_VIEWER', 'FLEET_MANAGER'],
        sections: ['basic', 'registration', 'maintenance']
      },
      response: {
        enabled: true,
        types: ['basic']
      }
    },
    fields: [
      {
        name: 'registrationNumber',
        type: 'text',
        label: 'Registration Number',
        required: true,
        searchable: true,
        showInResults: true,
        showInView: true,
        validation: {
          pattern: '^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$',
          maxLength: 10
        }
      },
      {
        name: 'vehicleType',
        type: 'dropdown',
        label: 'Vehicle Type',
        required: true,
        searchable: true,
        filterable: true,
        showInResults: true,
        showInView: true,
        options: [
          { code: 'CAR', name: 'Car' },
          { code: 'BIKE', name: 'Bike' },
          { code: 'TRUCK', name: 'Truck' },
          { code: 'BUS', name: 'Bus' }
        ]
      },
      {
        name: 'make',
        type: 'text',
        label: 'Make',
        required: true,
        showInView: true,
        validation: {
          maxLength: 50
        }
      },
      {
        name: 'model',
        type: 'text',
        label: 'Model',
        required: true,
        showInView: true,
        validation: {
          maxLength: 50
        }
      },
      {
        name: 'year',
        type: 'number',
        label: 'Year of Manufacture',
        required: true,
        showInView: true,
        validation: {
          min: 1900,
          max: new Date().getFullYear() + 1
        }
      },
      {
        name: 'registrationDate',
        type: 'date',
        label: 'Registration Date',
        required: true,
        filterable: true,
        showInView: true
      },
      {
        name: 'status',
        type: 'dropdown',
        label: 'Status',
        required: true,
        filterable: true,
        showInResults: true,
        showInView: true,
        options: [
          { code: 'ACTIVE', name: 'Active' },
          { code: 'INACTIVE', name: 'Inactive' },
          { code: 'MAINTENANCE', name: 'Under Maintenance' },
          { code: 'RETIRED', name: 'Retired' }
        ]
      },
      {
        name: 'fuelType',
        type: 'dropdown',
        label: 'Fuel Type',
        required: true,
        showInView: true,
        options: [
          { code: 'PETROL', name: 'Petrol' },
          { code: 'DIESEL', name: 'Diesel' },
          { code: 'CNG', name: 'CNG' },
          { code: 'ELECTRIC', name: 'Electric' }
        ]
      },
      {
        name: 'seatingCapacity',
        type: 'number',
        label: 'Seating Capacity',
        required: false,
        showInView: true,
        validation: {
          min: 1,
          max: 100
        }
      },
      {
        name: 'insuranceNumber',
        type: 'text',
        label: 'Insurance Policy Number',
        required: false,
        showInView: true,
        validation: {
          maxLength: 50
        }
      },
      {
        name: 'insuranceExpiryDate',
        type: 'date',
        label: 'Insurance Expiry Date',
        required: false,
        showInView: true
      }
    ],
    api: {
      create: '/vehicle/_create',
      update: '/vehicle/_update',
      search: '/vehicle/_search',
      view: '/vehicle/{id}'
    },
    auth: {
      required: true,
      roles: ['VEHICLE_ADMIN', 'VEHICLE_VIEWER', 'FLEET_MANAGER']
    },
    workflow: {
      enabled: false
    },
    i18n: {
      prefix: 'VEHICLE_',
      generateKeys: true
    }
  };
}

function createUtilsConfig() {
  return {
    module: {
      name: 'Document Management',
      code: 'document-mgmt'
    },
    entity: {
      name: 'Document',
      apiPath: '/document-service/v1',
      primaryKey: 'documentId',
      displayField: 'documentName'
    },
    fields: [
      {
        name: 'documentName',
        type: 'text',
        label: 'Document Name',
        required: true
      },
      {
        name: 'documentType',
        type: 'dropdown',
        label: 'Document Type',
        required: true,
        options: [
          { code: 'PDF', name: 'PDF' },
          { code: 'WORD', name: 'Word Document' },
          { code: 'EXCEL', name: 'Excel Sheet' }
        ]
      },
      {
        name: 'fileSize',
        type: 'number',
        label: 'File Size (MB)',
        required: false
      },
      {
        name: 'uploadDate',
        type: 'date',
        label: 'Upload Date',
        required: true
      }
    ],
    api: {
      create: '/document/_create',
      search: '/document/_search'
    },
    i18n: {
      prefix: 'DOC_'
    }
  };
}

function showSummary() {
  console.log('\n🎉 Examples Completed Successfully!');
  console.log('=====================================\n');
  
  console.log('📁 Generated Files:');
  console.log('   📂 examples/generated/employee-mgmt/     - Complete HRMS module');
  console.log('   📂 examples/generated/vehicle-mgmt/      - Custom vehicle management');
  console.log('   📂 examples/generated/project-create/    - Project create screen');
  console.log('   📂 examples/generated/project-search/    - Project search screen');
  console.log('   📂 examples/generated/document-utils/    - Document utility functions');
  console.log('   📂 examples/generated/i18n/              - Internationalization files\n');
  
  console.log('📖 What you can do next:');
  console.log('   1. Explore the generated modules');
  console.log('   2. Run npm install in generated directories');
  console.log('   3. Integrate modules into your DIGIT application');
  console.log('   4. Customize configurations for your needs');
  console.log('   5. Run tests with npm test\n');
  
  console.log('💡 Try more commands:');
  console.log('   digit-gen templates --detailed           - Explore available templates');
  console.log('   digit-gen validate --config config.json  - Validate configurations');
  console.log('   digit-gen diff --template "hrms inventory" - Compare templates');
  console.log('   digit-gen migrate --module old-module    - Migrate existing modules\n');
  
  console.log('📚 Documentation: https://digit-module-generator.docs.dev');
  console.log('🐛 Issues: https://github.com/egovernments/digit-module-generator/issues');
  console.log('💬 Community: https://discord.gg/digit-developers\n');
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample();
}

module.exports = { runExample };