const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");

const emContPg = OrReader.getEmergencyContactPageOr();
class EmergengyContactPage {
  /**
   * @description Enter Site Phone number
   * @param {String} Phone Phone number to be entered
   */
  static async enterSitePhoneNumber(Phone) {
    logger.enterMethod(`enterSitePhoneNumber ${Phone}`);
    let loc = OrReader.getElementMeta(emContPg, "SitePhoneNumber").css;
    await sel.clickByCss(loc);
    await sel.findElementByCssAndSetText(loc, Phone);

    loc = OrReader.getElementMeta(emContPg, "Save").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod("enterSitePhoneNumber");
  }

  /**
   * @description Enter Site Phone number
   * @param {String} Phone Phone number to be entered
   * @param {String} Password Verbal Password to enter *
   */
  static async addEmergencyContact(Phone) {
    logger.enterMethod(`addEmergencyContact ${Phone}`);
    let loc = OrReader.getElementMeta(emContPg, "PhoneNumber").css;
    await sel.clickByCss(loc);
    logger.info("Clicked field phonenumber");
    sel.getWaitUtils().sleep(1000);
    await sel.findElementByCssAndSetText(loc, Phone);

    loc = OrReader.getElementMeta(emContPg, "ContactType").xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(emContPg, "ContactList").xpath;
    await sel.clickElementByXpathContainingText(loc, "Home");

    loc = OrReader.getElementMeta(emContPg, "PhoneNumberType").xpath;
    await sel.clickByXpath(loc);

    loc = OrReader.getElementMeta(emContPg, "PhoneTypeList").xpath;
    await sel.clickElementByXpathContainingText(loc, "Mobile");

    loc = OrReader.getElementMeta(emContPg, "Password").css;
    await sel.clickByCss(loc);
    await sel.findElementByCssAndSetText(loc, "Password");

    loc = OrReader.getElementMeta(emContPg, "AddContact").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod("addEmergencyContact");
  }

  /**
   * @description Click on Next Button
   */
  static async clickNextButton() {
    logger.enterMethod(`clickNextButton`);
    await sel.getWaitUtils().sleep(2000);
    const loc = OrReader.getElementMeta(emContPg, "Next").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickNextButton");
  }
}

module.exports = EmergengyContactPage;
