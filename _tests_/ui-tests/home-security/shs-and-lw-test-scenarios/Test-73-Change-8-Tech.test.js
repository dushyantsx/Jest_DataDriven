/**
 * @group allTests
 * @group shs-lw-tests
 * @group change-tests
 * @group change8
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
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const ManageServicesPage = require("../../../../src/pages/home-security/ManageServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const {
  BillingInformationPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.change8TestId;
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
describe("Change- 8-Tech Test Scenarios", () => {
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

  const testName = "Change-8: Swap Equipment";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Change-8");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Change-8");
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
          return await stepsChange8(dsObj, index)
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

async function stepsChange8(dsObj, datasetindex) {
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

    const provide8Email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide8SSHLWTech
    ).request.email;

    const provide8serviceplan = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide8SSHLWTech
    ).request.shsserviceplan;
    await CsrDesktopPage.searchCustomerForEmail(provide8Email);

    const move7city = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.move7TestId
    ).request.city;

    await CsrDesktopPage.clickCityRadioButton(move7city);

    await CsrDesktopPage.clickOnServiceslink();

    await ManageServicesPage.clickEquipmentonService(provide8serviceplan);

    const ypequipments = await EquipmentPage.completeYouPickSectionOnDefaults();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      ypequipments
    );

    await EquipmentPage.clickSwapOnEquipment(
      dr.getDataSetKeyValue(dsObj, "input", "equipmenttoswap")
    );

    await EquipmentPage.selectEquipmentToSwap(
      dr.getDataSetKeyValue(dsObj, "input", "equipmenttoadd")
    );

    await EquipmentPage.selectReasonToSwapAndClickOk("Physical Damage");

    const swapequip = await EquipmentPage.getSwappedToEquipments();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, swapequip);
    expect(
      StringUtils.containsIgnoreCaseAny(
        JSON.stringify(swapequip),
        dr.getDataSetKeyValue(dsObj, "input", "equipmenttoadd")
      )
    ).toBeTruthy();
    await EquipmentPage.clickOnAddEquipment("Outdoor Camera");
    await EquipmentPage.clickOnAddEquipment("Outdoor Camera");
    await EquipmentPage.clickOnAddEquipment("Outdoor Camera");
    await EquipmentPage.clickOnAddEquipment("Doorbell Camera - Round");

    const equipment = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      "tech"
    );
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, equipment);

    await AppointmentPage.clickonSelectedService();

    await sel.getWaitUtils().waitForUrlToChangeTo("checkout");

    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

    await BillingInformationPage.clickSubmitButton();

    const output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
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

    logger.debug("Fetching customer's internal id");
    const customerId = await du.getValue(
      dbcfg,
      dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber)
    );
    const order = { customerId };
    order.customerId = customerId;
    logger.debug(`Customer's internal id: ${order.customerId}`);
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, order);

    const customererr = await du.getErrorsOccuredForCustomer(dbcfg, customerId);
    const custErrors = { customererr };
    custErrors.customererr = customererr;
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, custErrors);
    logger.info("going into ifblock for pending");

    const imgPath = await sel.captureScreenshot(
      `${testId}-ds-${datasetindex}-PASS`
    );
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    await sel.quit();
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
