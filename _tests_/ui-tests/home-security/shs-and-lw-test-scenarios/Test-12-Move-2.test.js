/**
 * @group allTests
 * @group shs-lw-tests
 * @group move-tests
 * @group move2/lw/abtobc
 * @group provide2
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
const TestIdsMap = require("../../../../src/globals/TestIdsMap");
const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const SelectServicesPage = require("../../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const BillingInformationPage = require("../../../../src/pages/home-security/BillingInformationPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const ManageServicesPage = require("../../../../src/pages/home-security/ManageServicesPage");
const { PermitPage } = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();

const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.move2TestId;
const tapis = new TelusApis();
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
describe("Move2: LW AB to BC (LW move and upgrade) Livingwell Companion Home to Livingwell Companion Go", () => {
  beforeAll(() => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.uitest);
    logger.exitMethod("beforeAll");
  });

  afterAll(() => {
    logger.enterMethod("afterAll");
    const dsRepDir = config.getLocationDataSetReportsDirForGivenEnv();
    logger.info(dsRepDir);
    if (FileSystem.fileExistsSync(dsRepDir) === false) {
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
    "Move-2: LW AB to BC (LW move and upgrade) Livingwell Companion Home to Livingwell Companion Go";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Move-2");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Move-2");
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
          return await stepsMove2(dsObj, index)
            .then((v) => {
              logger.result(`Test result for data-set-${index + 1}: ${v}`);
              logger.exitMethod(`Test finished for data-set-${index + 1}`);
              done();
            })
            .catch((ex) => {
              logger.error(`Test error for data-set-${index + 1}: ${ex}`);
              throw ex;
              //done();
            });
        }
        return (async () => {
          caseResult.datasets[index].result = TestResultStatus.Skipped;
          logger.exitMethod(
            `Test finished as skipped for data-set-${index + 1}`
          );
          pending();
          //return "success";
        })(); //.then(done());
      }); // test block ending
    }); // for loop ending
  }); // inner describe block ending
}); // describe block ending

async function stepsMove2(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  try {
    let output;

    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    await sel.getJsUtils().isPageLoaded();

    const provide2email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide2LWTech
    ).request.email;

    await CsrDesktopPage.searchCustomerForEmail(provide2email);

    //await CsrDesktopPage.clickCityRadioButton("AMHERSTBURG");

    await CsrDesktopPage.clickOnServiceslink();

    await sel.getJsUtils().isPageLoaded();

    await ManageServicesPage.clickMoveServicesButton();

    await sel.getJsUtils().isPageLoaded();

    await ManageServicesPage.addNewAddressInMovePopUp(
      dr.getDataSetKeyValue(dsObj, "input", "City"),
      dr.getDataSetKeyValue(dsObj, "input", "address-search")
    );

    await sel.getJsUtils().isPageLoaded();

    const availsAndSelected = await SelectServicesPage.selectVerticallyProductOffering(
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan")
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
      "shs-and-lw-test-scenarios",
      testId,
      "validate-available-services"
    );
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
    }

    await SelectServicesPage.clickNextButton();

    await sel.getJsUtils().isPageLoaded();

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-no-easy-payments"
    );
    if (isValEnabled) {
      logger.debug(`Validating no easy payments`);
      let invisible = await EquipmentPage.validateInvisibilityOfEasyPayments();
      invisible = `Easy Payments are available:${invisible}`;
      expect(invisible).not.toBeNull();
      expect(invisible).not.toBeUndefined();
      expect(invisible).toBeTruthy();

      TestResult.storeOutputToDataSetResult(caseResult, datasetindex, {
        easypaymentvisibility: invisible,
      });
    }

    // let defEquips = await EquipmentPage.completeYouPickSectionOnDefaults();
    // logger.result(`Default equipments are selected ${defEquips}`);
    const equipments = await EquipmentPage.completeLivingWellSectionOnDefaults();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, equipments);
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

      const expectedmyequipment = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "includedequipment"
      );
      expect(
        StringUtils.containsIgnoreCase(
          StringUtils.replaceAll(
            JSON.stringify(equipments.lwincludedEquipments),
            "[^a-zA-Z_]",
            ""
          ),
          StringUtils.replaceAll(expectedmyequipment, "[^a-zA-Z_]", "")
        )
      ).toBeTruthy();
    }

    await sel.getJsUtils().isPageLoaded();

    const noAddOnAdditionalEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      noAddOnAdditionalEquipments
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-no-additional-equipment"
    );
    if (isValEnabled) {
      logger.result(`No option to add any additional equipment`);
      expect(noAddOnAdditionalEquipments).not.toBeNull();
      expect(noAddOnAdditionalEquipments).not.toBeUndefined();
      expect(noAddOnAdditionalEquipments).toBeTruthy();
      const expectedadditionalequipment = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "addonequipment"
      );

      expect(noAddOnAdditionalEquipments.additionalEquipments).toContain(
        expectedadditionalequipment
      );

      await sel.getWaitUtils().waitForUrlToChangeTo("emergency_contact_lw");

      let steps = [];
      steps = await EquipmentPage.getCurrentOrderStep();
      if (StringUtils.containsIgnoreCaseAny(steps, "Security Information")) {
        await PermitPage.enterLWCustomerDetails(
          dr.getDataSetKeyValue(dsObj, "input", "firstname"),
          dr.getDataSetKeyValue(dsObj, "input", "lastname"),
          dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
        );

        await PermitPage.enterLWEmergencyDetails(
          dr.getDataSetKeyValue(dsObj, "input", "firstname"),
          dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber"),
          "2"
        );

        await sel.getJsUtils().isPageLoaded();

        await PermitPage.clickNextButton();
      }
    }

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
        StringUtils.containsIgnoreCaseAny(
          JSON.stringify(tax.appliedtax),
          taxToValidate
        )
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
      logger.debug(`Validating cost ${cost} with ${costToValidate}`);
      expect(
        StringUtils.containsIgnoreCaseAny(
          JSON.stringify(cost.amount),
          costToValidate
        )
      ).toBeTruthy();
    }

    const totaltax = await CheckoutPage.getEstimatedTotalTaxesforToday();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, totaltax);

    const totaltopaytoday = await CheckoutPage.getTotalPaymentToday();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      totaltopaytoday
    );

    await CheckoutPage.checkEmailcheckbox();
    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();
    await BillingInformationPage.clickSubmitButton();

    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    // eslint-disable-next-line prefer-const
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

    const order = {};
    logger.debug("Fetching customer's internal id");
    const customerId = await du.getValue(
      dbcfg,
      dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber)
    );
    logger.debug(`Customer's internal id: ${customerId}`);
    order.customerId = customerId;
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, customerId);

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
    }

    logger.debug("Completing manual tasks in case any");
    const manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
    if (!StringUtils.isEmpty(manualTaskId)) {
      const res = await tapis.processManualTask(apicfg, manualTaskId);
      logger.debug(
        `Manual task ${manualTaskId} completion status code: ${res.status}`
      );
    }

    const pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(
      dbcfg,
      customerId
    );
    for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
      //let orderInternalId = pendingWorkOrders[orIndex][1];
      const workOrderNumber = pendingWorkOrders[orIndex][0];
      const workOrderName = pendingWorkOrders[orIndex][2];
      if (StringUtils.containsIgnoreCase(workOrderName, "work order")) {
        // Hit release activation in case order is in entering state
        await tapis.processReleaseActivation(apicfg, workOrderNumber);
        // Wait for 10 seconds to get completed
        await sel.getWaitUtils().sleep(10000);

        // Hit work order completion
        await tapis.processWorkOrder(apicfg, workOrderNumber);
        // Wait for 10 seconds to get completed
        await sel.getWaitUtils().sleep(10000);
      }
    }

    logger.debug("Fetching customer's all order item's status");
    const allcustomerOrdStatus = {};
    const allOrdersStatus = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
    );
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    allcustomerOrdStatus.allOrdersStatus = allOrdersStatus;

    logger.debug("Fetching customer's all pending order item's status");
    const allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
        dbcfg,
        customerId
      )
    );
    logger.debug(
      `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
    );
    allcustomerOrdStatus.allPendingOrders = allPendingOrders;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(
        allcustomerOrdStatus.allOrdersStatus
      )}`
    );
    // storeOutputToDataSetResult(caseResult, datasetindex, allcustomerOrdStatus);

    const custErrors = {};
    custErrors.err = await du.getErrorsOccuredForCustomer(dbcfg, customerId);
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, custErrors);

    const allnonprocessedOrders = {};
    if (
      allPendingOrders != null &&
      allPendingOrders !== undefined &&
      allPendingOrders.length > 0
    ) {
      allnonprocessedOrders.ordersnotprocessed = await du.select(
        dbcfg,
        dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
          dbcfg,
          customerId
        )
      );
    }

    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      allnonprocessedOrders
    );

    const service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-services-active"
    );
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();
      await CsrDesktopPage.searchCustomerForEmail(provide2email);

      await CsrDesktopPage.clickCityRadioButton(
        dr.getDataSetKeyValue(dsObj, "input", "city")
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

    const imgPath = await sel.captureScreenshot(
      `${testId}-ds-${datasetindex}-PASS`
    );
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    //await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    caseResult.datasets[datasetindex].error = err;
    const imgPath = await sel.captureScreenshot(
      `${testId}-ds-${datasetindex}-FAIL`
    );
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}
