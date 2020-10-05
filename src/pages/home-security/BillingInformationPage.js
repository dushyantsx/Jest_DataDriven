const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const StringUtils = require("../../utils/common/StringUtils");
const logger = require("../../logger/Logger");

const biPageOr = OrReader.getBillingInformationPageOr();
class BillingInformationPage {
  /**
   * @description Cancel's section to save contact information
   */
  static async cancelSaveContactForBilling() {
    logger.enterMethod(`cancelSaveContactForBilling`);

    await sel.getJsUtils().isPageLoaded();

    const loc = OrReader.getElementMeta(biPageOr, "BillInfoCancelContact").css;
    await sel.clickByCss(loc);

    await sel.getWaitUtils().sleep(5000);
    await sel.getJsUtils().isPageLoaded();
    logger.exitMethod("cancelSaveContactForBilling");
  }

  /**
   * @description Accepts agent's advise and saves contact information
   * @param {String} pn Specifies phone number; if provided, fills the contact number else ignore
   */
  static async acceptAgentAdviseAndSaveContact(pn) {
    logger.enterMethod(`acceptAgentAdviseAndSaveContact`);
    let loc = OrReader.getElementMeta(biPageOr, "BillInfoContactPhone").css;
    if (!StringUtils.isEmpty(pn)) {
      await sel.findElementByCssAndSetText(loc, pn);
    }

    loc = OrReader.getElementMeta(biPageOr, "BillInfoAgentAdvisedCustomer").css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(biPageOr, "BillInfoSaveContact").css;
    await sel.getWaitUtils().sleep(5000);
    await sel.clickByCss(loc);
    await sel.getWaitUtils().sleep(5000);
    logger.exitMethod("acceptAgentAdviseAndSaveContact");
  }

  /**
   * @description Fills postal code and validates address information
   * @param {String} pc Specifies postal code
   */
  static async fillupPostalValidateAndSubmitOrder(pc) {
    logger.enterMethod(`fillupPostalAndValidate ${pc}`);
    let loc = OrReader.getElementMeta(biPageOr, "BillInfoPostalCode").css;
    await sel.findElementByCssAndSetText(loc, pc);

    loc = OrReader.getElementMeta(biPageOr, "BillInfoValidateAddress").css;
    await sel.clickByCss(loc);

    await sel.getWaitUtils().sleep(5000);

    loc = OrReader.getElementMeta(biPageOr, "UseAboveAddressRadio").xpath;
    await sel.clickByXpath(loc);

    // loc = OrReader.getElementMeta(biPageOr, "SubmitOrderButton").css;
    // await sel.getJsUtils().clickByCssUsingJavascript(loc);

    loc = OrReader.getElementMeta(biPageOr, "SubmitOrderButton").id;
    // await sel.getJsUtils().clickByIdUsingJavascript(loc);
    await sel.clickById(loc);

    logger.exitMethod("fillupPostalAndValidate");
  }

  /**
   * @description Clicks Submit Button
   */
  static async clickSubmitButton() {
    await sel.getWaitUtils().sleep(5000);
    const loc = OrReader.getElementMeta(biPageOr, "SubmitOrderButton").id;
    // await sel.getJsUtils().clickByIdUsingJavascript(loc);
    await sel.clickById(loc);

    logger.exitMethod("fillupPostalAndValidate");
  }

  /**
   * @description Clicks Submit Button
   */
  static async clickCancelButton() {
    logger.enterMethod("clickCancelButton");
    await sel.getWaitUtils().sleep(5000);
    const loc = OrReader.getElementMeta(biPageOr, "BillInfoCancelContact").css;
    await sel.clickByCss(loc);

    logger.exitMethod("clickCancelButton");
  }
}

module.exports = BillingInformationPage;
