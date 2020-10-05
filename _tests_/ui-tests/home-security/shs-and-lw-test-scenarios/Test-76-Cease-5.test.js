/**
 * @group allTests
 * @group shs-lw-tests
 * @group cease-tests
 * @group provide8
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

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const ManageServicesPage = require("../../../../src/pages/home-security/ManageServicesPage");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.cease5TestId;
const valFile = "shs-and-lw-test-scenarios";

const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);

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
describe("Cease5: SHS and LW Test Scenarios", () => {
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

  const testName = "Cease5: SHS & LW Test Scenarios";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Cease-5");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Cease-5");
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
          return await stepsCease5(dsObj, index)
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

async function stepsCease5(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  try {
    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    const provide1Email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide8SSHLWTech
    ).request.email;
    await CsrDesktopPage.searchCustomerForEmail(provide1Email);

    await CsrDesktopPage.clickOnServiceslink();

    await AccountPage.clickonManageServiceStatus();

    const servicename = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide8SSHLWTech
    ).request.shsserviceplan;
    await ManageServicesPage.checkServiceCheckbox(servicename);

    await ManageServicesPage.clickOnCease();

    await ManageServicesPage.selectCeaseReasonAndConfirm(
      "Move out of province"
    );

    await ManageServicesPage.selectImmediateCeaseAndSubmit();

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
    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();
    const order = await SubmitSuccessPage.verifyThanksMessageOnly();
    expect(order.successMessage).not.toBeNull();
    expect(order.successMessage).not.toBeUndefined();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, order);

    const provide8customerID = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide8SSHLWTech
    ).response.customerId;

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-be-time-zone"
    );
    if (isValEnabled) {
      logger.debug(
        `Validating no error occured on NetCracker BE for timezone of ${order}`
      );
      const customerErrors = await du.getErrorsOccuredForCustomer(
        dbcfg,
        provide8customerID
      );
      expect(customerErrors).not.toBeNull();
      expect(customerErrors).not.toBeUndefined();
      expect(customerErrors.length > 0).toBeFalsy();
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        customerErrors
      );
    }
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-order-completed"
    );
    if (isValEnabled) {
      logger.debug("Fetching customer's all pending order item's status");
      const pendingorders = await du.select(
        dbcfg,
        dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
          dbcfg,
          provide8customerID
        )
      );
      logger.debug(
        `Pending Orders' statuses: ${JSON.stringify(pendingorders)}`
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
    caseResult.datasets[datasetindex].error = err;
    const imgPath = await sel.captureScreenshot(
      `${testId}-ds-${datasetindex}-FAIL`
    );
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}
