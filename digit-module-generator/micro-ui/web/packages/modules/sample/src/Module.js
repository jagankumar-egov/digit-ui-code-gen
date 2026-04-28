import { TourProvider } from "@egovernments/digit-ui-react-components";
import { Loader, lazyWithFallback } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import { CustomisedHooks } from "./hooks";
import { UICustomizations } from "./configs/UICustomizations";
import SampleCard from "./components/SampleCard";

// Create lazy components with fallbacks using the utility
const EmployeeApp = lazyWithFallback(
  () => import(/* webpackChunkName: "employee-app" */ "./pages/employee"),
  () => require("./pages/employee").default,
  { loaderText: "Loading Employee App..." }
);


const SampleModule = React.memo(({ stateCode, userType, tenants }) => {
  const location = useLocation();

  // Derive path from location pathname (replaces useRouteMatch)
  // Expected pattern: /{contextPath}/employee/sample/...
  // We need: /{contextPath}/employee/sample
  const path = useMemo(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    // Take first 3 parts: contextPath/employee/sample
    if (pathParts.length >= 3) {
      return `/${pathParts.slice(0, 3).join("/")}`;
    }
    return `/${window?.contextPath}/employee/sample`;
  }, [location.pathname]);

  const modulePrefix = "hcm";

  const moduleCode = ["campaignmanager"];

  // const { path, url } = useRouteMatch();
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({
    stateCode,
    moduleCode,
    language,
    modulePrefix,
  });

  if (isLoading) {
    return <Loader page={true} variant={"PageLoader"} />;
  }

  return (
    <ErrorBoundary moduleName="SAMPLE">
      <TourProvider>
        <EmployeeApp
          path={path}
          stateCode={stateCode}
          userType={userType}
        />
      </TourProvider>
    </ErrorBoundary>
  );
});

const componentsToRegister = {
  SampleCard: SampleCard,
  SampleModule: SampleModule
};

const overrideHooks = () => {
  Object.keys(CustomisedHooks).map((ele) => {
    if (ele === "Hooks") {
      Object.keys(CustomisedHooks[ele]).map((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).map((method) => {
          setupHooks(hook, method, CustomisedHooks[ele][hook][method]);
        });
      });
    } else if (ele === "Utils") {
      Object.keys(CustomisedHooks[ele]).map((hook) => {
        Object.keys(CustomisedHooks[ele][hook]).map((method) => {
          setupHooks(hook, method, CustomisedHooks[ele][hook][method], false);
        });
      });
    } else {
      Object.keys(CustomisedHooks[ele]).map((method) => {
        setupLibraries(ele, method, CustomisedHooks[ele][method]);
      });
    }
  });
};

/* To Overide any existing hook we need to use similar method */
const setupHooks = (HookName, HookFunction, method, isHook = true) => {
  window.Digit = window.Digit || {};
  window.Digit[isHook ? "Hooks" : "Utils"] = window.Digit[isHook ? "Hooks" : "Utils"] || {};
  window.Digit[isHook ? "Hooks" : "Utils"][HookName] = window.Digit[isHook ? "Hooks" : "Utils"][HookName] || {};
  window.Digit[isHook ? "Hooks" : "Utils"][HookName][HookFunction] = method;
};
/* To Overide any existing libraries  we need to use similar method */
const setupLibraries = (Library, service, method) => {
  window.Digit = window.Digit || {};
  window.Digit[Library] = window.Digit[Library] || {};
  window.Digit[Library][service] = method;
};

/* To Overide any existing config/middlewares  we need to use similar method */
const updateCustomConfigs = () => {
  setupLibraries("Customizations", "commonUiConfig", { ...window?.Digit?.Customizations?.commonUiConfig, ...UICustomizations });
  // setupLibraries("Utils", "parsingUtils", { ...window?.Digit?.Utils?.parsingUtils, ...parsingUtils });
};


const initSampleComponents = () => {
  overrideHooks();
  updateCustomConfigs();
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};

export { initSampleComponents };
