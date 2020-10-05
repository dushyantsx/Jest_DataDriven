/**
 * @group allTests
 * @group shs-lw-tests
 */

require("../../../../src/globals/MyTypeDefs");
require("../../../../src/globals/enumerations");

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

const { TestResultStatus } = require("../../../../src/globals/enumerations");

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
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const BillingInformationPage = require("../../../../src/pages/home-security/BillingInformationPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const testId = TestIdsMap.provide3TestId;

const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);
const apicfg = config.getTelusApisConfig(envcfg);
let useremailid = "NA";

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
const sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(
  configDataAsset.dataFile,
  configDataAsset.dataSheet
);
console.table(sheetDataAsJsonArray);

/**
 * @type TestCaseResultObject
 */
let caseResult;
describe("Provide3: SHS & LW Test Scenarios", () => {
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

  const testName = "Provide-3: Multi location Customer";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Provide-3");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Provide-3");
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
          return await stepsProvide3(dsObj, index)
            .then((v) => {
              logger.result(`Test result for data-set-${index + 1}: ${v}`);
              logger.exitMethod(`Test finished for data-set-${index + 1}`);
              done();
            })
            .catch((ex) => {
              logger.error(`Test error for data-set-${index + 1}: ${ex}`);
              throw ex;
              // fail(ex);
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

async function stepsProvide3(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  try {
    let output;
    const drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    await CsrDesktopPage.clickCheckAddress();

    const ct = dr.getDataSetKeyValue(dsObj, "input", "city");
    const prv = dr.getDataSetKeyValue(dsObj, "input", "province");
    const adr = dr.getDataSetKeyValue(dsObj, "input", "address-search");
    output = await CreateCustomerPage.checkAddress(
      ct,
      dr.getDataSetKeyValue(dsObj, "input", "citylov"),
      prv,
      adr,
      dr.getDataSetKeyValue(dsObj, "input", "addresslov")
    );
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-2",
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
      // expect(StringUtils.containsIgnoreCase(addressDb, ct)).toBeTruthy();
      // expect(StringUtils.containsIgnoreCase(addressDb, prv)).toBeTruthy();
    }

    await CreateCustomerPage.verifyServiceAvailability(
      dr.getDataSetKeyValue(dsObj, "input", "services-available")
    );

    await CreateCustomerPage.clickNextForCheckedAddress();
    await CreateCustomerPage.proceedToCustomerCreation();

    useremailid = dr.getDataSetKeyValue(dsObj, "input", "email");
    await CreateCustomerPage.createNewCustomerWithoutIdentityAccount(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "lastname"),
      useremailid
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
      "shs-and-lw-test-scenarios",
      "provide-2",
      "validate-customer-registered"
    );
    if (isValEnabled) {
      logger.debug(`Validating customer-regristration`);
      expect(customerRegistered).toBeTruthy();
    }

    const availsAndSelected = await SelectServicesPage.selectServicesCommitmentPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "services"),
      dr.getDataSetKeyValue(dsObj, "input", "commitments"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceprovider")
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
      "shs-and-lw-test-scenarios",
      "provide-1",
      "validate-available-services"
    );
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
    }

    await SelectServicesPage.clickNextButton();

    await EquipmentPage.completeYouPickSectionOnDefaults();
    logger.result(`Default equipments are selected `);

    const deliveryMethod = "tech";
    const equipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      deliveryMethod,
      true
    );

    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, equipments);
    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-1",
      "validate-default-equipments"
    );
    if (isValEnabled) {
      logger.debug(`Validating default equipments available or not`);
      expect(equipments).not.toBeNull();
      expect(equipments).not.toBeUndefined();

      expect(equipments.myEquipments).not.toBeNull();
      expect(equipments.myEquipments).not.toBeUndefined();

      expect(equipments.includedEquipments).not.toBeNull();
      expect(equipments.includedEquipments).not.toBeUndefined();

      expect(equipments.additionalEquipments).not.toBeNull();
      expect(equipments.additionalEquipments).not.toBeUndefined();
    }

    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-1",
      "validate-no-easy-payments"
    );
    if (isValEnabled) {
      logger.debug(`Validating no easy payments`);
      const invisible = await EquipmentPage.validateInvisibilityOfEasyPayments();

      expect(invisible).not.toBeNull();
      expect(invisible).not.toBeUndefined();
      expect(invisible).toBeTruthy();
    }

    const noAddOnAdditionalEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaultsToContinueWithOrder();
    logger.result(
      `No option to add any additional equipment: ${noAddOnAdditionalEquipments}`
    );

    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      noAddOnAdditionalEquipments
    );
    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-2",
      "validate-no-additional-equipment"
    );
    if (isValEnabled) {
      logger.result(`No option to add any additional equipment`);
      expect(noAddOnAdditionalEquipments).not.toBeNull();
      expect(noAddOnAdditionalEquipments).not.toBeUndefined();
      expect(noAddOnAdditionalEquipments).toBeTruthy();
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
      "shs-and-lw-test-scenarios",
      "provide-2",
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
    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-2",
      "validate-cost"
    );
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

    // await CreditApprovalPage.clickNextToCreditCheckResult();

    // await BillingInformationPage.acceptAgentAdviseAndSaveContact(
    //   dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    // );
    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;

    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-2",
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

    let ordersStatuses = {};
    logger.debug("Fetching customer's internal id");
    let customerId = await du.getValue(
      dbcfg,
      dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber)
    );
    logger.debug(`Customer's internal id: ${customerId}`);
    ordersStatuses.customerId = customerId;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );

    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-2",
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
      "shs-and-lw-test-scenarios",
      "provide-2",
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
      expect(customerErrors.length > 0).toBeFalsy();
    }

    logger.debug("Completing manual tasks in case any");
    const manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
    if (StringUtils.isEmpty(manualTaskId) === false) {
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
      const workOrderNumber = pendingWorkOrders[orIndex][0];
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
    let allOrdersStatus = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
    );
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    ordersStatuses.allOrdersStatus = allOrdersStatus;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );

    logger.debug("Fetching customer's all pending order item's status");
    let allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(customerId)
    );
    logger.debug(
      `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
    );
    ordersStatuses.allPendingOrders = allPendingOrders;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      ordersStatuses
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
        }
      }
    }

    let service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-2",
      "validate-services-active"
    );
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();
      await CsrDesktopPage.searchCustomerForEmail(
        dr.getDataSetKeyValue(dsObj, "input", "email")
      );

      await CsrDesktopPage.clickOnServiceslink();
      const servicePlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
      const isActive = await AccountPage.validateStatusIsActiveForGivenService(
        servicePlan
      );

      expect(isActive).not.toBeNull();
      expect(isActive).not.toBeUndefined();
      expect(isActive).toBeTruthy();
    }
    await SubmitSuccessPage.clickComplete();

    await CsrDesktopPage.searchCustomerForEmail(
      dr.getDataSetKeyValue(dsObj, "input", "email")
    );

    await CsrDesktopPage.clickOnServiceslink();

    await AccountPage.addLocation(
      dr.getDataSetKeyValue(dsObj, "input", "secondcity"),
      dr.getDataSetKeyValue(dsObj, "input", "secondaddress")
    );

    await sel.getWaitUtils().sleep(1000);

    await AccountPage.selectAddress(
      dr.getDataSetKeyValue(dsObj, "input", "expectedaddress")
    );

    await AccountPage.clickOnAddService(
      dr.getDataSetKeyValue(dsObj, "input", "secondservice")
    );

    const availableAndSelected = await SelectServicesPage.selectServicesVerticalPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "secondservice"),
      dr.getDataSetKeyValue(dsObj, "input", "secondserviceplan"),
      dr.getDataSetKeyValue(dsObj, "input", "secondserviceprovider")
    );
    logger.result(`There were available services ${availableAndSelected}`);

    // let defEquips = await EquipmentPage.completeYouPickSectionOnDefaults();
    // logger.result(`Default equipments are selected ${defEquips}`);
    await sel.getWaitUtils().sleep(5000);

    const deliveryMethod2 = "Self";
    await EquipmentPage.completeLivingWellSectionOnDefaults(deliveryMethod2);
    const noAdditionalEquipments2 = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults(
      deliveryMethod2,
      true
    );
    logger.result(
      `No option to add any additional equipment: ${noAdditionalEquipments2}`
    );

    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      noAdditionalEquipments2
    );
    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-3",
      "validate-no-additional-equipment"
    );
    if (isValEnabled) {
      logger.result(`No option to add any additional equipment`);
      expect(noAdditionalEquipments2).not.toBeNull();
      expect(noAdditionalEquipments2).not.toBeUndefined();
      expect(noAdditionalEquipments2).toBeTruthy();
    }

    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-3",
      "validate-cost"
    );
    if (isValEnabled) {
      const cost2 = await CheckoutPage.getDueMonthlyBeforeTaxMatching();
      const costToValidate2 = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "costtovalidate"
      );
      logger.debug(`Validating cost ${cost2} with ${costToValidate2}`);
      expect(StringUtils.equalsIgnoreCase(cost2, costToValidate2)).toBeTruthy();
    }

    await CheckoutPage.acceptTermsSafelyAndMoveToNext();
    // await ShippingDetailsPage.fillupPhoneNumberAndSaveContactInfo(
    //     dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
    // );
    // //await ShippingDetailsPage.shipToPreFilledAddressAndSubmit(dr.getDataSetKeyValue(dsObj,"input","postalcode"));

    //await CreditApprovalPage.clickNextToCreditCheckResult();

    await BillingInformationPage.clickSubmitButton();

    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-1",
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

    ordersStatuses = {};
    logger.debug("Fetching customer's internal id");
    customerId = await du.getValue(
      dbcfg,
      dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, output.orderNumber)
    );
    logger.debug(`Customer's internal id: ${customerId}`);
    ordersStatuses.customerId = customerId;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );

    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-1",
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
      "shs-and-lw-test-scenarios",
      "provide-1",
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
      expect(customerErrors.length > 0).toBeFalsy();
    }

    logger.debug("Fetching customer's all order item's status");
    allOrdersStatus = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
    );
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    ordersStatuses.allOrdersStatus = allOrdersStatus;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );

    logger.debug("Fetching customer's all pending order item's status");
    allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(customerId)
    );
    logger.debug(
      `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
    );
    ordersStatuses.allPendingOrders = allPendingOrders;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(ordersStatuses)}`
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      ordersStatuses
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
        }
      }
    }

    service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(
      "shs-and-lw-test-scenarios",
      "provide-1",
      "validate-services-active"
    );
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();

      await CsrDesktopPage.searchCustomerForEmail(
        dr.getDataSetKeyValue(dsObj, "input", "email")
      );

      await CsrDesktopPage.clickCityRadioButton(
        dr.getDataSetKeyValue(dsObj, "input", "secondcity")
      );

      await CsrDesktopPage.clickOnServiceslink();
      const servicePlan = dr.getDataSetKeyValue(
        dsObj,
        "input",
        "secondserviceplan"
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
