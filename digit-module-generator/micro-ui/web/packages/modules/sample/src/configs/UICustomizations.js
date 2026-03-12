import { Link } from "react-router-dom";
import _ from "lodash";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

//create functions here based on module name set in mdms(eg->SearchProjectConfig)
//how to call these -> Digit?.Customizations?.[masterName]?.[moduleName]
// these functions will act as middlewares
// var Digit = window.Digit || {};
const businessServiceMap = {};

const inboxModuleNameMap = {};

const HCM_MODULE_NAME = "console";



export const UICustomizations = {
  HCM_MODULE_NAME,
};
