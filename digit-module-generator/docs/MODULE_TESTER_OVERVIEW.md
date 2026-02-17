# Module Testing Portal - Overview

## What Was Created

Instead of copying the entire DIGIT console structure, I've created a **minimal Module Testing Portal** that provides a centralized interface to test all your generated modules.

## Structure Created

```
digit-module-generator/
├── micro-ui/
│   └── web/
│       ├── packages/
│       │   └── modules/
│       │       ├── module-tester/          ✅ NEW - Testing Portal Module
│       │       │   ├── src/
│       │       │   │   ├── components/
│       │       │   │   │   └── ModuleCard.js           # Display card for each module
│       │       │   │   ├── configs/
│       │       │   │   │   └── moduleRegistry.js       # 📝 Register your modules here
│       │       │   │   ├── pages/
│       │       │   │   │   └── ModuleHome.js           # Landing page
│       │       │   │   ├── Module.js
│       │       │   │   └── index.js
│       │       │   ├── package.json
│       │       │   ├── webpack.config.js
│       │       │   ├── .babelrc
│       │       │   └── README.md
│       │       │
│       │       └── project-mgmt/           ✅ UPDATED - Your generated module
│       │           └── src/
│       │               └── index.js        # Added export file
│       │
│       └── builds/
│           └── module-tester/              # Build configuration for testing
│               ├── index.js                # 📝 Import your modules here
│               ├── package.json            # 📝 Add module dependencies here
│               └── public/
│
├── TESTING_GUIDE.md                        ✅ NEW - Complete setup guide
└── MODULE_TESTER_OVERVIEW.md               ✅ NEW - This file
```

## Key Change: Module Generator Output Path

**Updated**: Module generator now outputs directly to `micro-ui/web/packages/modules/`

This means:
- Generated modules are immediately available to the build system
- No need to copy or move files
- Simpler path references in build configuration

## How It Works

### 1. Landing Page (ModuleHome)
```
┌─────────────────────────────────────────────────────┐
│        Module Testing Portal                         │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────────────────────────────────────┐    │
│  │  Project Management                         │    │
│  │  Comprehensive project management system    │    │
│  │                                              │    │
│  │  [Inbox] [Search] [Create] [View]          │    │
│  │                                              │    │
│  │  Code: project-mgmt                         │    │
│  └────────────────────────────────────────────┘    │
│                                                       │
│  ┌────────────────────────────────────────────┐    │
│  │  Inventory Management                       │    │
│  │  Track and manage inventory items           │    │
│  │                                              │    │
│  │  [Inbox] [Search] [Create] [View]          │    │
│  │                                              │    │
│  │  Code: inventory-mgmt                       │    │
│  └────────────────────────────────────────────┘    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 2. Click on Any Screen
When you click a button (e.g., "Inbox"), it navigates to that module's screen.

### 3. Test Your Module
The actual module screen loads and you can test all functionality.

## 3 Steps to Add a New Module

When you generate a new module, you only need to edit **3 files**:

### Step 1: Register the Module
**File**: `micro-ui/web/packages/modules/module-tester/src/configs/moduleRegistry.js`

```javascript
export const moduleRegistry = [
  {
    name: "Your Module Name",
    code: "your-module-code",
    description: "Description of what it does",
    packageName: "@egovernments/digit-ui-module-your-module",
    screens: [
      { name: "Inbox", path: "/digit-ui/employee/your-module/inbox", component: "YourModuleInbox" },
      { name: "Search", path: "/digit-ui/employee/your-module/search", component: "YourModuleSearch" },
      { name: "Create", path: "/digit-ui/employee/your-module/create", component: "YourModuleCreate" },
      { name: "View", path: "/digit-ui/employee/your-module/view", component: "YourModuleView" }
    ]
  }
];
```

### Step 2: Import in Build
**File**: `micro-ui/web/builds/module-tester/index.js`

```javascript
// Add after existing imports
const yourModule = await import("@egovernments/digit-ui-module-your-module")
  .catch(() => null);

if (yourModule?.YourModuleComponents) {
  window.Digit.ComponentRegistryService.setupRegistry({
    ...yourModule.YourModuleComponents,
  });
}
```

### Step 3: Add Dependency
**File**: `micro-ui/web/builds/module-tester/package.json`

```json
{
  "dependencies": {
    "@egovernments/digit-ui-module-your-module": "file:../../packages/modules/your-module"
  }
}
```

Then rebuild and test!

## Build Commands

```bash
# Build modules first
cd micro-ui/web/packages/modules/module-tester
npm install && npm run build

cd ../project-mgmt
npm install && npm run build

# Build the web app
cd ../../
npm install
npm run build:prod

# Serve
npx http-server build -p 8080
```

Visit: `http://localhost:8080`

## Generating New Modules

The module generator now outputs directly to the correct location:

```bash
# From project root
node dist/index.js

# Or with CLI
npm run start
```

New modules will be created in: `micro-ui/web/packages/modules/your-new-module/`

## Key Benefits

✅ **Correct Location** - Modules generated in the right place
✅ **Minimal Setup** - No need to copy entire console
✅ **Clean Structure** - Only what's needed for testing
✅ **Easy to Extend** - 3 file edits to add new modules
✅ **Centralized** - All modules in one portal
✅ **Fast Navigation** - Direct links to all screens
✅ **Auto-Discovery** - Modules automatically appear when registered

## Files You'll Edit Often

1. **`moduleRegistry.js`** - Every time you generate a new module
2. **`builds/module-tester/index.js`** - Every time you add a new module
3. **`builds/module-tester/package.json`** - Every time you add a new module

## Next Steps

1. ✅ Module Testing Portal created
2. ✅ Project Management module configured
3. ✅ Module generator updated to output to correct location
4. 📝 Generate more modules using your module generator
5. 📝 Add them to the testing portal
6. 📝 Test all modules in one place!

For detailed instructions, see [TESTING_GUIDE.md](TESTING_GUIDE.md)
