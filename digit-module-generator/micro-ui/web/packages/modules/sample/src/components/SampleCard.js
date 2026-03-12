import { useTranslation } from "react-i18next";

import React, { Fragment, useEffect } from "react";
import { EmployeeModuleCard } from "@egovernments/digit-ui-react-components";

const ROLES = {
  CAMPAIGN_MANAGER: ["CAMPAIGN_MANAGER", "MICROPLAN_CAMPAIGN_INTEGRATOR"],
};

const SampleCard = () => {
  if (!Digit.Utils.didEmployeeHasAtleastOneRole(Object.values(ROLES).flatMap((e) => e))) {
    return null;
  }
  const { t } = useTranslation();

  let links = [
    {
      label: t("ACTION_TEST_CREATE"),
      link: `/workbench-ui/employee/sample/sample-home`,
      id:`home-screen-create-sample-link`,
      roles: ROLES.CAMPAIGN_MANAGER,
    }
  ];

  links = links.filter((link) => (link?.roles && link?.roles?.length > 0 ? Digit.Utils.didEmployeeHasAtleastOneRole(link?.roles) : true));

  const propsForModuleCard = {
    Icon: "Engineering",
    moduleName: t("ACTION_TEST_CAMPAIGN"),
    kpis: [],
    links: links,
  };
  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default SampleCard;
