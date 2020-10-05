/**
 * @group provide9to13
 * @group provide-tests
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
const CreateCustomerPage = require("../../../../src/pages/home-security/CreateCustomerPage");
const SelectServicesPage = require("../../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const BillingInformationPage = require("../../../../src/pages/home-security/BillingInformationPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const RulesPopup = require("../../../../src/pages/home-security/RulesPopup");
const PermitPage = require("../../../../src/pages/home-security/PermitPage");
const {
  ShippingDetailsPage,
  CreditApprovalPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const testId = TestIdsMap.provideTENSHLWMAN;
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
describe("Provide 10: SHS (Smart automation and video) and LW (Livingwell Companion Go) Self Install", () => {
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
    "Provide 10: SHS (Smart automation and video) and LW (Livingwell Companion Go) Self Install";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Provide-10");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Provide-10");
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
          return await stepsProvide10SHSLW(dsObj, index)
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
async function stepsProvide10SHSLW(dsObj, datasetindex) {
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

    await CsrDesktopPage.clickCheckAddress();

    await sel.getJsUtils().isPageLoaded();

    const ct = dr.getDataSetKeyValue(dsObj, "input", "city");
    const prv = dr.getDataSetKeyValue(dsObj, "input", "province");
    const adr = dr.getDataSetKeyValue(dsObj, "input", "address-search");
    let output = await CreateCustomerPage.checkAddress(
      ct,
      dr.getDataSetKeyValue(dsObj, "input", "citylov"),
      prv,
      adr,
      dr.getDataSetKeyValue(dsObj, "input", "addresslov")
    );
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    await CreateCustomerPage.verifyServiceAvailability(
      dr.getDataSetKeyValue(dsObj, "input", "services-available")
    );

    await CreateCustomerPage.clickNextForCheckedAddress();
    await CreateCustomerPage.proceedToCustomerCreation();

    await CreateCustomerPage.createNewCustomer(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "lastname"),
      dr.getDataSetKeyValue(dsObj, "input", "email")
    );

    await CreateCustomerPage.continueWithSecureCreditCheck(
      dr.getDataSetKeyValue(dsObj, "input", "dobmonth"),
      dr.getDataSetKeyValue(dsObj, "input", "dobday"),
      dr.getDataSetKeyValue(dsObj, "input", "dobyear"),
      dr.getDataSetKeyValue(dsObj, "input", "province")
    );

    await CreateCustomerPage.fillDriverLicenseIdentityDetails(
      dr.getDataSetKeyValue(dsObj, "input", "driverlicense"),
      dr.getDataSetKeyValue(dsObj, "input", "province")
    );

    const customerRegistered = await CreateCustomerPage.authorizeAndValidate();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      customerRegistered
    );
    logger.result(`Customer registration successful: ${customerRegistered}`);

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-customer-registered"
    );
    if (isValEnabled) {
      logger.debug(`Validating customer-regristration`);
      expect(customerRegistered).toBeTruthy();
    }

    await sel.getWaitUtils().sleep(10000);

    let availsAndSelected = await SelectServicesPage.selectServicesCommitmentPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "shsservices"),
      dr.getDataSetKeyValue(dsObj, "input", "shsservicecommitments"),
      dr.getDataSetKeyValue(dsObj, "input", "shsserviceplan"),
      dr.getDataSetKeyValue(dsObj, "input", "shsserviceprovider")
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      availsAndSelected
    );
    logger.result(
      `There were available services ${JSON.stringify(availsAndSelected)}`
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-available-services"
    );
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
    }

    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();

      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        availsAndSelected
      );
      logger.result(
        `There were available services ${JSON.stringify(availsAndSelected)}`
      );
    }
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-available-services"
    );
    await sel.getJsUtils().isPageLoaded();
    availsAndSelected = await SelectServicesPage.selectServicesVerticalPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "lwservices"),
      dr.getDataSetKeyValue(dsObj, "input", "lwplan"),
      dr.getDataSetKeyValue(dsObj, "input", "lwserviceprovider")
    );

    TestResult.storeOutputToDataSetResult(availsAndSelected);

    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();

      const expectedlwprice = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "cartprice"
      );
      const expectedlwplan = dr.getDataSetKeyValue(dsObj, "expected", "lwplan");
      // let expectedEquipment =  dr.getDataSetKeyValue(dsObj,"expected","Equipment");

      expect(availsAndSelected.cartItems.cartPlan).toContain(expectedlwplan);
      expect(availsAndSelected.cartItems.cartPrice).toContain(expectedlwprice);
      // expect(ArrayUtils.equalsIgnoreCase());
    }

    const ypequipment = await EquipmentPage.completeYouPickSectionOnDefaults();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      ypequipment
    );
    const hsequipment = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      "self"
    );
    const expectedhseq = dr.getDataSetKeyValue(
      dsObj,
      "expected",
      "hsequipment"
    );
    expect(
      StringUtils.containsIgnoreCaseAnyPosition(
        hsequipment.hsincludedEquipments,
        expectedhseq
      )
    ).toBeTruthy();

    const lwequipment = await EquipmentPage.completeLivingWellSectionOnDefaults(
      "self"
    );
    const expectedlweq = dr.getDataSetKeyValue(
      dsObj,
      "expected",
      "lwequipment"
    );

    expect(
      StringUtils.containsIgnoreCaseAnyPosition(
        lwequipment.lwmyEquipments,
        expectedlweq
      )
    ).toBeTruthy();

    await EquipmentPage.completeAddOnEquipmentSectionOnDefaults();

    await RulesPopup.acceptRulesSafely();

    await sel.getJsUtils().isPageLoaded();

    await EquipmentPage.clickOnNextButton();

    await sel.getWaitUtils().waitForUrlToChangeTo("emergency_contact_lw");

    let steps = [];
    steps = await EquipmentPage.getCurrentOrderStep();
    if (StringUtils.containsIgnoreCaseAny(steps, "Security Information")) {
      await PermitPage.enterLWCustomerDetails(
        dr.getDataSetKeyValue(dsObj, "input", "firstname"),
        dr.getDataSetKeyValue(dsObj, "input", "lastname"),
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
      );

      await PermitPage.enterLWEmergencyDetails(
        dr.getDataSetKeyValue(dsObj, "input", "firstname"),
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber"),
        "2"
      );

      await PermitPage.clickNextButton();
    }

    const discounteditems = await CheckoutPage.getDiscountNames();
    expect(discounteditems).toContain("LWC Promo - -$10.00");

    await CheckoutPage.acceptTermsSafelyAndMoveToNext();

    await ShippingDetailsPage.fillupPhoneNumberAndSaveContactInfo(
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    );

    await ShippingDetailsPage.clickSubmitButton();

    await sel.getWaitUtils().waitForUrlToChangeTo("credit");
    const currentUrl = await sel.getCurrentUrl();
    if (StringUtils.containsIgnoreCase(currentUrl, "credit")) {
      await CreditApprovalPage.clickNextToCreditCheckResult();
    }

    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    isValEnabled = tval.isValidationEnabled(valFile, testId, "end-to-end");
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

      const ordersStatuses = {};
      logger.debug("Fetching customer's internal id");
      const customerId = await du.getValue(
        dbcfg,
        dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber)
      );
      logger.debug(`Customer's internal id: ${customerId}`);
      ordersStatuses.customerId = customerId;
      logger.debug(
        `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
      );
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
        expect(customerErrors).not.toBeNull();
        expect(customerErrors).not.toBeUndefined();
      }
      logger.debug("Completing manual tasks in case any");
      const manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
      if (!StringUtils.isEmpty(manualTaskId)) {
        const res = await tapis.processManualTask(apicfg, manualTaskId);
        logger.debug(
          `Manual task ${manualTaskId} completion status code: ${res.status}`
        );
      }

      logger.debug("Fetching customer's all order item's status");
      const allOrdersStatus = await du.select(
        dbcfg,
        dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
      );
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        allOrdersStatus
      );
      logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);

      logger.debug("Fetching customer's all pending order item's status");
      const allPendingOrders = await du.select(
        dbcfg,
        dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
          dbcfg,
          customerId
        )
      );
      logger.debug(
        `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
      );

      if (
        allPendingOrders != null &&
        allPendingOrders !== undefined &&
        allPendingOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
          const orderInternalId = allPendingOrders[orIndex][1];
          const orderName = allPendingOrders[orIndex][0];
          if (StringUtils.containsIgnoreCase(orderName, "shipment")) {
            // Hit release activation in case order is in entering state
            await tapis.processReleaseActivation(apicfg, orderInternalId);
            // Wait for 10 seconds to get completed
            await sel.getWaitUtils().sleep(10000);

            // Wait for 10 seconds to get completed
          }
        }
      }

      isValEnabled = tval.isValidationEnabled(
        valFile,
        testId,
        "validate-billing-task"
      );
      if (isValEnabled) {
        logger.debug(
          `Validating billing actions occured on NetCracker for customer ${customerId}`
        );
        const billingActionsStatus = await du.getBillingActionStatus(
          dbcfg,
          customerId
        );
        expect(billingActionsStatus).not.toBeNull();
        expect(billingActionsStatus).not.toBeUndefined();
        expect(billingActionsStatus.length > 0).toBeTruthy();
        logger.debug(
          `Validating no error occured on NetCracker for any billing task for customer ${customerId}`
        );
      }
      const customerErrors = await du.getErrorsOccuredForCustomer(
        dbcfg,
        customerId
      );
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        customerErrors
      );
    }
    const service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-services-active"
    );
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();
      await CsrDesktopPage.searchCustomerForEmail(
        dr.getDataSetKeyValue(dsObj, "input", "email")
      );
      await CsrDesktopPage.clickOnServiceslink();
      const servicePlan = dr.getDataSetKeyValue(
        dsObj,
        "input",
        "shsserviceplan"
      );
      const isActive = await AccountPage.validateStatusIsActiveForGivenService(
        servicePlan
      );

      expect(isActive).not.toBeNull();
      expect(isActive).not.toBeUndefined();
      expect(isActive).toBeTruthy();
    }

    const imgPath = await sel.captureScreenshot(
      `${testId}-ds-${datasetindex}-PASS`
    );
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
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
