const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const StringUtils = require("../../utils/common/StringUtils");
const logger = require("../../logger/Logger");
const { LocFindStrategy } = require("../../globals/enumerations");
const RulesPopup = require("./RulesPopup");

const equPageOr = OrReader.getEquipmentPageOr();
class EquipmentPage {
  /**
   * @description Does not change anything with default set values and moves to next
   */
  static async validateDefaultSetEquipmentsAndMoveToNextStep() {
    logger.enterMethod(`validateDefaultSetEquipmentsAndMoveToNextStep`);
    const loc = OrReader.getElementMeta(equPageOr, "NextButton").css;
    await sel.clickByCss(loc);
    logger.exitMethod("validateDefaultSetEquipmentsAndMoveToNextStep");
  }

  /**
   * @description Completes and clicks next on You Pick section with all default values
   */
  static async completeYouPickSectionOnDefaults() {
    const youpickequipments = {};
    logger.enterMethod(`completeYouPickSectionOnDefaults`);
    const locTitle = OrReader.getElementMeta(equPageOr, "Title").css;
    await sel
      .getWaitUtils()
      .waitForElementLocated(LocFindStrategy.CssSel, locTitle, 5000);

    const loc = OrReader.getElementMeta(equPageOr, "YouPickItemList").xpath;
    youpickequipments.ypEquipments = await sel.getTextAllByXpath(loc);

    const locNext = OrReader.getElementMeta(equPageOr, "YouPickNextButton").css;

    // If on equipment page, click next to continue to next step on equipment page
    await sel
      .getWaitUtils()
      .sleep(5000)
      .then(async function clickNextAgain() {
        await sel.clickByCss(locNext);
      });

    await sel.getJsUtils().isPageLoaded();

    logger.exitMethod("completeYouPickSectionOnDefaults");
    return youpickequipments;
  }

  /**
   * @description Completes and clicks next on Home Security section with all default values
   * @param {String} deliveryMethod Specifies delivery method to use. It can be either self / technician.
   */
  static async completeHomeSecuritySectionOnDefaults(deliveryMethod) {
    logger.enterMethod(
      `completeHomeSecuritySectionOnDefaults: Delivery Method: ${deliveryMethod}`
    );

    const homesecurityequipments = {};

    let loc = OrReader.getElementMeta(equPageOr, "MyEquipmentsList").css;
    homesecurityequipments.hsmyEquipments = await sel.getTextAllByCss(loc);

    await sel.getWaitUtils().sleep(3000);
    try {
      loc = OrReader.getElementMeta(equPageOr, "HSIncludedEquipmentButton")
        .xpath;
      await sel.clickByXpath(loc);
    } catch (err) {
      logger.info(err);
      //eating error for stale element
    }
    await sel.getJsUtils().isPageLoaded();
    loc = OrReader.getElementMeta(equPageOr, "HSIncludedEquipment").xpath;
    homesecurityequipments.hsincludedEquipments = await sel.getTextAllByXpath(
      loc
    );
    await sel.getWaitUtils().sleep(1000);
    loc = OrReader.getElementMeta(equPageOr, "HSAdditionalEquipment").xpath;
    homesecurityequipments.hsadditionalEquipments = await sel.getTextAllByXpath(
      loc
    );

    if (!StringUtils.isEmpty(deliveryMethod)) {
      loc = OrReader.getElementMeta(equPageOr, "DeliveryMethodsCollection").css;
      const delMethods = await sel.getElementsByCssSelector(loc);
      for (const ele of delMethods) {
        const eleText = await sel.getText(ele);
        if (StringUtils.containsIgnoreCase(eleText, deliveryMethod)) {
          await sel.click(ele);
          break;
        }
      }
    }

    // If on equipment page, click next to continue to next step on equipment page
    const locNext = OrReader.getElementMeta(
      equPageOr,
      "EquipmentDetailsNextButton"
    ).css;
    await sel
      .getWaitUtils()
      .sleep(5000)
      .then(async function clickNextAgain() {
        await sel.clickByCss(locNext);
      });

    try {
      homesecurityequipments.popup = await RulesPopup.continueSafely().catch(
        (err) => {
          logger.error(err);
        }
      );
    } catch (err) {
      logger.error(err);
    }

    logger.exitMethod("completeHomeSecuritySectionOnDefaults");
    return homesecurityequipments;
  }

  /**
   * @description Completes and clicks next on Home Security section with all default values
   * @param {String} deliveryMethod Specifies delivery method to use. It can be either self / technician.
   */
  static async completeLivingWellSectionOnDefaults(deliveryMethod) {
    logger.enterMethod(
      `completeLivingWellSectionOnDefaults: Delivery Method: ${deliveryMethod}`
    );
    const equipments = {};

    let loc = OrReader.getElementMeta(equPageOr, "MyEquipmentsList").css;
    equipments.lwmyEquipments = await sel.getTextAllByCss(loc);
    await sel.getWaitUtils().sleep(1000);
    loc = OrReader.getElementMeta(equPageOr, "IncludedEquipment").xpath;
    await sel.clickByXpath(loc);
    loc = OrReader.getElementMeta(equPageOr, "IncludedEquipmentsList").css;
    equipments.lwincludedEquipments = await sel.getTextAllByCss(loc);
    try {
      loc = OrReader.getElementMeta(equPageOr, "AdditionalEquipmentsList")
        .xpath;
      equipments.lwlwadditionalEquipments = await sel.getTextAllByXpath(loc);
    } catch (err) {
      //Eating Error
    }

    loc = OrReader.getElementMeta(equPageOr, "DeliveryMethodsCollection").css;
    const delMethods = await sel.getElementsByCssSelector(loc);
    if (!StringUtils.isEmpty(deliveryMethod)) {
      for (const ele of delMethods) {
        const eleText = await sel.getText(ele);
        if (StringUtils.containsIgnoreCase(eleText, deliveryMethod)) {
          await sel.click(ele);
          break;
        }
      }
    }

    // If on equipment page, click next to continue to next step on equipment page
    const locNext = OrReader.getElementMeta(
      equPageOr,
      "EquipmentDetailsNextButton"
    ).css;
    await sel
      .getWaitUtils()
      .sleep(5000)
      .then(async function clickNextAgain() {
        await sel.clickByCss(locNext);
      });
    logger.exitMethod("completeLivingWellSectionOnDefaults");
    return equipments;
  }

  /**
   * @description Submit Equipment section with all default values
   */
  static async completeAddOnEquipmentSectionOnDefaults() {
    logger.enterMethod(`completeAddOnEquipmentSectionOnDefaults`);
    try {
      const loc = OrReader.getElementMeta(equPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      // eating error
    }
    const addOnAdditionalEquipments = {};
    let loc = OrReader.getElementMeta(
      equPageOr,
      "AddOnAdditionalEquipmentTitleCollection"
    ).css;
    //  await sel.getElementByCssSelector(loc);
    addOnAdditionalEquipments.additionalEquipments = await sel.getTextAllByCss(
      loc
    );
    logger.info(JSON.stringify(addOnAdditionalEquipments.additionalEquipments));

    await sel.getWaitUtils().sleep(1000);
    loc = OrReader.getElementMeta(equPageOr, "EquipmentDetailsNextButton").css;

    await sel.clickByCss(loc);

    logger.exitMethod(
      `completeAddOnEquipmentSectionOnDefaults - returning validation for all quantities to zero${JSON.stringify(
        addOnAdditionalEquipments
      )}`
    );
    return addOnAdditionalEquipments;
  }

  static async clickAdditionalNextButton() {
    logger.enterMethod("clickAdditionalNextButton");
    // If on equipment page, click next to continue to next step on equipment page
    const locNext = OrReader.getElementMeta(
      equPageOr,
      "AdditionalNextButton",
      false
    ).css;
    await sel
      .getWaitUtils()
      .sleep(5000)
      .then(async () => {
        await sel.clickByCss(locNext);
      });
    logger.exitMethod("clickAdditionalNextButton");
  }

  /**
   * @description Submit Equipment section with all default values
   */
  static async submitEquipmentSectionOnAllDefaults() {
    logger.enterMethod(`submitEquipmentSectionOnAllDefaults`);
    await this.completeYouPickSectionOnDefaults();
    await this.completeHomeSecuritySectionOnDefaults();
    await this.completeAddOnEquipmentSectionOnDefaults("self", true);

    const loc = OrReader.getElementMeta(
      equPageOr,
      "Rule4kPopupContinueWithOrder"
    ).css;
    if (await sel.isVisibleByCss(loc)) await sel.clickByCss(loc);

    logger.exitMethod("submitEquipmentSectionOnAllDefaults");
  }

  /**
   * @description Clicks continue with order button; this is done when delivery method is Technical Install
   */
  static async continueWithOrderForAdditionalCharges() {
    await sel.getWaitUtils().sleep(1000);
    RulesPopup.acceptRulesSafely();
  }

  /**
   * @description Clicks continue with order button Safely; this is done when delivery method is Technical Install
   */
  static async continueWithOrderForAdditionalChargesSafely() {
    try {
      await this.continueWithOrderForAdditionalCharges();
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   * @description Validates all quantity fields to have value zero
   * @returns {Boolean} returns false if any quantity fields on Add-On Additional screen are not set to 0
   */
  static async validateAllQuantitiesToZero() {
    const loc = OrReader.getElementMeta(equPageOr, "AllQuantityFieldsList").css;
    const eleColl = await sel.getElementsByCssSelector(loc);
    for (const ele of eleColl) {
      let value = await sel.getAttribute(ele, "value");
      value *= 1;
      if (value !== 0) return false;
    }
    return true;
  }

  static async validateInvisibilityOfEasyPayments() {
    logger.enterMethod(`validateInvisibilityOfEasyPayments`);
    await sel.getJsUtils().isPageLoaded();
    const loc = OrReader.getElementMeta(equPageOr, "EasyPaymentsTab").xpath;
    logger.exitMethod(`validateInvisibilityOfEasyPayments`);
    try {
      await sel.getElementByXpath(loc);
      return false;
    } catch (error) {
      return true;
    }
  }

  static async completeAddOnEquipmentSectionOnDefaultsToContinueWithOrder() {
    logger.enterMethod(
      `completeAddOnEquipmentSectionOnDefaultsToContinueWithOrder`
    );
    let loc = OrReader.getElementMeta(
      equPageOr,
      "AddOnAdditionalEquipmentTitleCollection"
    ).css;
    await sel.getElementByCssSelector(loc);

    loc = OrReader.getElementMeta(equPageOr, "EquipmentDetailsNextButton").css;
    await sel.getWaitUtils().sleep(1000);
    await sel.clickByCss(loc);

    try {
      loc = OrReader.getElementMeta(equPageOr, "Rule4kPopupContinueWithOrder")
        .css;
      await sel.clickByCss(loc);
    } catch (err) {
      logger.error(err);
    }

    logger.exitMethod(
      "completeAddOnEquipmentSectionOnDefaultsToContinueWithOrder - returning validation for all quantities to zero"
    );
    return await this.validateAllQuantitiesToZero();
  }

  /**
   * @description Clicks on Add button quantity against provided equipment
   * @param {String} EquipmenttoAdd
   *
   */
  static async clickOnAddEquipment(EquipmenttoAdd) {
    logger.enterMethod(`clickOnAddEquipment ${EquipmenttoAdd}`);

    // let loc = OrReader.getElementMeta(equPageOr, "EquipmentList").xpath;
    // let elements = await sel.getElementsByXpathContainingText(loc, EquipmenttoAdd);

    // if (elements == null || elements.length == 0)
    //   throw new Error(`Could not find element having service text as ${EquipmenttoAdd}`);
    // let eleToOrderText = await sel.getText(elements[0]);
    let loc = OrReader.getElementMeta(
      equPageOr,
      "HomeSecurityEquipmentAddButton"
    ).xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", EquipmenttoAdd);
    await sel.clickByXpath(loc);

    try {
      loc = OrReader.getElementMeta(equPageOr, "QuantityLoadIcon").xpath;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.Xpath, loc);
    } catch (err) {
      //eating error
    }

    logger.exitMethod(`clickOnAddEquipment`);
  }

  /**
   * @description Clicks on Add button quantity against provided equipment
   * @param {String} EquipmenttoMinus   *
   */
  static async clickOnMinusEquipment(EquipmenttoMinus) {
    logger.enterMethod(`clickOnMinusEquipment ${EquipmenttoMinus}`);

    let loc = OrReader.getElementMeta(
      equPageOr,
      "HomeSecurityEquipmentMinusButton"
    ).xpath;
    // let elements = await sel.getElementsByXpathContainingText(loc, EquipmenttoAdd);

    // if (elements == null || elements.length == 0)
    //   throw new Error(`Could not find element having service text as ${EquipmenttoAdd}`);
    // let eleToOrderText = await sel.getText(elements[0]);
    // loc = OrReader.getElementMeta(equPageOr, "EquipmentMinusButton").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", EquipmenttoMinus);
    await sel.clickByXpath(loc);

    logger.exitMethod(`clickOnMinusEquipment`);
  }

  /**
   * @description click on next button   *
   */
  static async clickOnNextforChange() {
    logger.enterMethod(`clickOnNext`);

    let loc = OrReader.getElementMeta(equPageOr, "NextButton").css;
    await sel.clickByCss(loc);

    try {
      loc = OrReader.getElementMeta(equPageOr, "ConfirmTakeOver").css;
      const eletoclick = await sel.getElementsByCssContainingText(
        loc,
        "Confirm No Takeover"
      );
      await sel.getJsUtils().clickUsingJavascript(eletoclick[0]);
    } catch (err) {
      logger.info(err);
    }
    await sel.getWaitUtils().sleep(5000);

    try {
      loc = OrReader.getElementMeta(equPageOr, "Rule4kPopupContinueWithOrder")
        .css;
      await sel.clickByCss(loc);
    } catch (err) {
      logger.info(err);
    }

    logger.exitMethod(`clickOnNext`);
  }

  /**
   * @description Select Delivery Method*
   */
  static async selectDeliveryMethod(deliveryMethod) {
    logger.enterMethod(`selectDeliveryMethod ${deliveryMethod}`);
    const loc = OrReader.getElementMeta(equPageOr, "DeliveryMethodsCollection")
      .css;
    const delMethods = await sel.getElementsByCssSelector(loc);
    if (!StringUtils.isEmpty(deliveryMethod)) {
      for (const ele of delMethods) {
        const eleText = await sel.getText(ele);
        if (StringUtils.containsIgnoreCase(eleText, deliveryMethod)) {
          await sel.click(ele);
          break;
        }
      }
    }
    logger.enterMethod(`selectDeliveryMethod`);
  }

  /**
   * @description Select Delivery Method*
   */
  static async selectServicePlanTab(service) {
    logger.enterMethod(`selectServicePlanTab ${service}`);
    let loc = OrReader.getElementMeta(equPageOr, "ServicePlanHeader").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.clickByXpath(loc);

    logger.enterMethod(`selectServicePlanTab`);
  }

  /**
   * @description Select Delivery Method*
   */
  static async clickOnNextButton() {
    logger.enterMethod(`clickOnNextButton`);
    await sel.getJsUtils().isPageLoaded();
    const loc = OrReader.getElementMeta(equPageOr, "NextButton").css;
    await sel.getWaitUtils().sleep(2000);
    await sel.clickByCss(loc);
    await sel.getWaitUtils().sleep(2000);
    logger.exitMethod(`clickOnNextButton`);
  }

  /**
   * @description Completes TV Section by entering number of ctv connections required
   * @param {String} NumberofConnections Specifies Number of connections.
   */
  static async completeTVSection(NumberofConnections) {
    logger.enterMethod(
      `completeTVSection: Number Of connections: ${NumberofConnections}`
    );
    let loc = OrReader.getElementMeta(equPageOr, "TVQuantity").css;
    await sel.clickByCss(loc);

    await sel.getWaitUtils().sleep(500);

    loc = OrReader.getElementMeta(equPageOr, "QuantityDropdown").xpath;
    await sel.clickElementByXpathContainingText(loc, NumberofConnections);

    await sel.getWaitUtils().sleep(3000);

    logger.exitMethod("completeLivingWellSectionOnDefaults");
  }

  /**
   * @description Completes and clicks next on Home Security section with all default values
   */
  static async getOrderSteps() {
    logger.enterMethod(`getOrderSteps`);

    const loc = OrReader.getElementMeta(equPageOr, "OrderSteps").xpath;
    const steps = await sel.getTextAllByXpath(loc);
    logger.info(`All steps in order are:${steps}`);
    logger.exitMethod("getOrderSteps");
    return steps;
  }

  /**
   * @description Clicks on Continue
   */
  static async clickContinue() {
    logger.enterMethod(`clickContinue`);
    try {
      const loc = OrReader.getElementMeta(equPageOr, "Continue").xpath;
      await sel.clickByXpath(loc);
    } catch (err) {
      //eating error
    }

    logger.exitMethod("clickContinue");
  }

  static async getIntsallChargesMsg() {
    logger.enterMethod(`getIntsallChargesMsg`);
    const loc = OrReader.getElementMeta(equPageOr, "InstallationChargesPopUp")
      .xpath;
    logger.exitMethod("getIntsallChargesMsg");
    return await sel.getTextByXpath(loc);
  }

  /**
   * @description Clicks on confirm
   */
  static async clickConfirmTakeOver() {
    logger.enterMethod(`clickConfirmTakeOver`);
    const loc = OrReader.getElementMeta(equPageOr, "ConfirmTakeOver").css;
    const eletoclick = await sel.getElementsByCssContainingText(
      loc,
      "Confirm No Takeover"
    );
    await sel.getJsUtils().clickUsingJavascript(eletoclick[0]);

    logger.exitMethod("clickConfirmTakeOver");
  }

  /**
   * @description Clicks on next button
   */
  static async yourPickNextBtn() {
    logger.enterMethod(`clickOnYourPickNextbutton`);
    const locNext = OrReader.getElementMeta(equPageOr, "YouPickNextButton").css;
    await sel.clickByCss(locNext);
    logger.exitMethod(`clickOnYourPickNextbutton`);
  }

  /**
   * @description Clicks on Add button quantity against provided equipment
   * @param {String} EquipmenttoAdd
   *
   */
  static async addYourPickCamera(cameraName) {
    logger.enterMethod(`addYourPickCamera ${cameraName}`);
    let loc = OrReader.getElementMeta(equPageOr, "YourPickCamera").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", cameraName);
    await sel.clickByXpath(loc);
    logger.exitMethod(`addYourPickCamera`);
  }

  static async cameraMaxCountMsg() {
    logger.enterMethod(`cameraMaxCountMsg`);
    const output = {};
    await sel.getWaitUtils().sleep(3000);
    const loc = OrReader.getElementMeta(equPageOr, "CameraCountMsg").xpath;
    const txt = await sel.getTextByXpath(loc);
    if (
      !StringUtils.isEmpty(txt) &&
      StringUtils.containsIgnoreCase(
        txt,
        "A maximum of 8 Camera’s can be added to an account."
      )
    )
      output.successMessage = txt;

    const locNext = OrReader.getElementMeta(equPageOr, "OKPopUp").xpath;
    await sel.clickByXpath(locNext);

    await sel.getWaitUtils().sleep(2000);

    logger.exitMethod("cameraMaxCountMsg");
  }

  static async equipDD(equipName) {
    logger.enterMethod(`equipDD ${equipName}`);
    let loc = OrReader.getElementMeta(equPageOr, "EquipmentDD").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", equipName);
    await sel.clickByXpath(loc);
    logger.exitMethod(`equipDD`);
  }

  static async clickOnLWAddEquipment(EquipmenttoAdd) {
    logger.enterMethod(`clickOnLWAddEquipment ${EquipmenttoAdd}`);

    // let loc = OrReader.getElementMeta(equPageOr, "EquipmentList").xpath;
    // let elements = await sel.getElementsByXpathContainingText(loc, EquipmenttoAdd);

    // if (elements == null || elements.length == 0)
    //   throw new Error(`Could not find element having service text as ${EquipmenttoAdd}`);
    // let eleToOrderText = await sel.getText(elements[0]);
    let loc = OrReader.getElementMeta(equPageOr, "LWAddEquipment").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", EquipmenttoAdd);
    await sel.clickByXpath(loc);

    logger.exitMethod(`clickOnLWAddEquipment`);
  }

  static async selectTelusEasyPayment(equipName) {
    logger.enterMethod(`selectTelusEasyPayment ${equipName}`);
    let loc = OrReader.getElementMeta(equPageOr, "TelusEasyPayment").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", equipName);
    await sel.clickByXpath(loc);
    logger.exitMethod(`selectTelusEasyPayment`);
  }

  /**
   * @description Completes and clicks next on Home Security section with all default values
   */
  static async getCurrentOrderStep() {
    logger.enterMethod(`getOrderSteps`);

    const loc = OrReader.getElementMeta(equPageOr, "CurrentOrderSteps").xpath;
    const steps = await sel.getTextByXpath(loc);
    logger.info(`All steps in order are:${steps}`);
    logger.exitMethod("getOrderSteps");
    return steps;
  }

  static async clickonTakeOverEquipment() {
    logger.enterMethod(`clickonTakeOverEquipment`);

    const loc = OrReader.getElementMeta(equPageOr, "TakeoverEquipment").xpath;
    const steps = await sel.clickByXpath(loc);
    logger.exitMethod("clickonTakeOverEquipment");
    return steps;
  }

  static async clickOnAddTakeoverEquipment(EquipmenttoAdd) {
    logger.enterMethod(`clickOnAddEquipment ${EquipmenttoAdd}`);

    let loc = OrReader.getElementMeta(equPageOr, "AddTakeOverEquipment").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", EquipmenttoAdd);
    await sel.clickByXpath(loc);

    try {
      loc = OrReader.getElementMeta(equPageOr, "QuantityLoadIcon").xpath;
      await sel.getWaitUtils().waitForElementRemoved(loc);
    } catch (err) {
      //eating error
    }

    logger.exitMethod(`clickOnAddEquipment`);
  }

  static async clickOnAddEquipmentViaEasyPayment(EquipmenttoAdd) {
    logger.enterMethod(`clickOnAddEquipment ${EquipmenttoAdd}`);

    let loc = OrReader.getElementMeta(equPageOr, "AddEquipmentWithEasyPayment")
      .xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", EquipmenttoAdd);
    await sel.clickByXpath(loc);

    try {
      loc = OrReader.getElementMeta(equPageOr, "Quantityload").xpath;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.Xpath, loc);
    } catch (err) {
      // eating error
    }

    logger.exitMethod(`clickOnAddEquipment`);
  }

  static async addEquipmentFromEquipmentList(EquipmenttoAdd) {
    logger.enterMethod(`addEquipmentFromEquipmentList ${EquipmenttoAdd}`);

    let loc = OrReader.getElementMeta(equPageOr, "AddTakeOverEquipment").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", EquipmenttoAdd);
    await sel.clickByXpath(loc);

    try {
      loc = OrReader.getElementMeta(equPageOr, "QuantityLoadIcon").xpath;
      await sel.getWaitUtils().waitForElementRemoved(loc);
    } catch (err) {
      //eating error
    }

    logger.exitMethod(`addEquipmentFromEquipmentList`);
  }

  static async clickOnNextInCustomize() {
    logger.enterMethod(`clickOnNextInCustomize`);
    await sel.getJsUtils().isPageLoaded();

    let loc = OrReader.getElementMeta(equPageOr, "Spinner").css;
    try {
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      //eating error
    }
    await sel.getWaitUtils().sleep(5000);
    loc = OrReader.getElementMeta(equPageOr, "clickOnNextInCustomize").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(" clickOnNextInCustomize");
  }

  static async clickSwapOnEquipment(equipment) {
    logger.enterMethod(`clickSwapOnEquipment${equipment}`);
    let loc = OrReader.getElementMeta(equPageOr, "SwapButtonEquipment").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", equipment);
    await sel.getJsUtils().clickByXpathUsingJavascript(loc);
    logger.exitMethod("clickSwapOnEquipment");
  }

  static async selectEquipmentToSwap(equipment) {
    logger.enterMethod(`selectEquipmentToSwap${equipment}`);
    let loc = OrReader.getElementMeta(equPageOr, "EquipmentInSwapPopUp").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", equipment);
    await sel.clickByXpath(loc);
    logger.exitMethod("selectEquipmentToSwap");
  }

  static async selectReasonToSwapAndClickOk(reason) {
    logger.enterMethod(`selectReasonToSwap${reason}`);
    logger.info("selecting reasoncode drop down");
    let loc = OrReader.getElementMeta(equPageOr, "ReasonCodeDropDown").xpath;
    await sel.clickByXpath(loc);
    logger.info("Reasoncodelist");
    loc = OrReader.getElementMeta(equPageOr, "ReasonCodeList").xpath;
    await sel.clickElementByXpathContainingText(loc, reason);
    loc = OrReader.getElementMeta(equPageOr, "OkButton").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("selectReasonToSwap");
  }

  static async getSwappedToEquipments() {
    logger.enterMethod(`getSwappedToEquipments`);
    const loc = OrReader.getElementMeta(equPageOr, "SwappedToList").xpath;
    const swappedequipments = await sel.getTextAllByXpath(loc);
    logger.exitMethod("selectReasonToSwap");
    return swappedequipments;
  }
}

module.exports = EquipmentPage;
