const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");
const StringUtils = require("../../utils/common/StringUtils");

const customPgOr = OrReader.getCustomizePageOr();
class CustomizePage {
  /**
   * @description Selects feature from the provided list of items
   */
  static async selectFeature(feature) {
    logger.enterMethod(`selectFeature${feature}`);
    const loc = OrReader.getElementMeta(customPgOr, "Feature").css;
    await sel.clickElementByCssContainingText(loc, feature);
    await sel.getWaitUtils().sleep(3000);
    logger.exitMethod("validateDefaultSetEquipmentsAndMoveToNextStep");
  }

  static async clickNextButton() {
    logger.enterMethod(`clickNextButton`);
    await sel.getJsUtils().isPageLoaded();
    await sel.getWaitUtils().sleep(3000);
    const loc = OrReader.getElementMeta(customPgOr, "NextButton").xpath;
    await sel.clickByXpath(loc);
    await sel.getWaitUtils().sleep(5000);
    logger.exitMethod("clickNextButton");
  }

  static async clickTVNextButton() {
    logger.enterMethod(`clickTVNextButton`);
    const loc = OrReader.getElementMeta(customPgOr, "TVNextButton").id;
    await sel.clickById(loc);
    await sel.getWaitUtils().sleep(5000);
    logger.exitMethod("clickTVNextButton");
  }

  static async completePhnOptions(optionToSelect) {
    logger.enterMethod(`selectPhnOption ${optionToSelect}`);
    let loc = OrReader.getElementMeta(customPgOr, "PhoneOptions").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", optionToSelect);
    await sel.clickByXpath(loc);
    logger.exitMethod(`selectPhnOption`);
  }

  static async numberToAppearInPhoneBook(optionToSelect) {
    logger.enterMethod(`selectPhnOption ${optionToSelect}`);
    let loc = OrReader.getElementMeta(customPgOr, "PhoneOptions").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", optionToSelect);
    await sel.clickByXpath(loc);
    logger.exitMethod(`selectPhnOption`);
  }
}
module.exports = CustomizePage;
