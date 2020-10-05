/**
 * @group allTests
 * @group shs-lw-tests
 *
 */

require("../../../../src/globals/MyTypeDefs");
require("../../../../src/globals/enumerations");

const { TestResultStatus } = require("../../../../src/globals/enumerations");

const brw = require("../../../../src/sel-js/Browser");
const sel = require("../../../../src/sel-js/SelUtils");
const config = require("../../../../br-config");
const logger = require("../../../../src/logger/Logger");
const StringUtils = require("../../../../src/utils/common/StringUtils");
const ExcelUtils = require("../../../../src/utils/excel/excelUtils");
const DataReader = require("../../../../src/sel-js/DataReader");
const FileSystem = require("../../../../src/utils/common/FileSystem");
const FileWriter = require("../../../../src/utils/common/FileWriter");
const TestResult = require("../../../../src/globals/results/TestResult");
const { Validator } = require("../../../../src/globals/TestObjects");

const DbUtils = require("../../../../src/utils/dbutils/DbUtils");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");
const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const {
  SsoLoginPage,
  AccountPage,
  BillingInformationPage,
  CheckoutPage,
  CreateCustomerPage,
  CreditApprovalPage,
  CsrDesktopPage,
  EquipmentPage,
  RulesPopup,
  SelectServicesPage,
  ShippingDetailsPage,
  SubmitSuccessPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const testId = TestIdsMap.provide1TestId;
const valFile = "shs-and-lw-test-scenarios";

const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);
const apicfg = config.getTelusApisConfig(envcfg);

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
const sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(
  configDataAsset.dataFile,
  configDataAsset.dataSheet
);
// eslint-disable-next-line no-console
console.table(sheetDataAsJsonArray);

/**
 * @type TestCaseResultObject
 */
let caseResult;
describe("Provide1: SHS & LW Test Scenarios", () => {
  beforeAll(() => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.uitest);
    logger.exitMethod("beforeAll");
  });

  afterAll(() => {
    logger.enterMethod("afterAll");
    const dsRepDir = config.getLocationDataSetReportsDirForGivenEnv();
    logger.info(dsRepDir);
    if (!FileSystem.fileExistsSync(dsRepDir)) {
      logger.error(
        `Can not write case-results to non-existent location ${dsRepDir}`
      );
    }
    FileWriter.sync(
      `${dsRepDir}/${testId}.json`,
      JSON.stringify(caseResult),
      false
    );

    //sel.deleteAllCookies();
    logger.exitMethod("afterAll");
  });

  afterEach(async () => {
    logger.enterMethod("afterEach");
    //await sel.captureScreenshot(testId);
    logger.exitMethod("afterEach");
  });

  const testName =
    "Provide-1: Provide in ON; Product: LivingWell Companion Go; Self Install";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Provide-1");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Provide-1");
    });

    logger.debug(`Starting for all data-sets for test-id ${testId}`);
    sheetDataAsJsonArray.forEach((singleJsonRowObject, index) => {
      test(`${testName} for data-set-${index + 1}`, async (done) => {
        logger.enterMethod(`Test started for data-set-${index + 1}`);
        dr.setDataSetObject(singleJsonRowObject, index);
        const dsObj = dr.getDataSetObject(index);
        const executeOrNot = dr.getDataSetKeyValue(
          dsObj,
          "input",
          "data-set-enabled"
        );
        logger.debug(
          `Dataset ${index} at is having execution flag set to ${executeOrNot}`
        );
        caseResult.datasets.push(dr.getDataSetObject(index));
        if (executeOrNot === "Y") {
          return await stepsProvide1(dsObj, index)
            .then((v) => {
              logger.result(`Test result for data-set-${index + 1}: ${v}`);
              logger.exitMethod(`Test finished for data-set-${index + 1}`);
              done();
            })
            .catch((ex) => {
              logger.error(`Test error for data-set-${index + 1}: ${ex}`);
              throw ex;
              //fail(ex);
            });
        }
        return (async () => {
          caseResult.datasets[index].result = TestResultStatus.Skipped;
          logger.exitMethod(
            `Test finished as skipped for data-set-${index + 1}`
          );
          //return "success";
          pending();
        })(); //.then(done());
      }); // test block ending
    }); // for loop ending
  }); // inner describe block ending
}); // describe block ending

async function stepsProvide1(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  let imgPath;
  try {
    let output;
    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    await CsrDesktopPage.clickCheckAddress();

    const ct = dr.getDataSetKeyValue(dsObj, "input", "city");
    let prv = dr.getDataSetKeyValue(dsObj, "input", "province");
    const adr = dr.getDataSetKeyValue(dsObj, "input", "address-search");
    output = await CreateCustomerPage.checkAddress(
      ct,
      dr.getDataSetKeyValue(dsObj, "input", "citylov"),
      prv,
      adr,
      dr.getDataSetKeyValue(dsObj, "input", "addresslov")
    );
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-address"
    );
    if (isValEnabled) {
      logger.debug(`Querying city name from db for ${output.city.itemid}`);
      const cityDb = await du.getValue(
        dbcfg,
        dq.queryNcObjectNameOnId(dbcfg, output.city.itemid)
      );
      logger.debug(`Validating city ${cityDb} with ${ct}`);
      expect(cityDb).not.toBeNull();
      expect(cityDb).not.toBeUndefined();
      expect(StringUtils.containsIgnoreCase(cityDb, ct)).toBeTruthy();

      logger.debug(`Validating province ${output.province} with ${prv}`);
      expect(StringUtils.containsIgnoreCase(output.province, prv)).toBeTruthy();

      logger.debug(`Validating address ${output.address.text} with ${adr}`);
      expect(
        StringUtils.containsIgnoreCase(output.address.text, adr)
      ).toBeTruthy();

      logger.debug(`Querying address from db for ${output.address.rel.id}`);
      const addressDb = await du.getValue(
        dbcfg,
        dq.queryCompleteAddress(dbcfg, output.address.rel.id)
      );
      // expect(addressDb).not.toBeNull();
      logger.debug(
        `Validating db-address ${addressDb} for city ${ct} and province ${prv}`
      );
      // expect(StringUtils.containsIgnoreCase(addressDb, ct)).toBeTruthy();
      // expect(StringUtils.containsIgnoreCase(addressDb, prv)).toBeTruthy();
      TestResult.storeOutputToDataSetResult(caseResult, datasetindex, cityDb);
      logger.info();
    }

    await CreateCustomerPage.verifyServiceAvailability(
      dr.getDataSetKeyValue(dsObj, "input", "services-available")
    );

    await CreateCustomerPage.clickNextForCheckedAddress();
    await CreateCustomerPage.proceedToCustomerCreation();

    await CreateCustomerPage.createNewCustomer(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "lastname"),
      dr.getDataSetKeyValue(dsObj, "input", "email")
    );

    await CreateCustomerPage.continueWithSecureCreditCheck(
      dr.getDataSetKeyValue(dsObj, "input", "dobmonth"),
      dr.getDataSetKeyValue(dsObj, "input", "dobday"),
      dr.getDataSetKeyValue(dsObj, "input", "dobyear"),
      dr.getDataSetKeyValue(dsObj, "input", "province")
    );

    await CreateCustomerPage.fillDriverLicenseIdentityDetails(
      dr.getDataSetKeyValue(dsObj, "input", "driverlicense"),
      dr.getDataSetKeyValue(dsObj, "input", "province")
    );

    const customerRegistered = await CreateCustomerPage.authorizeAndValidate();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      customerRegistered
    );
    logger.result(`Customer registration successful: ${customerRegistered}`);

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-customer-registered"
    );
    if (isValEnabled) {
      logger.debug(`Validating customer-regristration`);
      expect(customerRegistered).toBeTruthy();
    }

    const availsAndSelected = await SelectServicesPage.selectServicesVerticalPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "services"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceprovider")
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      availsAndSelected
    );
    logger.result(
      `There were available services ${JSON.stringify(availsAndSelected)}`
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-available-services"
    );
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
      const expectedplan = dr.getDataSetKeyValue(dsObj, "expected", "Plan");
      // let expectedEquipment =  dr.getDataSetKeyValue(dsObj,"expected","Equipment");
      const expectedPrice = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "costtovalidate"
      );
      expect(availsAndSelected.cartItems.cartPlan).toContain(expectedplan);
      expect(availsAndSelected.cartItems.cartPrice).toContain(expectedPrice);
      // expect(ArrayUtils.equalsIgnoreCase());
    }

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-no-easy-payments"
    );
    if (isValEnabled) {
      logger.debug(`Validating no easy payments`);
      const invisible = await EquipmentPage.validateInvisibilityOfEasyPayments();

      expect(invisible).not.toBeNull();
      expect(invisible).not.toBeUndefined();
      expect(invisible).toBeTruthy();

      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        `Visibility of Easy Payments: ${invisible}`
      );
    }

    // let defEquips = await EquipmentPage.completeYouPickSectionOnDefaults();
    // logger.result(`Default equipments are selected ${defEquips}`);
    prv = dr.getDataSetKeyValue(dsObj, "input", "province");
    if (StringUtils.equalsIgnoreCase(prv, "ON")) {
      logger.info("Entering function to validate tech install");
      await EquipmentPage.selectDeliveryMethod("tech");

      await EquipmentPage.clickOnNextButton();

      await EquipmentPage.clickOnNextButton();

      const popupcontentdelivery = await RulesPopup.acceptRulesSafely();
      expect(popupcontentdelivery).not.toBeNull();
      expect(popupcontentdelivery).not.toBeUndefined();
      const msgtoverify =
        "The selected delivery method is not supported, please choose another";
      expect(popupcontentdelivery.msgtext).toContain(msgtoverify);

      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        popupcontentdelivery
      );
      await EquipmentPage.selectServicePlanTab(
        dr.getDataSetKeyValue(dsObj, "input", "services")
      );
    }

    // var allequipments = [];

    // Tech Install validation steps
    {
      const deliveryMethod = "self";
      const equipments = await EquipmentPage.completeLivingWellSectionOnDefaults(
        deliveryMethod
      );
      // allequipments.push(equipments);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        equipments
      );
      isValEnabled = tval.isValidationEnabled(
        valFile,
        testId,
        "validate-default-equipments"
      );
      if (isValEnabled) {
        logger.debug(`Validating default equipments available or not`);
        expect(equipments).not.toBeNull();
        expect(equipments).not.toBeUndefined();

        expect(equipments.lwmyEquipments).not.toBeNull();
        expect(equipments.lwmyEquipments).not.toBeUndefined();

        expect(equipments.lwincludedEquipments).not.toBeNull();
        expect(equipments.lwincludedEquipments).not.toBeUndefined();
        const allIncludedEquipment = dr.getDataSetKeyValue(
          dsObj,
          "expected",
          "IncludedEquipment"
        );
        expect(
          StringUtils.replaceAll(
            JSON.stringify(equipments.lwincludedEquipments),
            "[^a-zA-Z_]",
            ""
          )
        ).toContain(
          StringUtils.replaceAll(allIncludedEquipment, "[^a-zA-Z_]", "")
        );

        expect(equipments.lwlwadditionalEquipments).not.toBeNull();
        expect(equipments.lwlwadditionalEquipments).not.toBeUndefined();
        const allAddiontalEquipment = dr.getDataSetKeyValue(
          dsObj,
          "expected",
          "AdditionalEquipment"
        );
        expect(
          StringUtils.replaceAll(
            JSON.stringify(equipments.lwlwadditionalEquipments),
            "[^a-zA-Z0-9]",
            ""
          )
        ).toContain(
          StringUtils.replaceAll(allAddiontalEquipment, "[^a-zA-Z]", "")
        );
      }

      const addOnAdditionalEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults(
        deliveryMethod
      );
      // allequipments.push(addonequipments);
      const popupdetail = [];
      popupdetail.push(addOnAdditionalEquipments.popup);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        addOnAdditionalEquipments
      );
      isValEnabled = tval.isValidationEnabled(
        valFile,
        testId,
        "validate-no-additional-equipment"
      );
      if (isValEnabled) {
        logger.result(`No option to add any additional equipment`);
        expect(addOnAdditionalEquipments.additionalEquipments).not.toBeNull();
        expect(
          addOnAdditionalEquipments.additionalEquipments
        ).not.toBeUndefined();
        const exAddOnEquipment = dr.getDataSetKeyValue(
          dsObj,
          "expected",
          "AddOnEquipment"
        );
        expect(
          StringUtils.replaceAll(
            JSON.stringify(addOnAdditionalEquipments.additionalEquipments),
            "[^a-zA-Z0-9]",
            ""
          )
        ).toContain(
          StringUtils.replaceAll(exAddOnEquipment, "[^a-zA-Z0-9]", "")
        );
        expect(addOnAdditionalEquipments.popup).not.toBeNull();
        expect(addOnAdditionalEquipments.popup).not.toBeUndefined();

        const msgtoverify =
          "You’ve chosen Self-Install and LWC Direct Ship has been added to your order.";
        expect(addOnAdditionalEquipments.popup.msgtext).toContain(msgtoverify);
      }
    }
    // let popupcontent = await RulesPopup.acceptRulesSafely();
    // expect(popupcontent).not.toBeNull();
    // expect(popupcontent).not.toBeUndefined();

    await CheckoutPage.applyPromoCode(
      dr.getDataSetKeyValue(dsObj, "input", "couponcode")
    );

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-tax-rate"
    );
    const tax = await CheckoutPage.getEstimatedMonthlyTotalTaxes();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, tax);
    if (isValEnabled) {
      const taxToValidate = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "taxtovalidate"
      );
      logger.debug(`Validating tax ${tax} with ${taxToValidate}`);
      expect(
        StringUtils.equalsIgnoreCase(tax.appliedtax, taxToValidate)
      ).toBeTruthy();
    }

    const cost = await CheckoutPage.getDueMonthlyBeforeTaxMatching();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, cost);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-cost");
    if (isValEnabled) {
      const costToValidate = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "costtovalidate"
      );
      logger.debug(`Validating cost ${cost.amount} with ${costToValidate}`);
      expect(
        StringUtils.equalsIgnoreCase(cost.amount, costToValidate)
      ).toBeTruthy();
    }

    const discount = await CheckoutPage.getDiscount();

    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, discount);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "Discount");
    if (isValEnabled) {
      const discounttovalidate = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "discount"
      );
      logger.debug(
        `Validating cost ${discount.discountamount} with ${discounttovalidate}`
      );
      expect(
        StringUtils.equalsIgnoreCase(
          discount.discountamount,
          discounttovalidate
        )
      ).toBeTruthy();
    }

    const totaltax = await CheckoutPage.getEstimatedTotalTaxesforToday();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, totaltax);

    const totaltopaytoday = await CheckoutPage.getEstimatedTotalToPayToday();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      totaltopaytoday
    );

    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();
    await ShippingDetailsPage.fillupPhoneNumberAndSaveContactInfo(
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    );
    // await ShippingDetailsPage.shipToPreFilledAddressAndSubmit(dr.getDataSetKeyValue(dsObj, "input", "postalcode"));

    await EquipmentPage.clickOnNextButton();

    const currentUrl = await sel.getCurrentUrl();
    if (StringUtils.containsIgnoreCase(currentUrl, "credit")) {
      await CreditApprovalPage.clickNextToCreditCheckResult();
    }

    // await BillingInformationPage.acceptAgentAdviseAndSaveContact(
    //   dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    // );
    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-order-submission"
    );
    if (isValEnabled) {
      logger.debug(
        `Validating order submission by getting order number generated from Agent portal`
      );
      expect(output).not.toBeNull();
      expect(output).not.toBeUndefined();

      expect(output.orderNumber).not.toBeNull();
      expect(output.orderNumber).not.toBeUndefined();
    }

    const ordersStatuses = {};
    logger.debug("Fetching customer's internal id");
    const customerId = await du.getValue(
      dbcfg,
      dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber)
    );
    logger.debug(`Customer's internal id: ${customerId}`);
    ordersStatuses.customerId = customerId;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-order-submission"
    );
    if (isValEnabled) {
      logger.debug(
        `Validating order submission by querying NetCracker BE for order number ${output.orderNumber} by validating if this order exists for registered customer`
      );
      expect(customerId).not.toBeNull();
      expect(customerId).not.toBeUndefined();
    }

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-be-time-zone"
    );
    if (isValEnabled) {
      logger.debug(
        `Validating no error occured on NetCracker BE for timezone of ${output.orderNumber}`
      );
      const customerErrors = await du.getErrorsOccuredForCustomer(
        dbcfg,
        customerId
      );
      expect(customerErrors).not.toBeNull();
      expect(customerErrors).not.toBeUndefined();
      expect(customerErrors.length > 0).toBeFalsy();
    }

    logger.debug("Completing manual tasks in case any");
    const manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
    if (!StringUtils.isEmpty(manualTaskId)) {
      const res = await tapis.processManualTask(apicfg, manualTaskId);
      logger.debug(
        `Manual task ${manualTaskId} completion status code: ${res.status}`
      );
    }

    logger.debug("Fetching customer's all order item's status");
    const allOrdersStatus = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
    );
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    ordersStatuses.allOrdersStatus = allOrdersStatus;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );

    logger.debug("Fetching customer's all pending order item's status");
    const allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
        dbcfg,
        customerId
      )
    );
    const temp = {};
    temp.errors = {
      ...output.orderNumber,
      ...allPendingOrders,
    };
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, temp);
    logger.debug(
      `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
    );
    ordersStatuses.allPendingOrders = allPendingOrders;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      ordersStatuses
    );

    if (
      allPendingOrders != null &&
      allPendingOrders !== undefined &&
      allPendingOrders.length > 0
    ) {
      for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
        const orderInternalId = allPendingOrders[orIndex][1];
        const orderName = allPendingOrders[orIndex][0];
        if (StringUtils.containsIgnoreCase(orderName, "shipment")) {
          // Hit release activation in case order is in entering state
          await tapis.processReleaseActivation(apicfg, orderInternalId);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);

          const res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
            dbcfg,
            orderInternalId
          );
          TestResult.storeOutputToDataSetResult(caseResult, datasetindex, res);
          // Hit shipment order completion
          const orderstatus = await tapis.processShipmentOrder(
            apicfg,
            res.shipmentOrderNumber,
            res.purchaseeOrderNumber
          );
          TestResult.storeOutputToDataSetResult(
            caseResult,
            datasetindex,
            orderstatus
          );
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);
        }
      }
    }

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-billing-task"
    );
    if (isValEnabled) {
      logger.debug(
        `Validating billing actions occured on NetCracker for customer ${customerId}`
      );
      let billingActionsStatus = await du.getBillingActionStatus(
        dbcfg,
        customerId
      );
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        billingActionsStatus
      );
      expect(billingActionsStatus).not.toBeNull();
      expect(billingActionsStatus).not.toBeUndefined();
      expect(billingActionsStatus.length > 0).toBeTruthy();
      logger.debug(
        `Validating no error occured on NetCracker for any billing task for customer ${customerId}`
      );
      billingActionsStatus = await du.getBillingFailedActionStatus(
        dbcfg,
        customerId
      );
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        billingActionsStatus
      );
      expect(billingActionsStatus).not.toBeNull();
      expect(billingActionsStatus).not.toBeUndefined();
      expect(billingActionsStatus.length > 0).toBeFalsy();
    }

    const service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-services-active"
    );
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();
      await CsrDesktopPage.searchCustomerForEmail(
        dr.getDataSetKeyValue(dsObj, "input", "email")
      );
      await CsrDesktopPage.clickOnServiceslink();
      const servicePlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
      const isActive = await AccountPage.validateStatusIsActiveForGivenService(
        servicePlan
      );

      expect(isActive).not.toBeNull();
      expect(isActive).not.toBeUndefined();
      expect(isActive).toBeTruthy();
    }

    imgPath = await sel.captureScreenshot(`${testId}-ds-${datasetindex}-PASS`);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    //await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    caseResult.datasets[datasetindex].error = err;
    imgPath = await sel.captureScreenshot(`${testId}-ds-${datasetindex}-FAIL`);
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}
