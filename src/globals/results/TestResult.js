require("../MyTypeDefs");
const { ResultLevel, TestResultStatus } = require("../enumerations");
const logger = require("../../logger/Logger");
require("../enumerations");

function GenericTestResultObject(testStepId, testCaseId, resDescription) {
  const resultType = `${ResultLevel.TestCase}`;
  //if(testStepId)
  const resultObj = {
    id: "",
    type: resultType,
    description: resDescription,
    stepResult: "",
    startTime: 0,
    endTime: 0,
    data: [
      {
        input: null,
        output: null,
        expected: null,
      },
    ],
    elapsedTime: function () {
      return this.endTime - this.startTime;
    },
    calculateStepResult: function () {
      this.data.forEach((element) => {
        if (
          (element.input === undefined || element.input == null) &&
          (element.output === undefined || element.output == null) &&
          (element.expected === undefined || element.expected == null)
        ) {
          return this.stepResult;
        }

        if (element.output != null && element.output !== undefined) {
          if (element.output === element.expected) {
            return TestResultStatus.Pass;
          }
          return TestResultStatus.Fail;
        }
        return TestResultStatus.InProgress;
      });
    },
  };
  return resultObj;
}

class TestResultHolder {
  static TestStepResult(testStepId, testCaseId, testStepDescription) {
    const obj = GenericTestResultObject(
      testStepId,
      testCaseId,
      testStepDescription
    );
    return obj;
  }

  /**
   *
   * @param {String} caseId
   * @param {String} caseDescription
   * @returns {TestCaseResultObject}
   */
  static TestCaseResult(caseId, caseDescription) {
    const obj = {
      caseid: caseId,
      description: caseDescription,
      // steps property would be pushed with multiple steps by objects of GenericTestResultObject
      steps: [],
      datasets: [],
      finalScreenshotLocation: "",
      result: "",
    };
    return obj;
  }

  /**
   * @param {TestCaseResultObject} cr
   * @param {Number} datasetindex
   * @param {Object} objToSave
   */
  static storeOutputToDataSetResult(cr, datasetindex, objToSave) {
    logger.enterMethod(`Object provided to save`);
    try {
      if (
        objToSave == null ||
        objToSave === undefined ||
        JSON.stringify(objToSave) === "{}"
      ) {
        logger.exitMethod(
          "Nothing provided to store as OUTPUT in data-set result"
        );
        return;
      }
      const objKeys = Object.keys(objToSave);
      const objVals = Object.values(objToSave);

      for (let index = 0; index < objKeys.length; index++) {
        cr.datasets[datasetindex].response[objKeys[index]] = objVals[index];
      }
      logger.trace(
        `Response stored: ${JSON.stringify(cr.datasets[datasetindex].response)}`
      );
    } catch (err) {
      logger.error(err);
    }
    logger.exitMethod(`Case Resulte so far: ${JSON.stringify(cr)}`);
    return cr;
  }
}

module.exports = TestResultHolder;
