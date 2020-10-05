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
const TestResult = require("../../../../src/globals/results/TestResult");
const { Validator } = require("../../../../src/globals/TestObjects");
const DbUtils = require("../../../../src/utils/dbutils/DbUtils");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const SelectServicesPage = require("../../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const RulesPopup = require("../../../../src/pages/home-security/RulesPopup");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.change4TestID;
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
describe("CHANGE4: Add SHS Equipments and add LW Companion Home", () => {
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

  const testName = "Change-4: Add SHS Equipments and add LW Companion Home";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Change-4");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Change-4");
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
          return await stepsChange4(dsObj, index)
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

async function stepsChange4(dsObj, datasetindex) {
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

    const provide4Email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide4TestId
    ).request.email;
    await CsrDesktopPage.searchCustomerForEmail(provide4Email);

    //    provide_two_4841646@telus.com
    await CsrDesktopPage.clickOnServiceslink();

    await AccountPage.clickOnAddService("LivingWell");

    await SelectServicesPage.selectServicesVerticalPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "services"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceprovider")
    );

    await EquipmentPage.clickOnAddEquipment("Door/Window Sensor");
    await EquipmentPage.clickOnAddEquipment("Smoke Sensor");
    await EquipmentPage.clickOnAddEquipment("Motion Sensor");
    await EquipmentPage.clickOnAddEquipment("Indoor Camera");
    await EquipmentPage.clickOnAddEquipment("Outdoor Camera");
    await EquipmentPage.clickOnAddEquipment("Doorbell Camera - Slimline");
    await EquipmentPage.clickOnAddEquipment("Doorbell Camera - Round");
    await EquipmentPage.clickOnAddEquipment("Carbon Monoxide Detector");
    await EquipmentPage.clickOnAddEquipment("Smart Thermostat");
    await EquipmentPage.clickOnAddEquipment("Secondary Touchscreen Keypad");
    await EquipmentPage.clickOnAddEquipment("Smart Garage Door Controller");
    await EquipmentPage.clickOnAddEquipment("Glass Break Sensor");
    await EquipmentPage.clickOnAddEquipment(
      "Smart Push Button Door Lock - Solid Brass"
    );
    await EquipmentPage.clickOnAddEquipment(
      "Smart Push Button Door Lock - Nickel Satin"
    );
    await EquipmentPage.clickOnAddEquipment(
      "Smart Push Button Door Lock - Venetian Bronze"
    );
    await EquipmentPage.clickOnAddEquipment("Flood Sensor");
    await EquipmentPage.clickOnAddEquipment("Smart Light Bulb - 60W");
    await EquipmentPage.clickOnAddEquipment("4-Button Key Ring Remote");
    await EquipmentPage.clickOnAddEquipment("Smart Plug - Appliance");
    await EquipmentPage.clickOnAddEquipment("Smart Plug - Lamp");

    const deliverymethod = "tech";

    await sel.getJsUtils().isPageLoaded();

    const hsequipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      deliverymethod
    );

    expect(hsequipments).not.toBeNull();
    expect(hsequipments).not.toBeUndefined();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      hsequipments
    );

    const lwequipments = await EquipmentPage.completeLivingWellSectionOnDefaults();
    expect(lwequipments).not.toBeNull();
    expect(lwequipments).not.toBeUndefined();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      lwequipments
    );

    const addonEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults();
    expect(addonEquipments).not.toBeNull();
    expect(addonEquipments).not.toBeUndefined();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      lwequipments
    );

    const popupmsg = RulesPopup.clickOnContinueWithOrder();
    const msgtoverify =
      "An Installation charge of $450 is applicable on this order. Do you want to continue?";
    expect(popupmsg).not.toBeNull();
    expect(popupmsg).not.toBeUndefined();
    expect((await popupmsg).msgtext).toContain(msgtoverify);

    const duration = await AppointmentPage.submitAnyAvailableAppointment(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    );
    expect(duration.swtime).toContain("6.5");
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, duration);

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
      expect(StringUtils.equalsIgnoreCase(taxToValidate, tax)).toBeTruthy();
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

    const costtoday = await CheckoutPage.getTotalPaymentToday();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, costtoday);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-cost");
    if (isValEnabled) {
      const costToValidate = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "totalduetoday"
      );
      logger.debug(`Validating cost ${cost} with ${costToValidate}`);
      expect(
        StringUtils.equalsIgnoreCase(costtoday, costToValidate)
      ).toBeTruthy();
    }
    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

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
