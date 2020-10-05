/**
 * @group allTests
 * @group shs-lw-tests
 * @group move-tests
 * @group move4/shsaddlw
 * @group provide5
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
const {
  RulesPopup,
  PermitPage,
  ShippingDetailsPage,
  AppointmentPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();

const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.move4TestId;
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
describe("Move4: SHS From AB to BC and add LW Livingwell Companion Go Same SHS package", () => {
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
    "Move-4: SHS From AB to BC and add LW Livingwell Companion Go Same SHS package";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Move-4");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Move-4");
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
          return await stepsMove4(dsObj, index)
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

async function stepsMove4(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;
  let workOrderNumber;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  try {
    let output;

    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    const provide5email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide5SSHTech
    ).request.email;

    await CsrDesktopPage.searchCustomerForEmail(provide5email);

    await CsrDesktopPage.clickOnServiceslink();

    await ManageServicesPage.clickMoveServicesButton();

    await ManageServicesPage.addNewAddressInMovePopUp(
      dr.getDataSetKeyValue(dsObj, "input", "City"),
      dr.getDataSetKeyValue(dsObj, "input", "address-search")
    );

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
      "shs-and-lw-test-scenarios",
      testId,
      "validate-available-services"
    );
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
    }

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

    const hsequipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      hsequipments
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-default-equipments"
    );
    if (isValEnabled) {
      logger.debug(`Validating default equipments available or not`);
      expect(hsequipments).not.toBeNull();
      expect(hsequipments).not.toBeUndefined();

      expect(hsequipments.hsmyEquipments).not.toBeNull();
      expect(hsequipments.hsmyEquipments).not.toBeUndefined();

      expect(hsequipments.hsincludedEquipments).not.toBeNull();
      expect(hsequipments.hsincludedEquipments).not.toBeUndefined();

      expect(hsequipments.hsadditionalEquipments).not.toBeNull();
      expect(hsequipments.hsadditionalEquipments).not.toBeUndefined();
    }

    // let defEquips = await EquipmentPage.completeYouPickSectionOnDefaults();
    // logger.result(`Default equipments are selected ${defEquips}`);
    const deliveryMethod = "self";
    const lwequipments = await EquipmentPage.completeLivingWellSectionOnDefaults(
      deliveryMethod
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      lwequipments
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-default-equipments"
    );
    if (isValEnabled) {
      logger.debug(`Validating default equipments available or not`);
      expect(lwequipments).not.toBeNull();
      expect(lwequipments).not.toBeUndefined();

      expect(lwequipments.lwmyEquipments).not.toBeNull();
      expect(lwequipments.lwmyEquipments).not.toBeUndefined();

      expect(lwequipments.lwincludedEquipments).not.toBeNull();
      expect(lwequipments.lwincludedEquipments).not.toBeUndefined();

      expect(lwequipments.lwlwadditionalEquipments).not.toBeNull();
      expect(lwequipments.lwlwadditionalEquipments).not.toBeUndefined();
    }

    const noAddOnAdditionalEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults(
      deliveryMethod,
      true
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      noAddOnAdditionalEquipments
    );

    await RulesPopup.acceptRulesSafely();

    await EquipmentPage.clickOnNextButton();

    const currentstep = EquipmentPage.getCurrentOrderStep();

    if (
      StringUtils.containsIgnoreCaseAny(currentstep, "Security Information")
    ) {
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

      await PermitPage.clickNextButton();
    }

    await AppointmentPage.submitAnyAvailableAppointment(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber"),
      "Test"
    );

    const totaltax = await CheckoutPage.getEstimatedTotalTaxesforToday();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, totaltax);

    const totaltopaytoday = await CheckoutPage.getEstimatedTotalToPayToday();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      totaltopaytoday
    );

    await CheckoutPage.checkEmailcheckbox();

    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

    await ShippingDetailsPage.clickSubmitButton();

    await sel.getJsUtils().isPageLoaded();

    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    // eslint-disable-next-line prefer-const
    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "end-to-end");
    if (isValEnabled) {
      if (isValEnabled) {
        logger.debug(
          `Validating order submission by getting order number generated from Agent portal`
        );
        expect(output).not.toBeNull();
        expect(output).not.toBeUndefined();

        expect(output.orderNumber).not.toBeNull();
        expect(output.orderNumber).not.toBeUndefined();
      }

      logger.debug("Fetching customer's internal id");
      const customerId = await du.getValue(
        dbcfg,
        dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber)
      );
      const order = { customerId };
      order.customerId = customerId;
      logger.debug(`Customer's internal id: ${order.customerId}`);
      TestResult.storeOutputToDataSetResult(caseResult, datasetindex, order);

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
        workOrderNumber = pendingWorkOrders[orIndex][0];
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
      const allOrdersStatus = await du.select(
        dbcfg,
        dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
      );
      logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);

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
      const allcustomerOrdStatus = { allOrdersStatus, allPendingOrders };
      allcustomerOrdStatus.allOrdersStatus = allOrdersStatus;
      allcustomerOrdStatus.allPendingOrders = allPendingOrders;

      logger.debug(
        `Order's statuses till now: ${JSON.stringify(allcustomerOrdStatus)}`
      );
      // storeOutputToDataSetResult(caseResult, datasetindex, allcustomerOrdStatus);

      const customererr = await du.getErrorsOccuredForCustomer(
        dbcfg,
        customerId
      );
      const custErrors = { customererr };
      custErrors.customererr = customererr;
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        custErrors
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
            const holdordertask = await du.getHoldOrderTaskNumber(
              dbcfg,
              res.purchaseeOrderNumber
            );
            logger.info(holdordertask);

            try {
              await tapis.processHoldOrderTask(apicfg, holdordertask);
            } catch (err) {
              console.log(JSON.stringify(err));
            }

            await sel.getWaitUtils().sleep(1000);
            // Hit shipment order completion
            await tapis.processShipmentOrder(
              apicfg,
              res.shipmentOrderNumber,
              res.purchaseeOrderNumber
            );
            // Wait for 10 seconds to get completed
            await sel.getWaitUtils().sleep(10000);

            const ordersnotprocessed = await du.select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId
              )
            );
            const allnonprocessedOrders = { ordersnotprocessed };
            TestResult.storeOutputToDataSetResult(
              caseResult,
              datasetindex,
              allnonprocessedOrders
            );
          }
        }
      }
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
      await CsrDesktopPage.searchCustomerForEmail(provide5email);
      await CsrDesktopPage.clickCityRadioButton(
        dr.getDataSetKeyValue(dsObj, "input", "City")
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
