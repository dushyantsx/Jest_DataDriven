/**
 * @group allTests
 * @group shs-lw-tests
 * @group change-tests
 * @group change3
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

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const SelectServicesPage = require("../../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const ManageServicesPage = require("../../../../src/pages/home-security/ManageServicesPage");
const PermitPage = require("../../../../src/pages/home-security/PermitPage");
const RulesPopup = require("../../../../src/pages/home-security/RulesPopup");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const testId = TestIdsMap.change3TestID;
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
describe("SHS and LW Test Scenarios", () => {
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

  const testName = "Change-3: Upgrade Package";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Change-3");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Change-3");
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
          return await stepsChange3(dsObj, index)
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

async function stepsChange3(dsObj, datasetindex) {
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

    const provide2Email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide2TestId
    ).request.email;
    await CsrDesktopPage.searchCustomerForEmail(provide2Email);

    //    provide_two_4841646@telus.com
    await CsrDesktopPage.clickOnServiceslink();

    await ManageServicesPage.clickChangeonService("Control");

    await SelectServicesPage.selectCommitments(
      dr.getDataSetKeyValue(dsObj, "input", "commitments")
    );

    await SelectServicesPage.selectPlan(
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan")
    );

    await SelectServicesPage.clickNextButton();

    const sPlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");

    if (!StringUtils.containsIgnoreCase(sPlan, "secure")) {
      const youpickequipment = await EquipmentPage.completeYouPickSectionOnDefaults();
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        youpickequipment
      );

      logger.result(`Default equipments are selected `);
    }

    const homesecurityequipment = await EquipmentPage.completeHomeSecuritySectionOnDefaults();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      homesecurityequipment
    );

    const addonequipment = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      addonequipment
    );

    await RulesPopup.clickOnContinueWithOrder();

    let steps = [];
    steps = await EquipmentPage.getOrderSteps();
    if (StringUtils.containsIgnoreCaseAny(steps, "security information")) {
      await PermitPage.enterPermitNumber();

      await PermitPage.validatePermitSectionIsAvailable();

      await PermitPage.enterExpiryDate();

      await PermitPage.clickNextButton();
    }

    //await AppointmentPage.clickonSelectedService();

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
      expect(StringUtils.equalsIgnoreCase(tax, tax)).toBeTruthy();
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
      expect(StringUtils.equalsIgnoreCase(cost, costToValidate)).toBeTruthy();
    }

    await CheckoutPage.acceptTermsSafelyAndMoveToNext();

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
    }

    const output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
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
