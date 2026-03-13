/**
 * i18nGenerator.js — Localization file generator
 *
 * Generates localization JSON files (en_IN.json, hi_IN.json) in the module's
 * localization/ directory. Called by moduleGenerator when config.i18n.generateKeys is true.
 *
 * Key generation strategy:
 *   - Every field name is converted to SCREAMING_SNAKE_CASE and prefixed with i18n.prefix
 *     e.g. "employeeName" + prefix "HRMS_" → "HRMS_EMPLOYEE_NAME"
 *   - Three variants are generated per field: _LABEL, _ERROR, _PLACEHOLDER
 *   - Screen-level keys are generated for headers, buttons, breadcrumbs
 *   - Module-level keys: MODULE_NAME, MODULE_DESCRIPTION
 *
 * English values are pre-filled from field labels (human-readable defaults).
 * Hindi values fall back to the English string when no translation is available
 * — developers replace them with actual translations.
 *
 * The output format matches DIGIT's expected locale JSON structure:
 *   { "HRMS_EMPLOYEE_NAME_LABEL": "Employee Name", ... }
 */
const fs = require('fs-extra');
const path = require('path');

/**
 * Generates localization JSON files for the specified languages.
 *
 * @param {Object} config      - Validated module config
 * @param {string} outputDir   - Module root directory (localization/ subfolder is created here)
 * @param {Array}  languages   - Language codes to generate, e.g. ['en_IN', 'hi_IN']
 */
async function generateI18nFiles(config, outputDir, languages = ['en_IN']) {
  console.log('🌐 Generating internationalization files...');
  const localizationDir = path.join(outputDir, 'localization');
  await fs.ensureDir(localizationDir);

  // Generate for each language
  for (const lang of languages) {
    const localeContent = generateLocaleContent(config, lang);
    await fs.writeFile(path.join(localizationDir, `${lang}.json`), JSON.stringify(localeContent, null, 2));
    console.log(`📄 Generated ${lang}.json`);
  }
  console.log('✅ Internationalization files generated successfully');
}
function generateLocaleContent(config, language = 'en_IN') {
  const prefix = config.i18n?.prefix || `${config.entity.name.toUpperCase()}_`;
  const isHindi = language.includes('hi');
  const baseKeys = {
    // Module Level
    [`${prefix}MODULE_NAME`]: isHindi ? getHindiTranslation(config.module.name) : config.module.name,
    [`${prefix}MODULE_DESCRIPTION`]: isHindi ? getHindiTranslation(config.module.description) : config.module.description,
    // Entity Level
    [`${prefix}TITLE`]: isHindi ? getHindiTranslation(config.entity.name) : config.entity.name,
    [`${prefix}SUBTITLE`]: isHindi ? `${getHindiTranslation(config.entity.name)} प्रबंधन` : `${config.entity.name} Management`,
    // Screen Titles
    [`${prefix}CREATE_TITLE`]: isHindi ? `नया ${getHindiTranslation(config.entity.name)}` : `New ${config.entity.name}`,
    [`${prefix}SEARCH_TITLE`]: isHindi ? `${getHindiTranslation(config.entity.name)} खोजें` : `Search ${config.entity.name}`,
    [`${prefix}VIEW_TITLE`]: isHindi ? `${getHindiTranslation(config.entity.name)} विवरण` : `${config.entity.name} Details`,
    [`${prefix}INBOX_TITLE`]: isHindi ? `${getHindiTranslation(config.entity.name)} इनबॉक्स` : `${config.entity.name} Inbox`,
    // Actions
    [`${prefix}CREATE`]: isHindi ? 'बनाएं' : 'Create',
    [`${prefix}EDIT`]: isHindi ? 'संपादित करें' : 'Edit',
    [`${prefix}UPDATE`]: isHindi ? 'अपडेट करें' : 'Update',
    [`${prefix}DELETE`]: isHindi ? 'हटाएं' : 'Delete',
    [`${prefix}VIEW`]: isHindi ? 'देखें' : 'View',
    [`${prefix}SEARCH`]: isHindi ? 'खोजें' : 'Search',
    [`${prefix}CLEAR`]: isHindi ? 'साफ़ करें' : 'Clear',
    [`${prefix}SUBMIT`]: isHindi ? 'जमा करें' : 'Submit',
    [`${prefix}CANCEL`]: isHindi ? 'रद्द करें' : 'Cancel',
    [`${prefix}SAVE`]: isHindi ? 'सेव करें' : 'Save',
    [`${prefix}SAVE_DRAFT`]: isHindi ? 'ड्राफ्ट सेव करें' : 'Save as Draft',
    // Messages
    [`${prefix}CREATED_SUCCESSFULLY`]: isHindi ? `${getHindiTranslation(config.entity.name)} सफलतापूर्वक बनाया गया` : `${config.entity.name} created successfully`,
    [`${prefix}UPDATED_SUCCESSFULLY`]: isHindi ? `${getHindiTranslation(config.entity.name)} सफलतापूर्वक अपडेट किया गया` : `${config.entity.name} updated successfully`,
    [`${prefix}DELETED_SUCCESSFULLY`]: isHindi ? `${getHindiTranslation(config.entity.name)} सफलतापूर्वक हटाया गया` : `${config.entity.name} deleted successfully`,
    [`${prefix}CREATION_FAILED`]: isHindi ? `${getHindiTranslation(config.entity.name)} बनाने में त्रुटि` : `Failed to create ${config.entity.name}`,
    [`${prefix}UPDATE_FAILED`]: isHindi ? `${getHindiTranslation(config.entity.name)} अपडेट करने में त्रुटि` : `Failed to update ${config.entity.name}`,
    [`${prefix}NO_RESULTS_FOUND`]: isHindi ? 'कोई परिणाम नहीं मिला' : 'No results found',
    [`${prefix}LOADING`]: isHindi ? 'लोड हो रहा है...' : 'Loading...',
    // Common Labels
    [`${prefix}ID`]: isHindi ? 'आईडी' : 'ID',
    [`${prefix}NAME`]: isHindi ? 'नाम' : 'Name',
    [`${prefix}STATUS`]: isHindi ? 'स्थिति' : 'Status',
    [`${prefix}CREATED_DATE`]: isHindi ? 'निर्मित दिनांक' : 'Created Date',
    [`${prefix}MODIFIED_DATE`]: isHindi ? 'संशोधित दिनांक' : 'Modified Date',
    [`${prefix}ACTIONS`]: isHindi ? 'कार्य' : 'Actions',
    // Validation Messages
    [`${prefix}REQUIRED_FIELD`]: isHindi ? 'यह फील्ड आवश्यक है' : 'This field is required',
    [`${prefix}INVALID_FORMAT`]: isHindi ? 'गलत प्रारूप' : 'Invalid format',
    [`${prefix}MIN_LENGTH_ERROR`]: isHindi ? 'न्यूनतम लंबाई आवश्यक' : 'Minimum length required',
    [`${prefix}MAX_LENGTH_ERROR`]: isHindi ? 'अधिकतम लंबाई पार हो गई' : 'Maximum length exceeded',
    [`${prefix}INVALID_EMAIL`]: isHindi ? 'गलत ईमेल पता' : 'Invalid email address',
    [`${prefix}INVALID_MOBILE`]: isHindi ? 'गलत मोबाइल नंबर' : 'Invalid mobile number',
    [`${prefix}DATE_RANGE_ERROR`]: isHindi ? 'गलत दिनांक सीमा' : 'Invalid date range',
    // Status Labels
    [`${prefix}STATUS_ACTIVE`]: isHindi ? 'सक्रिय' : 'Active',
    [`${prefix}STATUS_INACTIVE`]: isHindi ? 'निष्क्रिय' : 'Inactive',
    [`${prefix}STATUS_PENDING`]: isHindi ? 'लंबित' : 'Pending',
    [`${prefix}STATUS_APPROVED`]: isHindi ? 'अनुमोदित' : 'Approved',
    [`${prefix}STATUS_REJECTED`]: isHindi ? 'अस्वीकृत' : 'Rejected',
    // Pagination
    [`${prefix}SHOWING_RESULTS`]: isHindi ? 'परिणाम दिखा रहे हैं' : 'Showing results',
    [`${prefix}OF`]: isHindi ? 'का' : 'of',
    [`${prefix}RESULTS`]: isHindi ? 'परिणाम' : 'results',
    [`${prefix}PREVIOUS`]: isHindi ? 'पिछला' : 'Previous',
    [`${prefix}NEXT`]: isHindi ? 'अगला' : 'Next',
    [`${prefix}PAGE`]: isHindi ? 'पृष्ठ' : 'Page'
  };

  // Add field labels
  const fieldKeys = {};
  config.fields?.forEach(field => {
    // Generate consistent field key (same logic as config generators)
    const constantCase = field.name.replace(/([a-z])([A-Z])/g, '$1_$2') // Insert underscore before capitals
    .toUpperCase();
    const fieldKey = `${prefix}${constantCase}`;
    fieldKeys[fieldKey] = isHindi ? getHindiTranslation(field.label) : field.label;

    // Add error message
    fieldKeys[`${fieldKey}_ERROR`] = isHindi ? `${getHindiTranslation(field.label)} में त्रुटि` : `${field.label} error`;

    // Add placeholder text
    fieldKeys[`${fieldKey}_PLACEHOLDER`] = isHindi ? `${getHindiTranslation(field.label)} दर्ज करें` : `Enter ${field.label}`;

    // Add help text if available
    if (field.helpText) {
      fieldKeys[`${fieldKey}_HELP`] = isHindi ? getHindiTranslation(field.helpText) : field.helpText;
    }

    // Add option labels for dropdowns
    if (field.type === 'dropdown' && field.options) {
      field.options.forEach(option => {
        const optionKey = `${prefix}${field.name.toUpperCase()}_${option.code}`;
        fieldKeys[optionKey] = isHindi ? getHindiTranslation(option.name) : option.name;
      });
    }
  });

  // Add workflow labels if enabled
  const workflowKeys = {};
  if (config.workflow?.enabled) {
    workflowKeys[`${prefix}WORKFLOW_TITLE`] = isHindi ? 'वर्कफ़्लो' : 'Workflow';
    workflowKeys[`${prefix}CURRENT_STATE`] = isHindi ? 'वर्तमान अवस्था' : 'Current State';
    workflowKeys[`${prefix}NEXT_ACTIONS`] = isHindi ? 'अगली कार्यवाहियाँ' : 'Next Actions';
    workflowKeys[`${prefix}COMMENTS`] = isHindi ? 'टिप्पणियाँ' : 'Comments';
    workflowKeys[`${prefix}ASSIGNED_TO`] = isHindi ? 'सौंपा गया' : 'Assigned To';
    workflowKeys[`${prefix}WORKFLOW_HISTORY`] = isHindi ? 'वर्कफ़्लो इतिहास' : 'Workflow History';
  }
  return {
    ...baseKeys,
    ...fieldKeys,
    ...workflowKeys
  };
}
function getHindiTranslation(text) {
  // Simple mapping for common terms - in real implementation, you'd use a proper translation service
  const translations = {
    'Employee': 'कर्मचारी',
    'Project': 'परियोजना',
    'Vehicle': 'वाहन',
    'Document': 'दस्तावेज़',
    'User': 'उपयोगकर्ता',
    'Management': 'प्रबंधन',
    'System': 'सिस्टम',
    'Name': 'नाम',
    'Email': 'ईमेल',
    'Phone': 'फोन',
    'Address': 'पता',
    'Date': 'दिनांक',
    'Time': 'समय',
    'Status': 'स्थिति',
    'Type': 'प्रकार',
    'Category': 'श्रेणी',
    'Description': 'विवरण',
    'Amount': 'राशि',
    'Number': 'संख्या',
    'Code': 'कोड'
  };
  return translations[text] || text;
}
module.exports = {
  generateI18nFiles
};