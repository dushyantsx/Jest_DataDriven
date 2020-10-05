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
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const ManageServicesPage = require("../../../../src/pages/home-security/ManageServicesPage");
const {
  BillingInformationPage,
  SubmitSuccessPage,
} = require("../../../../src/pages/home-security");

const StringUtils = require("../../../../src/utils/common/StringUtils");
const AdcApiUtils = require("../../../../src/utils/telus-apis/AdcApis");
const XmlParser = require("../../../../src/utils/common/XmlParser");

const tval = new Validator();
const eu = new ExcelUtils();
const dr = new DataReader();
const testId = TestIdsMap.amend2TestID;

const adcapis = new AdcApiUtils();
const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);
const adcfg = config.getAdcApisConfig(envcfg);
const valFile = "shs-and-lw-test-scenarios";
logger.info("readingenvconfig");
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
describe("Ammend2: Partial Cancel LW order", () => {
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

  const testName = "Ammend2: Partial Cancel LW order";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Amend-2");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Amend-2");
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
          return await stepsAmend2(dsObj, index)
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

async function stepsAmend2(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  try {
    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    const provide4Email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide4TestId
    ).request.email;
    await CsrDesktopPage.searchCustomerForEmail(provide4Email);

    await CsrDesktopPage.clickOnServiceslink();

    await AccountPage.selectManageMyOrderTab();

    await ManageServicesPage.clickOnServiceCheckboxandSelectCancel();

    await ManageServicesPage.selectCancellationReason("Cancel - Test Order");

    await ManageServicesPage.clickonConfirmReason();

    await ManageServicesPage.clickConfirmButton();

    await BillingInformationPage.clickSubmitButton();

    const output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    let isValEnabled = tval.isValidationEnabled(valFile, testId, "end-to-end");
    if (isValEnabled) {
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
        TestResult.storeOutputToDataSetResult(
          caseResult,
          datasetindex,
          customerErrors
        );
        expect(customerErrors).not.toBeNull();
        expect(customerErrors).not.toBeUndefined();
      }
      let workOrderNumber;
      const pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(
        dbcfg,
        customerId
      );
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        pendingWorkOrders
      );
      for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
        //let orderInternalId = pendingWorkOrders[orIndex][1];
        workOrderNumber = pendingWorkOrders[orIndex][0];
        const workOrderName = pendingWorkOrders[orIndex][2];
        logger.info(workOrderName);
      }

      const dstdetail = await adcapis.getDSTInfo(adcfg, workOrderNumber);
      const parseddst = await XmlParser.getDatafromXml(dstdetail);
      let dstdetails = {};
      dstdetails = { parseddst };
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        dstdetails
      );
      isValEnabled = tval.isValidationEnabled(valFile, testId, "Dst-Details");
      if (isValEnabled) {
        expect(parseddst).not.toBeNull();
        expect(parseddst).not.toBeUndefined();

        const desc = XmlParser.getDescriptionInfoFromDst(parseddst);

        const plan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
        expect(StringUtils.containsIgnoreCaseAny(desc, plan)).toBeTruthy();

        const commitment = dr.getDataSetKeyValue(dsObj, "input", "commitments");
        expect(
          StringUtils.containsIgnoreCaseAny(desc, commitment)
        ).toBeTruthy();
      }
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
