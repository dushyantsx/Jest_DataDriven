const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");
const StringUtils = require("../../utils/common/StringUtils");
const { LocFindStrategy } = require("../../globals/enumerations");

const manageservOr = OrReader.getManageServicesPageOr();

class ManageServicesPage {
  /**
   * @description Checks the checkbox for the desired service on Manage services page
   * @param {String} service
   *
   */
  static async checkServiceCheckbox(service) {
    logger.enterMethod(`checkServiceCheckbox ${service}`);

    let loc = OrReader.getElementMeta(manageservOr, "AvailableServices").css;

    await sel.getWaitUtils().sleep(2000);

    const elements = await sel.getElementsByCssContainingText(loc, service);

    if (elements == null || elements.length === 0)
      throw new Error(
        `Could not find element having service text as ${service}`
      );
    const eleToOrderText = await sel.getText(elements[0]);
    loc = OrReader.getElementMeta(manageservOr, "CheckServicebox").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", eleToOrderText);

    //eleToOrderText = sel.getElementByXpath(xpath);
    //await sel.getJsUtils().clickUsingJavascript(eleToOrderText);

    await sel.clickByXpath(loc);

    logger.exitMethod(`checkServiceCheckbox`);
  }

  /**
   * @description Clicks on Cease Button
   *
   *
   */
  static async clickOnCease() {
    logger.enterMethod(`clickOnCease`);

    const loc = OrReader.getElementMeta(manageservOr, "Cease").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod(`clickOnCease`);
  }

  /**
   * @description Selects the reason for cease and clicks on Confirm reason button
   * @param {String} reason
   *
   */
  static async selectCeaseReasonAndConfirm(reason) {
    logger.enterMethod(`selectCeaseReasonAndConfirm ${reason}`);

    let loc = OrReader.getElementMeta(manageservOr, "SelectDropdown").xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "CeaseList").xpath;
    await sel.clickElementByXpathContainingText(loc, reason);

    loc = OrReader.getElementMeta(manageservOr, "ConfirmReason").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod(`selectCeaseReasonAndConfirm`);
  }

  /**
   * @description Selects immediate cease option and submits order
   *
   */
  static async selectImmediateCeaseAndSubmit() {
    logger.enterMethod(`selectImmediateCeaseAndSubmit`);
    let loc = OrReader.getElementMeta(manageservOr, "Immediate").xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "ConfirmStatus").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod(`selectImmediateCeaseAndSubmit`);
  }

  /**
   * @description Clicks manage servide option in the header
   *
   */
  static async clickonManageServiceStatus() {
    logger.enterMethod(`clickonManageServiceStatus`);

    await sel.getWaitUtils().sleep(2000);

    const loc = OrReader.getElementMeta(manageservOr, "ManageServicesLink")
      .xpath;
    await sel.getWaitUtils().waitForElementEnabled(LocFindStrategy.Xpath, loc);
    await sel.clickByXpath(loc);
    logger.exitMethod(`clickonManageServiceStatus`);
  }

  /**
   * @description Selects futuredate cease option and submits order
   *
   */
  static async selectFutureDateCeaseAndSubmit() {
    logger.enterMethod(`selectFutureDateCeaseAndSubmit`);
    let loc = OrReader.getElementMeta(manageservOr, "FutureDate").xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "Calender").xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "DateToSelect").xpath;
    await sel.getJsUtils().clickByXpathUsingJavascript(loc);

    loc = OrReader.getElementMeta(manageservOr, "CeaseTime").xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "ConfirmStatus").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod(`selectFutureDateCeaseAndSubmit`);
  }

  /**
   * @description Verifies whether the Move Services button is enabled or not
   *
   */
  static async validateMoveButtonIsDisabled() {
    logger.enterMethod(`validateMoveButtonIsEnabled`);
    let output = {};

    await sel.getWaitUtils().waitForUrlToChangeTo("my_account");
    const loc = OrReader.getElementMeta(manageservOr, "MoveButton").xpath;
    const ele = await sel.getElementByXpath(loc);
    const eleatt = await sel.getAttribute(ele, "class");
    output = StringUtils.containsIgnoreCase(eleatt, "disabled");
    logger.exitMethod(`validateMoveButtonIsEnabled`);
    return output;
  }

  /**
   * @description Add Address in Move to Pop-up
   *  @param {String} ct Specifies city of new customer
   * @param {String} ctlov Specifies city to be chosen of new customer
   * @param {String} pv Specifies province of new customer
   * @param {String} ad Specifies address of new customer
   * @param {String} adlov Specifies address to be chosen of new customer
   * @returns {CheckAddressReturn}
   */

  static async addNewAddressInMovePopUp(ct, ad) {
    logger.enterMethod(`addNewAddressInMovePopUp${ct}, ${ad}`);

    const output = {};
    output.city = {};
    output.address = {};
    output.address.rel = {};

    try {
      const loc = OrReader.getElementMeta(manageservOr, "NewAddress").xpath;
      await sel.clickByXpath(loc);
    } catch (err) {
      // Eat Error
    }

    let loc = OrReader.getElementMeta(manageservOr, "MoveToCity").xpath;
    await sel.findElementAndSetText(LocFindStrategy.Xpath, loc, ct);

    loc = OrReader.getElementMeta(manageservOr, "MoveToCityLov").xpath;
    await sel.clickElementByXpathContainingText(loc, ct);

    loc = OrReader.getElementMeta(manageservOr, "MoveToCity").xpath;
    output.city.itemid = await sel.getAttributeByXpath(loc, "itemid");
    output.city.parentid = await sel.getAttributeByXpath(loc, "parentid");

    loc = OrReader.getElementMeta(manageservOr, "MoveToProvince").xpath;
    output.province = await sel.getTextByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "MoveToAddress").xpath;
    await sel.findElementAndSetText(LocFindStrategy.Xpath, loc, ad);

    loc = OrReader.getElementMeta(manageservOr, "MoveToAddressLov").xpath;
    await sel.clickElementByXpathContainingText(loc, ad);

    // output.address.text = await sel.getAttributeByXpathContainingText(
    //   loc,
    //   ad,
    //   "innerText"
    // );
    // output.address.rel.text = await sel.getAttributeByXpathContainingText(
    //   loc,
    //   ad,
    //   "rel"
    // );
    // output.address.rel.id = StringUtils.extractNumbers(output.address.rel.text);

    loc = OrReader.getElementMeta(manageservOr, "Next").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod(`checkAddress: ${JSON.stringify(output)}`);
    logger.exitMethod(`validateMoveButtonIsEnabled`);
    return output;
  }

  /**
   * @description Click on move services button
   *
   */
  static async clickMoveServicesButton() {
    logger.enterMethod(`clickMoveServicesButton`);
    const loc = OrReader.getElementMeta(manageservOr, "MoveButton").xpath;
    await sel.getWaitUtils().sleep(2000);
    await sel.clickByXpath(loc);

    logger.exitMethod(`clickMoveServicesButton`);
  }

  /**
   * @description Checks the checkbox for the desired service on Manage services page
   * @param {String} service
   *
   */
  static async clickEquipmentonService(service) {
    logger.enterMethod(`clickEquipmentonService ${service}`);

    // let loc = OrReader.getElementMeta(manageservOr, "AvailableServices").css;

    // let elements = await sel.getElementsByCssContainingText(loc, service);

    // if (elements == null || elements.length == 0)
    //   throw new Error(
    //     `Could not find element having service text as ${service}`
    //   );
    // let eleToOrderText = await sel.getText(elements[0]);
    let loc = OrReader.getElementMeta(manageservOr, "Equipment").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.clickByXpath(loc);

    logger.exitMethod(`checkServiceCheckbox`);
  }

  /**
   * @description Checks the checkbox for the desired service on Manage services page
   * @param {String} service
   *
   */
  static async clickChangeonService(service) {
    logger.enterMethod(`clickEquipmentonService ${service}`);

    // let loc = OrReader.getElementMeta(manageservOr, "AvailableServices").css;

    // let elements = await sel.getElementsByCssContainingText(loc, service);

    // if (elements == null || elements.length == 0)
    //   throw new Error(
    //     `Could not find element having service text as ${service}`
    //   );
    // let eleToOrderText = await sel.getText(elements[0]);
    let loc = OrReader.getElementMeta(manageservOr, "Change").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.clickByXpath(loc);

    logger.exitMethod(`checkServiceCheckbox`);
  }

  /**
   * @description Checks the checkbox for the desired service on Manage services page
   * @param {String} service
   *
   */
  static async addNewLocation(city, address) {
    logger.enterMethod(`addNewLocation${city}${address}`);

    let loc = OrReader.getElementMeta(manageservOr, "City").xpath;
    await sel.findElementByXpathAndSetText(loc, city);

    loc = OrReader.getElementMeta(manageservOr, "Citylov").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", city);
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "Address").xpath;
    await sel.findElementByXpathAndSetText(loc, address);

    loc = OrReader.getElementMeta(manageservOr, "Citylov").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", address);
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(manageservOr, "AddAddressButton").xpath;
    await sel.clickByXpath(loc);

    await sel.getJsUtils().isPageLoaded();

    logger.exitMethod(`addNewLocation`);
  }

  static async clickOnServiceCheckboxandSelectCancel() {
    logger.enterMethod(`clickOnServiceCheckboxandSelectCancel`);

    let loc = OrReader.getElementMeta(manageservOr, "ServiceCheckbox").xpath;
    await sel.clickByXpath(loc);
    loc = OrReader.getElementMeta(manageservOr, "CancelRequestLink").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`clickOnServiceCheckboxandSelectCancel`);
  }

  static async selectCancellationReason(reason) {
    logger.enterMethod(`selectCancellationReason`);

    let loc = OrReader.getElementMeta(
      manageservOr,
      "CancellationReasonDropdown"
    ).xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(
      manageservOr,
      "CancellationReasonDropdownlist"
    ).xpath;

    await sel.clickElementByXpathContainingText(loc, reason);

    logger.exitMethod(`selectCancellationReason`);
  }

  static async clickonConfirmReason() {
    logger.enterMethod(`clickonConfirmReason`);
    const loc = OrReader.getElementMeta(
      manageservOr,
      "ConfirmCancellationButton"
    ).xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`clickonConfirmReason`);
  }

  static async clickConfirmButton() {
    logger.enterMethod(`clickConfirmButton`);
    const loc = OrReader.getElementMeta(manageservOr, "ConfirmButton").xpath;

    await sel.clickByXpath(loc);

    logger.exitMethod(`clickConfirmButton`);
  }

  static async clickExpandServideDetails(service) {
    logger.enterMethod(`clickExpandServideDetails`);
    let loc = OrReader.getElementMeta(manageservOr, "ServiceDetailsExpander")
      .xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.clickByXpath(loc);
    loc = OrReader.getElementMeta(manageservOr, "EquipmentDetailsLink;").css;
    await sel.clickByCss(loc);
    logger.exitMethod(`clickExpandServideDetails`);
  }

  static async clickRemoveEquipment(service) {
    logger.enterMethod(`clickRemoveEquipmentButton`);
    let loc = OrReader.getElementMeta(manageservOr, "RemoveEquipment").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.clickByXpath(loc);
    logger.exitMethod(`clickRemoveEquipmentButton`);
  }
}

module.exports = ManageServicesPage;
