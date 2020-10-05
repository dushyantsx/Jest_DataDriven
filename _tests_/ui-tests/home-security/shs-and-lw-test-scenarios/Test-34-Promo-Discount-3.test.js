/**
 * @group allTests
 * @group shs-lw-tests
 * @group change-tests
 * @group change7
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

const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const {
  ManageServicesPage,
  EquipmentPage,
  AppointmentPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const testId = TestIdsMap.promo3TestID;

const envcfg = config.getConfigForGivenEnv();

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
describe("PROMO3: Promo/Discount-3 Add promo code Control + VIdeo Equip 60", () => {
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
    "Promo-3: Promo/Discount-3 Add promo code Control + VIdeo Equip 60";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Promo-3");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Promo-3");
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
          return await stepsPromo3(dsObj, index)
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

async function stepsPromo3(dsObj, datasetindex) {
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

    const provide4plan = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide4TestId
    ).request.serviceplan;
    await CsrDesktopPage.searchCustomerForEmail(provide4Email);

    await CsrDesktopPage.clickOnServiceslink();

    await ManageServicesPage.clickEquipmentonService(provide4plan);

    await EquipmentPage.clickOnNextButton();

    await EquipmentPage.clickOnAddEquipment("4-Button Key Ring Remote");
    await EquipmentPage.clickOnAddEquipment("Smart Plug - Appliance");
    await EquipmentPage.clickOnAddEquipment("Smart Plug - Lamp");

    await EquipmentPage.completeHomeSecuritySectionOnDefaults();

    await AppointmentPage.submitAnyAvailableAppointment();

    await CheckoutPage.applyPromoCode("Equip60");

    const discounts = CheckoutPage.getDiscountNames();
    StringUtils.containsIgnoreCaseAny(
      JSON.stringify(discounts),
      "Free Equipment Promotion - $60"
    );
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, discounts);
    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

    const output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    const imgPath = await sel.captureScreenshot(
      `${testId}-ds-${datasetindex}-Pass`
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
