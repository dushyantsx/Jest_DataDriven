/* eslint-disable no-unused-vars */
/**
 * @group allTests
 * @group shs-lw-tests
 * @group provide-tests
 * @group otherproducts-tests
 * @group otherproducts1
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
const CreateCustomerPage = require("../../../../src/pages/home-security/CreateCustomerPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const ShippingDetailsPage = require("../../../../src/pages/home-security/ShippingDetailsPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const RulesPopup = require("../../../../src/pages/home-security/RulesPopup");
const EmergencyContactPage = require("../../../../src/pages/home-security/EmergencyContactPage");
const PermitPage = require("../../../../src/pages/home-security/PermitPage");
const CustomizePage = require("../../../../src/pages/home-security/CustomizePage");
const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");
const AdcApis = require("../../../../src/utils/telus-apis/AdcApis");
const BillingInformationPage = require("../../../../src/pages/home-security/BillingInformationPage");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();

const adcapis = new AdcApis();
const testId = TestIdsMap.provide14TestID;
const valFile = "shs-and-lw-test-scenarios";

const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);
const apicfg = config.getTelusApisConfig(envcfg);
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
describe("Provide-14: SHS, LW, Internet, tv and phone", () => {
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

  const testName = "provide-14: SHS, LW, Internet, tv and phone";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll provide-14");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll provide-1");
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
          return await stepsProvide14(dsObj, index)
            .then((v) => {
              logger.result(`Test result for data-set-${index + 1}: ${v}`);
              logger.exitMethod(`Test finished for data-set-${index + 1}`);
              done();
            })
            .catch((ex) => {
              logger.error(`Test error for data-set-${index + 1}: ${ex}`);
              throw ex;
              //done();
            });
        }
        return (async () => {
          caseResult.datasets[index].result = TestResultStatus.Skipped;
          logger.exitMethod(
            `Test finished as skipped for data-set-${index + 1}`
          );
          pending();
          //return "success";
        })(); //.then(done());
      }); // test block ending
    }); // for loop ending
  }); // inner describe block ending
}); // describe block ending

async function stepsProvide14(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;
  let workOrderNumber;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  try {
    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    await sel.getJsUtils().isPageLoaded();

    await CsrDesktopPage.clickCheckAddress();

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

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-address"
    );
    if (isValEnabled) {
      logger.debug(`Querying city name from db for ${output.city.itemid}`);
      const cityDb = await du.getValue(
        dbcfg,
        dq.queryNcObjectNameOnId(dbcfg, output.city.itemid)
      );
      logger.debug(`Validating city ${cityDb} with ${ct}`);
      expect(cityDb).not.toBeNull();
      expect(cityDb).not.toBeUndefined();
      expect(StringUtils.containsIgnoreCase(cityDb, ct)).toBeTruthy();

      logger.debug(`Validating province ${output.province} with ${prv}`);
      expect(StringUtils.containsIgnoreCase(output.province, prv)).toBeTruthy();

      logger.debug(`Validating address ${output.address.text} with ${adr}`);
      expect(
        StringUtils.containsIgnoreCase(output.address.text, adr)
      ).toBeTruthy();

      logger.debug(`Querying address from db for ${output.address.rel.id}`);
      const addressDb = await du.getValue(
        dbcfg,
        dq.queryCompleteAddress(dbcfg, output.address.rel.id)
      );
      // expect(addressDb).not.toBeNull();
      logger.debug(
        `Validating db-address ${addressDb} for city ${ct} and province ${prv}`
      );
      TestResult.storeOutputToDataSetResult(caseResult, datasetindex, cityDb);
      logger.info();
    }

    await CreateCustomerPage.verifyServiceAvailability(
      dr.getDataSetKeyValue(dsObj, "input", "services-available")
    );

    await CreateCustomerPage.clickNextForCheckedAddress();

    await sel.getJsUtils().isPageLoaded();

    await CreateCustomerPage.proceedToCustomerCreation();

    await CreateCustomerPage.createNewCustomer(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "lastname"),
      dr.getDataSetKeyValue(dsObj, "input", "email")
    );

    await sel.getJsUtils().isPageLoaded();

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

    const allAvailsAndSelected = [];

    /************************  Add Internet Products *************************************** */

    const internetService = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "internetservice"
    );
    const internetPlan = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "internetproductoffering"
    );

    await SelectServicesPage.selectServices(internetService);
    await SelectServicesPage.selectNotIntoCommitments();
    await SelectServicesPage.selectPlan(internetPlan);

    /************************  Add SHS Products *************************************** */

    let availsAndSelected = await SelectServicesPage.selectServicesCommitmentPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "shsservices"),
      dr.getDataSetKeyValue(dsObj, "input", "shsservicecommitments"),
      dr.getDataSetKeyValue(dsObj, "input", "shsserviceplan"),
      dr.getDataSetKeyValue(dsObj, "input", "shsserviceprovider")
    );
    allAvailsAndSelected.push(availsAndSelected);
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      allAvailsAndSelected
    );
    logger.result(
      `There were available services ${JSON.stringify(allAvailsAndSelected)}`
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
      const expectedplan = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "shsserviceplan"
      );
      // let expectedEquipment =  dr.getDataSetKeyValue(dsObj,"expected","Equipment");
    }

    /************************  Add TV Products *************************************** */

    const tvService = dr.getDataSetKeyValue(dsObj, "input", "tvservices");
    const tvProductType = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "tvproducttype"
    );
    const tvProductPackage = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "tvproductpackage"
    );
    const tvPackageSecondary = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "tvpackagesecondary"
    );

    await SelectServicesPage.selectServices(tvService);
    await SelectServicesPage.selectProductType(tvProductType);
    await SelectServicesPage.selectProductOffering(tvProductPackage);
    await SelectServicesPage.selectVerticallyProductOffering(
      tvPackageSecondary
    );

    /************************  Add Phone Products *************************************** */

    const phoneService = dr.getDataSetKeyValue(dsObj, "input", "PhoneService");
    const phoneProduct = dr.getDataSetKeyValue(dsObj, "input", "phoneType");

    await SelectServicesPage.selectServices(phoneService);
    await SelectServicesPage.selectVerticallyProductOffering(phoneProduct);

    /************************  Living Well Products *************************************** */

    const livingWellService = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "LivingWellService"
    );
    const lwProduct = dr.getDataSetKeyValue(dsObj, "input", "LivingProduct");

    await SelectServicesPage.selectServices(livingWellService);
    await SelectServicesPage.selectVerticallyProductOffering(lwProduct);

    await sel.getJsUtils().isPageLoaded();

    await SelectServicesPage.clickNextButton();

    await sel.getJsUtils().isPageLoaded();

    await CustomizePage.clickNextButton();

    await sel.getJsUtils().isPageLoaded();

    await EquipmentPage.clickOnNextButton();

    await sel.getJsUtils().isPageLoaded();

    await EquipmentPage.clickOnNextButton();

    await sel.getJsUtils().isPageLoaded();
    try {
      await CustomizePage.completePhnOptions(
        dr.getDataSetKeyValue(dsObj, "input", "PhoneOption")
      );
    } catch (err) {
      await CustomizePage.clickTVNextButton();
      await CustomizePage.completePhnOptions(
        dr.getDataSetKeyValue(dsObj, "input", "PhoneOption")
      );
    }

    await sel.getJsUtils().isPageLoaded();

    await CustomizePage.numberToAppearInPhoneBook(
      "Your name and number will not be listed anywhere"
    );

    await CustomizePage.clickTVNextButton();

    await sel.getJsUtils().isPageLoaded();

    await EquipmentPage.clickOnNextButton();

    const allequipments = [];

    await EquipmentPage.completeTVSection("1");

    await sel.getJsUtils().isPageLoaded();

    //await RulesPopup.clickOnConfirm();

    await EquipmentPage.clickOnNextButton();

    let deliveryMethod = "Tech";
    let equipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      deliveryMethod,
      true
    );

    deliveryMethod = "Tech";

    equipments = await EquipmentPage.completeLivingWellSectionOnDefaults(
      deliveryMethod
    );
    await sel.getJsUtils().isPageLoaded();

    await EquipmentPage.completeAddOnEquipmentSectionOnDefaults();

    try {
      const msg2 = await RulesPopup.clickonMultiplepopups("2");
    } catch (err) {
      await RulesPopup.clickOnContinueWithOrder();
    }

    let steps = [];
    steps = await EquipmentPage.getOrderSteps();

    if (StringUtils.containsIgnoreCaseAny(steps, "security information")) {
      await EmergencyContactPage.enterSitePhoneNumber(
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
      );

      await EmergencyContactPage.addEmergencyContact(
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
      );

      await EmergencyContactPage.clickNextButton();

      const permit = await PermitPage.validatePermitSectionIsAvailable();
      isValEnabled = tval.isValidationEnabled(
        valFile,
        testId,
        "validate-permit-active"
      );
      if (isValEnabled) {
        logger.result(`No option to add any additional equipment`);

        expect(permit).not.toBeNull();
        expect(permit).not.toBeUndefined();
        expect(permit).toBeTruthy();
      }
      await PermitPage.enterPermitNumber();

      await PermitPage.enterExpiryDate();

      await PermitPage.clickNextButton();
    }
    await AppointmentPage.submitAnyAvailableAppointment(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber"),
      dr.getDataSetKeyValue(dsObj, "input", "additionalinfo")
    );

    /* await CheckoutPage.applyPromoCode(
         dr.getDataSetKeyValue(dsObj, "input", "couponcode")
     );*/

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

    await sel.getJsUtils().isPageLoaded();

    await CheckoutPage.checkEmailcheckbox();

    await CheckoutPage.acceptTermsSafelyAndMoveToNext();

    await ShippingDetailsPage.clickSimpleSwitch();

    await ShippingDetailsPage.clickSubmitButton();

    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    await sel.getJsUtils().isPageLoaded();

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
        "validate-order-submission"
      );
      if (isValEnabled) {
        logger.debug(
          `Validating order submission by querying NetCracker BE for order number ${output.orderNumber} by validating if this order exists for registered customer`
        );
        expect(customerId).not.toBeNull();
        expect(customerId).not.toBeUndefined();
      }

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

      const pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(
        dbcfg,
        customerId
      );
      for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
        //let orderInternalId = pendingWorkOrders[orIndex][1];
        workOrderNumber = pendingWorkOrders[orIndex][0];
        const workOrderName = pendingWorkOrders[orIndex][2];
        if (StringUtils.containsIgnoreCase(workOrderName, "work order")) {
          // Hit release activation in case order is in entering state
          await tapis.processReleaseActivation(apicfg, workOrderNumber);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);

          // Hit work order completion
          await tapis.processWorkOrder(apicfg, workOrderNumber);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);
        }
      }

      logger.debug("Fetching customer's all order item's status");
      const allOrdersStatus = await du.select(
        dbcfg,
        dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
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
      const allcustomerOrdStatus = { allOrdersStatus, allPendingOrders };
      allcustomerOrdStatus.allOrdersStatus = allOrdersStatus;
      allcustomerOrdStatus.allPendingOrders = allPendingOrders;

      logger.debug(
        `Order's statuses till now: ${JSON.stringify(allcustomerOrdStatus)}`
      );
      // storeOutputToDataSetResult(caseResult, datasetindex, allcustomerOrdStatus);

      const customererr = await du.getErrorsOccuredForCustomer(
        dbcfg,
        customerId
      );
      const custErrors = { customererr };
      custErrors.customererr = customererr;
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        custErrors
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

            const res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
              dbcfg,
              orderInternalId
            );
            // Hit shipment order completion
            await tapis.processShipmentOrder(
              apicfg,
              res.shipmentOrderNumber,
              res.purchaseeOrderNumber
            );
            // Wait for 10 seconds to get completed
            await sel.getWaitUtils().sleep(10000);

            const ordersnotprocessed = await du.select(
              dbcfg,
              dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
                dbcfg,
                customerId
              )
            );
            const allnonprocessedOrders = { ordersnotprocessed };
            TestResult.storeOutputToDataSetResult(
              caseResult,
              datasetindex,
              allnonprocessedOrders
            );
          }
        }
      }

      if (
        allPendingOrders != null &&
        allPendingOrders !== undefined &&
        allPendingOrders.length > 0
      ) {
        for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
          const orderInternalId = allPendingOrders[orIndex][1];
          const orderName = allPendingOrders[orIndex][0];
          if (StringUtils.containsIgnoreCase(orderName, "Home Phone")) {
            // Hit release activation in case order is in entering state
            // Wait for 10 seconds to get completed
            await sel.getWaitUtils().sleep(10000);

            const res = await du.getValidateTaskNumber(dbcfg, orderInternalId);
            // Hit shipment order completion
            await tapis.processHoldOrderTask(apicfg, res);
            // Wait for 10 seconds to get completed
            await sel.getWaitUtils().sleep(10000);
          }
        }
      }
    }

    const service = dr.getDataSetKeyValue(dsObj, "input", "LivingProduct");
    // isValEnabled = tval.isValidationEnabled(
    //   valFile,
    //   testId,
    //   "validate-services-active"
    // );
    // if (isValEnabled) {
    logger.debug(`Validating service [${service}] is active or not`);

    await SubmitSuccessPage.clickComplete();
    await CsrDesktopPage.searchCustomerForEmail(
      dr.getDataSetKeyValue(dsObj, "input", "email")
    );
    await CsrDesktopPage.clickOnServiceslink();
    const isActive = {};
    isActive.livingWellService = await AccountPage.validateStatusIsActiveForGivenService(
      service
    );

    let servicePlan = dr.getDataSetKeyValue(dsObj, "input", "phoneType");
    isActive.phoneService = await AccountPage.validateStatusIsActiveForGivenService(
      servicePlan
    );
    servicePlan = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "internetproductoffering"
    );
    isActive.tvService = await AccountPage.validateStatusIsActiveForGivenService(
      servicePlan
    );
    const status = `Active banner is displayed:${isActive}`;
    const activesymbol = { status };
    activesymbol.status = status;
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      activesymbol
    );

    expect(isActive).not.toBeNull();
    expect(isActive).not.toBeUndefined();
    expect(isActive).toBeTruthy();
    // }
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
    const imgPath = sel.captureScreenshot(`${testId}-ds-${datasetindex}-FAIL`);
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}
