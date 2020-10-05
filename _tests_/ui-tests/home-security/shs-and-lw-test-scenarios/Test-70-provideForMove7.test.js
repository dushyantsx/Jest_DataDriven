/**
 * @group allTests
 * @group shs-lw-tests
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
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const tapis = new TelusApis();
const adcapis = new AdcApis();
const testId = TestIdsMap.provide3migratedTestId;
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

  const testName = "Provide-3: Provide SHS; Product: Home Security Migration";
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

async function stepsProvide3(dsObj, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  let isValEnabled = true;

  logger.debug(`Till now case result: ${JSON.stringify(caseResult.datasets)}`);
  let imgPath;
  try {
    let output;
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

    const customerfirstname = dr.getDataSetKeyValue(
      dsObj,
      "input",
      "firstname"
    );
    const customerLastname = dr.getDataSetKeyValue(dsObj, "input", "lastname");

    const useremailid = dr.getDataSetKeyValue(dsObj, "input", "email");
    await CreateCustomerPage.createNewCustomerWithoutIdentityAccount(
      customerfirstname,
      customerLastname,
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
      valFile,
      testId,
      "validate-customer-registered"
    );
    if (isValEnabled) {
      logger.debug(`Validating customer-regristration`);
      expect(customerRegistered).toBeTruthy();
    }

    let res = await du.getCustomerIdFromCustomerName(dbcfg, customerfirstname);
    logger.info(JSON.stringify(res.customerId));
    const response = await tapis.setMigrationFlag(apicfg, res);
    logger.info(response);

    await SelectServicesPage.clickOnCompleteOnServicesPage();

    await sel.getJsUtils().isPageLoaded();

    await CsrDesktopPage.clickOnUserDropDownOption("Show migration offers");

    await CsrDesktopPage.searchCustomerForEmail(useremailid);

    await CsrDesktopPage.clickOnServiceslink();

    await AccountPage.clickOnAddService("Security Products");

    const availsAndSelectedservices = await SelectServicesPage.selectServices(
      dr.getDataSetKeyValue(dsObj, "input", "services")
    );

    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      availsAndSelectedservices
    );

    await SelectServicesPage.clickShowMore();

    const availsAndSelectedcommitment = await SelectServicesPage.selectCommitments(
      dr.getDataSetKeyValue(dsObj, "input", "commitments")
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      availsAndSelectedcommitment
    );

    await SelectServicesPage.setMigrationDateandTerm("36");

    await SelectServicesPage.clickSSHViewMore();

    await SelectServicesPage.enterHomeSecurityAmountandConfirmPrice(
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan"),
      "50"
    );

    const availsAndSelectedplanprovider = await SelectServicesPage.selectServiceProvider(
      dr.getDataSetKeyValue(dsObj, "input", "serviceprovider")
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      availsAndSelectedplanprovider
    );
    logger.result(
      `There were available services ${JSON.stringify(
        availsAndSelectedplanprovider
      )}`
    );

    await SelectServicesPage.clickNextButton();

    await sel.getJsUtils().isPageLoaded();

    await EquipmentPage.clickOnNextButton();

    await sel.getJsUtils().isPageLoaded();

    await EquipmentPage.clickOnNextButton();

    /* await CheckoutPage.applyPromoCode(
         dr.getDataSetKeyValue(dsObj, "input", "couponcode")
     );*/

    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-tax-rate"
    );

    await sel.getJsUtils().isPageLoaded();

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

    await CheckoutPage.acceptTermsSafelyAndMoveToNext();

    await sel.getJsUtils().isPageLoaded();

    await BillingInformationPage.cancelSaveContactForBilling();

    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    );

    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
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
      expect(customerErrors.length > 0).toBeFalsy();
    }

    logger.debug("Completing manual tasks in case any");
    const manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
    if (!StringUtils.isEmpty(manualTaskId)) {
      await tapis.processManualTask(apicfg, manualTaskId);
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

    const customererr = await du.getErrorsOccuredForCustomer(dbcfg, customerId);
    const custErrors = { customererr };
    custErrors.customererr = customererr;
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, custErrors);

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

          res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
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
        if (
          StringUtils.containsIgnoreCase(
            orderName,
            "New TELUS Home Security Product Order"
          )
        ) {
          // Hit release activation in case order is in entering state
          // Wait for 10 seconds to get completed

          res = await du.getHomeSecurityTask(dbcfg, orderInternalId);
          logger.info(res);
          // Hit shipment order completion
          await tapis.processHoldOrderTask(apicfg, res);
          // Wait for 10 seconds to get completed
          await sel.getWaitUtils().sleep(10000);
        }
      }
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
    }

    let adcid = await adcapis.isCustomerAvailable(
      adcfg,
      dr.getDataSetKeyValue(dsObj, "input", "email")
    );
    adcid = JSON.stringify(adcid.text);
    adcid = StringUtils.substringBetween(adcid, "<int>", "</int>");
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
