/**
 * @group allTests
 * @group shs-lw-tests
 * @group provide-tests
 * @group secureprovide
 */

require("../../../../src/globals/MyTypeDefs");
require("../../../../src/globals/enumerations");

const brw = require("../../../../src/sel-js/Browser");
const sel = require("../../../../src/sel-js/SelUtils");
const config = require("../../../../br-config");
const logger = require("../../../../src/logger/Logger");
const StringUtils = require("../../../../src/utils/common/StringUtils");
const excelUtils = require("../../../../src/utils/excel/excelUtils");
const DataReader = require("../../../../src/sel-js/DataReader");
const FileSystem = require("../../../../src/utils/common/FileSystem");
const FileWriter = require("../../../../src/utils/common/FileWriter");
const TestResult = require("../../../../src/globals/results/TestResult");
const Validator = require("../../../../src/globals/TestObjects").Validator;
const DbUtils = require("../../../../src/utils/dbutils/DbUtils"),
  du = DbUtils.DbUtils,
  dq = DbUtils.DbQueries;
const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");
const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const CreateCustomerPage = require("../../../../src/pages/home-security/CreateCustomerPage");
const SelectServicesPage = require("../../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const ShippingDetailsPage = require("../../../../src/pages/home-security/ShippingDetailsPage");
const CreditApprovalPage = require("../../../../src/pages/home-security/CreditApprovalPage");
const BillingInformationPage = require("../../../../src/pages/home-security/BillingInformationPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const EmergencyContactPage = require("../../../../src/pages/home-security/EmergencyContactPage");
const PermitPage = require("../../../../src/pages/home-security/PermitPage");

const eu = new excelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const testId = TestIdsMap.provide1secureTestID;
const valFile = "shs-and-lw-test-scenarios";

let envcfg = config.getConfigForGivenEnv();
let dbcfg = config.getDbConfig(envcfg);
let apicfg = config.getTelusApisConfig(envcfg);

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
console.log(`configdataasset: --------- >>>> ${JSON.stringify(configDataAsset)}`);
var sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(configDataAsset.dataFile, configDataAsset.dataSheet);
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
    let dsRepDir = config.getLocationDataSetReportsDirForGivenEnv();
    logger.info(dsRepDir);
    if (FileSystem.fileExistsSync(dsRepDir) == false) {
      logger.error(`Can not write case-results to non-existent location ${dsRepDir}`);
    }
    FileWriter.sync(dsRepDir + "/" + testId + ".json", JSON.stringify(caseResult), false);

    //sel.deleteAllCookies();
    logger.exitMethod("afterAll");
  });

  afterEach(async () => {
    logger.enterMethod("afterEach");
    //await sel.captureScreenshot(testId);
    logger.exitMethod("afterEach");
  });

  let testName = "ProvideSecure-HS for 36 Months";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll SecureProvide");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll SecureProvide");
    });

    logger.debug(`Starting for all data-sets for test-id ${testId}`);
    sheetDataAsJsonArray.forEach((singleJsonRowObject, index) => {
      test(`${testName} for data-set-${index + 1}`, async (done) => {
        logger.enterMethod(`Test started for data-set-${index + 1}`);
        dr.setDataSetObject(singleJsonRowObject, index);
        let dsObj = dr.getDataSetObject(index);
        let executeOrNot = dr.getDataSetKeyValue(dsObj, "input", "data-set-enabled");
        logger.debug(`Dataset ${index} at is having execution flag set to ${executeOrNot}`);
        caseResult.datasets.push(dr.getDataSetObject(index));
        if (executeOrNot == "Y") {
          return await stepsSecureProvide(dsObj, index)
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
        } else {
          return (async () => {
            caseResult.datasets[index].result = TestResultStatus.Skipped;
            logger.exitMethod(`Test finished as skipped for data-set-${index + 1}`);
            //return "success";
            pending();
          })(); //.then(done());
        }
        logger.exitMethod(`Test finished for data-set-${index + 1}`);
      }); // test block ending
    }); // for loop ending
  }); // inner describe block ending
}); // describe block ending

async function stepsSecureProvide(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;

  logger.debug("Till now case result: " + JSON.stringify(caseResult.datasets));
  try {
    let output;
    let imgPath;
    let drv = await brw.initializeDriver(envcfg.browser);
    await sel.setDriver(drv);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    await CsrDesktopPage.clickCheckAddress();

    let ct = dr.getDataSetKeyValue(dsObj, "input", "city");
    let prv = dr.getDataSetKeyValue(dsObj, "input", "province");
    let adr = dr.getDataSetKeyValue(dsObj, "input", "address-search");
    output = await CreateCustomerPage.checkAddress(
      ct,
      dr.getDataSetKeyValue(dsObj, "input", "citylov"),
      prv,
      adr,
      dr.getDataSetKeyValue(dsObj, "input", "addresslov")
    );
    storeOutputToDataSetResult(caseResult, datasetindex, output);

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-address");
    if (isValEnabled) {
      logger.debug(`Querying city name from db for ${output.city.itemid}`);
      let cityDb = await du.getValue(dbcfg, dq.queryNcObjectNameOnId(output.city.itemid));
      logger.debug(`Validating city ${cityDb} with ${ct}`);
      expect(cityDb).not.toBeNull();
      expect(cityDb).not.toBeUndefined();
      expect(StringUtils.containsIgnoreCase(cityDb, ct)).toBeTruthy();

      logger.debug(`Validating province ${output.province} with ${prv}`);
      expect(StringUtils.containsIgnoreCase(output.province, prv)).toBeTruthy();

      logger.debug(`Validating address ${output.address.text} with ${adr}`);
      expect(StringUtils.containsIgnoreCase(output.address.text, adr)).toBeTruthy();

      logger.debug(`Querying address from db for ${output.address.rel.id}`);
      let addressDb = await du.getValue(dbcfg, dq.queryCompleteAddress(output.address.rel.id));
      // expect(addressDb).not.toBeNull();
      logger.debug(`Validating db-address ${addressDb} for city ${ct} and province ${prv}`);
      // expect(StringUtils.containsIgnoreCase(addressDb, ct)).toBeTruthy();
      // expect(StringUtils.containsIgnoreCase(addressDb, prv)).toBeTruthy();
    }

    await CreateCustomerPage.verifyServiceAvailability(dr.getDataSetKeyValue(dsObj, "input", "services-available"));

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

    let customerRegistered = await CreateCustomerPage.authorizeAndValidate();
    storeOutputToDataSetResult(caseResult, datasetindex, customerRegistered);
    logger.result(`Customer registration successful: ${customerRegistered}`);

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-customer-registered");
    if (isValEnabled) {
      logger.debug(`Validating customer-regristration`);
      expect(customerRegistered).toBeTruthy();
    }

    let availsAndSelected = await SelectServicesPage.selectServicesCommitmentPlanProvider(
      dr.getDataSetKeyValue(dsObj, "input", "services"),
      dr.getDataSetKeyValue(dsObj, "input", "commitments"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan"),
      dr.getDataSetKeyValue(dsObj, "input", "serviceprovider")
    );
    storeOutputToDataSetResult(caseResult, datasetindex, availsAndSelected);
    logger.result(`There were available services ${JSON.stringify(availsAndSelected)}`);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-available-services");
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
    }

    //  await EquipmentPage.completeYouPickSectionOnDefaults();
    //logger.result(`Default equipments are selected `);

    let deliveryMethod = "tech";
    let equipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(deliveryMethod, true);

    storeOutputToDataSetResult(caseResult, datasetindex, equipments);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-default-equipments");
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

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-no-easy-payments");
    if (isValEnabled) {
      logger.debug(`Validating no easy payments`);
      let invisible = await EquipmentPage.validateInvisibilityOfEasyPayments();

      expect(invisible).not.toBeNull();
      expect(invisible).not.toBeUndefined();
      expect(invisible).toBeTruthy();
    }

    let noAddOnAdditionalEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaultsToContinueWithOrder();
    logger.result(`No option to add any additional equipment: ${noAddOnAdditionalEquipments}`);

    storeOutputToDataSetResult(caseResult, datasetindex, noAddOnAdditionalEquipments);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-no-additional-equipment");
    if (isValEnabled) {
      logger.result(`No option to add any additional equipment`);
      expect(noAddOnAdditionalEquipments).not.toBeNull();
      expect(noAddOnAdditionalEquipments).not.toBeUndefined();
      expect(noAddOnAdditionalEquipments).toBeTruthy();
    }

    await EmergencyContactPage.enterSitePhoneNumber("6611223789");

    await EmergencyContactPage.addEmergencyContact("1231412399", "Password");

    await EmergencyContactPage.clickNextButton();

    let permit = await PermitPage.validatePermitSectionIsAvailable();
    isValEnabled = tval.isValidationEnabled("shs-and-lw-test-scenarios", testId, "validate-permit-active");
    if (isValEnabled) {
      logger.result(`No option to add any additional equipment`);

      expect(permit).not.toBeNull();
      expect(permit).not.toBeUndefined();
      expect(permit).toBeTruthy();
    }
    await PermitPage.enterPermitNumber();

    await PermitPage.enterExpiryDate();

    await PermitPage.clickNextButton();

    await AppointmentPage.clickonSelectedService();

    /* await CheckoutPage.applyPromoCode(
         dr.getDataSetKeyValue(dsObj, "input", "couponcode")
     );*/

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-tax-rate");
    let tax = await CheckoutPage.getEstimatedMonthlyTotalTaxes();
    storeOutputToDataSetResult(caseResult, datasetindex, tax);
    if (isValEnabled) {
      let taxToValidate = dr.getDataSetKeyValue(dsObj, "expected", "taxtovalidate");
      logger.debug(`Validating tax ${tax} with ${taxToValidate}`);
      expect(StringUtils.equalsIgnoreCase(tax, tax)).toBeTruthy();
    }

    let cost = await CheckoutPage.getDueMonthlyBeforeTaxMatching();
    storeOutputToDataSetResult(caseResult, datasetindex, cost);
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-cost");
    if (isValEnabled) {
      let costToValidate = dr.getDataSetKeyValue(dsObj, "expected", "costtovalidate");
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
    storeOutputToDataSetResult(caseResult, datasetindex, output);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-order-submission");
    if (isValEnabled) {
      logger.debug(`Validating order submission by getting order number generated from Agent portal`);
      expect(output).not.toBeNull();
      expect(output).not.toBeUndefined();

      expect(output.orderNumber).not.toBeNull();
      expect(output.orderNumber).not.toBeUndefined();
    }

    let ordersStatuses = {};
    logger.debug("Fetching customer's internal id");
    let customerId = await du.getValue(dbcfg, dq.queryNcCustomerIdFromSaleOrderNumber(output.orderNumber));
    logger.debug(`Customer's internal id: ${customerId}`);
    ordersStatuses.customerId = customerId;
    logger.debug(`Order's statuses till now: ${JSON.stringify(ordersStatuses)}`);

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-order-submission");
    if (isValEnabled) {
      logger.debug(
        `Validating order submission by querying NetCracker BE for order number ${output.orderNumber} by validating if this order exists for registered customer`
      );
      expect(customerId).not.toBeNull();
      expect(customerId).not.toBeUndefined();
    }

    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-be-time-zone");
    if (isValEnabled) {
      logger.debug(`Validating no error occured on NetCracker BE for timezone of ${output.orderNumber}`);
      let customerErrors = await du.getErrorsOccuredForCustomer(dbcfg, customerId);
      expect(customerErrors).not.toBeNull();
      expect(customerErrors).not.toBeUndefined();
      expect(customerErrors.length > 0).toBeFalsy();
    }

    logger.debug("Completing manual tasks in case any");
    let manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
    if (StringUtils.isEmpty(manualTaskId) == false) {
      let res = await tapis.processManualTask(apicfg, manualTaskId);
      logger.debug(`Manual task ${manualTaskId} completion status code: ${res.status}`);
    }

    let pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(dbcfg, customerId);
    for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
      //let orderInternalId = pendingWorkOrders[orIndex][1];
      let workOrderNumber = pendingWorkOrders[orIndex][0];
      let workOrderName = pendingWorkOrders[orIndex][2];
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
    let allOrdersStatus = await du.select(dbcfg, dq.queryNcCustomerOrdersStatus(customerId));
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    ordersStatuses.allOrdersStatus = allOrdersStatus;
    logger.debug(`Order's statuses till now: ${JSON.stringify(ordersStatuses)}`);

    logger.debug("Fetching customer's all pending order item's status");
    let allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(customerId)
    );
    logger.debug(`Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`);
    ordersStatuses.allPendingOrders = allPendingOrders;
    logger.debug(`Order's statuses till now: ${JSON.stringify(ordersStatuses)}`);
    storeOutputToDataSetResult(caseResult, datasetindex, ordersStatuses);

    if (allPendingOrders != null && allPendingOrders !== undefined && allPendingOrders.length > 0) {
      for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
        let orderInternalId = allPendingOrders[orIndex][1];
        let orderName = allPendingOrders[orIndex][0];
        if (StringUtils.containsIgnoreCase(orderName, "shipment")) {
          // Hit release activation in case order is in entering state
          await tapis.processReleaseActivation(apicfg, orderInternalId);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);

          let res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(dbcfg, orderInternalId);
          // Hit shipment order completion
          await tapis.processShipmentOrder(apicfg, res.shipmentOrderNumber, res.purchaseeOrderNumber);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);
        }
      }
    }

    let service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-services-active");
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();
      await CsrDesktopPage.searchCustomerForEmail(dr.getDataSetKeyValue(dsObj, "input", "email"));
      await CsrDesktopPage.clickOnServiceslink();
      let servicePlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
      let isActive = await AccountPage.validateStatusIsActiveForGivenService(servicePlan);

      expect(isActive).not.toBeNull();
      expect(isActive).not.toBeUndefined();
      expect(isActive).toBeTruthy();
    }

    imgPath = await sel.captureScreenshot(testId + "-ds-" + datasetindex + "-PASS");
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    //await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    caseResult.datasets[datasetindex].error = err;
    imgPath = await sel.captureScreenshot(testId + "-ds-" + datasetindex + "-FAIL");
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}

/**
 * @param {TestCaseResultObject} cr
 * @param {Object} objToSave
 */
function storeOutputToDataSetResult(cr, datasetindex, objToSave) {
  logger.enterMethod(`Object provided to save: ${JSON.stringify(objToSave)}`);
  try {
    if (objToSave == null || objToSave === undefined || JSON.stringify(objToSave) == "{}") {
      logger.exitMethod("Nothing provided to store as OUTPUT in data-set result");
      return;
    }

    let objKeys = Object.keys(objToSave);
    let objVals = Object.values(objToSave);

    for (let index = 0; index < objKeys.length; index++) {
      cr.datasets[datasetindex].response[objKeys[index]] = objVals[index];
    }
  } catch (err) {
    logger.error(err);
  }
  logger.debug(`Response stored: ${JSON.stringify(cr.datasets[datasetindex].response)}`);
  logger.exitMethod(`Case Resulte so far: ${JSON.stringify(cr)}`);
}
