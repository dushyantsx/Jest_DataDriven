/**
 * @group allTests
 * @group shs-lw-tests
 * @group provide-tests
 * @group provide4/ssh/controlplusvideo
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
const AdcApis = require("../../../../src/utils/telus-apis/AdcApis");
const TestResult = require("../../../../src/globals/results/TestResult");
const { Validator } = require("../../../../src/globals/TestObjects");
const XmlParser = require("../../../../src/utils/common/XmlParser");

const DbUtils = require("../../../../src/utils/dbutils/DbUtils");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");
const TestIdsMap = require("../../../../src/globals/TestIdsMap");

const {
  AccountPage,
  AppointmentPage,
  BillingInformationPage,
  CheckoutPage,
  CreateCustomerPage,
  CsrDesktopPage,
  EquipmentPage,
  PermitPage,
  SelectServicesPage,
  ShippingDetailsPage,
  SsoLoginPage,
  SubmitSuccessPage,
  RulesPopup,
  EmergencyContactPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const adcapis = new AdcApis();
const testId = TestIdsMap.provide4TestId;
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
describe("Provide4: SHS Only On Control + Video Tech Install", () => {
  beforeAll(() => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.uitest);
    logger.exitMethod("beforeAll");
  });

  afterAll(() => {
    logger.enterMethod("afterAll");
    const dsRepDir = config.getLocationDataSetReportsDirForGivenEnv();
    logger.info(dsRepDir);
    if (!FileSystem.fileExistsSync(dsRepDir)) {
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

  const testName = "Provide-4: SHS Only On Control + Video Tech Install";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Provide-4");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Provide-4");
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
          return await stepsProvide4(dsObj, index)
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

async function stepsProvide4(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;
  let workOrderNumber;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  let imgPath;
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
      // expect(StringUtils.containsIgnoreCase(addressDb, ct)).toBeTruthy();
      // expect(StringUtils.containsIgnoreCase(addressDb, prv)).toBeTruthy();
    }

    await CreateCustomerPage.verifyServiceAvailability(
      dr.getDataSetKeyValue(dsObj, "input", "services-available")
    );

    await CreateCustomerPage.clickNextForCheckedAddress();
    await CreateCustomerPage.proceedToCustomerCreation();

    await sel.getJsUtils().isPageLoaded();

    const useremailid = dr.getDataSetKeyValue(dsObj, "input", "email");

    await CreateCustomerPage.createNewCustomerWithoutIdentityAccount(
      dr.getDataSetKeyValue(dsObj, "input", "firstname"),
      dr.getDataSetKeyValue(dsObj, "input", "lastname"),
      useremailid
    );

    await sel.getJsUtils().isPageLoaded();

    await CreateCustomerPage.continueWithSecureCreditCheck(
      dr.getDataSetKeyValue(dsObj, "input", "dobmonth"),
      dr.getDataSetKeyValue(dsObj, "input", "dobday"),
      dr.getDataSetKeyValue(dsObj, "input", "dobyear"),
      dr.getDataSetKeyValue(dsObj, "input", "province")
    );

    await sel.getJsUtils().isPageLoaded();
    await CreateCustomerPage.fillDriverLicenseIdentityDetails(
      dr.getDataSetKeyValue(dsObj, "input", "driverlicense"),
      dr.getDataSetKeyValue(dsObj, "input", "province")
    );

    await sel.getJsUtils().isPageLoaded();
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

    await sel.getJsUtils().isPageLoaded();
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
      valFile,
      testId,
      "validate-available-services"
    );
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
    }

    await SelectServicesPage.clickNextButton();

    let youpickequipments;
    // let allequipments = [];
    const sPlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    if (!StringUtils.containsIgnoreCase(sPlan, "secure")) {
      youpickequipments = await EquipmentPage.completeYouPickSectionOnDefaults();
      logger.result(
        `Default equipments are selected ${JSON.stringify(youpickequipments)} `
      );

      //  allequipments.push(youpickequipments);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        youpickequipments
      );
    }
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-equipments"
    );
    if (isValEnabled) {
      expect(youpickequipments).not.toBeNull();
      expect(youpickequipments).not.toBeUndefined();
    }

    const deliveryMethod = "tech";
    const homesecurityequipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      deliveryMethod,
      true
    );

    // allequipments.push(homesecurityequipments);
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      homesecurityequipments
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-default-equipments"
    );
    if (isValEnabled) {
      logger.debug(`Validating default equipments available or not`);

      const exphsaddiontalequipments = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "additionalequipments"
      );
      //Not verifying included equiments
      expect(homesecurityequipments.hsmyEquipments).not.toBeNull();
      expect(homesecurityequipments.hsmyEquipments).not.toBeUndefined();

      expect(homesecurityequipments.hsincludedEquipments).not.toBeNull();
      expect(homesecurityequipments.hsincludedEquipments).not.toBeUndefined();

      expect(homesecurityequipments.hsadditionalEquipments).not.toBeNull();
      expect(homesecurityequipments.hsadditionalEquipments).not.toBeUndefined();

      const expectedypequipments = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "youpickequipments"
      );

      //expectedypequipments = expectedypequipments.split(",");

      expect(
        StringUtils.containsIgnoreCaseAny(
          JSON.stringify(homesecurityequipments.hsmyEquipments),
          expectedypequipments
        )
      ).toBeTruthy();

      expect(
        StringUtils.containsIgnoreCaseAny(
          JSON.stringify(homesecurityequipments.hsadditionalEquipments),
          exphsaddiontalequipments
        )
      ).toBeTruthy();
      const popupmsg =
        "Please double check if customer needs to install old equipment in Takeover Equipment Section (Confirm no takeover)";
      expect(
        StringUtils.containsIgnoreCaseAny(
          JSON.stringify(homesecurityequipments.popup.msgtext),
          popupmsg
        )
      ).toBeTruthy();
    }

    const addOnAdditionalEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults(
      deliveryMethod,
      true
    );
    logger.result(
      `No option to add any additional equipment: ${addOnAdditionalEquipments}`
    );

    // allequipments.push(addOnAdditionalEquipments);
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      addOnAdditionalEquipments
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-no-additional-equipment"
    );
    if (isValEnabled) {
      logger.result(`No option to add any additional equipment`);
      expect(addOnAdditionalEquipments.additionalEquipments).not.toBeNull();
      expect(
        addOnAdditionalEquipments.additionalEquipments
      ).not.toBeUndefined();
      const expectedaddon = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "addonequipments"
      );
      expect(
        StringUtils.replaceAll(
          JSON.stringify(addOnAdditionalEquipments.additionalEquipments),
          "[^a-zA-Z_]",
          ""
        )
      ).toContain(StringUtils.replaceAll(expectedaddon, "[^a-zA-Z_]", ""));
    }
    const expectedmsg =
      "An Installation charge of $450 is applicable on this order. Do you want to continue? (Continue with order)";
    const popupmsg = await RulesPopup.clickOnContinueWithOrder();
    const msg = popupmsg.msgtext;
    logger.info(msg);
    expect(
      StringUtils.containsIgnoreCaseAny(
        JSON.stringify(popupmsg.msgtext),
        expectedmsg
      )
    ).toBeTruthy();

    let steps = [];
    steps = await EquipmentPage.getCurrentOrderStep();
    if (StringUtils.containsIgnoreCaseAny(steps, "security information")) {
      await EmergencyContactPage.enterSitePhoneNumber(
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
      );

      await EmergencyContactPage.addEmergencyContact(
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
      );

      await EmergencyContactPage.clickNextButton();

      await sel.getJsUtils().isPageLoaded();

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

    if (
      StringUtils.containsIgnoreCase(sPlan, "secure") &&
      StringUtils.equalsIgnoreCase(deliveryMethod, "tech")
    ) {
      await AppointmentPage.clickonSelectedService();
    }

    let duration;
    if (StringUtils.equalsIgnoreCase(deliveryMethod, "tech")) {
      duration = await AppointmentPage.submitAnyAvailableAppointment(
        dr.getDataSetKeyValue(dsObj, "input", "firstname"),
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber"),
        dr.getDataSetKeyValue(dsObj, "input", "additionalinfo")
      );
      isValEnabled = tval.isValidationEnabled(
        valFile,
        testId,
        "validate-swt-time"
      );

      const totalswttime = { duration };
      totalswttime.duration = duration;
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetindex,
        totalswttime
      );
      if (isValEnabled) {
        expect(duration).not.toBeUndefined();
        expect(duration).not.toBeNull();
        expect(
          StringUtils.containsIgnoreCaseAny(
            JSON.stringify(totalswttime.duration.swtime),
            dr.getDataSetKeyValue(dsObj, "expected", "swttime")
          )
        );
      }
    }

    /* await CheckoutPage.applyPromoCode(
         dr.getDataSetKeyValue(dsObj, "input", "couponcode")
     );*/

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-tax-rate"
    );
    const tax = await CheckoutPage.getEstimatedMonthlyTotalTaxes();
    if (isValEnabled) {
      const taxToValidate = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "taxtovalidate"
      );
      logger.debug(`Validating tax ${tax} with ${taxToValidate}`);
      expect(
        StringUtils.equalsIgnoreCase(tax.appliedtax, taxToValidate)
      ).toBeTruthy();
    }

    const cost = await CheckoutPage.getDueMonthlyBeforeTaxMatching();
    const monthlyCost = { cost, tax };
    monthlyCost.cost = cost;
    monthlyCost.tax = tax;
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      monthlyCost
    );
    isValEnabled = tval.isValidationEnabled(valFile, testId, "validate-cost");
    if (isValEnabled) {
      const costToValidate = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "costtovalidate"
      );
      logger.debug(`Validating cost ${cost} with ${costToValidate}`);
      expect(
        StringUtils.equalsIgnoreCase(cost.amount, costToValidate)
      ).toBeTruthy();
    }

    const totaltax = await CheckoutPage.getEstimatedTotalTaxesforToday();
    const totaltopaytoday = await CheckoutPage.getEstimatedTotalToPayToday();

    const toPayToday = { totaltax, totaltopaytoday };
    toPayToday.totaltax = totaltax;
    toPayToday.totaltopaytoday = totaltopaytoday;
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      totaltopaytoday
    );
    await CheckoutPage.acceptTermsSafelyAndMoveToNext();

    if (StringUtils.equalsIgnoreCase(deliveryMethod, "self")) {
      await ShippingDetailsPage.fillupPhoneNumberAndSaveContactInfo(
        dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")
      );

      await EquipmentPage.clickOnNextButton();
    }

    // await CreditApprovalPage.clickNextToCreditCheckResult();

    // await BillingInformationPage.acceptAgentAdviseAndSaveContact(
    //   dr.getDataSetKeyValue(dsObj, "input", "contactphonenumber")

    // );

    await sel.getJsUtils().isPageLoaded();

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

      isValEnabled = tval.isValidationEnabled(
        valFile,
        testId,
        "validate-billing-task"
      );
      if (isValEnabled) {
        logger.debug(
          `Validating billing actions occured on NetCracker for customer ${customerId}`
        );
        let billingActionsStatus = await du.getBillingActionStatus(
          dbcfg,
          customerId
        );
        TestResult.storeOutputToDataSetResult(
          caseResult,
          datasetindex,
          billingActionsStatus
        );
        expect(billingActionsStatus).not.toBeNull();
        expect(billingActionsStatus).not.toBeUndefined();
        expect(billingActionsStatus.length > 0).toBeTruthy();
        logger.debug(
          `Validating no error occured on NetCracker for any billing task for customer ${customerId}`
        );
        billingActionsStatus = await du.getBillingFailedActionStatus(
          dbcfg,
          customerId
        );
        TestResult.storeOutputToDataSetResult(
          caseResult,
          datasetindex,
          billingActionsStatus
        );
        expect(billingActionsStatus).not.toBeNull();
        expect(billingActionsStatus).not.toBeUndefined();
        expect(billingActionsStatus.length > 0).toBeFalsy();
      }

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

      if (allPendingOrders != null && allPendingOrders !== undefined) {
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
    }

    const service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
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
    const servicePlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    const isActive = await AccountPage.validateStatusIsActiveForGivenService(
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

    const dstdetail = await adcapis.getDSTInfo(adcfg, workOrderNumber);
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

    imgPath = await sel.captureScreenshot(`${testId}-ds-${datasetindex}-PASS`);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    //await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    caseResult.datasets[datasetindex].error = err;
    imgPath = sel.captureScreenshot(`${testId}-ds-${datasetindex}-FAIL`);
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}
