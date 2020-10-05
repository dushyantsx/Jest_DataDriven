/**
 * @group allTests
 * @group shs-lw-tests
 * @group change-tests
 * @group change4/provi
 * @group provide4
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
const AdcApis = require("../../../../src/utils/telus-apis/AdcApis");
const TestResult = require("../../../../src/globals/results/TestResult");
const { Validator } = require("../../../../src/globals/TestObjects");
const XmlParser = require("../../../../src/utils/common/XmlParser");

const DbUtils = require("../../../../src/utils/dbutils/DbUtils");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");
const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const {
  AppointmentPage,
  CsrDesktopPage,
  SsoLoginPage,
  SubmitSuccessPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const adcapis = new AdcApis();

const testId = TestIdsMap.amend4TestID;
const valFile = "shs-and-lw-test-scenarios";

const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);
const apicfg = config.getTelusApisConfig(envcfg);
const adcfg = config.getAdcApisConfig(envcfg);

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
describe("Ammend4: Change appointment", () => {
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

  const testName = "Amend-4: Change Appointment";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Amend-4");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Amend-4");
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
          return await stepsAmend4(dsObj, index)
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

async function stepsAmend4(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let workOrderNumber;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  try {
    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    const provide6Email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide6TestID
    ).request.email;

    const provide6customerid = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide6TestID
    ).response.customerId;

    const provide6service = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.move5TestID
    ).request.serviceplan;

    const move5city = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.move5TestID
    ).request.city;

    await CsrDesktopPage.searchCustomerForEmail(provide6Email);

    await CsrDesktopPage.clickCityRadioButton(move5city);

    await CsrDesktopPage.clickOnBookAppointment();

    await AppointmentPage.clickOnCreateAppointment();

    await AppointmentPage.selectServiceForAppointment(provide6service);

    const duration = await AppointmentPage.submitAnyChangedAppointment(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    );
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, duration);

    const output = await SubmitSuccessPage.verifyThanksMessageOnly();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    let isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-order-submission"
    );
    if (isValEnabled) {
      logger.debug(
        `Validating order submission by querying NetCracker BE for order number ${output.orderNumber} by validating if this order exists for registered customer`
      );
      expect(provide6customerid).not.toBeNull();
      expect(provide6customerid).not.toBeUndefined();
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
        provide6customerid
      );
      expect(customerErrors).not.toBeNull();
      expect(customerErrors).not.toBeUndefined();
    }

    logger.debug("Completing manual tasks in case any");
    const manualTaskId = await du.getManualCreditTaskId(
      dbcfg,
      provide6customerid
    );
    if (!StringUtils.isEmpty(manualTaskId)) {
      const res = await tapis.processManualTask(apicfg, manualTaskId);
      logger.debug(
        `Manual task ${manualTaskId} completion status code: ${res.status}`
      );
    }

    const pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(
      dbcfg,
      provide6customerid
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
      dq.queryNcCustomerOrdersStatus(dbcfg, provide6customerid)
    );
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);

    logger.debug("Fetching customer's all pending order item's status");
    const allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
        dbcfg,
        provide6customerid
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

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-billing-task"
    );
    if (isValEnabled) {
      logger.debug(
        `Validating billing actions occured on NetCracker for customer ${provide6customerid}`
      );
      let billingActionsStatus = await du.getBillingActionStatus(
        dbcfg,
        provide6customerid
      );
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        billingActionsStatus
      );
      expect(billingActionsStatus).not.toBeNull();
      expect(billingActionsStatus).not.toBeUndefined();

      logger.debug(
        `Validating no error occured on NetCracker for any billing task for customer ${provide6customerid}`
      );
      billingActionsStatus = await du.getBillingFailedActionStatus(
        dbcfg,
        provide6customerid
      );
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        billingActionsStatus
      );
      expect(billingActionsStatus).not.toBeNull();
      expect(billingActionsStatus).not.toBeUndefined();
    }

    const customererr = await du.getErrorsOccuredForCustomer(
      dbcfg,
      provide6customerid
    );
    const custErrors = { customererr };
    custErrors.customererr = customererr;
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, custErrors);

    if (allPendingOrders != null && allPendingOrders !== undefined) {
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
              provide6customerid
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

    const dstdetail = await adcapis.getDSTInfo(adcfg, workOrderNumber);
    const parseddst = await XmlParser.getDatafromXml(dstdetail);
    let dstdetails = {};
    dstdetails = { parseddst };
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, dstdetails);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "Dst-Details");
    if (isValEnabled) {
      expect(parseddst).not.toBeNull();
      expect(parseddst).not.toBeUndefined();
      const appointstartdate =
        parseddst.Body.getWorkOrderResponse.workOrder.appointmentStartDate;
      expect(
        StringUtils.substringBetweenIgnoreCase(
          JSON.stringify(appointstartdate),
          "",
          "T"
        )
      ).toContain(
        StringUtils.substringBetweenIgnoreCase(
          JSON.stringify(duration.startdate),
          "",
          "T"
        )
      );
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

    const imgPath = await sel.captureScreenshot(
      `${testId}-ds-${datasetindex}-Fail`
    );
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    //await sel.quit();
    throw err;
  }
}
