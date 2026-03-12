import utils from "../utils";

const UserService = {};

const workbench = {};

const contracts = {};

const sample = {
};

const Hooks = {
  sample,
};

const Utils = {
  browser: {
    sample: () => {},
  },
  workbench: {
    ...utils,
  },
  sample: {
    ...utils,
  },
};

export const CustomisedHooks = {
  Hooks,
  UserService,
  Utils,
};
