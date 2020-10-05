/**
 * @group allTests
 * @group shs-lw-tests
 * @group provide5
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
const TelusApis = require("../../../../src/utils/telus-apis/TelusApis");

const SsoLoginPage = require("../../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../../src/pages/home-security/CsrDesktopPage");
const SelectServicesPage = require("../../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../../src/pages/home-security/EquipmentPage");
const CheckoutPage = require("../../../../src/pages/home-security/CheckoutPage");
const SubmitSuccessPage = require("../../../../src/pages/home-security/SubmitSuccessPage");
const AccountPage = require("../../../../src/pages/home-security/AccountPage");
const ManageServicesPage = require("../../../../src/pages/home-security/ManageServicesPage");
const AdcApis = require("../../../../src/utils/telus-apis/AdcApis");
const AppointmentPage = require("../../../../src/pages/home-security/AppointmentPage");
const XmlParser = require("../../../../src/utils/common/XmlParser");
const {
  PermitPage,
  RulesPopup,
  EmergencyContactPage,
} = require("../../../../src/pages/home-security");

const eu = new ExcelUtils();

const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.amend3TestID;
const tapis = new TelusApis();
const adcapis = new AdcApis();
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
describe("Amend3: Upgrade from 1.0 to 2.0 1.0 Secure to 2.0 Control", () => {
  beforeAll(() => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.uitest);
    logger.exitMethod("beforeAll");
  });

  afterAll(() => {
    logger.enterMethod("afterAll");
    const dsRepDir = config.getLocationDataSetReportsDirForGivenEnv();
    logger.info(dsRepDir);
    if (FileSystem.fileExistsSync(dsRepDir)) {
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

  const testName = "Amend-3: Upgrade from 1.0 to 2.0 1.0 Secure to 2.0 Control";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll Amend-3");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll Amend-3");
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
          return await stepsAmend3(dsObj, index)
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

async function stepsAmend3(dsObj, datasetindex) {
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

    const provide5email = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide5SSHTech
    ).request.email;

    await CsrDesktopPage.searchCustomerForEmail(provide5email);

    const move4city = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.move4TestId
    ).request.city;
    await CsrDesktopPage.clickCityRadioButton(move4city);

    await CsrDesktopPage.clickOnServiceslink();

    await sel.getJsUtils().isPageLoaded();

    const provide5service = config.getFirstTestDataAssetResultsForGivenTestId(
      TestIdsMap.provide5SSHTech
    ).request.serviceplan;
    await ManageServicesPage.clickChangeonService(provide5service);

    await SelectServicesPage.clickSSHViewMore();

    const availsAndSelected = await SelectServicesPage.selectPlan(
      dr.getDataSetKeyValue(dsObj, "input", "serviceplan")
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
      testId,
      "validate-available-services"
    );
    if (isValEnabled) {
      logger.debug(`Validating available and selected services`);
      expect(availsAndSelected).not.toBeNull();
      expect(availsAndSelected).not.toBeUndefined();
    }

    await SelectServicesPage.clickNextButton();

    // let defEquips = await EquipmentPage.completeYouPickSectionOnDefaults();
    // logger.result(`Default equipments are selected ${defEquips}`);
    // const deliveryMethod = "self";

    await EquipmentPage.addEquipmentFromEquipmentList(
      "4-Button Key Ring Remote"
    );

    const deliveryMethod = "tech";
    const myequipments = await EquipmentPage.completeHomeSecuritySectionOnDefaults(
      deliveryMethod
    );
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      myequipments
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-default-equipments"
    );
    if (isValEnabled) {
      const expectedmyequipment = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "myequipment"
      );
      expect(
        StringUtils.containsIgnoreCaseAnyPosition(
          myequipments.hsincludedEquipments,
          expectedmyequipment
        )
      ).toBeTruthy();
    }

    const noAddOnAdditionalEquipments = await EquipmentPage.completeAddOnEquipmentSectionOnDefaults();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      noAddOnAdditionalEquipments
    );
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-no-additional-equipment"
    );
    if (isValEnabled) {
      logger.result(`No option to add any additional equipment`);
      expect(noAddOnAdditionalEquipments).not.toBeNull();
      expect(noAddOnAdditionalEquipments).not.toBeUndefined();
      expect(noAddOnAdditionalEquipments).toBeTruthy();
      // const expectedadditionalequipment = dr.getDataSetKeyValue(
      //   dsObj,
      //   "expected",
      //   "addonequipment"
      // );
    }
    await RulesPopup.clickOnContinueWithOrder();
    await sel.getWaitUtils().waitForUrlToChangeTo("emergency_contact_lw");

    const steps = [];
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

    const duration = await AppointmentPage.submitAnyAvailableAppointment(
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
        StringUtils.replaceAll(
          JSON.stringify(totalswttime.duration),
          "[^a-zA-Z0-9]",
          ""
        )
      ).toContain(
        StringUtils.replaceAll(
          dr.getDataSetKeyValue(dsObj, "expected", "swttime")
        ),
        "[^a-zA-Z0-9]",
        ""
      );
    }

    const tax = await CheckoutPage.getEstimatedMonthlyTotalTaxes();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, tax);
    if (isValEnabled) {
      const taxToValidate = dr.getDataSetKeyValue(
        dsObj,
        "expected",
        "taxtovalidate"
      );
      logger.debug(`Validating tax ${tax} with ${taxToValidate}`);
      expect(
        StringUtils.containsIgnoreCaseAny(
          JSON.stringify(tax.appliedtax),
          taxToValidate
        )
      ).toBeTruthy();
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
      expect(
        StringUtils.containsIgnoreCaseAny(
          JSON.stringify(cost.amount),
          costToValidate
        )
      ).toBeTruthy();
    }

    const totaltax = await CheckoutPage.getEstimatedTotalTaxesforToday();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, totaltax);

    const totaltopaytoday = await CheckoutPage.getEstimatedTotalToPayToday();
    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      totaltopaytoday
    );
    await CheckoutPage.noAcceptTermsAndOnlyMoveToNext();

    // await BillingInformationPage.cancelSaveContactForBilling();

    // await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
    //   dr.getDataSetKeyValue(dsObj, "input", "postalcode")
    // );

    // eslint-disable-next-line prefer-const
    output = await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, output);

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

          const res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
            dbcfg,
            orderInternalId
          );

          const holdordertask = await du.getHoldOrderTaskNumber(
            dbcfg,
            res.purchaseeOrderNumber
          );
          logger.info(holdordertask);

          try {
            await tapis.processHoldOrderTask(apicfg, holdordertask);
          } catch (err) {
            console.log(JSON.stringify(err));
          }
          await sel.getWaitUtils().sleep(10000);
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

    const service = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
    isValEnabled = tval.isValidationEnabled(
      valFile,
      testId,
      "validate-services-active"
    );
    if (isValEnabled) {
      logger.debug(`Validating service [${service}] is active or not`);

      await SubmitSuccessPage.clickComplete();
      await CsrDesktopPage.searchCustomerForEmail(provide5email);
      await CsrDesktopPage.clickCityRadioButton(move4city);
      await CsrDesktopPage.clickOnServiceslink();
      const servicePlan = dr.getDataSetKeyValue(dsObj, "input", "serviceplan");
      const isActive = await AccountPage.validateStatusIsActiveForGivenService(
        servicePlan
      );

      expect(isActive).not.toBeNull();
      expect(isActive).not.toBeUndefined();
      expect(isActive).toBeTruthy();
    }

    let adcresponse = await adcapis.isCustomerAvailable(adcfg, provide5email);
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
          JSON.stringify(dr.getDataSetKeyValue(dsObj, "input", "serviceplan")),
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
      expect(
        StringUtils.containsIgnoreCaseAnyPosition(desc, plan)
      ).toBeTruthy();

      const commitment = dr.getDataSetKeyValue(dsObj, "input", "commitments");
      expect(
        StringUtils.containsIgnoreCaseAnyPosition(desc, commitment)
      ).toBeTruthy();
    }

    imgPath = await sel.captureScreenshot(`${testId}-ds-${datasetindex}-PASS`);
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    caseResult.datasets[datasetindex].error = err;
    imgPath = await sel.captureScreenshot(`${testId}-ds-${datasetindex}-FAIL`);
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}
