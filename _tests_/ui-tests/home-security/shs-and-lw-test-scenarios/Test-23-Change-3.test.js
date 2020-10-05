/**
 * @group allTests
 * @group shs-lw-tests
 * @group change-tests
 * @group change3/provi
 * @group provide3
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
const AdcApis = require("../../../../src/utils/telus-apis/AdcApis");

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
const RulesPopup = require("../../../../src/pages/home-security/RulesPopup");
const { ManageServicesPage } = require("../../../../src/pages/home-security");
const XmlParser = require("../../../../src/utils/common/XmlParser");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const adcapis = new AdcApis();
const testId = TestIdsMap.change3TestId;
const valFile = "shs-and-lw-test-scenarios";

const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);
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
describe("CHANGE3: ADT to Smart Automation", () => {
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

  const testName = "Change-3: ADT to Smart Automation";
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

    const provide3Email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide3migratedTestId
    ).request.email;
    const provide3service = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide3migratedTestId
    ).request.serviceplan;
    await CsrDesktopPage.searchCustomerForEmail(provide3Email);

    //    provide_two_4841646@telus.com
    await CsrDesktopPage.clickOnServiceslink();

    await ManageServicesPage.clickChangeonService(provide3service);

    await sel.getJsUtils().isPageLoaded();

    await SelectServicesPage.selectCommitments(
      dr.getDataSetKeyValue(dsObj, "input", "commitments")
    );
    try {
      await SelectServicesPage.clickSSHViewMore();
    } catch (err) {
      //Eating error if view more button is not displayed.
    }

    await SelectServicesPage.selectPlan(
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan")
    );

    await SelectServicesPage.clickNextButton();

    await sel.getJsUtils().isPageLoaded();

    const deliverymethod = "tech";
    const ypequipment = await EquipmentPage.completeYouPickSectionOnDefaults();
    expect(ypequipment).not.toBeNull();
    expect(ypequipment).not.toBeUndefined();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      ypequipment
    );

    await sel.getJsUtils().isPageLoaded();

    const hsequipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      deliverymethod
    );

    expect(hsequipments).not.toBeNull();
    expect(hsequipments).not.toBeUndefined();
    const expectedequip = dr.getDataSetKeyValue(
      dsObj,
      "expected",
      "includedequipment"
    );
    expect(
      StringUtils.containsIgnoreCaseAnyPosition(
        JSON.stringify(hsequipments.hsincludedEquipments),
        expectedequip
      )
    ).toBeTruthy();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      hsequipments
    );

    const addonEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults();
    expect(addonEquipments).not.toBeNull();
    expect(addonEquipments).not.toBeUndefined();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      addonEquipments
    );

    const popupmsg = RulesPopup.clickOnContinueWithOrder();
    const msgtoverify =
      "An Installation charge of $450 is applicable on this order. Do you want to continue?";
    expect(popupmsg).not.toBeNull();
    expect(popupmsg).not.toBeUndefined();
    expect((await popupmsg).msgtext).toContain(msgtoverify);

    await sel.getJsUtils().isPageLoaded();

    const duration = await AppointmentPage.submitAnyAvailableAppointment(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    );
    expect(duration.swtime).toContain(
      dr.getDataSetKeyValue(dsObj, "expected", "swttime")
    );
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
      expect(tax.appliedtax).toContain(taxToValidate);
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
      expect(cost.amount).toContain(costToValidate);
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
      expect(costtoday).toContain(costToValidate);
    }
    await CheckoutPage.acceptTermsSafelyAndMoveToNext();

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

    const customerErrors = await du.getErrorsOccuredForCustomer(
      dbcfg,
      customerId
    );
    expect(customerErrors).not.toBeNull();
    expect(customerErrors).not.toBeUndefined();

    const pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(
      dbcfg,
      customerId
    );

    let adcresponse = await adcapis.isCustomerAvailable(
      adcfg,
      dr.getDataSetKeyValue(dsObj, "input", "email")
    );
    adcresponse = JSON.stringify(adcresponse.text);
    const adcid = StringUtils.substringBetween(adcresponse, "<int>", "</int>");
    logger.info(adcid);
    const customerinfo = await adcapis.getCustomerInfo(adcfg, adcid);
    logger.info(customerinfo);

    const parsedadc = await XmlParser.getDatafromXml(customerinfo);
    let adcdetails = {};
    adcdetails = { parsedadc };
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, adcdetails);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "Adc-Details");
    if (isValEnabled) {
      expect(parsedadc).not.toBeNull();
      expect(parsedadc).not.toBeUndefined();

      const address = StringUtils.replaceAll(
        parsedadc.Body.GetCustomerInfo_V2Response.GetCustomerInfo_V2Result
          .InstallAddress.Street1 +
          parsedadc.Body.GetCustomerInfo_V2Response.InstallAddress.City +
          parsedadc.Body.GetCustomerInfo_V2Response.InstallAddress.State,
        " ",
        ""
      );
      const providedadd = StringUtils.replaceAll(
        dr.getDataSetKeyValue(dsObj, "input", "address-search"),
        ",",
        ""
      );
      const expectedadd = StringUtils.replaceAll(providedadd, " ", "");

      expect(address).toContain(expectedadd);
    }

    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, adcdetails);

    const dstdetail = await adcapis.getDSTInfo(adcfg, pendingWorkOrders);
    const parseddst = await XmlParser.getDatafromXml(dstdetail);
    let dstdetails = {};
    dstdetails = { parseddst };
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, dstdetails);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "Dst-Details");
    if (isValEnabled) {
      expect(parseddst).not.toBeNull();
      expect(parseddst).not.toBeUndefined();
      expect(
        parseddst.Body.getWorkOrderResponse.workOrder.estimatedDurationNum
      ).toEqual(
        StringUtils.replaceAll(
          dr.getDataSetKeyValue(dsObj, "expected", "swttime"),
          "[^a-zA-Z_]",
          ""
        )
      );
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

      const desc = XmlParser.getDescriptionInfoFromDst(parseddst);
      expect(
        StringUtils.containsIgnoreCaseAny(
          desc,
          dr.getDataSetKeyValue(dsObj, "expected", "dstequipments")
        )
      ).toBeTruthy();

      const plan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
      expect(StringUtils.containsIgnoreCaseAny(desc, plan)).toBeTruthy();

      const commitment = dr.getDataSetKeyValue(dsObj, "input", "commitments");
      expect(StringUtils.containsIgnoreCaseAny(desc, commitment)).toBeTruthy();
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
