const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const StringUtils = require("../../utils/common/StringUtils");
const logger = require("../../logger/Logger");
const { LocFindStrategy } = require("../../globals/enumerations");

const ssPageOr = OrReader.getSubmitSuccessPageOr();
class SubmitSuccessPage {
  /**
   * @description Verifies thanks message appeared after submitting order
   */
  static async verifyThanksMessageForSuccessfulSubmissionOfOrder() {
    logger.enterMethod(`verifyThanksMessageForSuccessfulSubmissionOfOrder`);
    const output = {};

    await sel.getWaitUtils().sleep(15000);

    await sel.getJsUtils().isPageLoaded();

    let loc = OrReader.getElementMeta(ssPageOr, "Title").css;
    let txt = await sel.getTextByCss(loc);
    if (
      !StringUtils.isEmpty(txt) &&
      StringUtils.containsIgnoreCase(txt, "Thanks! You're all done!")
    ) {
      output.successMessage = txt;

      loc = OrReader.getElementMeta(ssPageOr, "OrderNumber").css;
      txt = await sel.getTextByCss(loc);
      output.orderNumber = txt;

      const ncPortletsFromDom = await sel
        .getJsUtils()
        .executeJsCommand("return nc_Portlets");
      logger.trace(JSON.stringify(ncPortletsFromDom));
      if (!StringUtils.isEmpty(ncPortletsFromDom)) {
        const ncPortletsObject = ncPortletsFromDom;
        for (let index = 0; index < ncPortletsObject.length; index++) {
          const portlet = ncPortletsObject[index];
          if (
            portlet != null &&
            portlet !== undefined &&
            StringUtils.equalsIgnoreCase(
              portlet.jsClass,
              "nc.portlets.AnalyticsPortlet"
            )
          ) {
            const transactionId = portlet.params.dataLayerInfo.transaction.id;
            output.orderObjectId = transactionId;
            break;
          }
        }
      }

      try {
        // await sel.getWaitUtils().sleep(5000);
        // loc = OrReader.getElementMeta(ssPageOr, "RefreshToGetAccountNumber").css;
        // await sel.clickByCssWithTimeout(loc, 5000);

        loc = OrReader.getElementMeta(ssPageOr, "AccountNumber").css;
        txt = await sel.getTextByCss(loc);
        output.orderAccountNumber = txt;
        await sel.getWaitUtils().sleep(60000);
      } catch (err) {
        logger.error(err);
      }

      return output;
    }

    logger.exitMethod("verifyThanksMessageForSuccessfulSubmissionOfOrder");
    throw new Error(
      `Order did not submit successfully; Verification message appeared: ${txt}`
    );
  }

  static async clickComplete() {
    logger.enterMethod(`ClickComplete`);
    const loc = OrReader.getElementMeta(ssPageOr, "Complete").css;
    await sel.findAndClick(LocFindStrategy.CssSel, loc);

    logger.exitMethod("clickComplete");
  }

  /**
   * @description Verifies thanks message appeared
   */
  static async verifyThanksMessageOnly() {
    logger.enterMethod(`verifyThanksMessageOnly`);

    const output = {};

    await sel.getWaitUtils().sleep(15000);
    const loc = OrReader.getElementMeta(ssPageOr, "Title").css;
    const txt = await sel.getTextByCss(loc);
    if (
      !StringUtils.isEmpty(txt) &&
      StringUtils.containsIgnoreCase(txt, "Thanks!")
    )
      output.successMessage = txt;
    logger.exitMethod("verifyThanksMessageOnly");
    return output;
  }

  /**
   * @description Click on View My order link
   */
  static async clickonViewMyOrder() {
    logger.enterMethod(`clickonViewMyOrder`);

    const loc = OrReader.getElementMeta(ssPageOr, "ViewMyOrder").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod("clickonViewMyOrder");
  }
}

module.exports = SubmitSuccessPage;
