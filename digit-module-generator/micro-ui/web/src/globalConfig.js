// // src/globalConfig.js

//Dev 
// var globalConfigs = (function () {
//   var stateTenantId = 'dev'
//   var gmaps_api_key = 'AIzaSyCslxyiD1nuQuoshbu_E3WkIV8J2SUA6KI';
//   var contextPath = 'workbench-ui';
//   var configModuleName = 'commonHCMUiConfig';
//   var centralInstanceEnabled = false;
//   var localeRegion = "IN";
//   var localeDefault = "en";
//   var mdmsContext = "egov-mdms-service";
//   var footerBWLogoURL =
//   "https://egov-uat-assets.s3.ap-south-1.amazonaws.com/digit-footer-bw.png";
// var footerLogoURL =
//   "https://egov-uat-assets.s3.ap-south-1.amazonaws.com/digit-footer.png";
//   var digitHomeURL = 'https://www.digit.org/';
//   var assetS3Bucket = 'egov-uat-asset';
//   var hrmsContext = "health-hrms";
//   var projectContext= "health-project";
//   var invalidEmployeeRoles = ["CBO_ADMIN", "ORG_ADMIN", "ORG_STAFF", "SYSTEM"]
//   var getConfig = function (key) {
//     if (key === 'STATE_LEVEL_TENANT_ID') {
//       return stateTenantId;
//     }
//     else if (key === 'GMAPS_API_KEY') {
//       return gmaps_api_key;
//     }
//     else if (key === 'ENABLE_SINGLEINSTANCE') {
//       return centralInstanceEnabled;
//     } else if (key === 'DIGIT_FOOTER_BW') {
//       return footerBWLogoURL;
//     } else if (key === 'DIGIT_FOOTER') {
//       return footerLogoURL;
//     } else if (key === 'DIGIT_HOME_URL') {
//       return digitHomeURL;
//     } else if (key === 'S3BUCKET') {
//       return assetS3Bucket;
//     } else if (key === 'CONTEXT_PATH') {
//       return contextPath;
//     } else if (key === 'UICONFIG_MODULENAME') {
//       return configModuleName;
//     } else if (key === "LOCALE_REGION") {
//       return localeRegion;
//     } else if (key === "LOCALE_DEFAULT") {
//       return localeDefault;
//     } else if (key === "MDMS_CONTEXT_PATH") {
//       return mdmsContext;
//     } else if (key === "PROJECT_SERVICE_PATH") {
//       return projectContext;
//     } else if (key === "HRMS_CONTEXT_PATH") {
//       return hrmsContext;
//     } else if (key === "MDMS_V2_CONTEXT_PATH") {
//       return mdmsContext;
//     } else if (key === "MDMS_V1_CONTEXT_PATH") {
//       return mdmsContext;
//     } if (key === 'INVALIDROLES') {
//       return invalidEmployeeRoles;
//     }
//   };
//   return {
//     getConfig
//   };
// }());


// var globalConfigs = (function () {
//   var stateTenantId = 'dev'
//   var gmaps_api_key = 'AIzaSyCslxyiD1nuQuoshbu_E3WkIV8J2SUA6KI';
//   var contextPath = 'workbench-ui';
//   var configModuleName = 'commonHCMUiConfig';
//   var centralInstanceEnabled = false;
//   var localeRegion = "IN";
//   var localeDefault = "en";
//   var mdmsContext = "egov-mdms-service";
//   var footerBWLogoURL =
//   "https://egov-uat-assets.s3.ap-south-1.amazonaws.com/digit-footer-bw.png";
// var footerLogoURL =
//   "https://egov-uat-assets.s3.ap-south-1.amazonaws.com/digit-footer.png";
//   var digitHomeURL = 'https://www.digit.org/';
//   var assetS3Bucket = 'egov-uat-asset';
//   var hrmsContext = "health-hrms";
//   var projectContext= "health-project";
//   var invalidEmployeeRoles = ["CBO_ADMIN", "ORG_ADMIN", "ORG_STAFF", "SYSTEM"]
//   var getConfig = function (key) {
//     if (key === 'STATE_LEVEL_TENANT_ID') {
//       return stateTenantId;
//     }
//     else if (key === 'GMAPS_API_KEY') {
//       return gmaps_api_key;
//     }
//     else if (key === 'ENABLE_SINGLEINSTANCE') {
//       return centralInstanceEnabled;
//     } else if (key === 'DIGIT_FOOTER_BW') {
//       return footerBWLogoURL;
//     } else if (key === 'DIGIT_FOOTER') {
//       return footerLogoURL;
//     } else if (key === 'DIGIT_HOME_URL') {
//       return digitHomeURL;
//     } else if (key === 'S3BUCKET') {
//       return assetS3Bucket;
//     } else if (key === 'CONTEXT_PATH') {
//       return contextPath;
//     } else if (key === 'UICONFIG_MODULENAME') {
//       return configModuleName;
//     } else if (key === "LOCALE_REGION") {
//       return localeRegion;
//     } else if (key === "LOCALE_DEFAULT") {
//       return localeDefault;
//     } else if (key === "MDMS_CONTEXT_PATH") {
//       return mdmsContext;
//     } else if (key === "PROJECT_SERVICE_PATH") {
//       return projectContext;
//     } else if (key === "HRMS_CONTEXT_PATH") {
//       return hrmsContext;
//     } else if (key === "MDMS_V2_CONTEXT_PATH") {
//       return mdmsContext;
//     } else if (key === "MDMS_V1_CONTEXT_PATH") {
//       return mdmsContext;
//     } if (key === 'INVALIDROLES') {
//       return invalidEmployeeRoles;
//     }
//   };
//   return {
//     getConfig
//   };
// }());



//UAT 
var globalConfigs = (function () {
  var stateTenantId = 'mz'
  var gmaps_api_key = 'AIzaSyCslxyiD1nuQuoshbu_E3WkIV8J2SUA6KI';
  var contextPath = 'workbench-ui';
  var configModuleName = 'commonHCMUiConfig';
  var centralInstanceEnabled = false;
  var localeRegion = "IN";
  var localeDefault = "en";
  var mdmsContext = "egov-mdms-service";
  var footerBWLogoURL =
  "https://egov-uat-assets.s3.ap-south-1.amazonaws.com/digit-footer-bw.png";
var footerLogoURL =
  "https://egov-uat-assets.s3.ap-south-1.amazonaws.com/digit-footer.png";
  var digitHomeURL = 'https://www.digit.org/';
  var assetS3Bucket = 'egov-uat-asset';
  var hrmsContext = "health-hrms";
  var projectContext= "health-project";
  var invalidEmployeeRoles = ["CBO_ADMIN", "ORG_ADMIN", "ORG_STAFF", "SYSTEM"]
  var mdmsFeatures={
    bulkDownload:true,
    bulkUpload:true,
    JSONEdit:true
  }
  var uiThemeConfig={
    headerTheme:"light",
    sideNavTheme:"light",
    sideNavVariant:"primary"
  }
  var getConfig = function (key) {
    if (key === 'STATE_LEVEL_TENANT_ID') {
      return stateTenantId;
    }
    else if (key === 'GMAPS_API_KEY') {
      return gmaps_api_key;
    } else if (key === "ROLE_BASED_HOMECARD") {
      return true;
    }
    else if (key === "HEADER_THEME") {
      return uiThemeConfig?.headerTheme;
    } else if (key === "SIDENAV_THEME") {
      return uiThemeConfig?.sideNavTheme;
    } else if (key === "SIDENAV_VARIANT") {
      return uiThemeConfig?.sideNavVariant;
    } 
    else if (key === 'ENABLE_SINGLEINSTANCE') {
      return centralInstanceEnabled;
    } else if (key === 'DIGIT_FOOTER_BW') {
      return footerBWLogoURL;
    } else if (key === 'DIGIT_FOOTER') {
      return footerLogoURL;
    } else if (key === 'DIGIT_HOME_URL') {
      return digitHomeURL;
    } else if (key === 'S3BUCKET') {
      return assetS3Bucket;
    } else if (key === 'CONTEXT_PATH') {
      return contextPath;
    } else if (key === 'UICONFIG_MODULENAME') {
      return configModuleName;
    } else if (key === "LOCALE_REGION") {
      return localeRegion;
    } else if (key === "LOCALE_DEFAULT") {
      return localeDefault;
    }  else if (key === "ENABLE_JSON_EDIT") {
      return mdmsFeatures?.JSONEdit;
    } else if (key === "ENABLE_MDMS_BULK_UPLOAD") {
      return mdmsFeatures?.bulkUpload;
    } else if (key === "ENABLE_MDMS_BULK_DOWNLOAD") {
      return mdmsFeatures?.bulkDownload;
    }else if (key === "MDMS_CONTEXT_PATH") {
      return mdmsContext;
    } else if (key === "PROJECT_SERVICE_PATH") {
      return projectContext;
    } else if (key === "HRMS_CONTEXT_PATH") {
      return hrmsContext;
    } else if (key === "MDMS_V2_CONTEXT_PATH") {
      return mdmsContext;
    } else if (key === "MDMS_V1_CONTEXT_PATH") {
      return mdmsContext;
    } if (key === 'INVALIDROLES') {
      return invalidEmployeeRoles;
    }
  };
  return {
    getConfig
  };
}());

export const initGlobalConfigs = (stateCode) => {
  window.globalConfigs = window.globalConfigs || globalConfigs;
  console.log("window.globalConfigs:", window.globalConfigs);
};