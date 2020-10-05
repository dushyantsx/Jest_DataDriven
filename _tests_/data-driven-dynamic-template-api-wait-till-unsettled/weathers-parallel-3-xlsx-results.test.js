const excelUtils = require("../../src/utils/excel/excelUtils");
const request = require("../../src/utils/apiutils/ApiUtils");
const ApiParams = require("../../src/utils/apiutils/ApiTemplateParams");
const FileWriter = require("../../src/utils/common/FileWriter");
const TestResult = require("../../src/globals/results/TestResult");
const config = require("../../br-config");
const logger = require("../../src/logger/Logger");
require(`${__src}/globals/enumerations`);

const eu = new excelUtils();
const rq = new request();
const rqo = new ApiParams();
const testId = "TEST-0003";

let envcfg = config.getConfigForGivenEnv();

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
var sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(configDataAsset.dataFile, configDataAsset.dataSheet);

let promises = [];
describe("Data Driven Approach for parallel dynamic testing Weather API", async () => {
  var sheetData = eu.sheetAs2dArrayAsync(configDataAsset.dataFile, configDataAsset.dataSheet, false);

  beforeAll(async () => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.test);
    return sheetData.then((sVals) =>
      sVals.forEach((el, index) => {
        if (index == 0) {
          listOfReqParams = rqo.setApiIndicesFromTemplate(el);
          rqo.printApiTemplateIndices(listOfReqParams);
        } else {
          logger.debug("now starting hitting all requests asynchronously");
          let pr = rq.hitSingleDynamicRequestObject(listOfReqParams, el);
          logger.verbose(pr);
          promises.push(pr);
        }
        return promises;
      })
    );
  });

  afterAll(async () => {
    //Close Server and Printout the report
    logger.enterMethod("afterAll Invoked");
    logger.exitMethod("afterAll");
  });

  test(testId + ": Get Weather Details and test its api dynamically", (done) => {
    let caseResult = TestResult.TestCaseResult(
      testId,
      "Get Weather Details and test its api dynamically for multiple data-sets"
    );
    function callback(reqResp) {
      expect.hasAssertions(); // At least one assertion is called during a test
      let index = 0;
      try {
        expect(reqResp).not.toBeUndefined();
        expect(reqResp).not.toBeNull();
        logger.verbose("Response received: " + reqResp.response.status);
        logger.step(
          "Verifying received response status: " +
            reqResp.response.status +
            " with expected response status: " +
            reqResp.expected.status.code
        );
        logger.verbose("Complete received response " + JSON.stringify(reqResp.response));

        if (reqResp.expected.status.code != reqResp.response.status) {
          logger.fail(
            `For data-set ${index} - Expected status code [${reqResp.expected.status.code}] and Received status code [${reqResp.response.status}] NOT MATCHED`
          );
        } else {
          logger.pass(
            `For data-set ${index} - Expected [${reqResp.expected.status.code}] and Received response status code [${reqResp.response.status}] MATCHED`
          );
          logger.verbose(JSON.stringify(reqResp.expected.body.part));
          if (reqResp.response.status == 200) {
            let expectedVal = reqResp.expected.getValueForGivenBodyPartKey("city");
            if (reqResp.response.body.name == expectedVal) {
              logger.pass(
                `For data-set ${index} - Expected city name [${expectedVal}] and Received city name [${reqResp.response.body.name}] MATCHED`
              );
            } else {
              logger.fail(
                `For data-set ${index} - Expected city name [${expectedVal}] and Received city name [${reqResp.response.body.name}] NOT MATCHED`
              );
            }
            expectedVal = reqResp.expected.getValueForGivenBodyPartKey("visibility");
            expect(reqResp.response.body.visibility).toBe(expectedVal);
            if (reqResp.response.body.visibility == expectedVal) {
              logger.pass(
                `For data-set ${index} - Expected visibility [${expectedVal}] and Received Visibility [${reqResp.response.body.visibility}] MATCHED`
              );
            } else {
              logger.fail(
                `For data-set ${index} - Expected visibility [${expectedVal}] and Received Visibility [${reqResp.response.body.visibility}] NOT MATCHED`
              );
              expect(reqResp.response.body.visibility).toBe(expectedVal);
            }
          }
        }
        reqResp.result = TestResultStatus.Pass;
        caseResult.datasets.push(reqResp);
      } catch (err) {
        reqResp.result = TestResultStatus.Fail;
        caseResult.datasets.push(reqResp);
        throw err;
      }
    } // callback function

    return promises.forEach((p) =>
      p
        .then((reqResp) => {
          callback(reqResp);
          FileWriter.sync(config.dataSetDetailedReportsDir + "/" + testId + ".json", JSON.stringify(caseResult), false);
          done();
        })
        .catch(done)
    );
  }); // test block ending
}); // describle block ending
