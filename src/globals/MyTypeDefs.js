/**
 * @typedef {Object} CmdParams
 *  @property {String} env
 */

/**
 * @typedef {Object} ConfigTestDataAsset
 * @property {String} url
 * @property {String} urlcontains
 * @property {String} testId
 * @property {String} dataFile
 * @property {String} dataSheet`
 */

/**
 * @typedef {Object} DbTables
 * @property {String} nc_objects
 * @property {String} nc_params_ix
 * @property {String} nc_params
 * @property {String} nc_list_values
 * @property {String} nc_object_types
 * @property {String} nc_references
 * @property {String} nc_po_tasks
 * @property {String} nc_attributes
 */

/**
 * @typedef {Object} DbConfig
 * @property {String} user
 * @property {String} password
 * @property {String} connectString
 * @property {Boolean} externalAuth
 * @property {DbTables} tables
 */

/**
 * @typedef {Object} Locations
 * @property {Object} or
 * @property {String} or.base
 * @property {Object} valsmeta
 * @property {String} valsmeta.base
 * @property {Object} dataFiles
 * @property {String} dataFiles.base
 * @property {Object} telusapis
 * @property {String} telusapis.base
 * @property {Object} adcapis
 * @property {String} adcapis.base
 */

/**
 * @typedef {Object} TestApp
 * @property {String} url
 * @property {String} urlcontains
 * @property {String} user
 * @property {String} password
 */

/**
 * @typedef {Object} Timeouts
 * @property {Number} test
 * @property {Number} apitest
 * @property {Number} uitest
 * @property {Number} pageload
 * @property {Number} urlchange
 * @property {Number} scriptasyncload
 * @property {Number} implicit
 * @property {Number} element
 * @property {Number} elementlong
 * @property {Boolean} sleep
 */

/**
 * @typedef {Object} Config
 * @property {Locations} locations
 * @property {String} logLevel
 * @property {Boolean} throwErrorsFromLogger
 * @property {String} dataSetDetailedReportsDir
 * @property {String} browser
 * @property {TestApp} testapp
 * @property {DbConfig} dbconfig
 * @property {TelusApis} telusapis
 * @property {AdcApis} adcapis
 * @property {BtApi} btapiconfig
 * @property {Timeouts} timeouts
 * @property {ConfigTestDataAsset[]} testDataAssets
 */

/**
 * @typedef {Object} AdcApis
 * @property {AdcApi} isCustomerAvailable
 * @property {AdcApi} getCustomerInfo
 * @property {AdcApi} getDSTInfo
 */
/**
 * @typedef {Object} AdcApi
 * @property {String} base
 * @property {String} endpoint
 * @property {String} contentType
 * @property {String} fileForBody
 * @property {String[]} keywordsToReplace
 * @property {String} authUser
 * @property {String} authPass
 */

/**
 * @typedef {Object} BtApi
 * @property {String} JEST_BTAPI_ENDPOINT
 * @property {String} JEST_BTAPI_ENDPOINT_SHOPPING_CART
 * @property {String} BTAPI_USERNAME
 * @property {String} BTAPI_PASS
 * @property {String} JEST_CREATECUSTOMER_ENDPOINT
 */

/**
 * @typedef {Object} TelusApis
 * @property {TelusApi} workOrderCompletion
 * @property {TelusApi} releaseActivation
 * @property {TelusApi} shipmentOrderCompletion
 * @property {TelusApi} manualTaskCompletion
 * @property {TelusApi} searchAvailableAppointments
 * @property {TelusApi} setMigrationFlag
 * @property {TelusApi} holdOrderTaskCompletion
 */

/**
 * @typedef {Object} TelusApi
 * @property {String} base
 * @property {String} endpoint
 * @property {String} contentType
 * @property {String} fileForBody
 * @property {String[]} keywordsToReplace
 */

/**
 * @typedef {Object} TestCaseResultObject
 * @property {String} caseid
 * @property {String} description
 * @property {Object[]} steps
 * @property {TestDatasetObject[]} datasets
 * @property {String} finalScreenshotLocation
 * @property {String} result
 */

/**
 * @typedef {Object} TestDatasetObject
 * @property {Object} request;
 * @property {Object} response;
 * @property {Object} expected;
 * @property {String} result;
 * @property {String} screenshotLocation
 * @property {Object} error;
 * @property {Number} indexId;
 */

/**
 * @typedef {ValidationTestCaseObject[]} ValidationTestCaseObjects
 */

/**
 * @typedef {Object} ValidationTestCaseObject
 * @property {String} tc_identifier
 * @property {ValidationObject[]} validations
 */

/**
 * @typedef {Object} ValidationObject
 * @property {String} validation_identifier
 * @property {String} type
 * @property {Boolean} enabled
 * @property {ValidationParams[]} validation_params
 * @property {ValidationSuiteInfo[]} suites
 */

/**
 * @typedef {Object} ValidationParams
 * @property {String} param
 * @property {String} type
 */

/**
 * @typedef {Object} ValidationSuiteInfo
 * @property {String} suite_name
 * @property {Boolean} enabled
 */

/**
 * @typedef {Object} TestResultStatus
 * @property {String} Pass
 * @property {String} Fail
 * @property {String} InProgress
 * @property {String} Unknown
 * @property {String} Skipped
 */
