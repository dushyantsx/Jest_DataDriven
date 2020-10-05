const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const StringUtils = require("../../utils/common/StringUtils");
const logger = require("../../logger/Logger");
const { LocFindStrategy } = require("../../globals/enumerations");

const chkoutPageOr = OrReader.getCheckoutPageOr();
class CheckoutPage {
  /**
   * @description No accepts terms & conditions and move to next directly
   */
  static async noAcceptTermsAndOnlyMoveToNext() {
    logger.enterMethod(`noAcceptTermsAndOnlyMoveToNext`);
    const loc = OrReader.getElementMeta(chkoutPageOr, "NextButton").css;
    await sel.clickByCss(loc);
    logger.exitMethod("noAcceptTermsAndOnlyMoveToNext");
  }

  /**
   * @description Accepts terms & conditions and move to next
   */
  static async acceptTermsSafelyAndMoveToNext() {
    logger.enterMethod(`acceptTermsAndMoveToNext`);

    await sel.getWaitUtils().sleep(5000);
    let loc = OrReader.getElementMeta(chkoutPageOr, "TermsAndCondition").id;
    try {
      await sel.clickById(loc);
    } catch (err) {
      logger.error(err);
    }

    loc = OrReader.getElementMeta(chkoutPageOr, "NextButton").xpath;
    await sel.getWaitUtils().waitForElementEnabled(LocFindStrategy.Xpath, loc);
    await sel.clickByXpath(loc);
    await sel.getJsUtils().isPageLoaded();
    logger.exitMethod("acceptTermsAndMoveToNext");
  }

  /**
   * @description applies promo code
   * @param {String} pc Specifies promo code
   */
  static async applyPromoCode(pc) {
    if (StringUtils.isEmpty(pc)) return;

    logger.enterMethod(`applyPromoCode ${pc}`);
    let loc = OrReader.getElementMeta(chkoutPageOr, "PromoCode").css;
    await sel.getWaitUtils().sleep(2000);
    await sel.findElementByCssAndSetText(loc, pc);

    loc = OrReader.getElementMeta(chkoutPageOr, "PromoCodeApplyButton").css;
    await sel.clickByCss(loc);

    // Sleep for 7 seconds to see effect of applying promo code
    await sel.getWaitUtils().sleep(7000);

    await sel.getJsUtils().isPageLoaded();
    logger.exitMethod("applyPromoCode");
  }

  static async getDueMonthlyBeforeTaxMatching() {
    const cost = {};
    const loc = OrReader.getElementMeta(chkoutPageOr, "DueMonthlyBeforeTaxText")
      .css;
    cost.amount = await sel.getTextByCss(loc);
    return cost;
  }

  /**
   * @description Gets estimated monthly total taxes
   */
  static async getEstimatedMonthlyTotalTaxes() {
    const tax = {};
    const loc = OrReader.getElementMeta(
      chkoutPageOr,
      "EstimatedMonthlyTotalTaxes"
    ).css;
    const taxapplied = await sel.getTextByCss(loc);
    logger.info(taxapplied);
    tax.appliedtax = taxapplied;
    return tax;
  }

  static async matchDueMonthlyBeforeTaxWithOrderAmountMinusTax() {
    let dueWithoutTax = await this.getDueMonthlyBeforeTaxMatching();
    dueWithoutTax = StringUtils.replaceString(dueWithoutTax, "$", "");
    dueWithoutTax *= 1;

    let tax = await this.getEstimatedMonthlyTotalTaxes();
    tax = StringUtils.replaceString(tax, "$", "");
    tax *= 1;
    const loc = OrReader.getElementMeta(chkoutPageOr, "OrderMonthlyTotalText")
      .css;
    let orderTotal = await sel.getTextByCss(loc);
    orderTotal = StringUtils.replaceString(orderTotal, "$", "");
    orderTotal *= 1;

    return orderTotal - (dueWithoutTax + tax) === 0;
  }

  static async checkEmailcheckbox() {
    logger.enterMethod(`checkEmailcheckbox`);
    await sel.getWaitUtils().sleep(1000);
    const loc = OrReader.getElementMeta(chkoutPageOr, "EmailCheckbox").xpath;
    await sel.clickByXpath(loc);

    logger.exitMethod("checkEmailcheckbox");
  }

  static async getDiscount() {
    const loc = OrReader.getElementMeta(chkoutPageOr, "Discount").xpath;
    const discount = {};
    discount.discountamount = await sel.getTextByXpath(loc);
    return discount;
  }

  /**
   * @description Gets estimated monthly total taxes
   */
  static async getEstimatedTotalTaxesforToday() {
    const tax = {};
    const loc = OrReader.getElementMeta(
      chkoutPageOr,
      "EstimatedMonthlyTotalTaxes"
    ).css;
    const ele = await sel.getElementsByCssSelector(loc);
    logger.info(`Elements:${ele}`);
    const taxtopaytoday = await sel.getText(ele[1]);
    tax.topaytoday = taxtopaytoday;
    return tax;
  }

  /**
   * @description Gets estimated monthly total taxes
   */
  static async getEstimatedTotalToPayToday() {
    const total = {};
    const loc = OrReader.getElementMeta(chkoutPageOr, "OrderTotalToday").xpath;
    const totaltopay = await sel.getTextByXpath(loc);
    total.totaltopay = totaltopay;
    return total;
  }

  /**
   * @description Gets estimated monthly total taxes
   */
  static async getProductprice(productname) {
    const ProductPrice = {};
    let loc = OrReader.getElementMeta(chkoutPageOr, "ProductPrice").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", productname);
    const total = await sel.getTextByXpath(loc);
    logger.info(total);
    ProductPrice.total = total;
    return ProductPrice;
  }

  static async getTotalPaymentToday() {
    logger.enterMethod(`getTotalPaymentToday`);
    const loc = OrReader.getElementMeta(chkoutPageOr, "TotalToday").xpath;
    const ele = await sel.getElementsByXpath(loc);
    const topaytoday = await sel.getText(ele[1]);
    return topaytoday;
  }

  static async getPromoError() {
    logger.enterMethod(`getPromoError`);
    const loc = OrReader.getElementMeta(chkoutPageOr, "PromoError").xpath;
    const errormsg = await sel.getTextByXpath(loc);
    logger.info(`Error message:${errormsg}`);
    logger.exitMethod(`getPromoError`);
    return errormsg;
  }

  static async deleteShoppinCart() {
    logger.enterMethod(`deleteShoppinCart`);
    let loc = OrReader.getElementMeta(chkoutPageOr, "TopMenu").id;
    await sel.clickById(loc);
    loc = OrReader.getElementMeta(chkoutPageOr, "DeleteShoppingCart").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`deleteShoppinCart`);
  }

  static async selectServiceForDiscount(service) {
    logger.enterMethod(`selectServiceForDiscount`);
    await sel.getWaitUtils().waitForUrlToChangeTo("review-order");
    let loc = OrReader.getElementMeta(chkoutPageOr, "DiscountService").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.clickByXpath(loc);
    logger.exitMethod(`selectServiceForDiscount`);
  }

  static async selectDiscountReason(reason, value) {
    logger.enterMethod(`selectDiscountReason ${reason} ${value}`);
    const reasonloc = OrReader.getElementMeta(
      chkoutPageOr,
      "DiscountReasonDropdown"
    ).id;
    await sel.clickById(reasonloc);
    const valueloc = OrReader.getElementMeta(
      chkoutPageOr,
      "DiscountReasonValue"
    ).xpath;

    await sel.clickElementByXpathContainingText(valueloc, reason);

    let loc = OrReader.getElementMeta(chkoutPageOr, "PartnersDropdown").id;
    await sel.clickById(loc);

    loc = OrReader.getElementMeta(chkoutPageOr, "PartnersDropdownList").css;
    await sel.clickElementByCssContainingText(loc, value);
    logger.exitMethod(`selectDiscountReason`);
  }

  static async getDiscountNames() {
    logger.enterMethod(`getDiscountNames`);
    let dn;
    const loc = OrReader.getElementMeta(
      chkoutPageOr,
      "AppliedDiscountonProducts"
    ).xpath;

    const eles = await sel.getElementsByXpath(loc);
    const eleslength = eles.length;
    for (let index = 0; index < eleslength; index++) {
      dn = await sel.getText(eles[index]);
      logger.exitMethod(`getDiscountNames`);
    }
    return dn;
  }

  static async clickConfirm() {
    logger.enterMethod(`clickConfirm`);
    await sel.getWaitUtils().sleep(3000);
    const loc = OrReader.getElementMeta(chkoutPageOr, "ConfirmButton").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`selectServiceForDiscount`);
  }

  static async selectDiscountName(discount) {
    logger.enterMethod(`selectDiscountName${discount}`);
    const loc = OrReader.getElementMeta(chkoutPageOr, "DiscountNames").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`selectServiceForDiscount`);
  }

  static async clickApplyDiscount() {
    logger.enterMethod(`clickApplyDiscount`);
    const loc = OrReader.getElementMeta(chkoutPageOr, "ApplyDiscountButton")
      .xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod(`clickApplyDiscount`);
  }
}

module.exports = CheckoutPage;
