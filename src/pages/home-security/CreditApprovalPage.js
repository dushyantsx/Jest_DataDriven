const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const logger = require("../../logger/Logger");

const crAppPageOr = OrReader.getCreditApprovalPageOr();
class CreditApprovalPage {
  /**
   * @description Clicks Next to Credit Check Result
   */
  static async clickNextToCreditCheckResult() {
    logger.enterMethod("clickNextToCreditCheckResult");
    const loc = OrReader.getElementMeta(crAppPageOr, "NextButton").css;
    await sel.clickByCss(loc);
    logger.exitMethod("clickNextToCreditCheckResult");
  }
}

module.exports = CreditApprovalPage;
