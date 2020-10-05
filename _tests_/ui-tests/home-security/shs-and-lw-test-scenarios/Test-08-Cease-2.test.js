/**
 * @group allTests
 * @group shs-lw-tests
 * @group cease-tests
 * @group testcease2
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

const eu = new excelUtils();
const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.cease2TestId;
const valFile = "shs-and-lw-test-scenarios";

let envcfg = config.getConfigForGivenEnv();
let dbcfg = config.getDbConfig(envcfg);
let apicfg = config.getTelusApisConfig(envcfg);

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
var sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(configDataAsset.dataFile, configDataAsset.dataSheet);
console.table(sheetDataAsJsonArray);

/**
 * @type TestCaseResultObject
 */
let caseResult;
describe("Cease2: SHS & LW Test Scenarios", () => {
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

  let testName = "Cease-2: Future Date Cease";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Cease-2");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Cease-2");
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
          return await stepsCease2(dsObj, index)
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

async function stepsCease2(dsObj, datasetindex) {
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

    let provide2Email = config.getFirstTestDataAssetResultsForGivenTestId(TestIdsMap.provide2TestId).request["email"];

    await CsrDesktopPage.searchCustomerForEmail(provide2Email);

    let move3City = config.getFirstTestDataAssetResultsForGivenTestId(TestIdsMap.move3TestId).request["city"];

    await CsrDesktopPage.clickCityRadioButton(move3City);

    await CsrDesktopPage.clickOnServiceslink();

    await AccountPage.clickonManageServiceStatus();

    await ManageServicesPage.checkServiceCheckbox(dr.getDataSetKeyValue(dsObj, "input", "serviceplan"));

    await ManageServicesPage.clickOnCease();

    await ManageServicesPage.selectCeaseReasonAndConfirm("Move out of province");

    await ManageServicesPage.selectFutureDateCeaseAndSubmit();

    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

    let cost = await CheckoutPage.getDueMonthlyBeforeTaxMatching();
    storeOutputToDataSetResult(caseResult, datasetindex, cost);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-cost");
    if (isValEnabled) {
      let costToValidate = dr.getDataSetKeyValue(dsObj, "expected", "costtovalidate");
      logger.debug(`Validating cost ${cost} with ${costToValidate}`);
      expect(StringUtils.equalsIgnoreCase(cost.amount, costToValidate)).toBeTruthy();
    }

    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    await SubmitSuccessPage.verifyThanksMessageOnly();

    imgPath = await sel.captureScreenshot(testId + "-ds-" + datasetindex + "-PASS");

    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    // isValEnabled = tval.isValidationEnabled(
    //   valFile,
    //   testId,
    //   "validate-order-submission"
    // );
    // if (isValEnabled) {
    //   logger.debug(
    //     `Validating order submission by getting order number generated from Agent portal`
    //   );
    //   expect(output).not.toBeNull();
    //   expect(output).not.toBeUndefined();

    //   expect(output.orderNumber).not.toBeNull();
    //   expect(output.orderNumber).not.toBeUndefined();
    // }

    // let ordersStatuses = {};
    // logger.debug("Fetching customer's internal id");
    // let customerId = await du.getValue(
    //   dbcfg,
    //   dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg,output.orderNumber)
    // );
    // logger.debug(`Customer's internal id: ${customerId}`);
    // ordersStatuses.customerId = customerId;
    // logger.debug(
    //   `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    // );

    // isValEnabled = tval.isValidationEnabled(
    //   valFile,
    //   testId,
    //   "validate-order-submission"
    // );
    // if (isValEnabled) {
    //   logger.debug(
    //     `Validating order submission by querying NetCracker BE for order number ${output.orderNumber} by validating if this order exists for registered customer`
    //   );
    //   expect(customerId).not.toBeNull();
    //   expect(customerId).not.toBeUndefined();
    // }

    // isValEnabled = tval.isValidationEnabled(
    //   valFile,
    //   testId,
    //   "validate-be-time-zone"
    // );
    // if (isValEnabled) {
    //   logger.debug(
    //     `Validating no error occured on NetCracker BE for timezone of ${output.orderNumber}`
    //   );
    //   let customerErrors = await du.getErrorsOccuredForCustomer(
    //     dbcfg,
    //     customerId
    //   );
    //   expect(customerErrors).not.toBeNull();
    //   expect(customerErrors).not.toBeUndefined();
    //   expect(customerErrors.length > 0).toBeFalsy();
    // }

    // logger.debug("Fetching customer's all order item's status");
    // let allOrdersStatus = await du.select(
    //   dbcfg,
    //   dq.queryNcCustomerOrdersStatus(customerId)
    // );
    // logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    // ordersStatuses.allOrdersStatus = allOrdersStatus;
    // logger.debug(
    //   `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    // );

    // logger.debug("Fetching customer's all pending order item's status");
    // let allPendingOrders = await du.select(
    //   dbcfg,
    //   dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(dbcfg,customerId)
    // );
    // logger.debug(
    //   `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
    // );
    // ordersStatuses.allPendingOrders = allPendingOrders;
    // logger.debug(
    //   `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    // );
    // storeOutputToDataSetResult(caseResult, datasetindex, ordersStatuses);
    // expect(allPendingOrders.length == 0).toBeTruthy();

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
  logger.enterMethod();
  if (objToSave == null || objToSave === undefined || JSON.stringify(objToSave) == "{}") {
    logger.exitMethod("Nothing provided to store as OUTPUT in data-set result");
    return;
  }

  let objKeys = Object.keys(objToSave);
  let objVals = Object.values(objToSave);

  for (let index = 0; index < objKeys.length; index++) {
    cr.datasets[datasetindex].response[objKeys[index]] = objVals[index];
  }
  logger.exitMethod(JSON.stringify(cr));
}
