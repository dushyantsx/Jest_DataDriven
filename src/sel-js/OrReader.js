/* eslint-disable no-dupe-class-members */
const FileSystem = require("../utils/common/FileSystem");
const StringUtils = require("../utils/common/StringUtils");
const errors = require("../errors/CustomErrors");
const logger = require("../logger/Logger");
const config = require("../../br-config");
const WaitUtils = require("./WaitUtils");

/**
 * @typedef {Object} OrMeta
 * @property {String} type
 * @property {String} id
 * @property {String} name
 * @property {String} xpath
 * @property {String} className
 * @property {String} css
 * @property {String} linkText
 */

// eslint-disable-next-line no-unused-vars
const envconfig = config.get(config.getCmdParam("env"));

class OrReader {
  static getDynamicDataKeyword() {
    return "#DYN_DATA#";
  }

  static getPageOr(OrFileName) {
    let OrFilePath = OrFileName;
    if (!FileSystem.fileExistsSync(OrFilePath)) {
      OrFilePath = `${config.getLocationOrForGivenEnv()}/${OrFileName}`;
      if (!FileSystem.fileExistsSync(OrFilePath)) {
        throw new errors.FileNotFoundError(`File not found: ${OrFilePath}`);
      }
    }
    return FileSystem.readFileSync(OrFilePath);
  }

  /**
   *
   * @param {Object} elementObjectRepo
   * @param {String} identifier
   * @returns {OrMeta}
   */
  static getElementMeta(elementObjectRepo, identifier) {
    return this.getElementMeta(elementObjectRepo, identifier, true);
  }

  /**
   *
   * @param {Object} elementObjectRepo
   * @param {String} identifier
   * @param {String} validateUrlBeforeReturningElement
   * @returns {OrMeta}
   */
  static getElementMeta(
    elementObjectRepo,
    identifier,
    validateUrlBeforeReturningElement
  ) {
    logger.enterMethod("getElementMeta");
    if (StringUtils.isEmpty(elementObjectRepo)) {
      throw new Error(
        `No element object repository ${elementObjectRepo} provided`
      );
    }

    const eleOr = JSON.parse(elementObjectRepo);
    logger.trace(`JSON parsed as: ${eleOr}`);
    if (eleOr != null && eleOr !== undefined && eleOr.elements.length > 0) {
      const { urlcontains } = eleOr;
      if (validateUrlBeforeReturningElement) {
        if (!StringUtils.isEmpty(urlcontains)) {
          (async () => {
            await WaitUtils.waitForUrlToChangeTo(urlcontains);
            logger.debug(`Wait for urlcontains ${urlcontains} finished`);
          })();
        }
      }
      for (let i = 0; i < eleOr.elements.length; i++) {
        const eleInfo = eleOr.elements[i];
        if (StringUtils.equalsIgnoreCase(eleInfo.identifier, identifier)) {
          logger.debug(
            `Element meta for ${identifier} : ${JSON.stringify(eleInfo.meta)}`
          );
          return eleInfo.meta;
        }
      }
    } else {
      throw new Error(
        `No such identifier [${identifier}] found in given element object repository`
      );
    }
    logger.exitMethod("getElementMeta");
    return "";
  }

  static getCreateCustomerPageOr() {
    const pageOr = OrReader.getPageOr("CreateCustomerPage.json");
    return pageOr;
  }

  static getShippingDetailsPageOr() {
    const pageOr = OrReader.getPageOr("ShippingDetailsPage.json");
    return pageOr;
  }

  static getRulesPopupOr() {
    const pageOr = OrReader.getPageOr("RulesPopup.json");
    return pageOr;
  }

  static getCsrDesktopPage() {
    const pageOr = OrReader.getPageOr("CsrDesktopPage.json");
    return pageOr;
  }

  static getEquipmentPageOr() {
    const pageOr = OrReader.getPageOr("EquipmentPage.json");
    return pageOr;
  }

  static getCreditApprovalPageOr() {
    const pageOr = OrReader.getPageOr("CreditApprovalPage.json");
    return pageOr;
  }

  static getAppointmentPageOr() {
    const pageOr = OrReader.getPageOr("AppointmentPage.json");
    return pageOr;
  }

  static getCheckoutPageOr() {
    const pageOr = OrReader.getPageOr("CheckoutPage.json");
    return pageOr;
  }

  static getBillingInformationPageOr() {
    const pageOr = OrReader.getPageOr("BillingInformationPage.json");
    return pageOr;
  }

  static getSubmitSuccessPageOr() {
    const pageOr = OrReader.getPageOr("SubmitSuccessPage.json");
    return pageOr;
  }

  static getHomePageOr() {
    const pageOr = OrReader.getPageOr("HomePage.json");
    return pageOr;
  }

  static getSelectServicesPageOr() {
    const pageOr = OrReader.getPageOr("SelectServicesPage.json");
    return pageOr;
  }

  static getSsoLoginPageOr() {
    const pageOr = OrReader.getPageOr("SsoLoginPage.json");
    return pageOr;
  }

  static getAccountPageOr() {
    const pageOr = OrReader.getPageOr("AccountPage.json");
    return pageOr;
  }

  static getManageServicesPageOr() {
    const pageOr = OrReader.getPageOr("ManageServicesPage.json");
    return pageOr;
  }

  static getPermitPageOr() {
    const pageOr = OrReader.getPageOr("PermitPage.json");
    return pageOr;
  }

  static getEmergencyContactPageOr() {
    const pageOr = OrReader.getPageOr("EmergencyContact.json");
    return pageOr;
  }

  static getCustomizePageOr() {
    const pageOr = OrReader.getPageOr("CustomizePage.json");
    return pageOr;
  }

  static getNetcrackerOr() {
    const pageOr = OrReader.getPageOr("Netcracker.json");
    return pageOr;
  }
}

module.exports = OrReader;
