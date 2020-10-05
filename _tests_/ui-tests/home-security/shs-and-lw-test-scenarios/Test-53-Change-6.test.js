/**
 * @group allTests
 * @group shs-lw-tests
 * @group change-tests
 * @group change6
 * @group provide6
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
const DbUtils = require("../../../../src/utils/dbutils/DbUtils");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const {
  EquipmentPage,
  ManageServicesPage,
  CheckoutPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const testId = TestIdsMap.change6TestID;

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
describe("Change6:SHS remove and add Equipments", () => {
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

  const testName = "Change6:SHS remove and add Equipments";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Change-6");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Change-6");
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
          return await stepsChange6(dsObj, index)
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

async function stepsChange6(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();

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

    const provide6serviceplan = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide6TestID
    ).request.serviceplan;
    await CsrDesktopPage.searchCustomerForEmail(provide6Email);

    const move5city = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.move5TestID
    ).request.city;

    await CsrDesktopPage.clickCityRadioButton(move5city);

    await CsrDesktopPage.clickOnServiceslink();

    await ManageServicesPage.clickEquipmentonService(provide6serviceplan);

    // await ManageServicesPage.clickExpandServideDetailsandRemoveEquipment(
    //   provide6serviceplan,
    //   ""
    // );

    await EquipmentPage.completeYouPickSectionOnDefaults();

    await EquipmentPage.clickOnMinusEquipment("Indoor Camera");

    await EquipmentPage.clickOnMinusEquipment("Indoor Camera");

    await EquipmentPage.clickOnMinusEquipment("Indoor Camera");

    await EquipmentPage.clickOnMinusEquipment("Indoor Camera");

    await EquipmentPage.clickOnAddEquipment("4-Button Key Ring Remote");
    await EquipmentPage.clickOnAddEquipment("Smart Plug - Appliance");
    await EquipmentPage.clickOnAddEquipment("Smart Plug - Lamp");

    const deliverymethod = "tech";
    await EquipmentPage.completeHomeSecuritySectionOnDefaults(deliverymethod);

    logger.result(`Select Delivery method ${JSON.stringify(deliverymethod)}`);

    await AppointmentPage.submitAnyAvailableAppointment(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    );

    await sel.getJsUtils().isPageLoaded();

    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

    const output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;

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
