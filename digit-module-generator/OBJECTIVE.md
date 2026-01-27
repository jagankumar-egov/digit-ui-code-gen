DIGIT Module Generator - Scope and Objective Document                                                                 
                                                                                                                        
  1. Executive Summary                                                                                                  
                                                                                                                        
  The DIGIT Module Generator is a Command Line Interface (CLI) tool designed to accelerate the development of DIGIT     
  micro-ui modules by automating code generation based on templates, prompts, and API specifications. It eliminates     
  repetitive boilerplate code and ensures consistency across all generated modules within the DIGIT ecosystem.          
                                                                                                                        
  ---                                                                                                                   
  2. Project Objectives                                                                                                 
                                                                                                                        
  2.1 Primary Objectives                                                                                                
  Objective: Accelerate Development                                                                                     
  Description: Reduce module development time by automating the generation of standardized screen components,           
    configurations, hooks, and utilities                                                                                
  ────────────────────────────────────────                                                                              
  Objective: Ensure Consistency                                                                                         
  Description: Enforce consistent coding patterns, architecture, and best practices across all DIGIT frontend modules   
  ────────────────────────────────────────                                                                              
  Objective: Reduce Errors                                                                                              
  Description: Minimize human error by generating validated, tested code structures from API specifications             
  ────────────────────────────────────────                                                                              
  Objective: Lower Entry Barrier                                                                                        
  Description: Enable developers with minimal DIGIT experience to create compliant modules quickly                      
  2.2 Secondary Objectives                                                                                              
                                                                                                                        
  - Provide seamless integration with OpenAPI/Swagger specifications                                                    
  - Support modern React 19 and React Router v6 patterns                                                                
  - Generate internationalization (i18n) keys automatically                                                             
  - Enable role-based access control configuration                                                                      
  - Support workflow integration out-of-the-box                                                                         
                                                                                                                        
  ---                                                                                                                   
  3. Scope                                                                                                              
                                                                                                                        
  3.1 In-Scope Features                                                                                                 
                                                                                                                        
  3.1.1 CLI Commands                                                                                                    
  ┌─────────────────────┬──────────────────────────────────────────────────┐                                            
  │       Command       │                     Purpose                      │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen create    │ Generate complete DIGIT modules with all screens │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen screen    │ Generate individual screen components            │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen utils     │ Generate utility functions                       │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen i18n      │ Generate localization files                      │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen templates │ List available module templates                  │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen validate  │ Validate configuration files                     │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen migrate   │ Migrate existing modules to newer versions       │                                            
  ├─────────────────────┼──────────────────────────────────────────────────┤                                            
  │ digit-gen diff      │ Compare template versions                        │                                            
  └─────────────────────┴──────────────────────────────────────────────────┘                                            
  3.1.2 Screen Types Generation                                                                                         
  ┌─────────────┬─────────────────────────────────────────────────────────────┐                                         
  │ Screen Type │                         Description                         │                                         
  ├─────────────┼─────────────────────────────────────────────────────────────┤                                         
  │ Create      │ Form-based screens using FormComposerV2 for entity creation │                                         
  ├─────────────┼─────────────────────────────────────────────────────────────┤                                         
  │ Search      │ Search screens with filters using CommonScreen pattern      │                                         
  ├─────────────┼─────────────────────────────────────────────────────────────┤                                         
  │ Inbox       │ Workflow-enabled inbox screens for task management          │                                         
  ├─────────────┼─────────────────────────────────────────────────────────────┤                                         
  │ View        │ Detail view screens with section-based layouts              │                                         
  ├─────────────┼─────────────────────────────────────────────────────────────┤                                         
  │ Response    │ Acknowledgement/response screens after operations           │                                         
  └─────────────┴─────────────────────────────────────────────────────────────┘                                         
  3.1.3 Generated Artifacts                                                                                             
                                                                                                                        
  - Pages: React components for each screen type                                                                        
  - Configs: Screen configuration files (create, search, inbox, view)                                                   
  - Hooks: Custom React hooks for API interactions                                                                      
  - Utils: Utility functions (createUtils, searchUtils, responseUtils)                                                  
  - Services: API service layer                                                                                         
  - Components: Reusable UI components                                                                                  
  - Localization: i18n JSON files (en_IN, hi_IN)                                                                        
  - Tests: Basic test files for screens and utilities                                                                   
                                                                                                                        
  3.1.4 Input Methods                                                                                                   
                                                                                                                        
  - Interactive CLI prompts                                                                                             
  - JSON configuration files                                                                                            
  - OpenAPI/Swagger API specifications                                                                                  
  - Pre-built templates (hrms, project-mgmt, inventory, etc.)                                                           
                                                                                                                        
  3.1.5 Integration Features                                                                                            
                                                                                                                        
  - DIGIT API Hooks (useCustomAPIHook, useCustomAPIMutationHook)                                                        
  - MDMS (Master Data Management System) integration                                                                    
  - Workflow business service integration                                                                               
  - Role-based access control                                                                                           
  - Multi-tenant support via tenantId                                                                                   
                                                                                                                        
  3.2 Out-of-Scope                                                                                                      
  ┌────────────────────────────────────┬─────────────────────────────────────────────┐                                  
  │                Item                │                  Rationale                  │                                  
  ├────────────────────────────────────┼─────────────────────────────────────────────┤                                  
  │ Backend API generation             │ Focus is on frontend module generation only │                                  
  ├────────────────────────────────────┼─────────────────────────────────────────────┤                                  
  │ Database schema generation         │ Outside the frontend domain                 │                                  
  ├────────────────────────────────────┼─────────────────────────────────────────────┤                                  
  │ Visual/GUI-based form builder      │ Planned for future roadmap                  │                                  
  ├────────────────────────────────────┼─────────────────────────────────────────────┤                                  
  │ Auto-deployment to DIGIT instances │ Planned for future roadmap                  │                                  
  ├────────────────────────────────────┼─────────────────────────────────────────────┤                                  
  │ Custom component library creation  │ Uses existing DIGIT UI component library    │                                  
  ├────────────────────────────────────┼─────────────────────────────────────────────┤                                  
  │ CI/CD pipeline generation          │ Deployment concerns are separate            │                                  
  └────────────────────────────────────┴─────────────────────────────────────────────┘                                  
  ---                                                                                                                   
  4. Technical Specifications                                                                                           
                                                                                                                        
  4.1 Technology Stack                                                                                                  
  ┌─────────────────────────────────────────┬─────────────────┐                                                         
  │               Technology                │     Version     │                                                         
  ├─────────────────────────────────────────┼─────────────────┤                                                         
  │ React                                   │ 19.0.0          │                                                         
  ├─────────────────────────────────────────┼─────────────────┤                                                         
  │ React Router                            │ 6.25.1          │                                                         
  ├─────────────────────────────────────────┼─────────────────┤                                                         
  │ react-i18next                           │ 15.0.0          │                                                         
  ├─────────────────────────────────────────┼─────────────────┤                                                         
  │ @egovernments/digit-ui-components       │ 2.0.0-dev-19    │                                                         
  ├─────────────────────────────────────────┼─────────────────┤                                                         
  │ @egovernments/digit-ui-react-components │ 2.0.0-dev-02    │                                                         
  ├─────────────────────────────────────────┼─────────────────┤                                                         
  │ Handlebars                              │ Template engine │                                                         
  └─────────────────────────────────────────┴─────────────────┘                                                         
  4.2 Supported Field Types                                                                                             
  ┌────────────────┬───────────────┐                                                                                    
  │    API Type    │ UI Field Type │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ string         │ text          │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ number/integer │ number        │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ boolean        │ checkbox      │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ date           │ date          │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ date-time      │ datetime      │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ email          │ email         │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ uri            │ url           │                                                                                    
  ├────────────────┼───────────────┤                                                                                    
  │ enum           │ dropdown      │                                                                                    
  └────────────────┴───────────────┘                                                                                    
  4.3 API Specification Support                                                                                         
                                                                                                                        
  - OpenAPI 3.x specification parsing                                                                                   
  - Swagger 2.x specification parsing                                                                                   
  - Schema property to form field mapping                                                                               
  - Validation rule extraction (patterns, min/max, required)                                                            
  - Enum to dropdown conversion                                                                                         
                                                                                                                        
  ---                                                                                                                   
  5. Deliverables                                                                                                       
  ┌──────────────────────┬────────────────────────────────────────────────────────────────┐                             
  │     Deliverable      │                          Description                           │                             
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤                             
  │ CLI Package          │ Publishable npm package (@egovernments/digit-module-generator) │                             
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤                             
  │ Template Library     │ Pre-built templates for common DIGIT module types              │                             
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤                             
  │ Configuration Schema │ JSON schema for module configuration validation                │                             
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤                             
  │ Documentation        │ Complete usage documentation and examples                      │                             
  ├──────────────────────┼────────────────────────────────────────────────────────────────┤                             
  │ Test Suite           │ Unit tests for generators and validators                       │                             
  └──────────────────────┴────────────────────────────────────────────────────────────────┘                             
  ---                                                                                                                   
  6. Success Criteria                                                                                                   
  ┌────────────────────────┬───────────────────────────────────────────┐                                                
  │         Metric         │                  Target                   │                                                
  ├────────────────────────┼───────────────────────────────────────────┤                                                
  │ Module generation time │ < 30 seconds for complete module          │                                                
  ├────────────────────────┼───────────────────────────────────────────┤                                                
  │ Generated code quality │ 100% linting pass (ESLint)                │                                                
  ├────────────────────────┼───────────────────────────────────────────┤                                                
  │ Template coverage      │ Support for 5+ common DIGIT module types  │                                                
  ├────────────────────────┼───────────────────────────────────────────┤                                                
  │ API spec compatibility │ Parse 95%+ of valid OpenAPI specs         │                                                
  ├────────────────────────┼───────────────────────────────────────────┤                                                
  │ Developer adoption     │ Reduce new module development time by 70% │                                                
  └────────────────────────┴───────────────────────────────────────────┘                                                
  ---                                                                                                                   
  7. Constraints and Dependencies                                                                                       
                                                                                                                        
  7.1 Dependencies                                                                                                      
                                                                                                                        
  - Node.js runtime environment                                                                                         
  - DIGIT UI framework packages                                                                                         
  - Access to MDMS for dropdown configurations                                                                          
  - Valid OpenAPI/Swagger specs for API-driven generation                                                               
                                                                                                                        
  7.2 Constraints                                                                                                       
                                                                                                                        
  - Generated modules must follow DIGIT frontend architecture                                                           
  - Must use only approved DIGIT UI component patterns                                                                  
  - Localization keys must follow DIGIT naming conventions                                                              
  - Roles must be valid DIGIT system roles                                                                              
                                                                                                                        
  ---                                                                                                                   
  8. Roadmap (Future Scope)                                                                                             
  ┌───────────────────────────┬─────────────────────────────────────────────┐                                           
  │          Feature          │                 Description                 │                                           
  ├───────────────────────────┼─────────────────────────────────────────────┤                                           
  │ Visual Form Builder       │ GUI interface for designing forms           │                                           
  ├───────────────────────────┼─────────────────────────────────────────────┤                                           
  │ DevOps Integration        │ Integration with DIGIT deployment pipelines │                                           
  ├───────────────────────────┼─────────────────────────────────────────────┤                                           
  │ Advanced Workflows        │ Complex workflow template support           │                                           
  ├───────────────────────────┼─────────────────────────────────────────────┤                                           
  │ Plugin System             │ Extensible generator plugins                │                                           
  ├───────────────────────────┼─────────────────────────────────────────────┤                                           
  │ Design System Integration │ Direct integration with DIGIT design tokens │                                           
  └───────────────────────────┴─────────────────────────────────────────────┘                                           
  ---                                                                                                                   
  9. Stakeholders                                                                                                       
  ┌─────────────────────┬──────────────────────────────────┐                                                            
  │        Role         │          Responsibility          │                                                            
  ├─────────────────────┼──────────────────────────────────┤                                                            
  │ Frontend Developers │ Primary users generating modules │                                                            
  ├─────────────────────┼──────────────────────────────────┤                                                            
  │ DIGIT Architects    │ Define patterns and templates    │                                                            
  ├─────────────────────┼──────────────────────────────────┤                                                            
  │ Product Teams       │ Define module requirements       │                                                            
  ├─────────────────────┼──────────────────────────────────┤                                                            
  │ DevOps              │ Deployment and CI/CD integration │                                                            
  └─────────────────────┴──────────────────────────────────┘                                                            
  ---                                                                                                                   
  10. Distribution                                                                                                      
                                                                                                                        
  - NPM Registry: Published as @egovernments/digit-module-generator                                                     
  - Installation: Global npm install or npx execution                                                                   
  - Custom Templates: User-defined templates in ~/.digit-gen/templates/                                                 
                                                                                                                        
  ---                                                                                                                   
  Document Version: 1.0                                                                                                 
  Last Updated: January 2026  