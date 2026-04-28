import React, { useEffect, useMemo, useState } from "react";
import { Routes, useLocation, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppContainer } from "@egovernments/digit-ui-react-components";
import {
  lazyWithFallback,
  BreadCrumb,
  SVG,
} from "@egovernments/digit-ui-components";
import { PRIMARY_COLOR } from "../../utils";


const SampleBreadCrumb = ({ location, defaultPath }) => {
  const { t } = useTranslation();
  const search = useLocation().search;
  const crumbs = [
    {
      internalLink: `/${window?.contextPath}/employee`,
      content: t("test"),
      show: true,
      icon: <SVG.Home fill={PRIMARY_COLOR} />,
    },
  ];

  return <BreadCrumb className="sample-breadcrumb" crumbs={crumbs} />;
};


const App = ({ path }) => {
  const location = useLocation();

  return (
    <React.Fragment>
      <div className="wbh-header-container">
        <SampleBreadCrumb location={location} defaultPath={path} />
      </div>
      <AppContainer className="sample">
        <Routes>
          <Route path={`test`} element={<div>"test"</div>} />
        </Routes>
      </AppContainer>
    </React.Fragment>
  );
};

export default React.memo(App);
