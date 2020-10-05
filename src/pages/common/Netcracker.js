const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");
const { LocFindStrategy } = require("../../globals/enumerations");

const netCrackerOr = OrReader.getNetcrackerOr();

class Netcracker {
  static async enterSearchUsers() {
    logger.enterMethod(`enterSearchText`);
    sel.getWaitUtils().sleep(2000);
    let loc = OrReader.getElementMeta(netCrackerOr, "NameSearchField").xpath;
    await sel.findElementByXpathAndSetText(loc, "Provide ");
    await sel.getWaitUtils().sleep(1000);
    loc = OrReader.getElementMeta(netCrackerOr, "SearchButton").xpath;
    await sel.clickByXpath(loc);
    await sel.getWaitUtils().sleep(1000);

    logger.exitMethod(`clickonManageServiceStatus`);
  }

  static async login(username, password) {
    logger.enterMethod(`Logging in ${username}`);

    const loginUserLoc = OrReader.getElementMeta(
      OrReader.getNetcrackerOr(),
      "UserName"
    ).id;
    const passwordLoc = OrReader.getElementMeta(
      OrReader.getNetcrackerOr(),
      "Password"
    ).id;
    const loginButton = OrReader.getElementMeta(
      OrReader.getNetcrackerOr(),
      "LoginButton"
    ).css;
    await sel.findElementAndSetText(LocFindStrategy.Id, loginUserLoc, username);
    await sel.findElementAndSetText(LocFindStrategy.Id, passwordLoc, password);
    await sel.clickByCss(loginButton);
    logger.exitMethod(`Logging in operation done`);
  }

  static async selectAndDeleteUsers() {
    logger.enterMethod(`enterSearchText`);
    sel.getWaitUtils().sleep(2000);
    let loc = OrReader.getElementMeta(netCrackerOr, "NameCheckbox").xpath;
    await sel.clickByXpath(loc);
    await sel.getWaitUtils().sleep(1000);
    loc = OrReader.getElementMeta(netCrackerOr, "DeleteButton").xpath;
    await sel.clickByXpath(loc);
    await sel.getWaitUtils().sleep(5000);
    await sel.acceptAlerts();

    logger.exitMethod(`clickonManageServiceStatus`);
  }
}

module.exports = Netcracker;
