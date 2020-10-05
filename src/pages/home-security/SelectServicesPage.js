const sel = require("../../sel-js/SelUtils");
const OrReader = require("../../sel-js/OrReader");
const StringUtils = require("../../utils/common/StringUtils");
const logger = require("../../logger/Logger");
const dateutils = require("../../utils/common/DateUtils");
const { LocFindStrategy } = require("../../globals/enumerations");

const selServPageOr = OrReader.getSelectServicesPageOr();
class SelectServicesPage {
  /**
   * Choose specified services -> commitments -> plan -> provider and moves to next step
   * @param {String} svs Specifies services to select (separated by | symbol for multiple services)
   * @param {String} cms Specifies commitments to select (separated by | symbol for multiple commitments)
   * @param {String} pl Specifies plan to select
   * @param {String} pr Specifies provider to select
   */
  static async selectServicesCommitmentPlanProvider(svs, cms, pl, pr) {
    logger.enterMethod(
      `selectServicesCommitmentPlanProvider ${svs} -> ${cms} -> ${pl} -> ${pr}`
    );
    const output = {};
    try {
      output.service = await this.selectServices(svs);
      output.commitment = await this.selectCommitments(cms);
      try {
        const loc = OrReader.getElementMeta(
          selServPageOr,
          "ViewMoreSecurityProducts"
        ).xpath;
        await sel.clickByXpath(loc);
      } catch (err) {
        //eating error
      }
      await sel.getWaitUtils().sleep(5000);
      output.plan = await this.selectPlan(pl);
      await this.selectServiceProvider(pr);
      output.cartItems = await this.validateCartItems("Home Security");
      //  loc = OrReader.getElementMeta(selServPageOr, "NextButton").css;
      // //let ele = await sel.getElementByCssSelector(loc);
      // //await sel.clickUsingJavascript(ele);
      // await sel.clickByCss(loc);

      // loc = OrReader.getElementMeta(selServPageOr, "ShoppingCartNextButton")
      //   .css;
      // await sel.clickByCss(loc);

      logger.exitMethod("selectServicesCommitmentPlanProvider");
    } catch (err) {
      logger.error(err);
      throw err;
    }
    return output;
  }

  /**
   * Choose specified services -> commitments -> plan -> provider and moves to next step
   * @param {String} svs Specifies services to select (separated by | symbol for multiple services)
   * @param {String} pl Specifies plan to select
   * @param {String} pr Specifies provider to select
   */
  static async selectServicesVerticalPlanProvider(svs, pl, pr) {
    logger.enterMethod(
      `selectServicesVerticalPlanProvider ${svs} -> ${pl} -> ${pr}`
    );
    const availsAndSelected = {};
    try {
      availsAndSelected.service = await this.selectServices(svs);
      availsAndSelected.offering = await this.selectVerticallyProductOffering(
        pl
      );
      await this.selectServiceProvider(pr);
      availsAndSelected.cartItems = await this.validateCartItems("LivingWell");
      await sel.getJsUtils().isPageLoaded();
      const loc = OrReader.getElementMeta(selServPageOr, "NextButton").css;
      //let ele = await sel.getElementByCssSelector(loc);
      //await sel.clickUsingJavascript(ele);
      await sel.clickByCss(loc);

      await sel.getWaitUtils().sleep(1000);

      // loc = OrReader.getElementMeta(selServPageOr, "ShoppingCartNextButton")
      //   .css;
      // await sel.clickByCss(loc);

      logger.exitMethod("selectServicesVerticalPlanProvider");
    } catch (err) {
      logger.error(err);
      throw err;
    }
    return availsAndSelected;
  }

  /**
   * @description Selects given services
   * @param {String} services Specifies services to select (separated by | symbol for multiple services)
   */
  static async selectServices(services) {
    logger.enterMethod(`selectServices ${services}`);
    const availsAndSelected = {};

    const locBase = OrReader.getElementMeta(selServPageOr, "ServiceCaption")
      .xpath;
    let loc = "";
    const servicesArr = services.split("|");
    for (let index = 0; index < servicesArr.length; index++) {
      const service = servicesArr[index];
      loc = StringUtils.replaceString(
        locBase,
        OrReader.getDynamicDataKeyword(),
        service
      );
      logger.info(loc);
      await sel.clickByXpath(loc);
      try {
        loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
        await sel
          .getWaitUtils()
          .waitForElementRemoved(LocFindStrategy.CssSel, loc);
      } catch (err) {
        // eating error
      }

      logger.exitMethod(`selectServices`);
    }

    loc = OrReader.getElementMeta(selServPageOr, "AllServicesAvailable").css;
    const allAvailableServicesList = await sel.getTextAllByCss(loc);
    availsAndSelected.available = allAvailableServicesList;

    loc = OrReader.getElementMeta(selServPageOr, "SelectedServices").css;
    const allSelectedServicesList = await sel.getTextAllByCss(loc);
    availsAndSelected.selected = allSelectedServicesList;

    logger.exitMethod("selectServices");
    return availsAndSelected;
  }

  /**
   * @description Selects given commitments
   * @param {String} commitments Specifies commitments to select (separated by | symbol for multiple commitments)
   */
  static async selectCommitments(commitments) {
    logger.enterMethod(`selectCommitments ${commitments}`);
    const output = {};

    let loc = OrReader.getElementMeta(selServPageOr, "CommitmentsCollection")
      .css;
    output.available = await sel.getTextAllByCss(loc);
    const commArr = commitments.split("|");
    for (let index = 0; index < commArr.length; index++) {
      const commitment = commArr[index];

      await sel.clickElementByCssContainingText(loc, commitment);
      try {
        loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
        await sel
          .getWaitUtils()
          .waitForElementRemoved(LocFindStrategy.CssSel, loc);
      } catch (err) {
        // eating error
      }
    }
    output.selected = commitments;

    logger.exitMethod("selectCommitments");
    return output;
  }

  /**
   * @description Selects given product offering/plan
   * @param {String} plan Specifies plan to select
   */
  static async selectPlan(plan) {
    logger.enterMethod(`selectPlan ${plan}`);
    const plans = {};
    let loc = OrReader.getElementMeta(
      selServPageOr,
      "ChooseYourProductOfferingNamesCollection"
    ).css;
    plans.available = await sel.getTextAllByCss(loc);
    await sel
      .getWaitUtils()
      .sleep(5000)
      .then(async () => {
        await sel.clickElementByCssContainingText(loc, plan);
      });

    try {
      loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      // eating error
    }
    sel.getWaitUtils().sleep(3000);
    plans.selected = plan;
    logger.exitMethod("selectPlan");
    return plans;
  }

  /**
   * @description Selects given product offering/plan
   * @param {String} offering Specifies offering/plan to select
   */
  static async selectVerticallyProductOffering(offering) {
    logger.enterMethod(`selectVerticallyProductOffering ${offering}`);
    try {
      await this.clickViewMore();
      const loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      //eating error
    }

    const offerings = {};
    let loc = OrReader.getElementMeta(
      selServPageOr,
      "ProductOfferingsPackageTitlesCollection"
    ).css;
    offerings.available = await sel.getTextAllByCss(loc);
    const elecol = await sel.getElementsByCssSelector(loc);
    await sel
      .getWaitUtils()
      .sleep(5000)
      .then(async () => {
        await sel.clickElementText(elecol, offering);
      });

    try {
      loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      // eating error
    }
    await sel.getWaitUtils().sleep(1000);

    offerings.selected = offering;
    logger.exitMethod("selectVerticallyProductOffering");
    return offerings;
  }

  /**
   * @description Selects given service provider
   * @param {String} provider Specifies service provider
   */
  static async selectServiceProvider(provider) {
    logger.enterMethod(`selectServiceProvider ${provider}`);
    let loc = OrReader.getElementMeta(selServPageOr, "ServiceProvider").css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(selServPageOr, "ServiceProviderLov").xpath;
    await sel.clickElementByXpathContainingText(loc, provider);

    try {
      loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      // eating error
    }

    logger.exitMethod("selectServiceProvider");
  }

  /**
   * @description Selects given service provider
   *  Gets the details of active service
   */
  static async getServiceDetails() {
    const availsAndSelected = {};
    logger.enterMethod(`getServiceDetails `);

    let loc = OrReader.getElementMeta(selServPageOr, "SelectedServiceHS").xpath;
    availsAndSelected.service = sel.getTextByXpath(loc);

    loc = OrReader.getElementMeta(selServPageOr, "SelectedPlanHS").xpath;
    availsAndSelected.plan = sel.getTextByXpath(loc);

    loc = OrReader.getElementMeta(selServPageOr, "NextButton").css;
    await sel.clickByCss(loc);

    logger.exitMethod("getServiceDetails");
    return availsAndSelected;
  }

  /**
   * @description Gets details of cart and validates if the selected services and equipment in the cart
   */
  static async validateCartItems(service) {
    const availsAndSelected = {};
    logger.enterMethod(`getServiceDetails `);

    let loc = OrReader.getElementMeta(selServPageOr, "CartButton").css;
    await sel.clickByCss(loc);

    loc = OrReader.getElementMeta(selServPageOr, "ServiceDropDown").xpath;
    loc = StringUtils.replaceString(loc, "$$TEXT$$", service);
    await sel.getWaitUtils().sleep(500);
    await sel.clickByXpath(loc);

    await sel.getWaitUtils().sleep(1000);
    loc = OrReader.getElementMeta(selServPageOr, "CartPlan").css;
    const qouteplan = await sel.getTextByCss(loc);
    availsAndSelected.cartPlan = qouteplan;
    logger.info(`allAddOnEquiments: ${JSON.stringify(qouteplan)}`);

    loc = OrReader.getElementMeta(selServPageOr, "CartProductPrice").css;
    const qouteprice = await sel.getTextByCss(loc);
    availsAndSelected.cartPrice = qouteprice;
    logger.info(`allAddOnEquiments: ${JSON.stringify(qouteprice)}`);

    await sel.getWaitUtils().sleep(1000);

    loc = OrReader.getElementMeta(selServPageOr, "CartButton").css;
    await sel.clickByCss(loc);

    logger.info(`price of added product: ${JSON.stringify(qouteprice)}`);

    // loc = OrReader.getElementMeta(selServPageOr, "CartEquipment").css;
    // let allAddOnEquipments = await sel.getTextAllByCss(loc);
    // availsAndSelected.cartEquipments = allAddOnEquipments;
    // logger.info(`allAddOnEquiments: ${JSON.stringify(allAddOnEquipments)}`);

    logger.exitMethod("getServiceDetails");

    return availsAndSelected;
  }

  static async clickNextButton() {
    logger.enterMethod("ClickNextButton");
    const loc = OrReader.getElementMeta(selServPageOr, "NextButton").css;
    await sel.clickByCss(loc);
    logger.exitMethod("ClickNextButton");
  }

  static async selectProductType(producttype) {
    logger.enterMethod(`selectProductType${producttype}`);
    let loc = OrReader.getElementMeta(
      selServPageOr,
      "ProductTypeNamesCollection"
    ).css;
    await sel.clickElementByCssContainingText(loc, producttype);

    try {
      loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      // eating error
    }
    logger.exitMethod("selectProductType");
  }

  static async selectProductOffering(producttype) {
    logger.enterMethod(`selectProductType${producttype}`);
    await sel.getWaitUtils().sleep(1000);
    let loc = OrReader.getElementMeta(
      selServPageOr,
      "ProductOfferingsCategoryNamesCollection"
    ).css;
    await sel.clickElementByCssContainingText(loc, producttype);
    try {
      loc = OrReader.getElementMeta(selServPageOr, "Spinner").css;
      await sel
        .getWaitUtils()
        .waitForElementRemoved(LocFindStrategy.CssSel, loc);
    } catch (err) {
      // eating error
    }
    await sel.getWaitUtils().sleep(5000);
    logger.exitMethod("selectProductType");
  }

  static async selectTVPlan(svs, cms, pr, po, pl) {
    logger.enterMethod(
      `SelectTVplan for ${svs} -> ${cms} -> ${po} -> ${pr}->${pl}`
    );
    const output = {};
    try {
      output.service = await this.selectServices(svs);
      await sel.getWaitUtils().sleep(3000);
      output.commitment = await this.selectCommitments(cms);
      await sel.getWaitUtils().sleep(4000);
      output.producttype = await this.selectProductType(pr);
      await sel.getWaitUtils().sleep(3000);
      output.productoffer = await this.selectProductOffering(po);
      await sel.getWaitUtils().sleep(3000);
      output.product = await this.selectVerticallyProductOffering(pl);
      await sel.getWaitUtils().sleep(2000);
      output.cartItems = await this.validateCartItems("Optik TV");

      logger.exitMethod("selectTVPlan");
    } catch (err) {
      logger.error(err);
      throw err;
    }
    return output;
  }

  static async selectInternetPlan(svs, cms, po) {
    logger.enterMethod(`selectInternetPlan for ${svs} -> ${cms} -> ${po}`);
    await sel.getWaitUtils().sleep(3000);
    const output = {};
    try {
      output.service = await this.selectServices(svs);
      await sel.getWaitUtils().sleep(3000);

      output.commitment = await this.selectCommitments(cms);
      await sel.getWaitUtils().sleep(4000);

      output.productoffer = await this.selectPlan(po);
      await sel.getWaitUtils().sleep(2000);

      output.cartItems = await this.validateCartItems("TELUS Internet");

      logger.exitMethod("selectInternetPlan");
    } catch (err) {
      logger.error(err);
      throw err;
    }
    return output;
  }

  static async clickViewMore() {
    logger.enterMethod("clickViewMore");
    const loc = OrReader.getElementMeta(
      selServPageOr,
      "ViewMoreLivingWellProducts"
    ).xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickViewMore");
  }

  static async clickSSHViewMore() {
    logger.enterMethod("clickViewMore");
    const loc = OrReader.getElementMeta(
      selServPageOr,
      "ViewMoreSecurityProducts"
    ).xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickViewMore");
  }

  static async clickCommitmentsViewMore() {
    logger.enterMethod("clickViewMore");
    const loc = OrReader.getElementMeta(selServPageOr, "ViewMoreCommitments")
      .xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickViewMore");
  }

  static async clickShowMore() {
    logger.enterMethod("clickShowMore");
    const loc = OrReader.getElementMeta(selServPageOr, "ShowMore").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickShowMore");
  }

  static async setMigrationDateandTerm(length) {
    logger.enterMethod("setMigrationDateandTerm");
    let dt = dateutils.yesterday();
    dt = dateutils.formatDateDDMMYYYY(dt, "-");
    dt = dt.toString();
    let loc = OrReader.getElementMeta(selServPageOr, "StartDate").xpath;
    await sel.findElementByXpathAndSetText(loc, dt);
    loc = OrReader.getElementMeta(selServPageOr, "TermLength").xpath;
    await sel.clickByXpath(loc);
    loc = OrReader.getElementMeta(selServPageOr, "TermLengthDropdown").xpath;
    await sel.clickElementByXpathContainingText(loc, length);
    loc = OrReader.getElementMeta(selServPageOr, "ConfirmDate").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("setMigrationDateandTerm");
  }

  static async enterHomeSecurityAmountandConfirmPrice(plan, amount) {
    logger.enterMethod(
      `enterHomeSecurityAmountandConfirmPrice${plan}${amount}`
    );
    let loc = OrReader.getElementMeta(
      selServPageOr,
      "ChooseYourProductOfferingNamesCollection"
    ).css;
    await sel
      .getWaitUtils()
      .sleep(5000)
      .then(async () => {
        await sel.clickElementByCssContainingText(loc, plan);
      });

    loc = OrReader.getElementMeta(selServPageOr, "HomeSecurityAmount").xpath;
    await sel.findElementByXpathAndSetText(loc, amount);
    loc = OrReader.getElementMeta(selServPageOr, "ConfirmPrice").xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("enterHomeSecurityAmountandConfirmPrice");
  }

  static async selectNotIntoCommitments() {
    logger.enterMethod("selectNotIntoCommitments");
    const loc = OrReader.getElementMeta(selServPageOr, "NotIntoCommitments")
      .xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("selectNotIntoCommitments");
  }

  static async clickOnCompleteOnServicesPage() {
    logger.enterMethod("clickOnCompleteOnServicesPage");
    const loc = OrReader.getElementMeta(selServPageOr, "CompleteOnServicePage")
      .xpath;
    await sel.clickByXpath(loc);
    logger.exitMethod("clickOnCompleteOnServicesPage");
  }
}

module.exports = SelectServicesPage;
