const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");
const StringUtils = require("../../utils/common/StringUtils");
const { LocFindStrategy } = require("../../globals/enumerations");

const csrDesktopPageOr = OrReader.getPageOr("CsrDesktopPage.json");
class CsrDesktopPage {
  /**
   * @description Clicks Add New Customer button and waits for create-customer page
   */
  static async clickAddNewCustomer() {
    logger.enterMethod("clickAddNewCustomer");
    const loc = OrReader.getElementMeta(csrDesktopPageOr, "AddNewCustomer").css;
    await sel.clickByCss(loc);
    await sel.getWaitUtils().waitForUrlToChangeTo("create_customer");
    logger.exitMethod("clickAddNewCustomer");
  }

  /**
   * @description Clicks Check Address button and waits for create-customer page
   */
  static async clickCheckAddress() {
    logger.enterMethod("clickCheckAddress");
    const loc = OrReader.getElementMeta(csrDesktopPageOr, "CheckAddress").css;
    await sel.clickByCss(loc);
    await sel.getWaitUtils().waitForUrlToChangeTo("create_customer");
    await sel.getWaitUtils().sleep(2000);
    logger.exitMethod("clickCheckAddress");
  }

  /**
   * @description Searches customer based on given email id
   * @param {String} email
   */
  static async searchCustomerForEmail(email) {
    logger.enterMethod("searchCustomerForEmail");

    await sel.getJsUtils().isPageLoaded();

    let loc = OrReader.getElementMeta(csrDesktopPageOr, "Email").css;
    await sel.findElementByCssAndSetText(loc, email);

    await sel.getWaitUtils().sleep(5000);
    loc = OrReader.getElementMeta(csrDesktopPageOr, "SearchButton").css;
    await sel.clickByCss(loc);

    await sel.getWaitUtils().waitForUrlToChangeTo("create_customer");

    loc = OrReader.getElementMeta(csrDesktopPageOr, "SearchResultFirstCard")
      .css;
    await sel.getWaitUtils().waitForElementVisible(LocFindStrategy.CssSel, loc);

    logger.exitMethod("searchCustomerForEmail");
  }

  static async clickOnServiceslink() {
    logger.enterMethod("clickOnServicesLink");
    let loc = OrReader.getElementMeta(
      csrDesktopPageOr,
      "SearchResultFirstCardServicesLink"
    ).css;
    const ele = sel.getElementByCssSelector(loc);
    await sel.getJsUtils().clickUsingJavascript(ele);

    loc = OrReader.getElementMeta(csrDesktopPageOr, "Override").xpath;
    try {
      await sel.clickByXpath(loc);
    } catch (err) {
      // eat exception
    }

    await sel.getJsUtils().isPageLoaded();
    logger.exitMethod("clickOnServicesLink");
  }

  /**
   * @description Click on provided city radio button
   * @param {String} city
   */
  static async clickCityRadioButton(city) {
    logger.enterMethod(`clickCityRadioButton ${city}`);

    let loc = OrReader.getElementMeta(csrDesktopPageOr, "AvailableCities")
      .xpath;

    await sel.getWaitUtils().waitForElementEnabled(LocFindStrategy.Xpath, loc);
    const elements = await sel.getElementsByXpathContainingText(loc, city);

    if (elements == null || elements.length === 0)
      throw new Error(`Could not find element having service text as ${city}`);
    const eleToOrderText = await sel.getText(elements[0]);
    loc = OrReader.getElementMeta(csrDesktopPageOr, "CityRadio").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", eleToOrderText);
    await sel.clickByXpath(loc);

    logger.exitMethod(`clickCityRadioButton`);
  }

  /**
   * @description Click on Book Appointment button on search result
   */
  static async clickOnBookAppointment() {
    logger.enterMethod("clickOnBookAppointment");
    const loc = OrReader.getElementMeta(
      csrDesktopPageOr,
      "SearchResultFirstCardBookAppointmentLink"
    ).xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickOnBookAppointment");
  }

  /**
   * @description Click on Discount button on search result
   */
  static async clickOnManageDiscount() {
    logger.enterMethod("clickOnManageDiscount");
    const loc = OrReader.getElementMeta(
      csrDesktopPageOr,
      "SearchResultFirstCardManageDiscountsLink"
    ).css;
    await sel.clickByCss(loc);
    logger.exitMethod("clickOnManageDiscount");
  }
  /**
   * @description Click on Show Migration Offers button on search result
   * @param {String} option
   */

  static async clickOnUserDropDownOption(option) {
    logger.enterMethod(`clickOnUserDropDownOption${option}`);
    let loc = OrReader.getElementMeta(csrDesktopPageOr, "CustomerName").id;
    await sel.clickById(loc);
    loc = OrReader.getElementMeta(csrDesktopPageOr, "UserDropDownOptions")
      .xpath;
    await sel.clickElementByXpathContainingText(loc, option);
    logger.exitMethod("clickOnUserDropDownOption");
  }

  static async clickViewAllLocations() {
    logger.enterMethod(`clickViewAllLocations`);
    const loc = OrReader.getElementMeta(csrDesktopPageOr, "ViewAllLocations")
      .xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickViewAllLocations");
  }
}

module.exports = CsrDesktopPage;
