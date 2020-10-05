require("./enumerations");
const config = require("../../br-config").getConfigForGivenEnv();
const Nuller = require("../utils/common/Nuller");

const GlobalConsts = {};
GlobalConsts.defaultTimeOut = 20000;
GlobalConsts.getTimeOut = () => {
  let timeout;
  try {
    timeout = config.timeouts.test;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
GlobalConsts.getTimeOutImplicit = () => {
  let timeout;
  try {
    timeout = config.timeouts.implicit;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
GlobalConsts.getTimeOutElement = () => {
  let timeout;
  try {
    timeout = config.timeouts.element;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};

GlobalConsts.getTimeOutElementlong = () => {
  let timeout;
  try {
    timeout = config.timeouts.elementlong;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
GlobalConsts.getTimeOutPage = () => {
  let timeout;
  try {
    timeout = config.timeouts.page;
  } catch (err) {
    //eat exception
  }

  return Nuller.nullToValue(timeout, GlobalConsts.defaultTimeOut);
};
module.exports = GlobalConsts;
