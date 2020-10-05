const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");
const StringUtils = require("../../utils/common/StringUtils");
const { LocFindStrategy } = require("../../globals/enumerations");

const accntPageOr = OrReader.getAccountPageOr();

class AccountPage {
  /**
   * @description Clicks on Move button and verifies if move pop-up is displayed
   * @param {String} address
   */
  static async moveServices(address) {
    logger.enterMethod(`moveServices ${address}`);

    let loc = OrReader.getElementMeta(accntPageOr, "MoveButton").css;
    await sel.clickByCss(loc);
    loc = OrReader.getElementMeta(accntPageOr, "MovePopUp").className;
    return sel
      .getWaitUtils()
      .waitForElementVisible(LocFindStrategy.ClassName, loc);
  }

  /**
   * @description Selects provided address from the different locations of user
   * @param {String} address
   */
  static async selectAddress(address) {
    logger.enterMethod(`selectAddress ${address}`);

    await sel.getWaitUtils().sleep(5000);
    let loc = OrReader.getElementMeta(accntPageOr, "AddressesButton").id;
    await sel.getWaitUtils().waitForElementEnabled(LocFindStrategy.Id, loc);
    await sel.clickById(loc);

    loc = OrReader.getElementMeta(accntPageOr, "AddressList").xpath;
    await sel.clickElementByXpathContainingText(loc, address);

    logger.exitMethod("selectAddress");
  }

  /**
   * @description Adds location to the user addresses
   * @param {String} ct
   * @param {String} ad
   */
  static async addLocation(ct, ad) {
    logger.enterMethod(`addLocation ${ct} ${ad}`);

    let loc = OrReader.getElementMeta(accntPageOr, "AddLocation").xpath;
    await sel.clickByXpath(loc);

    await sel.getWaitUtils().sleep(1000);
    //loc = OrReader.getElementMeta(accntPageOr, "AddLocationPopUp");
    //await sel.getWaitUtils.waitForElementVisible(loc);

    loc = OrReader.getElementMeta(accntPageOr, "CityField").xpath;
    await sel.findElementByXpathAndSetText(loc, ct);

    loc = OrReader.getElementMeta(accntPageOr, "CityFieldlov").xpath;
    await sel.clickElementByXpathContainingText(loc, ct);

    loc = OrReader.getElementMeta(accntPageOr, "AddressField").xpath;
    await sel.findElementByXpathAndSetText(loc, ad);

    loc = OrReader.getElementMeta(accntPageOr, "AddressFieldlov").xpath;
    await sel.clickElementByXpathContainingText(loc, ad);

    loc = OrReader.getElementMeta(accntPageOr, "AddAddressButton").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod("addLocation");
  }

  /**
   * @description Clicks on order now button of the desired service from the list of available service
   * @param {String} service
   *
   */
  static async clickOnAddService(service) {
    logger.enterMethod(`clickOnAddService ${service}`);
    try {
      const loc = OrReader.getElementMeta(accntPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      // eating error
    }
    let loc = OrReader.getElementMeta(
      accntPageOr,
      "AvailableServicesNamesCollection"
    ).xpath;
    const elements = await sel.getElementsByXpathContainingText(loc, service);

    if (elements == null || elements.length === 0)
      throw new Error(
        `Could not find element having service text as ${service}`
      );
    const eleToOrderText = await sel.getText(elements[0]);
    loc = OrReader.getElementMeta(
      accntPageOr,
      "OrderNowButtonForProvidedServiceText"
    ).xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", eleToOrderText);
    await sel.clickByXpath(loc);

    logger.exitMethod(`clickOnAddService`);
  }

  static async validateStatusIsActiveForGivenService(service) {
    logger.enterMethod(`validateStatusIsActiveForGivenService ${service}`);

    let loc = OrReader.getElementMeta(accntPageOr, "ServicePlanActiveStatus")
      .xpath;
    loc = StringUtils.replaceString(
      loc,
      OrReader.getDynamicDataKeyword(),
      service
    );
    const ele = await sel.getElementByXpath(loc);
    logger.exitMethod(`validateStatusIsActiveForGivenService`);
    return await sel.isVisible(ele);
  }

  static async clickonManageServiceStatus() {
    logger.enterMethod(`clickonManageServiceStatus`);
    sel.getWaitUtils().sleep(2000);
    const loc = OrReader.getElementMeta(accntPageOr, "ManageServicesLink")
      .xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`clickonManageServiceStatus`);
  }

  static async clickonAddLocation() {
    logger.enterMethod(`clickonAddLocation`);
    sel.getWaitUtils().sleep(2000);
    const loc = OrReader.getElementMeta(accntPageOr, "Add Location").xpath;
    await sel.clickByXpath(loc);
    await sel.getJsUtils().isPageLoaded();
    logger.exitMethod(`clickonAddLocation`);
  }

  static async selectManageMyOrderTab() {
    logger.enterMethod(`selectManageMyOrderTab`);
    sel.getWaitUtils().sleep(2000);
    const loc = OrReader.getElementMeta(accntPageOr, "ManageMyOrderTab").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`selectManageMyOrderTab`);
  }

  static async getInvalidAddressMessage() {
    logger.enterMethod(`getInvalidAddressMessage`);
    const loc = OrReader.getElementMeta(accntPageOr, "InvalidAddressMessage")
      .css;

    const invalidaddmsg = await sel.getTextByCss(loc);
    logger.exitMethod(`getInvalidAddressMessage`);
    return invalidaddmsg;
  }
}

module.exports = AccountPage;
