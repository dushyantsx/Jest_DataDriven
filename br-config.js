require("./src/globals/MyTypeDefs");

const StringUtils = require("./src/utils/common/StringUtils");
const FileSystem = require("./src/utils/common/FileSystem");
const logger = require("./src/logger/Logger");

const ienv = process.env.IENV;

/**
 * @type {CmdParams}
 */
let cmdConfig = null;
class brconfig {
  /**
   * @param {Config} cfg Specifies config for test data assets to find
   * @param {String} id Specifies test id for test data assets to find
   * @returns {ConfigTestDataAsset}
   */
  static getTestDataAssetsForGivenTestId(cfg, id) {
    for (let i = 0; i < cfg.testDataAssets.length; i++) {
      const asset = cfg.testDataAssets[i];
      if (StringUtils.equalsIgnoreCase(asset.testId, id)) {
        if (!FileSystem.fileExistsSync(asset.dataFile)) {
          const dfLoc = this.getLocationDataFilesForGivenEnv();
          const dataFilePath = `${dfLoc}/${asset.dataFile}`;
          if (FileSystem.fileExistsSync(dataFilePath)) {
            asset.dataFile = dataFilePath;
          }
        }
        logger.debug(JSON.stringify(asset));
        return asset;
      }
    }
    return null;
  }

  /**
   * @description Provides object repository location
   */
  static getLocationOrForGivenEnv() {
    const loc = getLocationForGivenEnvObj("or");
    return loc;
  }

  /**
   * @description Provides data files location
   */
  static getLocationDataFilesForGivenEnv() {
    const loc = getLocationForGivenEnvObj("datafiles");
    return loc;
  }

  /**
   * @description Provides validators meta location
   */
  static getLocationValidatorsMetaForGivenEnv() {
    const loc = getLocationForGivenEnvObj("valsmeta");
    return loc;
  }

  /**
   * @param {Config} cfg
   * @returns {DbConfig}
   */
  static getDbConfig(cfg) {
    return cfg.dbconfig;
  }

  /**
   * @param {Config} cfg
   * @returns {TelusApis}
   */
  static getTelusApisConfig(cfg) {
    const tApis = cfg.telusapis;
    const baseLoc = getValidLocation(cfg.locations.telusapis.base);

    tApis.releaseActivation.fileForBody = `${baseLoc}/${tApis.releaseActivation.fileForBody}`;
    tApis.workOrderCompletion.fileForBody = `${baseLoc}/${tApis.workOrderCompletion.fileForBody}`;
    tApis.shipmentOrderCompletion.fileForBody = `${baseLoc}/${tApis.shipmentOrderCompletion.fileForBody}`;
    tApis.searchAvailableAppointments.fileForBody = `${baseLoc}/${tApis.searchAvailableAppointments.fileForBody}`;
    return tApis;
  }

  /**
   * @param {Config} cfg
   * @returns {BtApi}
   */
  static getBTApisConfig(cfg) {
    const btApis = cfg.btapiconfig;
    return btApis;
  }

  /**
   * @param {Config} cfg
   * @returns {AdcApis}
   */

  static getAdcApisConfig(cfg) {
    const adApis = cfg.adcapis;
    const baseLoc = getValidLocation(cfg.locations.adcapis.base);

    adApis.isCustomerAvailable.fileForBody = `${baseLoc}/${adApis.isCustomerAvailable.fileForBody}`;
    adApis.getCustomerInfo.fileForBody = `${baseLoc}/${adApis.getCustomerInfo.fileForBody}`;
    adApis.getDSTInfo.fileForBody = `${baseLoc}/${adApis.getDSTInfo.fileForBody}`;
    return adApis;
  }

  /**
   * @description Provides data-sets reporting directory to store jsons
   */
  static getLocationDataSetReportsDirForGivenEnv() {
    const envcfg = this.getConfigForGivenEnv();
    const loc = getValidLocation(envcfg.dataSetDetailedReportsDir);
    return loc;
  }

  /**
   * @description Provides {TestDatasetObject} for given test-id and first executed dataset-index
   * @param {String} testId Specifies test case id for test data assets to find
   * @returns {TestDatasetObject}
   */
  static getFirstTestDataAssetResultsForGivenTestId(testId) {
    logger.enterMethod(
      `getFirstTestDataAssetResultsForGivenTestId for testId ${testId}`
    );
    const datasets = this.getTestDataAssetsResultsForGivenTestId(testId);
    if (datasets.length === 0) {
      throw new Error(`No dataset result found for given test id ${testId}`);
    }

    let dataset = null;
    let isExecuted = false;
    for (let index = 0; index < datasets.length; index++) {
      dataset = datasets[index];
      isExecuted = dataset.request["data-set-enabled"] === "Y";
      if (isExecuted) break;
    }
    logger.exitMethod(
      `getFirstTestDataAssetResultsForGivenTestId dataset returned: ${JSON.stringify(
        dataset
      )}`
    );
    return dataset;
  }

  /**
   * @description Provides {TestDatasetObject} for given test-id and dataset-index
   * @param {String} testId Specifies test case id for test data assets to find
   * @param {Number} datasetIndex 1-based index; Specifies dataset index to get
   * @returns {TestDatasetObject}
   */
  static getTestDataAssetsResultsForGivenTestIdAndIndex(testId, datasetIndex) {
    const datasets = this.getTestDataAssetsResultsForGivenTestId(testId);
    if (datasets.length) {
      throw new Error(`No dataset result found for given test id ${testId}`);
    }
    if (datasetIndex > datasets.length) datasetIndex = datasets.length;
    const output = datasets[datasetIndex - 1];
    return output;
  }

  /**
   * @description Provides all {TestDatasetObject} for given test-id
   * @param {String} testId Specifies test case id for test data assets to find
   * @returns {TestDatasetObject[]}
   */
  static getTestDataAssetsResultsForGivenTestId(testId) {
    logger.enterMethod(`getTestDataAssetsResultsForGivenTestId for ${testId}`);
    const dataSetsReportFile = `${this.getLocationDataSetReportsDirForGivenEnv()}/${testId}.json`;
    if (!FileSystem.fileExistsSync(dataSetsReportFile)) {
      throw new Error(`No such file exists: ${dataSetsReportFile}`);
    }
    const resultFile = FileSystem.readFileSync(dataSetsReportFile);
    /**
     * @type TestCaseResultObject
     */
    const resultFileObj = JSON.parse(resultFile);
    const { datasets } = resultFileObj;
    logger.exitMethod(`Datasets returned: ${JSON.stringify(datasets)}`);
    return datasets;
  }

  /**
   * @param {String[]} arr
   */
  static parse(arr) {
    if (StringUtils.isEmptyObject(arr)) {
      return {};
    }

    const cmd = {};
    for (let index = 0; index < arr.length; index++) {
      const ele = arr[index];
      if (!StringUtils.isEmpty(ele)) {
        if (StringUtils.containsIgnoreCase(ele, "=")) {
          const eleInfo = ele.split("=");
          cmd[eleInfo[0]] = eleInfo[1];
        }
      }
    }
    return cmd;
  }

  /**
   * @return {CmdParams}
   */
  static getCmdParams() {
    if (StringUtils.isEmptyObject(cmdConfig)) {
      cmdConfig = this.parse(process.argv);
    }

    return cmdConfig;
  }

  /**
   * @param {String} paramName Specifies parameter name to be returned from command line parameters
   * @return {String} Returns empty string if parameter not found
   */
  static getCmdParam(paramName) {
    cmdConfig = this.getCmdParams();
    const objKeys = Object.keys(cmdConfig);
    const objVals = Object.values(cmdConfig);
    for (let index = 0; index < objKeys.length; index++) {
      const key = objKeys[index];
      if (
        StringUtils.equalsIgnoreCase(key, paramName) ||
        StringUtils.equalsIgnoreCase(key, `--${paramName}`)
      ) {
        return objVals[index];
      }
    }
    if (paramName === "ienv" && (ienv !== undefined || ienv != null)) {
      return ienv.trim();
    }
    return "";
  }

  /**
   * @returns {Config}
   */
  static getConfigForGivenEnv() {
    const env = StringUtils.defaultIfEmpty(this.getCmdParam("ienv"), "itn02");
    logger.info(`Reading configuration for ${env} environment`);
    const envconfig = this.get(env);
    logger.debug(`Environment ${env} Config: ${JSON.stringify(envconfig)}`);
    return envconfig;
  }

  /**
   * @param {String} env Specifies environment which configuration to be picked
   * @returns {Config}
   */
  static get(env) {
    const configFileName = StringUtils.defaultIfEmpty(
      this.getCmdParam("configFile"),
      "config.min.json"
    );
    const configFile = `${__dirname}/resources/envs/${env}/${configFileName}`;
    if (StringUtils.isEmpty(env) || !FileSystem.fileExistsSync(configFile)) {
      return {};
    }

    const cfg = FileSystem.readFileSync(configFile);
    return JSON.parse(cfg);
  }
}

module.exports = brconfig;

function getValidLocation(locBase) {
  logger.enterMethod();
  if (FileSystem.fileExistsSync(locBase)) {
    logger.exitMethod(`${locBase} specified in config and exists`);
    return locBase;
  }
  logger.debug(
    `${locBase} specified in config DOES NOT exist. Finding location from root`
  );

  let absLoc = StringUtils.trimStart(locBase, "/");
  absLoc = StringUtils.trimEnd(absLoc, "/");
  if (FileSystem.fileExistsSync(absLoc)) {
    logger.exitMethod(`Location ${absLoc} exists; returning it`);
    return absLoc;
  }

  absLoc = `${__dirname}/${absLoc}`;
  logger.debug(`Checking location ${absLoc}`);
  if (FileSystem.fileExistsSync(absLoc)) {
    logger.debug(
      `Prepared location from root ${absLoc} exists; returning this`
    );
    return absLoc;
  }

  logger.exitMethod(
    `Provided location ${locBase} in config DOES NOT exist; still returning the value`
  );
  return locBase;
}

/**
 * @description Provides location from config file for specified object
 * @param {String} obj object-name for which location needs to be returned; it can be one of {or, valsmeta, datafiles}
 */
function getLocationForGivenEnvObj(obj) {
  logger.enterMethod(`getLocationForGivenEnvObj`);
  if (StringUtils.isEmpty(obj)) return "";
  obj = obj.toLowerCase();

  const envconfig = brconfig.getConfigForGivenEnv();
  let locBase = "";
  switch (obj) {
    case "or":
      locBase = envconfig.locations.or.base;
      break;
    case "valsmeta":
      locBase = envconfig.locations.valsmeta.base;
      break;
    case "datafiles":
      locBase = envconfig.locations.dataFiles.base;
      break;
    case "telusapis":
      locBase = envconfig.locations.telusapis.base;
      break;
    case "adcapis":
      locBase = envconfig.locations.adcapis.base;
      break;
    default:
      throw new Error(
        `Not a supported object ${obj} for which location can be fetched from config`
      );
  }
  const finalLoc = getValidLocation(locBase);
  logger.exitMethod(finalLoc);
  return finalLoc;
}
