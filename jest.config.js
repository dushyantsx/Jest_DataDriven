module.exports = {
  verbose: true,
  setupFiles: ["<rootDir>/index.js"],
  reporters: [
    "default",
    [
      "<rootDir>/src/reporter/FiterTestResultsWrapper.js",
      [
        {
          underlying: "jest-html-reporters",
          underlyingOptions: {
            pageTitle: "Tests Execution Results Report",
            publicPath: "./reports/htmlreport/filtered",
            filename: "index.html",
            includeFailureMsg: true,
            expand: false,
          },
        },
      ],
    ],
    [
      "jest-html-reporters",
      {
        pageTitle: "Tests Execution Results Report",
        publicPath: "./reports/htmlreport",
        filename: "index.html",
        includeFailureMsg: true,
        expand: false,
      },
    ],
    [
      "jest-stare",
      {
        resultDir: "reports/jest-stare",
        reportTitle: "BR-UTA Tests Execution Results Report",
        reportHeadline: "BR-UTA Tests Execution Results Report",
        additionalResultsProcessors: ["jest-html-reporters"],
        testResultsProcessor: "jest-sonar-reporter",
        coverageLink: "../../coverage/lcov-report/index.html",
        jestStareConfigJson: "jest-stare.json",
        jestGlobalConfigJson: "globalStuff.json",
      },
    ],
    "<rootDir>/src/reporter/CustomTextReporter.js",
    "<rootDir>/src/reporter/CustomResultReporter.js",
    [
      "@reportportal/agent-js-jest",
      {
        token: "4d2c28cd-0c7d-451b-a680-b0a994d65445",
        launch: "RegressionTest",
        endpoint: "http://btln007609:8080/v1/api",
        //"launchname": "RegressionTest",
        project: "TELUSONLINE",
        description:
          "Jest based automation suite for Home Security and LivingWell products",
        //"tags": ["livingwell", "home-security", "report"],
        attributes: [
          {
            value: "livingwell",
          },
          {
            value: "home-security",
          },
          {
            value: "report",
          },
        ],
      },
    ],
  ],
  runner: "groups",
  setupFilesAfterEnv: ["jest-expect-message"],
  testEnvironment: "node",
  testResultsProcessor: "jest-sonar-reporter",
  testSequencer: "./src/executor/testSequencer.js",
};

//process.env = Object.assign(process.env, { DD_RESULT_DATA: '' });
