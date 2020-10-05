const path = require("path");
const FileWriter = require("../utils/common/FileWriter");
const logger = require("../logger/Logger");
const DateUtils = require("../utils/common/DateUtils");
const FileSystem = require("../utils/common/FileSystem");

const jsonTextReportingFolder = path.resolve(
  __dirname,
  `../../reports/textResults${DateUtils.today()}`
);

let filePath = "";
class CustomTextReporter {
  /**
   * constructor for the reporter
   *
   * @param {Object} globalConfig - Jest configuration object
   * @param {Object} options - Options object defined in jest config
   */
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;

    FileSystem.deleteFolderRecursivelySync(jsonTextReportingFolder);

    const globalConfigAsStr = JSON.stringify(this._globalConfig);
    logger.trace(`GlobalConfig: ${globalConfigAsStr}`);
    // Write a json syncronously
    filePath = path.resolve(jsonTextReportingFolder, "GlobalConfig.json");
    FileWriter.sync(filePath, globalConfigAsStr);

    const optionsAsStr = JSON.stringify(this._options);
    logger.trace(`GlobalOptions: ${optionsAsStr}`);
    // Write a json syncronously
    filePath = path.resolve(jsonTextReportingFolder, "GlobalOptions.json");
    FileWriter.sync(filePath, globalConfigAsStr);
  }

  /**
   * Hook to process the test run before running the tests, the only real data
   * available at this time is the number of test suites about to be executed
   *
   * @param {JestTestRunResult} runResults - Results for the test run, but only `numTotalTestSuites` is of use
   * @param {JestRunConfig} runConfig - Run configuration
   */
  onRunStart(runResults, runConfig) {
    const runEntry = `${JSON.stringify(runResults)}\n\n\n${JSON.stringify(
      runConfig
    )}`;

    logger.trace(`onRunStart: ${runEntry}`);
    // Write a json syncronously
    filePath = path.resolve(jsonTextReportingFolder, "onRunStart.json");
    FileWriter.sync(filePath, runEntry);
  }

  /**
   * Hook to process the test before just starting it
   *
   * @param {JestTestRunResult} test - Results for the test run, but only `numTotalTestSuites` is of use
   */
  onTestStart(test) {
    const runEntry = JSON.stringify(test);
    logger.trace(`onTestStart: ${runEntry}`);

    // Write a json syncronously
    filePath = path.resolve(jsonTextReportingFolder, "onTestStart.json");
    FileWriter.sync(filePath, runEntry, true);
  }

  /**
   * Hook to process the test run results after a test suite has been executed
   * This will be called many times during the test run
   *
   * @param {JestTestSuiteRunConfig} testRunConfig - Context information about the test run
   * @param {JestTestSuiteResult} testResults - Results for the test suite just executed
   * @param {JestTestRunResult} runResults - Results for the test run at the point in time of the test suite being executed
   */
  onTestResult(testRunConfig, testResults, runResults) {
    const runEntry = `${JSON.stringify(testRunConfig)}\n\n\n${JSON.stringify(
      testResults
    )}\n\n\n${JSON.stringify(runResults)}`;

    logger.trace(`onTestResult: ${runEntry}`);
    // Write a json syncronously
    filePath = path.resolve(
      jsonTextReportingFolder,
      "onTestResult-RunConfig.json"
    );
    if (FileSystem.fileExistsSync(filePath))
      FileWriter.sync(filePath, `,${JSON.stringify(testRunConfig)}`, true);
    else FileWriter.sync(filePath, JSON.stringify(testRunConfig), false);

    filePath = path.resolve(
      jsonTextReportingFolder,
      "onTestResult-TestResults.json"
    );
    if (FileSystem.fileExistsSync(filePath))
      FileWriter.sync(filePath, `,${JSON.stringify(testResults)}`, true);
    else FileWriter.sync(filePath, JSON.stringify(testResults), false);

    filePath = path.resolve(
      jsonTextReportingFolder,
      "onTestResult-RunResults.json"
    );
    FileWriter.sync(filePath, JSON.stringify(runResults));
  }

  /**
   * Hook to process the test run results after all the test suites have been
   * executed
   *
   * @param {string} test - The Test last run
   * @param {JestTestRunResult} runResults - Results from the test run
   */
  onRunComplete(test, runResults) {
    const runEntry = `${JSON.stringify(test)}\n\n\n${JSON.stringify(
      runResults
    )}`;

    logger.trace(`onRunComplete: ${runEntry}`);
    // Write a json syncronously
    filePath = path.resolve(jsonTextReportingFolder, "onRunComplete-Test.json");
    if (FileSystem.fileExistsSync(filePath))
      FileWriter.sync(filePath, `,${JSON.stringify(test)}`, true);
    else FileWriter.sync(filePath, JSON.stringify(test), false);

    filePath = path.resolve(
      jsonTextReportingFolder,
      "onRunComplete-RunResults.json"
    );
    if (FileSystem.fileExistsSync(filePath))
      FileWriter.sync(filePath, `,${JSON.stringify(runResults)}`, true);
    else FileWriter.sync(filePath, JSON.stringify(runResults), false);
  }

  getLastError() {
    if (this._shouldFail) {
      return new Error("CustomTextReporter.js reported an error");
    }
  }
}

module.exports = CustomTextReporter;
