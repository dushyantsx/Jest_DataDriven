/* eslint-disable no-unused-vars */
const fs = require("fs");
const path = require("path");
const FileSystem = require("../utils/common/FileSystem");
const logger = require("../logger/Logger");

const reportTemplatePath = path.resolve(
  __dirname,
  "../../resources/templates/report.html"
);
const reportOutputFilePath = path.resolve(
  __dirname,
  "../../reports/ds_report.html"
);
const dataSetsJsonResultsPath = path.resolve(
  __dirname,
  "../../reports/data-set-reports"
);

function genReport() {
  const dataResults = [];

  const resFiles = FileSystem.getFiles(dataSetsJsonResultsPath);
  for (let index = 0; index < resFiles.length; index++) {
    const file = resFiles[index];
    if (file != null && file !== undefined && file.indexOf("json") !== -1) {
      logger.verbose(`Putting file to results bucket: ${resFiles[index]}`);
      dataResults.push(
        fs.readFileSync(
          `${dataSetsJsonResultsPath}/${resFiles[index]}`,
          "utf-8"
        )
      );
    }
  }

  const htmlTemplate = fs.readFileSync(reportTemplatePath, "utf-8");
  const outputContext = htmlTemplate.replace(
    "$ddResultData",
    `[${dataResults}]`
  );

  fs.writeFileSync(reportOutputFilePath, outputContext, "utf-8");
}

class CustomResultReporter {
  /**
   * constructor for the reporter
   *
   * @param {Object} globalConfig - Jest configuration object
   * @param {Object} options - Options object defined in jest config
   */
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  /**
   * Hook to process the test run before running the tests, the only real data
   * available at this time is the number of test suites about to be executed
   *
   * @param {JestTestRunResult} runResults - Results for the test run, but only `numTotalTestSuites` is of use
   * @param {JestRunConfig} runConfig - Run configuration
   */
  onRunStart(runResults, runConfig) {}

  /**
   * Hook to process the test before just starting it
   *
   * @param {JestTestRunResult} test - Results for the test run, but only `numTotalTestSuites` is of use
   */
  onTestStart(test) {}

  /**
   * Hook to process the test run results after a test suite has been executed
   * This will be called many times during the test run
   *
   * @param {JestTestSuiteRunConfig} testRunConfig - Context information about the test run
   * @param {JestTestSuiteResult} testResults - Results for the test suite just executed
   * @param {JestTestRunResult} runResults - Results for the test run at the point in time of the test suite being executed
   */
  onTestResult(testRunConfig, testResults, runResults) {}

  /**
   * Hook to process the test run results after all the test suites have been executed
   *
   * @param {string} test - The Test last run
   * @param {JestTestRunResult} runResults - Results from the test run
   */
  onRunComplete(test, runResults) {
    genReport();
  }

  getLastError() {
    if (this._shouldFail) {
      return new Error("CustomTextReporter.js reported an error");
    }
  }
}

module.exports = CustomResultReporter;
