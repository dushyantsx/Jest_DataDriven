/* eslint-disable no-lonely-if */
const logger = require("../logger/Logger");

class FiterTestResultsWrapper {
  /**
   * constructor for the reporter
   *
   * @param {Object} globalConfig - Jest configuration object
   * @param {Object} options - Options object defined in jest config
   */
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;

    const filteredReporters = [];
    this._globalConfig.reporters.map((r) => {
      const str = JSON.stringify(r);
      if (str.indexOf("FiterTestResultsWrapper") > -1) {
        filteredReporters.push(r);
      }
    });
    logger.trace(JSON.stringify(filteredReporters));

    this.underlyingReporters = [];

    this.underlyingReporters = filteredReporters.map((r) => {
      if (r.length === 2) {
        logger.trace(JSON.stringify(r[1]));
        logger.trace(r[1][0].underlying);
        logger.trace(JSON.stringify(r[1][0].underlyingOptions));

        const Resolved = require(r[1][0].underlying);
        return new Resolved(globalConfig, r[1][0].underlyingOptions);
      }
    });
  }

  /**
   * Hook to process the test run before running the tests, the only real data
   * available at this time is the number of test suites about to be executed
   *
   * @param {JestTestRunResult} runResults - Results for the test run, but only `numTotalTestSuites` is of use
   * @param {JestRunConfig} runConfig - Run configuration
   */
  onRunStart(runResults, runConfig) {
    this.underlyingReporters.forEach((r) => {
      if (r.onRunStart) {
        r.onRunStart(runResults, runConfig);
      }
    });
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
    // test was skipped thus remove it
    if (testResults.skipped) {
      // testResults.numPassingTests -= removed;
      runResults.numPassedTests -= testResults.numPassingTests;
      runResults.numTotalTests -= testResults.numPendingTests;
      runResults.numPendingTests -= testResults.numPendingTests;
    } else {
      let testIndex = 0;
      for (; testIndex < testResults.testResults.length; testIndex++) {
        const test = testResults.testResults[testIndex];
        logger.verbose(
          `Test under onTestResult event: ${testResults.testFilePath}`
        );
        if (
          test.ancestorTitles.indexOf("Skipped") > -1 ||
          test.title.indexOf("Skipped") > -1
        ) {
          // test was skipped thus remove it
          testResults.testResults.splice(testIndex, 1);
          // adjust indexCount because 'testResults.testResults.length' has been updated due to the 'splice'
          testIndex--;
        }
      }
    }
    this.underlyingReporters.forEach((r) => {
      if (r.onTestResult) {
        r.onTestResult(testRunConfig, testResults, runResults);
      }
    });
  }

  /**
   * Hook to process the test run results after all the test suites have been
   * executed
   *
   * @param {string} test - The Test last run
   * @param {JestTestRunResult} runResults - Results from the test run
   */
  onRunComplete(test, runResults) {
    for (let i = 0; i < runResults.testResults.length; i++) {
      const tr = runResults.testResults[i];
      if (tr.testResults.length === 0) {
        runResults.numPassedTestSuites -= 1;
        runResults.numTotalTestSuites -= 1;

        runResults.testResults.splice(i, 1);
        i--;
      } else {
        // Remove skipped test first
        if (tr.skipped) {
          runResults.numPendingTestSuites -= 1;
          runResults.numTotalTestSuites -= 1;
          runResults.testResults.splice(i, 1);
          i--;
        }
      }
    }
    this.underlyingReporters.forEach((r) => {
      if (r.onRunComplete) {
        r.onRunComplete(test, runResults);
      }
    });
  }
}

module.exports = FiterTestResultsWrapper;
