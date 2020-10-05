const brw = require("../../../src/sel-js/Browser");
const sel = require("../../../src/sel-js/SelUtils");
const config = require("../../../br-config");
const logger = require("../../../src/logger/Logger");
require("../../../src/globals/enumerations");
const excelUtils = require("../../../src/utils/excel/excelUtils");
const DataReader = require("../../../src/sel-js/DataReader");
const FileWriter = require("../../../src/utils/common/FileWriter");
const TestResult = require("../../../src/globals/results/TestResult");

const SsoLoginPage = require("../../../src/pages/common/SsoLoginPage");
const CsrDesktopPage = require("../../../src/pages/home-security/CsrDesktopPage");
const CreateCustomerPage = require("../../../src/pages/home-security/CreateCustomerPage");
const SelectServicesPage = require("../../../src/pages/home-security/SelectServicesPage");
const EquipmentPage = require("../../../src/pages/home-security/EquipmentPage");
const AppointmentPage = require("../../../src/pages/home-security/AppointmentPage");
const CheckoutPage = require("../../../src/pages/home-security/CheckoutPage");
const BillingInformationPage = require("../../../src/pages/home-security/BillingInformationPage");
const SubmitSuccessPage = require("../../../src/pages/home-security/SubmitSuccessPage");

const eu = new excelUtils();
const dr = new DataReader();
const testId = "HOME-SECURITY-TEST-0001";
let envcfg = config.getConfigForGivenEnv();

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
var sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(configDataAsset.dataFile, configDataAsset.dataSheet);
console.table(sheetDataAsJsonArray);

let caseResult;
describe("home-security-new-customer-creation-test-0001", () => {
  beforeAll(() => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.uitest);
    caseResult = TestResult.TestCaseResult(
      testId,
      "home-security-new-customer-creation-test-0001 for multiple data-sets"
    );
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
    await sel.captureScreenshot(testId);
    logger.exitMethod("afterEach");
  });

  sheetDataAsJsonArray.forEach((singleJsonRowObject, index) => {
    test("home-security-new-customer-creation-test-0001 for data-set-" + index, async (done) => {
      logger.enterMethod("Test started for data-set-" + index);
      dr.setDataSetObject(singleJsonRowObject, index);
      let executeOrNot = dr.getDataKeyValue(singleJsonRowObject, "data-set-enabled");
      logger.debug(`Dataset ${index} at is having execution flag set to ${executeOrNot}`);
      caseResult.datasets.push(dr.getDataSetObject(index));
      if (executeOrNot == "Y") {
        return await steps(singleJsonRowObject, index)
          .then((v) => {
            logger.result("Test result for data-set-" + index + ": " + v);
            done();
          })
          .catch((ex) => {
            logger.error("Test error for data-set-" + index + ": " + ex);
            done();
          });
      } else {
        return (async () => {
          caseResult.datasets[index].result = TestResultStatus.Skipped;
          return "success";
        })().then(done());
      }
      logger.exitMethod("Test finished for data-set-" + index);
    }); // test block ending
  }); // for loop ending
}); // describle block ending

async function steps(singleJsonRowObject, datasetindex) {
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(singleJsonRowObject).toBeDefined();

  logger.debug("Till now case result: " + JSON.stringify(caseResult.datasets));

  try {
    await brw.initializeDriver(envcfg.browser);
    caseResult.datasets[datasetindex].result = TestResultStatus.Fail;

    await sel.navigateTo(configDataAsset.url, configDataAsset.urlcontains);

    await SsoLoginPage.login(envcfg.testapp.user, envcfg.testapp.password);

    await sel.getWaitUtils().waitForUrlToChangeTo("csr-desktop");

    await CsrDesktopPage.clickAddNewCustomer();

    await CreateCustomerPage.createNewCustomer(
      dr.getDataKeyValue(singleJsonRowObject, "firstname"),
      dr.getDataKeyValue(singleJsonRowObject, "lastname"),
      dr.getDataKeyValue(singleJsonRowObject, "email")
    );

    await CreateCustomerPage.checkAddress(
      dr.getDataKeyValue(singleJsonRowObject, "city"),
      dr.getDataKeyValue(singleJsonRowObject, "citylov"),
      dr.getDataKeyValue(singleJsonRowObject, "province"),
      dr.getDataKeyValue(singleJsonRowObject, "address-search"),
      dr.getDataKeyValue(singleJsonRowObject, "addresslov")
    );

    await CreateCustomerPage.continueWithSecureCreditCheck(
      dr.getDataKeyValue(singleJsonRowObject, "dobmonth"),
      dr.getDataKeyValue(singleJsonRowObject, "dobday"),
      dr.getDataKeyValue(singleJsonRowObject, "dobyear"),
      dr.getDataKeyValue(singleJsonRowObject, "province")
    );

    await CreateCustomerPage.fillDriverLicenseIdentityDetails(
      dr.getDataKeyValue(singleJsonRowObject, "driverlicense"),
      dr.getDataKeyValue(singleJsonRowObject, "province")
    );

    await CreateCustomerPage.authorizeAndValidate();

    await SelectServicesPage.selectServicesCommitmentPlanProvider(
      dr.getDataKeyValue(singleJsonRowObject, "services"),
      dr.getDataKeyValue(singleJsonRowObject, "commitments"),
      dr.getDataKeyValue(singleJsonRowObject, "serviceplan"),
      dr.getDataKeyValue(singleJsonRowObject, "serviceprovider")
    );

    await EquipmentPage.submitEquipmentSectionOnAllDefaults();

    await AppointmentPage.submitAnyAvailableAppointment(
      dr.getDataKeyValue(singleJsonRowObject, "firstname"),
      dr.getDataKeyValue(singleJsonRowObject, "contactphonenumber"),
      dr.getDataKeyValue(singleJsonRowObject, "additionalinfo")
    );

    await CheckoutPage.acceptTermsAndMoveToNext();

    await BillingInformationPage.acceptAgentAdviseAndSaveContact();
    await BillingInformationPage.fillupPostalValidateAndSubmitOrder(
      dr.getDataKeyValue(singleJsonRowObject, "postalcode")
    );

    await SubmitSuccessPage.verifyThanksMessageForSuccessfulSubmissionOfOrder();
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;

    await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    caseResult.datasets[datasetindex].error = err;
    return err;
  }
}
