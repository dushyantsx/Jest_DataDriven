const webdriver = require("selenium-webdriver");
const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const StringUtils = require("../../utils/common/StringUtils");
const logger = require("../../logger/Logger");
const { LocFindStrategy } = require("../../globals/enumerations");

const apptPageOr = OrReader.getAppointmentPageOr();
class AppointmentPage {
  /**
   * @description Enters given project code and click on Load-Available-Slots to load time slots
   * @param {String} projectCode
   */
  static async loadProjectCodeTimeSlots(projectCode) {
    let loc = OrReader.getElementMeta(apptPageOr, "ProjectCode").css;
    await sel.findElementByCssAndSetText(loc, projectCode);

    loc = OrReader.getElementMeta(apptPageOr, "LoadAvailableSlots").css;
    await sel.clickByCss(loc);
  }

  /**
   * @description Selects any first available date for the appointment
   */
  static async selectAvailableDate(retryAttempt = 0) {
    logger.enterMethod(`selectAvailableDate ${retryAttempt}`);
    if (retryAttempt > 9) {
      throw new Error(
        "No available dates found even after trying for 10 consecutive months"
      );
    }
    const locNextMonth = OrReader.getElementMeta(
      apptPageOr,
      "CalendarNextMonthArrow"
    ).css;

    try {
      const loc = OrReader.getElementMeta(apptPageOr, "DateLoading").xpath;

      await sel
        .getWaitUtils()
        .waitlongForElementRemoved(LocFindStrategy.Xpath, loc);
    } catch (err) {
      //eating error
    }
    const dateloc = OrReader.getElementMeta(
      apptPageOr,
      "AvailableDatesCollection"
    ).css;
    let eleColl = null;
    try {
      eleColl = await sel.getElementsByCssSelector(dateloc);
    } catch (err) {
      // eat exception in case no elements are found
    }
    if (eleColl == null || eleColl === undefined || eleColl.length === 0) {
      logger.debug(
        `No available date found till attempt ${retryAttempt} for selected month; moving in next month now to find any available date`
      );

      await sel.clickByCss(locNextMonth);
      return this.selectAvailableDate(++retryAttempt);
    }

    logger.info(`${eleColl.length} number of available dates found`);
    let res = null;
    try {
      res = await sel.click(eleColl[0]);
    } catch (err) {
      if (
        err instanceof webdriver.error.ElementClickInterceptedError ||
        err instanceof webdriver.error.InvalidElementStateError
      ) {
        return this.selectAvailableDate(++retryAttempt);
      }
    }
    logger.exitMethod("selectAvailableDate");
    return res;
  }

  /**
   * @description Selects any first available time for the appointment
   */
  static async selectAvailableTime() {
    logger.enterMethod(`selectAvailableTime`);
    await sel.getWaitUtils().sleep(1000);
    const loc = OrReader.getElementMeta(apptPageOr, "AvailableTimesCollection")
      .css;
    const eleColl = await sel.getElementsByCssSelector(loc);
    if (eleColl != null && eleColl !== undefined && eleColl.length > 0) {
      logger.info(`${eleColl.length} number of available time-slots found`);
      logger.exitMethod("selectAvailableTime");
      const slot = sel.getText(eleColl[eleColl.length - 1]);
      await sel.click(eleColl[eleColl.length - 1]);
      return slot;
    }

    throw new Error(
      "No available time slots found; seems to be BUG; why date is enabled if there are no times available"
    );
  }

  /**
   * @description Selects any available appointment; provides given contact name/phone and submits
   * @param {String} ctname
   * @param {String} ctphone
   * @param {String} ctcomments
   */
  static async submitAnyAvailableAppointment(ctname, ctphone, ctcomments) {
    logger.enterMethod(
      `submitAnyAvailableAppointment ${ctname} and ${ctphone}`
    );

    await sel.getWaitUtils().sleep(7000);
    const duration = {};
    duration.swtime = await this.getSWTDuration();
    await this.selectAvailableDate();
    duration.startdate = await this.getAppointmentDate();
    await sel.getJsUtils().isPageLoaded();
    duration.slot = await this.selectAvailableTime();
    await sel.getJsUtils().isPageLoaded();

    let loc = OrReader.getElementMeta(apptPageOr, "NextButton").css;
    await sel.clickByCss(loc);

    await sel.getJsUtils().isPageLoaded();

    if (!StringUtils.isEmpty(ctname)) {
      loc = OrReader.getElementMeta(apptPageOr, "ContactName").css;
      await sel.findElementByCssAndSetText(loc, ctname);
    }

    if (!StringUtils.isEmpty(ctphone)) {
      loc = OrReader.getElementMeta(apptPageOr, "ContactPhoneNumber").css;
      await sel.findElementByCssAndSetText(loc, ctphone);
    }

    if (!StringUtils.isEmpty(ctcomments)) {
      loc = OrReader.getElementMeta(
        apptPageOr,
        "AdditionalAccessInformationForTechnician"
      ).css;
      await sel.findElementByCssAndSetText(loc, ctcomments);
    }

    loc = OrReader.getElementMeta(apptPageOr, "NextButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod("submitAnyAvailableAppointment");
    return duration;
  }

  static async clickonSelectedService() {
    logger.enterMethod(`clickonSelectedService`);
    let loc = OrReader.getElementMeta(apptPageOr, "SelectedService").xpath;
    await sel.getWaitUtils().sleep(5000);
    await sel.getWaitUtils().waitForElementEnabled(LocFindStrategy.Xpath, loc);
    await sel.clickByXpath(loc);

    await sel.getWaitUtils().sleep(9000);

    await sel.getJsUtils().isPageLoaded();
    loc = OrReader.getElementMeta(apptPageOr, "NextButtontop").css;
    const ele = await sel.getElementByCssSelector(loc);
    await sel.getJsUtils().clickUsingJavascript(ele);

    logger.exitMethod("clickonSelectedService");
  }

  /**
   * @description Clicks on Create Appointment button
   */
  static async clickOnCreateAppointment() {
    logger.enterMethod(`clickOnCreateAppointment`);
    const loc = OrReader.getElementMeta(apptPageOr, "CreateNewAppointment").css;
    await sel.clickByCss(loc);
    await sel.getWaitUtils().sleep(3000);
    logger.exitMethod(`clickOnCreateAppointment`);
  }

  /**
   * @description Clicks on Service
   * @param {String} service
   */
  static async selectServiceForAppointment(service) {
    logger.enterMethod(`selectServiceForAppointment${service}`);
    let loc = OrReader.getElementMeta(apptPageOr, "CreateNewAppointment").css;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.clickElementByCssContainingText(loc, service);
    await sel.getWaitUtils().sleep(2000);

    logger.exitMethod(`selectServiceForAppointment`);
  }

  /**
   * @description Clicks on confirmButton
   *
   */
  static async clickConfirmButton() {
    logger.enterMethod(`clickConfirmButton`);
    const loc = OrReader.getElementMeta(apptPageOr, "ConfirmButton").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`clickConfirmButton`);
  }

  static async enterContactDetails(ctname, ctphone, ctcomments) {
    logger.enterMethod(
      `enterContactDetails ${ctname} ${ctphone} ${ctcomments}`
    );
    let loc;
    if (!StringUtils.isEmpty(ctname)) {
      loc = OrReader.getElementMeta(apptPageOr, "ContactName").css;
      await sel.findElementByCssAndSetText(loc, ctname);
    }

    if (!StringUtils.isEmpty(ctphone)) {
      loc = OrReader.getElementMeta(apptPageOr, "ContactPhoneNumber").css;
      await sel.findElementByCssAndSetText(loc, ctphone);
    }

    if (!StringUtils.isEmpty(ctcomments)) {
      loc = OrReader.getElementMeta(
        apptPageOr,
        "AdditionalAccessInformationForTechnician"
      ).css;
      await sel.findElementByCssAndSetText(loc, ctcomments);
    }

    loc = OrReader.getElementMeta(apptPageOr, "NextButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod("enterContactDetails");
  }

  static async getSWTDuration() {
    logger.enterMethod(`getSWTDuration`);

    const loc = OrReader.getElementMeta(apptPageOr, "SWTDuration").css;
    const duration = await sel.getTextByCss(loc);

    logger.exitMethod("getSWTDuration");
    return duration;
  }

  static async clickOnNextButton() {
    logger.enterMethod("clickOnNextButton");
    let loc = OrReader.getElementMeta(apptPageOr, "NextButtontop").css;
    const ele = await sel.getElementByCssSelector(loc);
    await sel.getJsUtils().clickUsingJavascript(ele);
    loc = OrReader.getElementMeta(apptPageOr, "Rule4kPopupContinueWithOrder")
      .css;
    try {
      await sel.clickByCss(loc);
    } catch (err) {
      logger.info(err);
      //eating error
    }
    logger.exitMethod("clickOnNextButton");
  }

  static async getAppointmentDate() {
    logger.enterMethod("getAppointmentDate");
    const loc = OrReader.getElementMeta(apptPageOr, "Appointment Date").xpath;
    const date = await sel.getTextByXpath(loc);
    const dt = new Date(date);
    let startdate = dt.toISOString(date);
    startdate = StringUtils.substringBetweenIgnoreCase(startdate, "", "T");

    logger.exitMethod("clickOnNextButton");
    return startdate;
  }

  /**
   * @description Selects any available appointment; provides given contact name/phone and submits
   * @param {String} ctname
   * @param {String} ctphone
   * @param {String} ctcomments
   */
  static async submitAnyChangedAppointment(ctname, ctphone) {
    logger.enterMethod(
      `submitAnyAvailableAppointment ${ctname} and ${ctphone}`
    );

    await sel.getWaitUtils().sleep(7000);
    const duration = {};
    duration.swtime = await this.getSWTDuration();
    await this.selectAvailableDate();
    duration.startdate = await this.getAppointmentDate();
    duration.slot = await this.selectAvailableTime();

    if (!StringUtils.isEmpty(ctname)) {
      const loc = OrReader.getElementMeta(apptPageOr, "ContactName").css;
      await sel.findElementByCssAndSetText(loc, ctname);
    }

    if (!StringUtils.isEmpty(ctphone)) {
      const loc = OrReader.getElementMeta(apptPageOr, "ContactPhoneNumber").css;
      await sel.findElementByCssAndSetText(loc, ctphone);
    }

    const loc = OrReader.getElementMeta(apptPageOr, "ConfirmButton").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod("submitAnyAvailableAppointment");
    return duration;
  }
}

module.exports = AppointmentPage;
