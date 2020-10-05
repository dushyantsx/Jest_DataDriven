const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");
const DateUtils = require("../../utils/common/DateUtils");
const { LocFindStrategy } = require("../../globals/enumerations");

const permitPgOr = OrReader.getPermitPageOr();

class PermitPage {
  /**
   * @description Enter permit number
   *
   */
  static async enterPermitNumber() {
    logger.enterMethod(`enterPermitNumber`);
    const loc = OrReader.getElementMeta(permitPgOr, "PermitNumber").css;
    await sel.findElementByCssAndSetText(loc, "123asdasdzx12");

    logger.exitMethod(`enterPermitNumber`);
  }

  /**
   * @description Set expiry date
   *
   */
  static async enterExpiryDate() {
    logger.enterMethod(`enterExpiryDate`);
    let loc = OrReader.getElementMeta(permitPgOr, "ExpiryDate").css;
    await sel.clickByCss(loc);
    const d = new Date();
    let date = d.setDate(d.getDate() + 7);
    //date = date.toString().slice(0,10);
    date = DateUtils.formatDateTo(date, "/");

    //let ele = sel.getElementByXpath(loc);
    await sel.findElementByCssAndSetText(loc, date);

    await sel.getWaitUtils().sleep(1000);

    await sel.clickByCss(loc);

    await sel.getWaitUtils().sleep(1000);

    loc = OrReader.getElementMeta(permitPgOr, "Save").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod(`enterExpiryDate`);
  }

  /**
   * @description Set expiry date
   *
   */
  static async clickNextButton() {
    logger.enterMethod(`clickNextButton`);
    const loc = OrReader.getElementMeta(permitPgOr, "Next").xpath;
    await sel.clickByXpath(loc);
    await sel.getJsUtils().isPageLoaded();
    logger.exitMethod(`clickNextButton`);
  }

  /**
   * @description Enter Customer details for LWPermitpage
   *
   */
  static async enterLWCustomerDetails(firstname, lastname, contact) {
    logger.enterMethod(
      `enterLWCustomerDetails${firstname} ${lastname}${contact}`
    );
    let loc = OrReader.getElementMeta(permitPgOr, "LWFirstName").xpath;
    await sel.findElementByXpathAndSetText(loc, firstname);

    loc = OrReader.getElementMeta(permitPgOr, "LWLastName").xpath;
    await sel.findElementByXpathAndSetText(loc, lastname);

    loc = OrReader.getElementMeta(permitPgOr, "LWContactNumber").xpath;
    await sel.findElementByXpathAndSetText(loc, contact);

    loc = OrReader.getElementMeta(permitPgOr, "Save").xpath;
    await sel.clickByXpath(loc);

    await sel.getWaitUtils().sleep(3000);

    logger.exitMethod(`enterLWCustomerDetails`);
  }

  /**
   * @description Enter Customer details for LWPermitpage
   *
   */
  static async enterLWEmergencyDetails(firstname, contact, number) {
    logger.enterMethod(`enterLWCustomerDetails${firstname} ${contact}`);
    for (let index = 1; index <= number; index++) {
      let loc = OrReader.getElementMeta(permitPgOr, "EmergencyContactName")
        .xpath;
      let ele = await sel.getElementByXpath(loc);
      await sel.setText(ele, firstname);

      loc = OrReader.getElementMeta(permitPgOr, "EmergencyContactNumber").xpath;
      ele = await sel.getElementByXpath(loc);
      await sel.setText(ele, contact);

      await sel.getWaitUtils().sleep(1000);
      loc = OrReader.getElementMeta(permitPgOr, "ContactListNumber").xpath;
      await sel.clickByXpath(loc);
      //clickByXpath(loc);

      loc = OrReader.getElementMeta(permitPgOr, "ContactListOrder").xpath;
      await sel.clickElementByXpathContainingText(loc, index);
      //        click();

      loc = OrReader.getElementMeta(permitPgOr, "AddContactButton").xpath;
      await sel.clickByXpath(loc);

      try {
        loc = OrReader.getElementMeta(permitPgOr, "Spinner").xpath;
        await sel
          .getWaitUtils()
          .waitForElementRemoved(LocFindStrategy.Xpath, loc);
      } catch (err) {
        //eating
      }
    }
    await sel.getWaitUtils().sleep(5000);

    logger.exitMethod(`enterLWCustomerDetails`);
  }

  /**
   * @description Validate Permit Section is available
   *
   */
  static async validatePermitSectionIsAvailable() {
    logger.enterMethod(`validatePermitSectionIsAvailable`);
    await sel.getJsUtils().isPageLoaded();
    const loc = OrReader.getElementMeta(permitPgOr, "PermitTab").xpath;
    const ele = await sel.getElementByXpath(loc);
    logger.exitMethod(`validatePermitSectionIsAvailable`);
    return await sel.isVisible(ele);
  }
}

module.exports = PermitPage;
