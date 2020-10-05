const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const StringUtils = require("../../utils/common/StringUtils");
const logger = require("../../logger/Logger");

const shipPageOr = OrReader.getShippingDetailsPageOr();
class ShippingDetailsPage {
  /**
   * @description Fills shipping info phone number and saves contact information
   * @param {String} pn Specifies phone number
   */
  static async fillupPhoneNumberAndSaveContactInfo(pn) {
    logger.enterMethod(`fillupPhoneNumberAndSaveContactInfo ${pn}`);
    let loc = OrReader.getElementMeta(shipPageOr, "ShippingInfoContactPhone")
      .css;
    await sel.findElementByCssAndSetText(loc, pn);

    loc = OrReader.getElementMeta(shipPageOr, "ShippingInfoSaveContact").css;
    await sel.clickByCss(loc);

    await sel.getWaitUtils().sleep(2000);
    logger.exitMethod("fillupPhoneNumberAndSaveContactInfo");
  }

  /**
   * @description Clicks ship to this address without changing/filling any address info
   */
  static async shipToPreFilledAddressAndSubmit(postalCode) {
    logger.enterMethod(`shipToPreFilledAddressAndSubmit ${postalCode}`);

    let loc = OrReader.getElementMeta(shipPageOr, "ShippingInfoPostalCode").css;
    sel.findElementByCssAndSetText(loc, postalCode);

    loc = OrReader.getElementMeta(shipPageOr, "ShipToThisAddress").id;
    await sel.clickById(loc); //.clickByCss(loc);

    await sel.getWaitUtils().sleep(4000);

    loc = OrReader.getElementMeta(shipPageOr, "ShippingInfoNextButton").id;
    await sel.clickById(loc);

    // Here we are sleeping after completing shipping details page;
    // so that next url appears in address-bar by the time we are going to perform next operation

    logger.exitMethod("shipToPreFilledAddressAndSubmit");
  }

  static async clickSubmitButton() {
    logger.enterMethod("clickSubmitButton");
    const loc = OrReader.getElementMeta(shipPageOr, "ShippingInfoNextButton")
      .css;
    await sel.clickByCss(loc);
    await sel.getWaitUtils().sleep(1000);
    logger.exitMethod("clicksubmitbutton");
  }

  static async clickSimpleSwitch(value) {
    logger.enterMethod("clickSimpleSwitch");
    if (StringUtils.equalsIgnoreCase(value, "Yes")) {
      const loc = OrReader.getElementMeta(shipPageOr, "Yes").xpath;
      await sel.clickByXpath(loc);
    } else {
      const loc = OrReader.getElementMeta(shipPageOr, "No").xpath;
      await sel.clickByXpath(loc);
    }
    await sel.getWaitUtils().sleep(1000);

    logger.enterMethod("clickSimpleSwitch");
  }

  static async validateEditButtonVisible() {
    logger.enterMethod("validateEditButtonVisible");
    const loc = OrReader.getElementMeta(shipPageOr, "editlink").xpath;
    return await sel.is(loc);
  }
}

module.exports = ShippingDetailsPage;
