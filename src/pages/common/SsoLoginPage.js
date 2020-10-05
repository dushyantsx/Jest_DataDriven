const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const config = require("../../../br-config");
const logger = require("../../logger/Logger");
const { LocFindStrategy } = require("../../globals/enumerations");
const StringUtils = require("../../utils/common/StringUtils");

class SsoLoginPage {
  /**
   * @description Searches for text in equalsIgnoreCase fashion and clicks the element from given collection
   * @param {WebElement} eleCollection Specifies element collection
   * @param {String} text Specifies text to be searched
   */
  static async login(username, password) {
    logger.enterMethod(`Logging in ${username}`);
    const envconfig = config.get(config.getCmdParam("ienv"));

    username = StringUtils.defaultIfEmpty(username, envconfig.testapp.user);
    password = StringUtils.defaultIfEmpty(password, envconfig.testapp.password);

    const loginUserLoc = OrReader.getElementMeta(
      OrReader.getSsoLoginPageOr(),
      "UserName"
    ).id;
    const passwordLoc = OrReader.getElementMeta(
      OrReader.getSsoLoginPageOr(),
      "Password"
    ).id;
    await sel.findElementAndSetText(LocFindStrategy.Id, loginUserLoc, username);
    await sel.findElementAndSetText(LocFindStrategy.Id, passwordLoc, password);
    await sel.clickByCss(
      OrReader.getElementMeta(OrReader.getSsoLoginPageOr(), "LoginButton").css
    );
    logger.exitMethod(`Logging in operation done`);
  }
}

module.exports = SsoLoginPage;
