const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");
const StringUtils = require("../../utils/common/StringUtils");

const rulesPopupOr = OrReader.getRulesPopupOr();
class RulesPopup {
  /**
   * @description Accepts rules
   */
  static async acceptRules() {
    logger.enterMethod("acceptRules");
    let loc = OrReader.getElementMeta(rulesPopupOr, "text").xpath;
    const popupContent = sel.getTextByXpath(loc);

    loc = OrReader.getElementMeta(rulesPopupOr, "OkButton").css;
    await sel.clickByCss(loc);

    logger.info(`popup content is:${popupContent}`);
    logger.exitMethod("acceptRules");
    return popupContent;
  }

  /**
   * @description Accepts rules safely. No errors / exceptions are thrown
   *
   */
  static async acceptRulesSafely() {
    const popup = {};
    let loc = OrReader.getElementMeta(rulesPopupOr, "text").xpath;
    try {
      popup.msgtext = await sel.getTextByXpath(loc);
      //return popupmsg;
      logger.info(`popup content is:${JSON.stringify(popup)}`);
    } catch (err) {
      logger.error("Safely eating error as below:");
      logger.error(err);
      //  return false;
    }

    loc = OrReader.getElementMeta(rulesPopupOr, "OkButton").xpath;
    await sel
      .clickByXpath(loc)
      .then(() => {
        //return true;
      })
      .catch((err) => {
        logger.error("Safely eating error as below:");
        logger.error(err);
        //return false;
      });
    //return Promise.resolve(popup);
    await sel.getWaitUtils().sleep(1000);
    return popup;
  }

  /**
   * @description Accepts popup by clicking continue button safely. No errors / exceptions are thrown
   */
  static async continueSafely() {
    logger.enterMethod("ContinueSafely for popups");
    const popup = {};
    let loc = OrReader.getElementMeta(rulesPopupOr, "PopupContent").xpath;
    try {
      popup.msgtext = await sel.getTextByXpath(loc);
      logger.info(`popup content is:${JSON.stringify(popup)}`);
    } catch (err) {
      logger.error("Safely eating error as below:");
      logger.error(err);
    }
    loc = OrReader.getElementMeta(rulesPopupOr, "Rule4kPopupContinueButton")
      .xpath;
    // if (sel.isVisibleByCss(loc) == false) {
    //   logger.debug("no popup appeared; returning true");
    //   logger.exitMethod();
    //   return true;
    // }
    // loc = OrReader.getElementMeta(rulesPopupOr,"text").css;
    // let popupContent = sel.getTextByCss(loc);
    // logger.info("popup content is:"+ JSON.stringify(popupContent));
    await sel
      .clickByXpath(loc)
      .then(() => {
        logger.exitMethod();
      })
      .catch((err) => {
        logger.error("Safely eating error as below:");
        logger.error(err);
        logger.exitMethod();
      });
    return Promise.resolve(popup);
  }

  static async confirmTakeOver() {
    logger.enterMethod("ContinueSafely for popups");
    const popup = {};
    let loc = OrReader.getElementMeta(rulesPopupOr, "ConfirmTakeOver").xpath;
    try {
      popup.msgtext = await sel.getTextByXpath(loc);
      //return popupmsg;
      logger.info(`popup content is:${JSON.stringify(popup)}`);
    } catch (err) {
      logger.error("Safely eating error as below:");
      logger.error(err);
      //  return false;
      //popup-content
    }
    loc = OrReader.getElementMeta(rulesPopupOr, "Rule4kPopupContinueButton")
      .css;
    // if (sel.isVisibleByCss(loc) == false) {
    //   logger.debug("no popup appeared; returning true");
    //   logger.exitMethod();
    //   return true;
    // }
    // loc = OrReader.getElementMeta(rulesPopupOr,"text").css;
    // let popupContent = sel.getTextByCss(loc);
    // logger.info("popup content is:"+ JSON.stringify(popupContent));
    await sel
      .clickByCssWithTimeout(loc, 10000)
      .then(() => {
        logger.exitMethod();
      })
      .catch((err) => {
        logger.error("Safely eating error as below:");
        logger.error(err);
        logger.exitMethod();
      });
    return Promise.resolve(popup);
  }

  static async clickOnProceed() {
    logger.enterMethod("clickOnProceed");
    const loc = OrReader.getElementMeta(rulesPopupOr, "Proceed").css;
    await sel.clickByCss(loc);
    logger.exitMethod("ClickonProceed");
  }

  static async clickOnConfirm() {
    logger.enterMethod("clickOnProceed");
    const loc = OrReader.getElementMeta(rulesPopupOr, "Confirm").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("ClickonProceed");
  }

  static async clickOnContinueWithOrder() {
    logger.enterMethod("clickOnContinueWithOrder");
    try {
      const popup = {};
      let loc = OrReader.getElementMeta(rulesPopupOr, "PopupContent").xpath;
      popup.msgtext = await sel.getTextByXpath(loc);
      loc = OrReader.getElementMeta(rulesPopupOr, "ContinueWithOrder").xpath;
      await sel.clickByXpath(loc);
      logger.exitMethod("clickOnContinueWithOrder");
      return popup;
    } catch (err) {
      //eating error
    }
  }

  static async clickonMultiplepopups(numberofpopups) {
    logger.enterMethod("clickonMultiplepopups");
    const popupmsg = {};
    popupmsg.text = [];
    for (let i = numberofpopups; i > 0; i--) {
      let loc = OrReader.getElementMeta(rulesPopupOr, "MultiplePopupContent")
        .xpath;
      loc = StringUtils.replaceString(loc, "$$TEXT$$", i);
      popupmsg.text.push(await sel.getTextByXpath(loc));
      loc = OrReader.getElementMeta(rulesPopupOr, "MultiplePopupbutton").xpath;
      loc = StringUtils.replaceString(loc, "$$TEXT$$", i);
      await sel.clickByXpath(loc);
    }
    return popupmsg;
  }

  static async getTextandClickOk() {
    logger.enterMethod("clickonMultiplepopups");
    const popupmsg = {};
    let loc = OrReader.getElementMeta(rulesPopupOr, "text").xpath;
    popupmsg.text = await sel.getTextByXpath(loc);
    loc = OrReader.getElementMeta(rulesPopupOr, "Rule4kPopupContinueButton")
      .xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickonMultiplepopups");
    return popupmsg;
  }
}

module.exports = RulesPopup;
