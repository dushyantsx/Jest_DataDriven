const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const { LocFindStrategy } = require("../../globals/enumerations");
const logger = require("../../logger/Logger");
const StringUtils = require("../../utils/common/StringUtils");

const createCustPageOr = OrReader.getCreateCustomerPageOr();
class CreateCustomerPage {
  /**
   * @description Searches for given customer id
   * @param {String} customerId Specifies text to be searched
   */
  static async searchEnterpriseCustomerId(customerId) {
    logger.enterMethod(`searchEnterpriseCustomerId ${customerId}`);
    let loc = OrReader.getElementMeta(createCustPageOr, "EnterpriseCustomerId")
      .css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, customerId);

    loc = OrReader.getElementMeta(createCustPageOr, "CheckIdButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod("clickAddNewCustomer");
  }

  /**
   * @description Starts creating a new customer along with identity account
   *
   * @param {String} fn Specifies first name of new customer
   * @param {String} ln Specifies last name of new customer
   * @param {String} em Specifies email of new customer
   */
  static async createNewCustomer(fn, ln, em) {
    logger.enterMethod(`createNewCustomer ${fn}, ${ln}, ${em}`);
    let loc = OrReader.getElementMeta(createCustPageOr, "FirstName").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, fn);

    loc = OrReader.getElementMeta(createCustPageOr, "LastName").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, ln);

    loc = OrReader.getElementMeta(createCustPageOr, "Email").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, em);

    loc = OrReader.getElementMeta(createCustPageOr, "CreateButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod("createNewCustomer");
  }

  /**
   * @description Starts creating a new customer without identity account
   *
   * @param {String} fn Specifies first name of new customer
   * @param {String} ln Specifies last name of new customer
   * @param {String} em Specifies email of new customer
   */
  static async createNewCustomerWithoutIdentityAccount(fn, ln, em) {
    logger.enterMethod(`createNewCustomer ${fn}, ${ln}, ${em}`);
    let loc = OrReader.getElementMeta(createCustPageOr, "FirstName").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, fn);

    loc = OrReader.getElementMeta(createCustPageOr, "LastName").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, ln);

    loc = OrReader.getElementMeta(createCustPageOr, "Email").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, em);

    loc = OrReader.getElementMeta(createCustPageOr, "CreateIdentityAccount")
      .css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "CreateButton").css;
    await sel.clickByCss(loc);

    await sel.getWaitUtils().sleep(3000);

    logger.exitMethod("createNewCustomer");
  }

  /**
   * @typedef {Object} CheckAddressReturn
   * @property {Object} city
   * @property {String} city.itemid
   * @property {String} city.parentid
   * @property {String} province
   * @property {Object} address
   * @property {String} address.text
   * @property {Object} address.rel
   * @property {String} address.rel.id
   * @property {String} address.rel.text
   */
  /**
   * @description Populates and Checks all address details
   *
   * @param {String} ct Specifies city of new customer
   * @param {String} ctlov Specifies city to be chosen of new customer
   * @param {String} pv Specifies province of new customer
   * @param {String} ad Specifies address of new customer
   * @param {String} adlov Specifies address to be chosen of new customer
   * @returns {Promise<CheckAddressReturn>}
   */
  static async checkAddress(ct, ctlov, pv, ad, adlov) {
    logger.enterMethod(`checkAddress ${ct}, ${pv}, ${ad}`);
    await sel.getWaitUtils().sleep(5000);
    const output = {};
    output.city = {};
    output.address = {};
    output.address.rel = {};

    let loc = OrReader.getElementMeta(createCustPageOr, "City").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, ct);

    loc = OrReader.getElementMeta(createCustPageOr, "CityLov").xpath;
    await sel.clickElementByXpathContainingText(loc, ctlov);

    loc = OrReader.getElementMeta(createCustPageOr, "City").css;
    output.city.itemid = await sel.getAttributeByCss(loc, "itemid");
    output.city.parentid = await sel.getAttributeByCss(loc, "parentid");

    loc = OrReader.getElementMeta(createCustPageOr, "Province").css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "ProvinceLov").css;
    await sel.clickElementByCssContainingText(loc, pv);

    loc = OrReader.getElementMeta(createCustPageOr, "Province").css;
    output.province = await sel.getTextByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "AddressSearch").css;
    await sel.findElementAndSetText(LocFindStrategy.CssSel, loc, ad);

    loc = OrReader.getElementMeta(createCustPageOr, "AddressSearchLov").xpath;
    output.address.text = await sel.getAttributeByXpathContainingText(
      loc,
      ad,
      "innerText"
    );
    output.address.rel.text = await sel.getAttributeByXpathContainingText(
      loc,
      ad,
      "rel"
    );
    output.address.rel.id = StringUtils.extractNumbers(output.address.rel.text);
    await sel.clickElementByXpathContainingText(loc, adlov);

    loc = OrReader.getElementMeta(createCustPageOr, "CheckButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod(`checkAddress: ${JSON.stringify(output)}`);
    return output;
  }

  /**
   * @description Clicks Next button for checked Address
   */
  static async clickNextForCheckedAddress() {
    logger.enterMethod(`clickNextForCheckedAddress`);
    try {
      const loc = OrReader.getElementMeta(
        createCustPageOr,
        "NextButtonCheckAddress"
      ).css;
      await sel.clickByCss(loc);
    } catch (err) {
      //Eating error
    }
    logger.exitMethod("clickNextForCheckedAddress");
  }

  /**
   * @description Verifies all given services to be available
   *
   * @param {String} services Specifies service(s) to verify for availability
   */
  static async verifyServiceAvailability(services) {
    logger.enterMethod(`verifyServiceAvailability ${services}`);
    try {
      const loc = OrReader.getElementMeta(
        createCustPageOr,
        "ServicesAvailableList"
      ).xpath;
      const eles = await sel.getElementsByXpathContainingText(loc, services);

      if (eles != null && eles !== undefined && eles.length > 0) {
        logger.exitMethod(
          `verifyServiceAvailability: Service(s) ${services} available`
        );
        return eles;
      }
    } catch (err) {
      logger.info(`Eating error for service availibility verification:${err}`);
    }
    // throw new Error(`Service ${services} seems to have unavaileble service`);
  }

  /**
   * @description Clicks on Proceed to customer creation button
   */
  static async proceedToCustomerCreation() {
    logger.enterMethod(`proceedToCustomerCreation`);
    const loc = OrReader.getElementMeta(
      createCustPageOr,
      "ProceedToCustomerCreation"
    ).css;
    await sel.clickByCss(loc);

    logger.exitMethod("proceedToCustomerCreation");
  }

  /**
   * @description Populates and continues with all credit details
   *
   * @param {String} mn Specifies month of new customer
   * @param {String} d Specifies day of new customer
   * @param {String} yr Specifies year of new customer
   * @param {String} pr Specifies province of residence of new customer
   */
  static async continueWithSecureCreditCheck(mn, d, yr, pr) {
    logger.enterMethod(
      `continueWithSecureCreditCheck ${mn}, ${d}, ${yr}, ${pr}`
    );
    let loc = OrReader.getElementMeta(createCustPageOr, "Month").css;
    await sel.clickByCss(loc);

    await sel.getJsUtils().isPageLoaded();

    loc = OrReader.getElementMeta(createCustPageOr, "MonthLov").css;
    await sel.clickElementByCssContainingText(loc, mn);

    loc = OrReader.getElementMeta(createCustPageOr, "Day").css;
    await sel.clickByCss(loc);

    await sel.getJsUtils().isPageLoaded();

    loc = OrReader.getElementMeta(createCustPageOr, "DayLov").css;
    await sel.clickElementByCssContainingText(loc, d);

    loc = OrReader.getElementMeta(createCustPageOr, "Year").css;
    await sel.clickByCss(loc);

    await sel.getJsUtils().isPageLoaded();

    loc = OrReader.getElementMeta(createCustPageOr, "YearLov").css;
    await sel.clickElementByCssContainingText(loc, yr);

    loc = OrReader.getElementMeta(createCustPageOr, "ProvinceOfResidence").css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "ProvinceOfResidenceLov")
      .css;
    await sel.clickElementByCssContainingText(loc, pr);

    loc = OrReader.getElementMeta(createCustPageOr, "ContinueButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod("continueWithSecureCreditCheck");
  }

  /**
   * @description Populates driver license number identity details
   *
   * @param {String} lic Specifies driver license number
   * @param {String} pr Specifies province of residence where customer license issued
   */
  static async fillDriverLicenseIdentityDetails(lic, pr) {
    logger.enterMethod(`fillDriverLicenseIdentityDetails ${lic}, ${pr}`);
    let loc = OrReader.getElementMeta(
      createCustPageOr,
      "DriverLicenseContainer"
    ).css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "DriverLicenseNumber")
      .xpath;
    await sel.findElementByXpathAndSetText(loc, lic);

    loc = OrReader.getElementMeta(createCustPageOr, "DriverLicenseProvince")
      .css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "DriverLicenseProvinceLov")
      .css;
    await sel.clickElementByCssContainingText(loc, pr);

    logger.exitMethod("fillDriverLicenseIdentityDetails");
  }

  /**
   * @description Provides authorization and validate all provided details
   */
  static async authorizeAndValidate() {
    logger.enterMethod("authorizeAndValidate");
    let loc = OrReader.getElementMeta(createCustPageOr, "IAuthorizeCheckbox")
      .css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "ValidateButton").css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(createCustPageOr, "NextButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod("authorizeAndValidate");
    return true;
  }
}

module.exports = CreateCustomerPage;
