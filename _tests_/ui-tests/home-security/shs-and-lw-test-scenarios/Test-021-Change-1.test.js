/**
 * @group allTests
 * @group shs-lw-tests
 * @group change-tests
 * @group change1
 */

require("../../../../src/globals/MyTypeDefs");
require("../../../../src/globals/enumerations");

const brw = require("../../../../src/sel-js/Browser");
const sel = require("../../../../src/sel-js/SelUtils");
const config = require("../../../../br-config");
const logger = require("../../../../src/logger/Logger");
const StringUtils = require("../../../../src/utils/common/StringUtils");
const excelUtils = require("../../../../src/utils/excel/excelUtils");
const DataReader = require("../../../../src/sel-js/DataReader");
const FileSystem = require("../../../../src/utils/common/FileSystem");
const FileWriter = require("../../../../src/utils/common/FileWriter");
const TestResult = require("../../../../src/globals/results/TestResult");
const Validator = require("../../../../src/globals/TestObjects").Validator;
const DbUtils = require("../../../../src/utils/dbutils/DbUtils"),
  du = DbUtils.DbUtils,
  dq = DbUtils.DbQueries;
const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");
const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const CreateCustomerPage = require("../../../../src/pages/home-security/CreateCustomerPage");
const SelectServicesPage = require("../../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const ShippingDetailsPage = require("../../../../src/pages/home-security/ShippingDetailsPage");
const CreditApprovalPage = require("../../../../src/pages/home-security/CreditApprovalPage");
const BillingInformationPage = require("../../../../src/pages/home-security/BillingInformationPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const ManageServicesPage = require("../../../../src/pages/home-security/ManageServicesPage");
const PermitPage = require("../../../../src/pages/home-security/PermitPage");
const RulesPopup = require("../../../../src/pages/home-security/RulesPopup");

const eu = new excelUtils();
const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.change1TestID;
const valFile = "shs-and-lw-test-scenarios";

let envcfg = config.getConfigForGivenEnv();
let dbcfg = config.getDbConfig(envcfg);
let apicfg = config.getTelusApisConfig(envcfg);
let useremailid = "NA";

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
var sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(configDataAsset.dataFile, configDataAsset.dataSheet);
console.table(sheetDataAsJsonArray);

/**
 * @type TestCaseResultObject
 */
let caseResult;
describe("SHS and LW Test Scenarios", () => {
  beforeAll(() => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.uitest);
    logger.exitMethod("beforeAll");
  });

  afterAll(() => {
    logger.enterMethod("afterAll");
    let dsRepDir = config.getLocationDataSetReportsDirForGivenEnv();
    logger.info(dsRepDir);
    if (FileSystem.fileExistsSync(dsRepDir) == false) {
      logger.error(`Can not write case-results to non-existent location ${dsRepDir}`);
    }
    FileWriter.sync(dsRepDir + "/" + testId + ".json", JSON.stringify(caseResult), false);

    //sel.deleteAllCookies();
    logger.exitMethod("afterAll");
  });

  afterEach(async () => {
    logger.enterMethod("afterEach");
    //await sel.captureScreenshot(testId);
    logger.exitMethod("afterEach");
  });

  let testName = "Change-1: Add Equipment";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Change-1");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Change-1");
    });

    logger.debug(`Starting for all data-sets for test-id ${testId}`);
    sheetDataAsJsonArray.forEach((singleJsonRowObject, index) => {
      test(`${testName} for data-set-${index + 1}`, async (done) => {
        logger.enterMethod(`Test started for data-set-${index + 1}`);
        dr.setDataSetObject(singleJsonRowObject, index);
        let dsObj = dr.getDataSetObject(index);
        let executeOrNot = dr.getDataSetKeyValue(dsObj, "input", "data-set-enabled");
        logger.debug(`Dataset ${index} at is having execution flag set to ${executeOrNot}`);
        caseResult.datasets.push(dr.getDataSetObject(index));
        if (executeOrNot == "Y") {
          return await stepsChange1(dsObj, index)
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
        } else {
          return (async () => {
            caseResult.datasets[index].result = TestResultStatus.Skipped;
            logger.exitMethod(`Test finished as skipped for data-set-${index + 1}`);
            //return "success";
            pending();
          })(); //.then(done());
        }
        logger.exitMethod(`Test finished for data-set-${index + 1}`);
      }); // test block ending
    }); // for loop ending
  }); // inner describe block ending
}); // describe block ending

async function stepsChange1(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;

  logger.debug("Till now case result: " + JSON.stringify(caseResult.datasets));
  try {
    let output;
    let imgPath;
    let drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    //  let provide1Email = config.getFirstTestDataAssetResultsForGivenTestId(TestIdsMap.provide1TestId).request["email"];
    await CsrDesktopPage.searchCustomerForEmail("Provide_Two_2563848@telus.com");

    await CsrDesktopPage.clickOnServiceslink();

    await ManageServicesPage.clickEquipmentonService("Smart Automation");

    let youpickequipments = await EquipmentPage.completeYouPickSectionOnDefaults();
    storeOutputToDataSetResult(caseResult, datasetindex, youpickequipments);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-default-equipments");
    if (isValEnabled) {
      logger.debug(`Validating default equipments available or not`);
      expect(youpickequipments).not.toBeNull();
      expect(youpickequipments).not.toBeUndefined();

      expect(youpickequipments.myEquipments).not.toBeNull();
      expect(youpickequipments.myEquipments).not.toBeUndefined();

      expect(youpickequipments.includedEquipments).not.toBeNull();
      expect(youpickequipments.includedEquipments).not.toBeUndefined();

      expect(youpickequipments.additionalEquipments).not.toBeNull();
      expect(youpickequipments.additionalEquipments).not.toBeUndefined();
    }

    await EquipmentPage.clickOnAddEquipment(dr.getDataSetKeyValue(dsObj, "input", "equipmenttoadd"));
    let deliverymethod = "Tech";
    let homesecurityequipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(deliverymethod, true);

    storeOutputToDataSetResult(caseResult, datasetindex, homesecurityequipments);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-default-equipments");
    if (isValEnabled) {
      logger.debug(`Validating default equipments available or not`);
      expect(homesecurityequipments).not.toBeNull();
      expect(homesecurityequipments).not.toBeUndefined();

      expect(homesecurityequipments.myEquipments).not.toBeNull();
      expect(homesecurityequipments.myEquipments).not.toBeUndefined();

      expect(homesecurityequipments.includedEquipments).not.toBeNull();
      expect(homesecurityequipments.includedEquipments).not.toBeUndefined();

      expect(homesecurityequipments.additionalEquipments).not.toBeNull();
      expect(homesecurityequipments.additionalEquipments).not.toBeUndefined();
    }

    await RulesPopup.clickOnContinueWithOrder();

    await AppointmentPage.clickonSelectedService();

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-tax-rate");
    let tax = await CheckoutPage.getEstimatedMonthlyTotalTaxes();
    storeOutputToDataSetResult(caseResult, datasetindex, tax);
    if (isValEnabled) {
      let taxToValidate = dr.getDataSetKeyValue(dsObj, "expected", "taxtovalidate");
      logger.debug(`Validating tax ${tax} with ${taxToValidate}`);
      expect(StringUtils.equalsIgnoreCase(tax.appliedtax, taxToValidate)).toBeTruthy();
    }

    let cost = await CheckoutPage.getDueMonthlyBeforeTaxMatching();
    storeOutputToDataSetResult(caseResult, datasetindex, cost);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-cost");
    if (isValEnabled) {
      let costToValidate = dr.getDataSetKeyValue(dsObj, "expected", "costtovalidate");
      logger.debug(`Validating cost ${cost} with ${costToValidate}`);
      expect(StringUtils.equalsIgnoreCase(cost, costToValidate)).toBeTruthy();
    }

    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    storeOutputToDataSetResult(caseResult, datasetindex, output);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-order-submission");
    if (isValEnabled) {
      logger.debug(`Validating order submission by getting order number generated from Agent portal`);
      expect(output).not.toBeNull();
      expect(output).not.toBeUndefined();

      expect(output.orderNumber).not.toBeNull();
      expect(output.orderNumber).not.toBeUndefined();
    }

    let order = {};
    logger.debug("Fetching customer's internal id");
    let customerId = await du.getValue(dbcfg, dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber));
    logger.debug(`Customer's internal id: ${customerId}`);
    order.customerId = customerId;
    storeOutputToDataSetResult(caseResult, datasetindex, customerId);

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-order-submission");
    if (isValEnabled) {
      logger.debug(
        `Validating order submission by querying NetCracker BE for order number ${output.orderNumber} by validating if this order exists for registered customer`
      );
      expect(customerId).not.toBeNull();
      expect(customerId).not.toBeUndefined();
    }

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-be-time-zone");
    if (isValEnabled) {
      logger.debug(`Validating no error occured on NetCracker BE for timezone of ${output.orderNumber}`);
      let customerErrors = await du.getErrorsOccuredForCustomer(dbcfg, customerId);
      expect(customerErrors).not.toBeNull();
      expect(customerErrors).not.toBeUndefined();
      expect(customerErrors.length > 0).toBeFalsy();
    }

    logger.debug("Completing manual tasks in case any");
    let manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
    if (StringUtils.isEmpty(manualTaskId) == false) {
      let res = await tapis.processManualTask(apicfg, manualTaskId);
      logger.debug(`Manual task ${manualTaskId} completion status code: ${res.status}`);
    }

    let pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(dbcfg, customerId);
    for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
      //let orderInternalId = pendingWorkOrders[orIndex][1];
      let workOrderNumber = pendingWorkOrders[orIndex][0];
      let workOrderName = pendingWorkOrders[orIndex][2];
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
    let allcustomerOrdStatus = {};
    let allOrdersStatus = await du.select(dbcfg, dq.queryNcCustomerOrdersStatus(dbcfg, customerId));
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    allcustomerOrdStatus.allOrdersStatus = allOrdersStatus;
    logger.debug(`Order's statuses till now: ${JSON.stringify(ordersStatuses)}`);

    logger.debug("Fetching customer's all pending order item's status");
    let allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(dbcfg, customerId)
    );
    logger.debug(`Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`);
    allcustomerOrdStatus.allPendingOrders = allPendingOrders;
    logger.debug(`Order's statuses till now: ${JSON.stringify(allcustomerOrdStatus)}`);
    // storeOutputToDataSetResult(caseResult, datasetindex, allcustomerOrdStatus);

    let custErrors = {};
    custErrors.err = await du.getErrorsOccuredForCustomer(dbcfg, customerId);
    storeOutputToDataSetResult(caseResult, datasetindex, custErrors);

    let allnonprocessedOrders = {};
    if (allPendingOrders != null && allPendingOrders !== undefined && allPendingOrders.length > 0) {
      for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
        let orderInternalId = allPendingOrders[orIndex][1];
        let orderName = allPendingOrders[orIndex][0];
        if (StringUtils.containsIgnoreCase(orderName, "shipment")) {
          // Hit release activation in case order is in entering state
          await tapis.processReleaseActivation(apicfg, orderInternalId);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);

          let res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(dbcfg, orderInternalId);
          // Hit shipment order completion
          await tapis.processShipmentOrder(apicfg, res.shipmentOrderNumber, res.purchaseeOrderNumber);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);

          allnonprocessedOrders.ordersnotprocessed = await du.select(
            dbcfg,
            dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(dbcfg, customerId)
          );
        }
      }
    }

    storeOutputToDataSetResult(caseResult, datasetindex, allnonprocessedOrders);

    let service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-services-active");
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();
      await CsrDesktopPage.searchCustomerForEmail(dr.getDataSetKeyValue(dsObj, "input", "email"));
      await CsrDesktopPage.clickOnServiceslink();
      let servicePlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
      let isActive = await AccountPage.validateStatusIsActiveForGivenService(servicePlan);

      expect(isActive).not.toBeNull();
      expect(isActive).not.toBeUndefined();
      expect(isActive).toBeTruthy();
    }

    imgPath = await sel.captureScreenshot(testId + "-ds-" + datasetindex + "-PASS");
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    //await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    caseResult.datasets[datasetindex].error = err;
    imgPath = await sel.captureScreenshot(testId + "-ds-" + datasetindex + "-FAIL");
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}

/**
 * @param {TestCaseResultObject} cr
 * @param {Object} objToSave
 */
function storeOutputToDataSetResult(cr, datasetindex, objToSave) {
  logger.enterMethod(`Object provided to save: ${JSON.stringify(objToSave)}`);
  try {
    if (objToSave == null || objToSave === undefined || JSON.stringify(objToSave) == "{}") {
      logger.exitMethod("Nothing provided to store as OUTPUT in data-set result");
      return;
    }

    let objKeys = Object.keys(objToSave);
    let objVals = Object.values(objToSave);

    for (let index = 0; index < objKeys.length; index++) {
      cr.datasets[datasetindex].response[objKeys[index]] = objVals[index];
    }
  } catch (err) {
    logger.error(err);
  }
  logger.debug(`Response stored: ${JSON.stringify(cr.datasets[datasetindex].response)}`);
  logger.exitMethod(`Case Resulte so far: ${JSON.stringify(cr)}`);
}
