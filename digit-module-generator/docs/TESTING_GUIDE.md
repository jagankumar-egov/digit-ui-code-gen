# Module Testing Portal - Setup Guide

This guide explains how to use the Module Testing Portal to test your generated DIGIT modules.

## Overview

The Module Testing Portal provides a centralized interface to test all your generated modules without copying the entire DIGIT console structure. It consists of:

1. **module-tester**: A module that provides the testing portal landing page
2. **Build configuration**: Minimal micro-ui setup to run the portal
3. **Module registry**: Configuration to list all your generated modules

## Architecture

```
Module Testing Portal Flow:
┌─────────────────────────────────────────┐
│     Module Testing Portal (Home)        │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ Project Mgmt│  │  Your Module│      │
│  │  - Inbox    │  │  - Inbox    │      │
│  │  - Search   │  │  - Search   │      │
│  │  - Create   │  │  - Create   │      │
│  │  - View     │  │  - View     │      │
│  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────┘
         ↓ Click on any screen
┌─────────────────────────────────────────┐
│    Actual Module Screen (Inbox/etc)     │
│         Your module in action!          │
└─────────────────────────────────────────┘
```

## Quick Start

### Step 1: Install Dependencies

```bash
cd micro-ui/web
npm install
```

This will install all dependencies for the module-tester build, including:
- Core DIGIT UI libraries
- Module tester portal
- Your generated modules (project-mgmt, etc.)

### Step 2: Build the Modules

```bash
# Build module-tester module
cd ../../packages/modules/module-tester
npm install
npm run build

# Build your generated module (project-mgmt)
cd ../project-mgmt
npm install
npm run build

# Go back to web directory
cd ../../../micro-ui/web
```

### Step 3: Build the Application

```bash
npm run build:prod
# or for development
npm run build:dev
```

### Step 4: Serve the Application

You can use any static server to serve the built files:

```bash
# Using Python
cd build
python3 -m http.server 8080

# Using Node's http-server
npx http-server build -p 8080

# Using nginx (configured in docker/nginx.conf)
```

Visit: `http://localhost:8080`

## Adding New Generated Modules

When you generate a new module (e.g., "inventory-mgmt"), follow these steps:

### 1. Generate Your Module

Use the module generator to create your module:
```bash
node dist/index.js
# Follow prompts to generate "inventory-mgmt" module
```

This creates: `packages/modules/inventory-mgmt/`

### 2. Add to Module Registry

Edit `packages/modules/module-tester/src/configs/moduleRegistry.js`:

```javascript
export const moduleRegistry = [
  {
    name: "Project Management",
    code: "project-mgmt",
    description: "Comprehensive project management and tracking system",
    packageName: "@egovernments/digit-ui-module-project-mgmt",
    screens: [
      { name: "Inbox", path: "/digit-ui/employee/project-mgmt/inbox", component: "ProjectInbox" },
      { name: "Search", path: "/digit-ui/employee/project-mgmt/search", component: "ProjectSearch" },
      { name: "Create", path: "/digit-ui/employee/project-mgmt/create", component: "ProjectCreate" },
      { name: "View", path: "/digit-ui/employee/project-mgmt/view", component: "ProjectView" }
    ]
  },
  // ADD YOUR NEW MODULE HERE
  {
    name: "Inventory Management",
    code: "inventory-mgmt",
    description: "Track and manage inventory items",
    packageName: "@egovernments/digit-ui-module-inventory-mgmt",
    screens: [
      { name: "Inbox", path: "/digit-ui/employee/inventory-mgmt/inbox", component: "InventoryInbox" },
      { name: "Search", path: "/digit-ui/employee/inventory-mgmt/search", component: "InventorySearch" },
      { name: "Create", path: "/digit-ui/employee/inventory-mgmt/create", component: "InventoryCreate" },
      { name: "View", path: "/digit-ui/employee/inventory-mgmt/view", component: "InventoryView" }
    ]
  }
];
```

### 3. Import in Build Configuration

Edit `micro-ui/web/builds/module-tester/index.js`:

Add the import after existing module imports:

```javascript
// Load generated modules for testing
const projectMgmtModule = await import(/* webpackChunkName: "project-mgmt" */ "@egovernments/digit-ui-module-project-mgmt")
  .catch(() => null);

if (projectMgmtModule?.ProjectModuleComponents) {
  window.Digit.ComponentRegistryService.setupRegistry({
    ...projectMgmtModule.ProjectModuleComponents,
  });
}

// ADD YOUR NEW MODULE HERE
const inventoryMgmtModule = await import(/* webpackChunkName: "inventory-mgmt" */ "@egovernments/digit-ui-module-inventory-mgmt")
  .catch(() => null);

if (inventoryMgmtModule?.InventoryModuleComponents) {
  window.Digit.ComponentRegistryService.setupRegistry({
    ...inventoryMgmtModule.InventoryModuleComponents,
  });
}
```

Also update the enabledModules array:
```javascript
const enabledModules = ["ModuleTester", "ProjectMgmt", "InventoryMgmt"];
```

### 4. Add Module Dependency

Edit `micro-ui/web/builds/module-tester/package.json`:

```json
{
  "dependencies": {
    "@egovernments/digit-ui-libraries": "2.0.0-dev-08",
    "@egovernments/digit-ui-module-core": "2.0.0-dev-08",
    "@egovernments/digit-ui-module-sample": "file:../../../../packages/modules/module-tester",
    "@egovernments/digit-ui-module-project-mgmt": "file:../../../../packages/modules/project-mgmt",
    "@egovernments/digit-ui-module-inventory-mgmt": "file:../../../../packages/modules/inventory-mgmt"
  }
}
```

### 5. Rebuild Everything

```bash
# Build the new module
cd packages/modules/inventory-mgmt
npm install
npm run build

# Rebuild module-tester (if registry was updated)
cd ../module-tester
npm run build

# Rebuild the application
cd ../../../micro-ui/web
npm install  # Picks up new dependency
npm run build:prod
```

### 6. Test Your Module

1. Start the server: `npx http-server build -p 8080`
2. Open browser: `http://localhost:8080`
3. You should see your new "Inventory Management" card
4. Click on any screen to test it!

## Docker Build

The Dockerfile supports building the module-tester variant:

```bash
cd micro-ui
docker build \
  --build-arg BUILD_VARIANT=module-tester \
  -t digit-module-tester:latest \
  -f web/docker/Dockerfile .
```

Run the container:
```bash
docker run -p 8080:80 digit-module-tester:latest
```

## Troubleshooting

### Module Not Showing Up

1. Check `moduleRegistry.js` - Is your module added?
2. Check `builds/module-tester/index.js` - Is it imported?
3. Check `builds/module-tester/package.json` - Is dependency added?
4. Rebuild: `npm install && npm run build:prod`

### Component Not Found Error

1. Ensure your module's `Module.js` exports components correctly:
   ```javascript
   export { YourModuleComponents };
   ```
2. Ensure component names match in registry
3. Rebuild your module: `cd packages/modules/your-module && npm run build`

### Navigation Not Working

1. Check path in `moduleRegistry.js` matches your module's routes
2. Ensure components are registered in build `index.js`
3. Check browser console for errors

## File Structure

```
digit-module-generator/
├── packages/
│   └── modules/
│       ├── module-tester/          # Testing portal module
│       │   ├── src/
│       │   │   ├── components/
│       │   │   │   └── ModuleCard.js
│       │   │   ├── configs/
│       │   │   │   └── moduleRegistry.js  ← Add modules here
│       │   │   ├── pages/
│       │   │   │   └── ModuleHome.js
│       │   │   ├── Module.js
│       │   │   └── index.js
│       │   └── package.json
│       ├── project-mgmt/           # Your generated module
│       └── inventory-mgmt/         # Another generated module
│
└── micro-ui/
    └── web/
        ├── builds/
        │   └── module-tester/
        │       ├── index.js        ← Import modules here
        │       └── package.json    ← Add dependencies here
        └── docker/
            └── Dockerfile
```

## Benefits of This Approach

1. **No Full Console Copy**: Only the minimal micro-ui structure needed
2. **Easy Module Addition**: Just edit 3 files to add a new module
3. **Centralized Testing**: All modules in one place
4. **Quick Navigation**: Direct links to all screens
5. **Scalable**: Add as many modules as you want
6. **Docker Ready**: Can be containerized easily

## Next Steps

- Generate more modules using the module generator
- Add them to the testing portal using the steps above
- Test all your modules in one unified interface
- Build and deploy using Docker when ready for production testing

Happy Testing! 🚀
